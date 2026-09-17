import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp } from '../src/index.js'

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = createServer(app)
    server.listen(0, () => {
      const { port } = server.address()
      resolve({ server, port })
    })
    server.on('error', reject)
  })
}

function close(server) {
  return new Promise(resolve => server.close(resolve))
}

async function reset(port) {
  await fetch(`http://localhost:${port}/_teste/reset`, { method: 'POST' })
}

async function criarAtividade(port, corpo = {}) {
  const res = await fetch(`http://localhost:${port}/atividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
    body: JSON.stringify({
      titulo: 'Flutter do zero',
      tipo: 'minicurso',
      salaId: 'lab-3',
      vagas: 4,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
      ],
      ...corpo
    })
  })
  assert.equal(res.status, 201)
  return res.json()
}

async function inscrever(port, atividadeId, xUsuario) {
  return (
    await fetch(`http://localhost:${port}/atividades/${atividadeId}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': xUsuario }
    })
  ).json()
}

async function cancelarInscricao(port, inscricaoId, xUsuario) {
  return await fetch(`http://localhost:${port}/inscricoes/${inscricaoId}/cancelamento`, {
    method: 'POST',
    headers: { 'X-Usuario': xUsuario }
  })
}

describe('F7 — atividade cancelada e campos do M1', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('cancelar atividade transforma todas as ativas em cancelada e nao promove ninguem', async () => {
    await reset(port)
    const atv = await criarAtividade(port, { vagas: 3 })
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    const elisa = await inscrever(port, atv.id, 'p-elisa')
    const fabio = await inscrever(port, atv.id, 'p-fabio')
    const gabriela = await inscrever(port, atv.id, 'p-gabriela')
    assert.equal(carla.status, 'confirmada')
    assert.equal(diego.status, 'confirmada')
    assert.equal(elisa.status, 'confirmada')
    assert.equal(fabio.status, 'em_espera')
    assert.equal(gabriela.status, 'em_espera')
    await cancelarInscricao(port, carla.id, 'p-carla')
    const convocada = (
      await (
        await fetch(`http://localhost:${port}/inscricoes`, {
          headers: { 'X-Usuario': 'p-fabio' }
        })
      ).json()
    )
    assert.equal(convocada[0].status, 'convocada')
    const cancelamento = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/cancelamento`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'org-ana' }
      }
    )
    assert.equal(cancelamento.status, 200)
    const lista = await (
      await fetch(`http://localhost:${port}/inscricoes`, {
        headers: { 'X-Usuario': 'org-ana' }
      })
    ).json()
    assert.ok(lista.length >= 5)
    assert.ok(lista.every(i => i.status === 'cancelada'))
    assert.equal(lista.filter(i => i.status === 'convocada').length, 0)
    const nova = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-heitor' }
      }
    )
    assert.equal(nova.status, 422)
    assert.equal((await nova.json()).erro, 'ATIVIDADE_CANCELADA')
  })

  it('GET /atividades/:id mostra ocupadas, emEspera e vagasRestantes calculados', async () => {
    await reset(port)
    const atv = await criarAtividade(port, { vagas: 3 })
    const carla = await inscrever(port, atv.id, 'p-carla')
    await inscrever(port, atv.id, 'p-diego')
    await inscrever(port, atv.id, 'p-elisa')
    await inscrever(port, atv.id, 'p-fabio')
    await inscrever(port, atv.id, 'p-gabriela')
    await cancelarInscricao(port, carla.id, 'p-carla')
    const atividade = await (
      await fetch(`http://localhost:${port}/atividades/${atv.id}`, {
        headers: { 'X-Usuario': 'org-ana' }
      })
    ).json()
    assert.equal(atividade.ocupadas, 3)
    assert.equal(atividade.emEspera, 1)
    assert.equal(atividade.vagasRestantes, 0)
  })

  it('PATCH reduzindo vagas abaixo dos ocupantes devolve 409 VAGAS_ABAIXO_DOS_INSCRITOS', async () => {
    await reset(port)
    const atv = await criarAtividade(port, { vagas: 3 })
    const carla = await inscrever(port, atv.id, 'p-carla')
    await inscrever(port, atv.id, 'p-diego')
    await inscrever(port, atv.id, 'p-elisa')
    await inscrever(port, atv.id, 'p-fabio')
    await inscrever(port, atv.id, 'p-gabriela')
    await cancelarInscricao(port, carla.id, 'p-carla')
    let patch = await fetch(`http://localhost:${port}/atividades/${atv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({ vagas: 2 })
    })
    assert.equal(patch.status, 409)
    assert.equal((await patch.json()).erro, 'VAGAS_ABAIXO_DOS_INSCRITOS')
    patch = await fetch(`http://localhost:${port}/atividades/${atv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({ vagas: 3 })
    })
    assert.equal(patch.status, 200)
  })

  it('com atividade cancelada os campos continuam calculados: ocupadas 0 e emEspera 0', async () => {
    await reset(port)
    const atv = await criarAtividade(port, { vagas: 3 })
    const carla = await inscrever(port, atv.id, 'p-carla')
    await inscrever(port, atv.id, 'p-diego')
    await inscrever(port, atv.id, 'p-elisa')
    await inscrever(port, atv.id, 'p-fabio')
    await inscrever(port, atv.id, 'p-gabriela')
    await cancelarInscricao(port, carla.id, 'p-carla')
    await fetch(`http://localhost:${port}/atividades/${atv.id}/cancelamento`, {
      method: 'POST',
      headers: { 'X-Usuario': 'org-ana' }
    })
    const atividade = await (
      await fetch(`http://localhost:${port}/atividades/${atv.id}`, {
        headers: { 'X-Usuario': 'org-ana' }
      })
    ).json()
    assert.equal(atividade.situacao, 'cancelada')
    assert.equal(atividade.ocupadas, 0)
    assert.equal(atividade.emEspera, 0)
    assert.equal(atividade.vagasRestantes, 3)
  })
})