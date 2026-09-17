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
  const res = await fetch(`http://localhost:${port}/_teste/reset`, { method: 'POST' })
  assert.equal(res.status, 204)
}

async function relogio(port, iso) {
  const res = await fetch(`http://localhost:${port}/_teste/relogio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agora: iso })
  })
  assert.equal(res.status, 200)
}

async function criaPalestra(port) {
  const res = await fetch(`http://localhost:${port}/atividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
    body: JSON.stringify({
      titulo: 'Palestra de abertura',
      tipo: 'palestra',
      salaId: 'auditorio',
      vagas: 100,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
      ]
    })
  })
  assert.equal(res.status, 201)
  const atividade = await res.json()
  return { atividadeId: atividade.id, encontroId: atividade.encontros[0].id }
}

async function inscreve(port, atividadeId, xUsuario) {
  const res = await fetch(
    `http://localhost:${port}/atividades/${atividadeId}/inscricoes`,
    {
      method: 'POST',
      headers: { 'X-Usuario': xUsuario }
    }
  )
  assert.equal(res.status, 201)
  return res.json()
}

async function obtemCodigo(port, encontroId) {
  const res = await fetch(
    `http://localhost:${port}/encontros/${encontroId}/codigo`,
    { headers: { 'X-Usuario': 'org-ana' } }
  )
  assert.equal(res.status, 200)
  return (await res.json()).codigo
}

async function enviaPresenca(port, encontroId, xUsuario, corpo) {
  const res = await fetch(
    `http://localhost:${port}/encontros/${encontroId}/presencas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': xUsuario },
      body: JSON.stringify(corpo)
    }
  )
  return { status: res.status, body: await res.json() }
}

async function enviaManual(port, encontroId, corpo, xUsuario) {
  const res = await fetch(
    `http://localhost:${port}/encontros/${encontroId}/presencas/manual`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': xUsuario },
      body: JSON.stringify(corpo)
    }
  )
  return { status: res.status, body: await res.json() }
}

describe('F5 — Lista de presenças', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('GET sem nenhuma presença registrada devolve 200 com lista vazia (R19)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await inscreve(port, atividadeId, 'p-diego')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/presencas`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), [])
  })

  it('p-carla QR 19:03:45 e p-diego manual 20:00 → lista com 2, p-carla antes de p-diego, com os campos do contrato (R19)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await inscreve(port, atividadeId, 'p-diego')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const qr = await enviaPresenca(port, encontroId, 'p-carla', { codigo })
    assert.equal(qr.status, 201)
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const manual = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-diego', justificativa: 'chegou atrasado' },
      'org-ana'
    )
    assert.equal(manual.status, 201)
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/presencas`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 200)
    const lista = await res.json()
    assert.equal(lista.length, 2)
    assert.equal(lista[0].id, qr.body.id)
    assert.equal(lista[1].id, manual.body.id)
    for (const presenca of lista) {
      assert.equal(typeof presenca.id, 'string')
      assert.equal(presenca.encontroId, encontroId)
      assert.equal(typeof presenca.participanteId, 'string')
      assert.equal(['qr', 'qr_offline', 'manual'].includes(presenca.origem), true)
      assert.equal(typeof presenca.lidoEm, 'string')
      assert.equal(typeof presenca.registradaEm, 'string')
      assert.ok('justificativa' in presenca)
    }
    assert.equal(
      Date.parse(lista[0].registradaEm),
      Date.parse('2026-10-19T19:03:45-03:00')
    )
    assert.equal(
      Date.parse(lista[1].registradaEm),
      Date.parse('2026-10-19T20:00:00-03:00')
    )
  })

  it('duas presenças com o mesmo registradaEm ficam em ordem crescente por id (R19)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await inscreve(port, atividadeId, 'p-diego')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const deCarla = await enviaPresenca(port, encontroId, 'p-carla', { codigo })
    assert.equal(deCarla.status, 201)
    const deDiego = await enviaPresenca(port, encontroId, 'p-diego', { codigo })
    assert.equal(deDiego.status, 201)
    assert.equal(
      Date.parse(deCarla.body.registradaEm),
      Date.parse(deDiego.body.registradaEm)
    )
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/presencas`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 200)
    const lista = await res.json()
    const idsOrdenados = [deCarla.body.id, deDiego.body.id].sort()
    assert.deepEqual(lista.map(p => p.id), idsOrdenados)
  })

  it('presença registrada às 18:47 continua na lista após cancelar a atividade às 18:50 (R24)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await inscreve(port, atividadeId, 'p-diego')
    await relogio(port, '2026-10-19T18:47:00-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const presenca = await enviaPresenca(port, encontroId, 'p-carla', { codigo })
    assert.equal(presenca.status, 201)
    await relogio(port, '2026-10-19T18:50:00-03:00')
    const cancelamento = await fetch(
      `http://localhost:${port}/atividades/${atividadeId}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(cancelamento.status, 200)
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/presencas`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 200)
    const lista = await res.json()
    assert.equal(lista.length, 1)
    assert.equal(lista[0].id, presenca.body.id)
  })

  it('participante em GET /encontros/:id/presencas devolve 403 SOMENTE_ORGANIZACAO (R22)', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/presencas`,
      { headers: { 'X-Usuario': 'p-carla' } }
    )
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.erro, 'SOMENTE_ORGANIZACAO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('GET de encontro inexistente devolve 404 NAO_ENCONTRADO (R22)', async () => {
    await reset(port)
    const res = await fetch(
      `http://localhost:${port}/encontros/enc_00000000/presencas`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 404)
    const body = await res.json()
    assert.equal(body.erro, 'NAO_ENCONTRADO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('DELETE e PATCH de presença devolvem 404 NAO_ENCONTRADO em JSON — não há rota de edição nem apagamento (R20)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const presenca = await enviaPresenca(port, encontroId, 'p-carla', { codigo })
    assert.equal(presenca.status, 201)
    for (const metodo of ['DELETE', 'PATCH']) {
      const res = await fetch(
        `http://localhost:${port}/encontros/${encontroId}/presencas/${presenca.body.id}`,
        { method: metodo, headers: { 'X-Usuario': 'org-ana' } }
      )
      assert.equal(res.status, 404)
      const body = await res.json()
      assert.equal(body.erro, 'NAO_ENCONTRADO')
      assert.equal(typeof body.mensagem, 'string')
    }
  })

  it('POST /encontros/:id/saidas devolve 404 NAO_ENCONTRADO em JSON — não há rota de saída (R21)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/saidas`,
      { method: 'POST', headers: { 'X-Usuario': 'p-carla' } }
    )
    assert.equal(res.status, 404)
    const body = await res.json()
    assert.equal(body.erro, 'NAO_ENCONTRADO')
    assert.equal(typeof body.mensagem, 'string')
  })
})