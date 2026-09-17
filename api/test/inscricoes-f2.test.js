import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp } from '../src/index.js'

const CLOCK_INICIAL = '2026-10-13T09:00:00-03:00'

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

describe('F2 — lista de espera', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('inscricao sem vaga nasce em_espera com posicaoNaEspera em ordem de chegada', async () => {
    await reset(port)
    const atv = await criarAtividade(port, { vagas: 1 })
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    const elisa = await inscrever(port, atv.id, 'p-elisa')
    assert.equal(carla.status, 'confirmada')
    assert.equal(carla.posicaoNaEspera, null)
    assert.equal(diego.status, 'em_espera')
    assert.equal(diego.posicaoNaEspera, 1)
    assert.equal(diego.convocadaAte, null)
    assert.equal(Date.parse(diego.criadaEm), Date.parse(CLOCK_INICIAL))
    assert.equal(elisa.status, 'em_espera')
    assert.equal(elisa.posicaoNaEspera, 2)
  })

  it('cancelar em_espera tira da fila e reindexa os demais, no mesmo instante criado', async () => {
    await reset(port)
    const atv = await criarAtividade(port, { vagas: 1 })
    await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    const elisa = await inscrever(port, atv.id, 'p-elisa')
    assert.equal(Date.parse(diego.criadaEm), Date.parse(elisa.criadaEm))
    const res = await fetch(
      `http://localhost:${port}/inscricoes/${diego.id}/cancelamento`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-diego' }
      }
    )
    assert.equal(res.status, 200)
    const corpo = await res.json()
    assert.equal(corpo.status, 'cancelada')
    assert.equal(corpo.posicaoNaEspera, null)
    const lista = await (
      await fetch(`http://localhost:${port}/inscricoes`, {
        headers: { 'X-Usuario': 'org-ana' }
      })
    ).json()
    const naEspera = lista.filter(i => i.status === 'em_espera')
    assert.equal(naEspera.length, 1)
    assert.equal(naEspera[0].id, elisa.id)
    assert.equal(naEspera[0].posicaoNaEspera, 1)
  })

  it('quem cancelou pode se reinscrever e entra no fim da fila', async () => {
    await reset(port)
    const atv = await criarAtividade(port, { vagas: 1 })
    await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await inscrever(port, atv.id, 'p-elisa')
    await fetch(`http://localhost:${port}/inscricoes/${diego.id}/cancelamento`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-diego' }
    })
    const denovo = await inscrever(port, atv.id, 'p-diego')
    assert.equal(denovo.status, 'em_espera')
    assert.equal(denovo.posicaoNaEspera, 2)
  })
})