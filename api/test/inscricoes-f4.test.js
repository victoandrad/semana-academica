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

async function andarRelogio(port, agora) {
  await fetch(`http://localhost:${port}/_teste/relogio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agora })
  })
}

async function criarAtividade(port, corpo = {}) {
  const res = await fetch(`http://localhost:${port}/atividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
    body: JSON.stringify({
      titulo: 'Flutter do zero',
      tipo: 'minicurso',
      salaId: 'lab-3',
      vagas: 1,
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

async function listar(port, xUsuario = 'org-ana') {
  return (await fetch(`http://localhost:${port}/inscricoes`, {
    headers: { 'X-Usuario': xUsuario }
  })).json()
}

describe('F4 — convocacao e expiracao', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('cancelar confirmada libera vaga e o 1o da fila ja aparece convocado sem outro acesso', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    const elisa = await inscrever(port, atv.id, 'p-elisa')
    assert.equal(diego.posicaoNaEspera, 1)
    await cancelarInscricao(port, carla.id, 'p-carla')
    const lista = await listar(port)
    const diegoDepois = lista.find(i => i.participanteId === 'p-diego')
    const elisaDepois = lista.find(i => i.participanteId === 'p-elisa')
    assert.equal(diegoDepois.status, 'convocada')
    assert.equal(diegoDepois.posicaoNaEspera, null)
    assert.equal(
      Date.parse(diegoDepois.convocadaAte),
      Date.parse('2026-10-13T11:00:00-03:00')
    )
    assert.equal(elisaDepois.status, 'em_espera')
    assert.equal(elisaDepois.posicaoNaEspera, 1)
  })

  it('PATCH aumentando vagas libera vaga e promove o 1o da fila', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    assert.equal(carla.status, 'confirmada')
    assert.equal(diego.status, 'em_espera')
    const patch = await fetch(`http://localhost:${port}/atividades/${atv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({ vagas: 2 })
    })
    assert.equal(patch.status, 200)
    const lista = await listar(port)
    const diegoDepois = lista.find(i => i.participanteId === 'p-diego')
    assert.equal(diegoDepois.status, 'convocada')
    assert.equal(diegoDepois.posicaoNaEspera, null)
    assert.equal(
      Date.parse(diegoDepois.convocadaAte),
      Date.parse('2026-10-13T11:00:00-03:00')
    )
  })

  it('convocadaAte nunca passa do fechamento das inscricoes', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await andarRelogio(port, '2026-10-19T17:30:00-03:00')
    await cancelarInscricao(port, carla.id, 'p-carla')
    const diegoDepois = (await listar(port)).find(i => i.participanteId === 'p-diego')
    assert.equal(diegoDepois.status, 'convocada')
    assert.equal(
      Date.parse(diegoDepois.convocadaAte),
      Date.parse('2026-10-19T18:30:00-03:00')
    )
  })

  it('convocacao vencida expira em cascata e o praco do proximo conta do vencimento anterior', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    const elisa = await inscrever(port, atv.id, 'p-elisa')
    const fabio = await inscrever(port, atv.id, 'p-fabio')
    await cancelarInscricao(port, carla.id, 'p-carla')
    let lista = await listar(port)
    assert.equal(lista.find(i => i.participanteId === 'p-diego').status, 'convocada')
    assert.equal(
      Date.parse(lista.find(i => i.participanteId === 'p-diego').convocadaAte),
      Date.parse('2026-10-13T11:00:00-03:00')
    )
    await andarRelogio(port, '2026-10-13T11:01:00-03:00')
    lista = await listar(port)
    assert.equal(lista.find(i => i.participanteId === 'p-diego').status, 'expirada')
    const elisaDepois = lista.find(i => i.participanteId === 'p-elisa')
    assert.equal(elisaDepois.status, 'convocada')
    assert.equal(
      Date.parse(elisaDepois.convocadaAte),
      Date.parse('2026-10-13T13:00:00-03:00')
    )
    await andarRelogio(port, '2026-10-13T13:01:00-03:00')
    lista = await listar(port)
    assert.equal(lista.find(i => i.participanteId === 'p-elisa').status, 'expirada')
    const fabioDepois = lista.find(i => i.participanteId === 'p-fabio')
    assert.equal(fabioDepois.status, 'convocada')
    assert.equal(
      Date.parse(fabioDepois.convocadaAte),
      Date.parse('2026-10-13T15:00:00-03:00')
    )
    assert.equal(
      lista.find(i => i.participanteId === 'p-diego').status,
      'expirada'
    )
    assert.equal(
      lista.find(i => i.participanteId === 'p-elisa').status,
      'expirada'
    )
  })

  it('expirada pode se reinscrever e entra no fim da fila', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await inscrever(port, atv.id, 'p-fabio')
    await cancelarInscricao(port, carla.id, 'p-carla')
    await andarRelogio(port, '2026-10-13T11:01:00-03:00')
    const reinscricao = await (
      await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
        method: 'POST',
        headers: { 'X-Usuario': 'p-diego' }
      })
    ).json()
    assert.equal(reinscricao.status, 'em_espera')
    assert.equal(reinscricao.posicaoNaEspera, 1)
    const lista = await listar(port)
    const deDiego = lista.filter(i => i.participanteId === 'p-diego')
    assert.equal(deDiego.length, 2)
    assert.equal(deDiego[0].status, 'expirada')
    assert.equal(deDiego[1].status, 'em_espera')
  })
})