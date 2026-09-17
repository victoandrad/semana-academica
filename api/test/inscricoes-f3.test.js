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
      vagas: 5,
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

describe('F3 — fechamento e recusas do POST', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('inscrever em atividade cancelada devolve 422 ATIVIDADE_CANCELADA', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const cancelamento = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/cancelamento`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'org-ana' }
      }
    )
    assert.equal(cancelamento.status, 200)
    const res = await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'ATIVIDADE_CANCELADA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('inscricoes fecham 30 min antes do 1o encontro: 18h29 aceita, 18h30 inclusive recusa', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    await andarRelogio(port, '2026-10-19T18:29:00-03:00')
    const dentro = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      }
    )
    assert.equal(dentro.status, 201)
    await andarRelogio(port, '2026-10-19T18:30:00-03:00')
    const naBorda = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-diego' }
      }
    )
    assert.equal(naBorda.status, 422)
    assert.equal((await naBorda.json()).erro, 'INSCRICOES_ENCERRADAS')
  })

  it('em_andamento e encerrada tambem recusam com INSCRICOES_ENCERRADAS', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    await andarRelogio(port, '2026-10-19T20:00:00-03:00')
    const emAndamento = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      }
    )
    assert.equal(emAndamento.status, 422)
    assert.equal((await emAndamento.json()).erro, 'INSCRICOES_ENCERRADAS')
    await andarRelogio(port, '2026-10-19T22:30:00-03:00')
    const encerrada = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      }
    )
    assert.equal(encerrada.status, 422)
    assert.equal((await encerrada.json()).erro, 'INSCRICOES_ENCERRADAS')
  })

  it('encontro sobreposto com confirmada devolve 409 CONFLITO_DE_HORARIO', async () => {
    await reset(port)
    const a = await criarAtividade(port, {
      titulo: 'Palestra A',
      tipo: 'palestra',
      salaId: 'auditorio',
      encontros: [{ inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }]
    })
    const b = await criarAtividade(port, {
      titulo: 'Palestra B',
      tipo: 'palestra',
      salaId: 'sala-101',
      encontros: [{ inicio: '2026-10-19T20:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }]
    })
    await fetch(`http://localhost:${port}/atividades/${a.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    const res = await fetch(`http://localhost:${port}/atividades/${b.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 409)
    const body = await res.json()
    assert.equal(body.erro, 'CONFLITO_DE_HORARIO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('encontro que apenas encosta (fim de um = inicio do outro) nao conflita', async () => {
    await reset(port)
    const a = await criarAtividade(port, {
      titulo: 'Palestra A',
      tipo: 'palestra',
      salaId: 'auditorio',
      encontros: [{ inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }]
    })
    const b = await criarAtividade(port, {
      titulo: 'Palestra B',
      tipo: 'palestra',
      salaId: 'sala-101',
      encontros: [{ inicio: '2026-10-19T21:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }]
    })
    await fetch(`http://localhost:${port}/atividades/${a.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    const res = await fetch(`http://localhost:${port}/atividades/${b.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 201)
  })

  it('so colide com em_espera nao bloqueia: inscricao nova em horario do em_espera vira confirmada', async () => {
    await reset(port)
    const a = await criarAtividade(port, {
      titulo: 'Palestra A',
      tipo: 'palestra',
      salaId: 'auditorio',
      vagas: 1,
      encontros: [{ inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }]
    })
    const b = await criarAtividade(port, {
      titulo: 'Palestra B',
      tipo: 'palestra',
      salaId: 'sala-101',
      encontros: [{ inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:30:00-03:00' }]
    })
    await fetch(`http://localhost:${port}/atividades/${a.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    const naEspera = await fetch(`http://localhost:${port}/atividades/${a.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-diego' }
    })
    assert.equal((await naEspera.json()).status, 'em_espera')
    const res = await fetch(`http://localhost:${port}/atividades/${b.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-diego' }
    })
    assert.equal(res.status, 201)
  })

  it('colisao só no 2o encontro de atividade multiencontro devolve conflito', async () => {
    await reset(port)
    const a = await criarAtividade(port, {
      titulo: 'Palestra A',
      tipo: 'palestra',
      salaId: 'auditorio',
      encontros: [{ inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }]
    })
    const b = await criarAtividade(port, {
      titulo: 'Fim de semana de dev',
      tipo: 'minicurso',
      salaId: 'sala-101',
      vagas: 5,
      encontros: [
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' },
        { inicio: '2026-10-21T20:00:00-03:00', fim: '2026-10-21T22:00:00-03:00' }
      ]
    })
    const a2 = await criarAtividade(port, {
      titulo: 'Palestra A2',
      tipo: 'palestra',
      salaId: 'sala-102',
      encontros: [{ inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T21:00:00-03:00' }]
    })
    const insA = await fetch(`http://localhost:${port}/atividades/${a.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(insA.status, 201)
    const insA2 = await fetch(`http://localhost:${port}/atividades/${a2.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(insA2.status, 201)
    const res = await fetch(`http://localhost:${port}/atividades/${b.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 409)
    assert.equal((await res.json()).erro, 'CONFLITO_DE_HORARIO')
  })

  it('4o minicurso com vaga quando ja ocupa 3 devolve 422 LIMITE_DE_MINICURSOS', async () => {
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
    const mc4 = await criarAtividade(port, { salaId: 'auditorio', titulo: 'MC4', encontros: [
      { inicio: '2026-10-22T09:00:00-03:00', fim: '2026-10-22T12:00:00-03:00' },
      { inicio: '2026-10-22T14:00:00-03:00', fim: '2026-10-22T17:00:00-03:00' }
    ] })
    for (const atv of [mc1, mc2, mc3]) {
      const res = await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      })
      assert.equal(res.status, 201)
      assert.equal((await res.json()).status, 'confirmada')
    }
    const res = await fetch(`http://localhost:${port}/atividades/${mc4.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'LIMITE_DE_MINICURSOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('4o minicurso sem vaga nao e recusado no limite: nasce em_espera', async () => {
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
    await fetch(`http://localhost:${port}/atividades/${mc4.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-diego' }
    })
    for (const atv of [mc1, mc2, mc3]) {
      const res = await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      })
      assert.equal(res.status, 201)
    }
    const res = await fetch(`http://localhost:${port}/atividades/${mc4.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.equal(body.status, 'em_espera')
  })

  it('4o palestra com vaga nao conta para o limite de minicursos', async () => {
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
    for (const atv of [mc1, mc2, mc3]) {
      await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      })
    }
    const palestra = await criarAtividade(port, {
      titulo: 'Palestra de IA',
      tipo: 'palestra',
      salaId: 'auditorio',
      encontros: [{ inicio: '2026-10-22T09:00:00-03:00', fim: '2026-10-22T10:30:00-03:00' }]
    })
    const res = await fetch(`http://localhost:${port}/atividades/${palestra.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 201)
    assert.equal((await res.json()).status, 'confirmada')
  })

  it('com 1 dos 3 minicursos cancelado, o 4o com vaga nasce confirmada', async () => {
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
    const mc4 = await criarAtividade(port, { salaId: 'auditorio', titulo: 'MC4', encontros: [
      { inicio: '2026-10-22T09:00:00-03:00', fim: '2026-10-22T12:00:00-03:00' },
      { inicio: '2026-10-22T14:00:00-03:00', fim: '2026-10-22T17:00:00-03:00' }
    ] })
    const inscricoes = {}
    for (const atv of [mc1, mc2, mc3]) {
      inscricoes[atv.id] = await (
        await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
          method: 'POST',
          headers: { 'X-Usuario': 'p-carla' }
        })
      ).json()
    }
    const cancelada = await fetch(
      `http://localhost:${port}/inscricoes/${inscricoes[mc1.id].id}/cancelamento`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      }
    )
    assert.equal(cancelada.status, 200)
    assert.equal((await cancelada.json()).status, 'cancelada')
    const res = await fetch(`http://localhost:${port}/atividades/${mc4.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 201)
    assert.equal((await res.json()).status, 'confirmada')
  })

  it('atividade cancelada vence encerrada na ordem da regra R6', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    await fetch(`http://localhost:${port}/atividades/${atv.id}/cancelamento`, {
      method: 'POST',
      headers: { 'X-Usuario': 'org-ana' }
    })
    await andarRelogio(port, '2026-10-19T18:30:00-03:00')
    const res = await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 422)
    assert.equal((await res.json()).erro, 'ATIVIDADE_CANCELADA')
  })

  it('encerrada vence ja_inscrito: ja ativo em atividade fechada recusa com INSCRICOES_ENCERRADAS', async () => {
    await reset(port)
    const atv = await criarAtividade(port, { vagas: 1 })
    const primeira = await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(primeira.status, 201)
    await andarRelogio(port, '2026-10-19T18:30:00-03:00')
    const res = await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 422)
    assert.equal((await res.json()).erro, 'INSCRICOES_ENCERRADAS')
  })
})