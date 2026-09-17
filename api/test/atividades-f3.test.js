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

function postAtividade(port, corpo, usuario = 'org-ana') {
  return fetch(`http://localhost:${port}/atividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Usuario': usuario },
    body: JSON.stringify(corpo)
  })
}

function setRelogio(port, agora) {
  return fetch(`http://localhost:${port}/_teste/relogio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agora })
  })
}

function corpoAtividade(extra) {
  return {
    titulo: 'da fatia F3',
    tipo: 'palestra',
    salaId: 'sala-101',
    vagas: 10,
    encontros: [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' }
    ],
    ...extra
  }
}

describe('F3 — vagas e conflito de sala', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('recusa vagas acima da capacidade da sala e aceita lotar até a capacidade', async () => {
    await reset(port)
    const acima = await postAtividade(port, corpoAtividade({ vagas: 41 }))
    assert.equal(acima.status, 422)
    const body = await acima.json()
    assert.equal(body.erro, 'VAGAS_ACIMA_DA_CAPACIDADE')
    const exato = await postAtividade(port, corpoAtividade({ vagas: 40 }))
    assert.equal(exato.status, 201)
  })

  it('recusa outra atividade na mesma sala a menos de 15 min do fim de um encontro', async () => {
    await reset(port)
    const a = await postAtividade(port, corpoAtividade({
      titulo: 'A',
      encontros: [
        { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }
      ]
    }))
    assert.equal(a.status, 201)
    const a14 = await postAtividade(port, corpoAtividade({
      titulo: 'B',
      encontros: [
        { inicio: '2026-10-19T10:14:00-03:00', fim: '2026-10-19T11:14:00-03:00' }
      ]
    }))
    assert.equal(a14.status, 409)
    const body = await a14.json()
    assert.equal(body.erro, 'CONFLITO_DE_SALA')
    const a15 = await postAtividade(port, corpoAtividade({
      titulo: 'B2',
      encontros: [
        { inicio: '2026-10-19T10:15:00-03:00', fim: '2026-10-19T11:15:00-03:00' }
      ]
    }))
    assert.equal(a15.status, 201)
    const toque = await postAtividade(port, corpoAtividade({
      titulo: 'C',
      encontros: [
        { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
      ]
    }))
    assert.equal(toque.status, 409)
    assert.equal((await toque.json()).erro, 'CONFLITO_DE_SALA')
  })

  it('cancelar atividade libera a sala para outra atividade no mesmo horário', async () => {
    await reset(port)
    const a = await postAtividade(port, corpoAtividade({
      titulo: 'A',
      encontros: [
        { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
      ]
    }))
    assert.equal(a.status, 201)
    const { id } = await a.json()
    const cancel = await fetch(
      `http://localhost:${port}/atividades/${id}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(cancel.status, 200)
    assert.equal((await cancel.json()).situacao, 'cancelada')
    const b = await postAtividade(port, corpoAtividade({
      titulo: 'B',
      encontros: [
        { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
      ]
    }))
    assert.equal(b.status, 201)
  })

  it('PATCH elevando vagas além da capacidade devolve 422 VAGAS_ACIMA_DA_CAPACIDADE', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade({ vagas: 30 }))
    const { id } = await criada.json()
    const acima = await fetch(`http://localhost:${port}/atividades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({ vagas: 41 })
    })
    assert.equal(acima.status, 422)
    const body = await acima.json()
    assert.equal(body.erro, 'VAGAS_ACIMA_DA_CAPACIDADE')
    const ok = await fetch(`http://localhost:${port}/atividades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({ vagas: 25 })
    })
    assert.equal(ok.status, 200)
    const alterada = await ok.json()
    assert.equal(alterada.vagas, 25)
  })

  it('prioriza ENCONTRO_INVALIDO sobre VAGAS_ACIMA_DA_CAPACIDADE e esta sobre CONFLITO_DE_SALA', async () => {
    await reset(port)
    const encontro = await postAtividade(port, corpoAtividade({
      vagas: 41,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T19:30:00-03:00' }
      ]
    }))
    assert.equal(encontro.status, 422)
    assert.equal((await encontro.json()).erro, 'ENCONTRO_INVALIDO')
    const ocupando = await postAtividade(port, corpoAtividade({
      titulo: 'A',
      encontros: [
        { inicio: '2026-10-19T16:00:00-03:00', fim: '2026-10-19T17:00:00-03:00' }
      ]
    }))
    assert.equal(ocupando.status, 201)
    const vagas = await postAtividade(port, corpoAtividade({
      titulo: 'B',
      vagas: 41,
      encontros: [
        { inicio: '2026-10-19T16:00:00-03:00', fim: '2026-10-19T17:00:00-03:00' }
      ]
    }))
    assert.equal(vagas.status, 422)
    assert.equal((await vagas.json()).erro, 'VAGAS_ACIMA_DA_CAPACIDADE')
  })
})