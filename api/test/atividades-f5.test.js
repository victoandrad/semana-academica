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

function patchAtividade(port, id, corpo, usuario = 'org-ana') {
  return fetch(`http://localhost:${port}/atividades/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-Usuario': usuario },
    body: JSON.stringify(corpo)
  })
}

function cancelaAtividade(port, id, usuario = 'org-ana') {
  return fetch(`http://localhost:${port}/atividades/${id}/cancelamento`, {
    method: 'POST',
    headers: { 'X-Usuario': usuario }
  })
}

function getAtividade(port, id, usuario = 'org-ana') {
  return fetch(`http://localhost:${port}/atividades/${id}`, {
    headers: { 'X-Usuario': usuario }
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
    titulo: 'da fatia F5',
    tipo: 'palestra',
    salaId: 'sala-101',
    vagas: 10,
    encontros: [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' }
    ],
    ...extra
  }
}

describe('F5 — cancelamento e situação', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('só se cancela antes do início; no instante exato ou depois é ATIVIDADE_JA_INICIADA', async () => {
    await reset(port)
    const antes = await postAtividade(port, corpoAtividade())
    const { id: idAntes } = await antes.json()
    await setRelogio(port, '2026-10-19T18:59:00-03:00')
    const ok = await cancelaAtividade(port, idAntes)
    assert.equal(ok.status, 200)
    assert.equal((await ok.json()).situacao, 'cancelada')

    const exata = await postAtividade(port, corpoAtividade({
      titulo: 'no instante',
      encontros: [
        { inicio: '2026-10-19T21:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
      ]
    }))
    const { id: idExata } = await exata.json()
    await setRelogio(port, '2026-10-19T21:00:00-03:00')
    const recusaExata = await cancelaAtividade(port, idExata)
    assert.equal(recusaExata.status, 422)
    assert.equal((await recusaExata.json()).erro, 'ATIVIDADE_JA_INICIADA')

    const depois = await postAtividade(port, corpoAtividade({
      titulo: 'depois',
      encontros: [
        { inicio: '2026-10-19T22:30:00-03:00', fim: '2026-10-19T23:30:00-03:00' }
      ]
    }))
    const { id: idDepois } = await depois.json()
    await setRelogio(port, '2026-10-19T23:00:00-03:00')
    const recusaDepois = await cancelaAtividade(port, idDepois)
    assert.equal(recusaDepois.status, 422)
    assert.equal((await recusaDepois.json()).erro, 'ATIVIDADE_JA_INICIADA')
  })

  it('cancelar de novo uma atividade cancelada devolve 422 ATIVIDADE_CANCELADA', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    const primeira = await cancelaAtividade(port, id)
    assert.equal(primeira.status, 200)
    const deNovo = await cancelaAtividade(port, id)
    assert.equal(deNovo.status, 422)
    const body = await deNovo.json()
    assert.equal(body.erro, 'ATIVIDADE_CANCELADA')
  })

  it('relógio no início do 1º encontro mostra em_andamento; 1 min antes, prevista', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    await setRelogio(port, '2026-10-19T18:59:00-03:00')
    const prevista = await (await getAtividade(port, id)).json()
    assert.equal(prevista.situacao, 'prevista')
    await setRelogio(port, '2026-10-19T19:00:00-03:00')
    const emAndamento = await (await getAtividade(port, id)).json()
    assert.equal(emAndamento.situacao, 'em_andamento')
  })

  it('relógio no fim do último encontro mostra encerrada; 1 min antes, em_andamento', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    await setRelogio(port, '2026-10-19T19:59:00-03:00')
    const emAndamento = await (await getAtividade(port, id)).json()
    assert.equal(emAndamento.situacao, 'em_andamento')
    await setRelogio(port, '2026-10-19T20:00:00-03:00')
    const encerrada = await (await getAtividade(port, id)).json()
    assert.equal(encerrada.situacao, 'encerrada')
  })

  it('cancelada prevalece sobre o relógio e a leitura devolve 200 com situacao cancelada', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    await cancelaAtividade(port, id)
    const lida = await getAtividade(port, id)
    assert.equal(lida.status, 200)
    assert.equal((await lida.json()).situacao, 'cancelada')
    const outra = await postAtividade(port, corpoAtividade({
      titulo: 'outra',
      encontros: [
        { inicio: '2026-10-19T15:00:00-03:00', fim: '2026-10-19T16:00:00-03:00' }
      ]
    }))
    const { id: idOutra } = await outra.json()
    await setRelogio(port, '2026-10-19T15:00:00-03:00')
    const outraLida = await (await getAtividade(port, idOutra)).json()
    assert.equal(outraLida.situacao, 'em_andamento')
  })

  it('atividade cancelada não pode ser alterada nem cancelada de novo, e mantém os calculados', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    await cancelaAtividade(port, id)
    const patch = await patchAtividade(port, id, { vagas: 5 })
    assert.equal(patch.status, 422)
    assert.equal((await patch.json()).erro, 'ATIVIDADE_CANCELADA')
    const deNovo = await cancelaAtividade(port, id)
    assert.equal(deNovo.status, 422)
    assert.equal((await deNovo.json()).erro, 'ATIVIDADE_CANCELADA')
    const lida = await (await getAtividade(port, id)).json()
    assert.equal(lida.situacao, 'cancelada')
    assert.equal(lida.ocupadas, 0)
    assert.equal(lida.vagasRestantes, 10)
    assert.equal(lida.emEspera, 0)
    assert.equal(lida.cargaHorariaMinutos, 60)
  })
})