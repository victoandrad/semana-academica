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

async function confirmar(port, inscricaoId, xUsuario) {
  return await fetch(`http://localhost:${port}/inscricoes/${inscricaoId}/confirmacao`, {
    method: 'POST',
    headers: { 'X-Usuario': xUsuario }
  })
}

describe('F5 — confirmacao', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('confirmar convocada no prazo devolve 200 com confirmada e campos null', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await cancelarInscricao(port, carla.id, 'p-carla')
    const diegoConvocado = await (
      await fetch(`http://localhost:${port}/inscricoes`, {
        headers: { 'X-Usuario': 'p-diego' }
      })
    ).json()
    const res = await confirmar(port, diegoConvocado[0].id, 'p-diego')
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.status, 'confirmada')
    assert.equal(body.convocadaAte, null)
    assert.equal(body.posicaoNaEspera, null)
  })

  it('confirmar em_espera devolve 422 SEM_CONVOCACAO', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    assert.equal(diego.status, 'em_espera')
    assert.equal(carla.status, 'confirmada')
    const res = await confirmar(port, diego.id, 'p-diego')
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'SEM_CONVOCACAO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('confirmar convocada vencida devolve 422 CONVOCACAO_EXPIRADA', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await cancelarInscricao(port, carla.id, 'p-carla')
    await andarRelogio(port, '2026-10-13T11:01:00-03:00')
    const res = await confirmar(port, diego.id, 'p-diego')
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'CONVOCACAO_EXPIRADA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('confirmar exatamente em convocadaAte e aceito (prazo ate X inclui X)', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await cancelarInscricao(port, carla.id, 'p-carla')
    await andarRelogio(port, '2026-10-13T11:00:00-03:00')
    const diegoDepois = await (
      await fetch(`http://localhost:${port}/inscricoes`, {
        headers: { 'X-Usuario': 'p-diego' }
      })
    ).json()
    assert.equal(diegoDepois[0].status, 'convocada')
    assert.equal(
      Date.parse(diegoDepois[0].convocadaAte),
      Date.parse('2026-10-13T11:00:00-03:00')
    )
    const res = await confirmar(port, diegoDepois[0].id, 'p-diego')
    assert.equal(res.status, 200)
    assert.equal((await res.json()).status, 'confirmada')
  })

  it('conflito criado depois recusa a confirmacao com 409 e a convocacao continua valida', async () => {
    await reset(port)
    const a = await criarAtividade(port)
    const e = await criarAtividade(port, {
      titulo: 'Palestra de rede',
      tipo: 'palestra',
      salaId: 'auditorio',
      encontros: [{ inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:30:00-03:00' }]
    })
    const carla = await inscrever(port, a.id, 'p-carla')
    const diego = await inscrever(port, a.id, 'p-diego')
    assert.equal(diego.status, 'em_espera')
    const emE = await inscrever(port, e.id, 'p-diego')
    assert.equal(emE.status, 'confirmada')
    await cancelarInscricao(port, carla.id, 'p-carla')
    const res = await confirmar(port, diego.id, 'p-diego')
    assert.equal(res.status, 409)
    const body = await res.json()
    assert.equal(body.erro, 'CONFLITO_DE_HORARIO')
    assert.equal(typeof body.mensagem, 'string')
    const diegoDepois = await (
      await fetch(`http://localhost:${port}/inscricoes`, {
        headers: { 'X-Usuario': 'p-diego' }
      })
    ).json()
    assert.equal(diegoDepois.find(i => i.atividadeId === a.id).status, 'convocada')
  })

  it('confirmar o 4o minicurso devolve 422 LIMITE_DE_MINICURSOS e segue convocada', async () => {
    await reset(port)
    const mc1 = await criarAtividade(port, { salaId: 'sala-101', titulo: 'MC1', encontros: [
      { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' },
      { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T17:00:00-03:00' }
    ] })
    const mc2 = await criarAtividade(port, { salaId: 'sala-102', titulo: 'MC2', encontros: [
      { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' },
      { inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T17:00:00-03:00' }
    ] })
    const mc3 = await criarAtividade(port, { salaId: 'lab-3', titulo: 'MC3', encontros: [
      { inicio: '2026-10-21T09:00:00-03:00', fim: '2026-10-21T12:00:00-03:00' },
      { inicio: '2026-10-21T14:00:00-03:00', fim: '2026-10-21T17:00:00-03:00' }
    ] })
    const mc4 = await criarAtividade(port, { salaId: 'auditorio', titulo: 'MC4', vagas: 1, encontros: [
      { inicio: '2026-10-22T09:00:00-03:00', fim: '2026-10-22T12:00:00-03:00' },
      { inicio: '2026-10-22T14:00:00-03:00', fim: '2026-10-22T17:00:00-03:00' }
    ] })
    for (const atv of [mc1, mc2, mc3]) {
      const res = await inscrever(port, atv.id, 'p-diego')
      assert.equal(res.status, 'confirmada')
    }
    const carlaEmMc4 = await inscrever(port, mc4.id, 'p-carla')
    assert.equal(carlaEmMc4.status, 'confirmada')
    const emMc4 = await inscrever(port, mc4.id, 'p-diego')
    assert.equal(emMc4.status, 'em_espera')
    await cancelarInscricao(port, carlaEmMc4.id, 'p-carla')
    const res = await confirmar(port, emMc4.id, 'p-diego')
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'LIMITE_DE_MINICURSOS')
    const diegoDepois = await (
      await fetch(`http://localhost:${port}/inscricoes`, {
        headers: { 'X-Usuario': 'p-diego' }
      })
    ).json()
    assert.equal(diegoDepois.find(i => i.atividadeId === mc4.id).status, 'convocada')
  })

  it('convocada vencida com conflito recusa CONVOCACAO_EXPIRADA, 1a condicao da ordem', async () => {
    await reset(port)
    const a = await criarAtividade(port)
    const e = await criarAtividade(port, {
      titulo: 'Palestra de rede',
      tipo: 'palestra',
      salaId: 'auditorio',
      encontros: [{ inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:30:00-03:00' }]
    })
    const carla = await inscrever(port, a.id, 'p-carla')
    const diego = await inscrever(port, a.id, 'p-diego')
    await inscrever(port, e.id, 'p-diego')
    await cancelarInscricao(port, carla.id, 'p-carla')
    await andarRelogio(port, '2026-10-13T11:01:00-03:00')
    const res = await confirmar(port, diego.id, 'p-diego')
    assert.equal(res.status, 422)
    assert.equal((await res.json()).erro, 'CONVOCACAO_EXPIRADA')
  })
})