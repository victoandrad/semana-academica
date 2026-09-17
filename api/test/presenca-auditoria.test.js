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

async function criaPalestra(port, corpo = {}) {
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
      ],
      ...corpo
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

async function enviaPresenca(port, encontroId, xUsuario, codigo) {
  const res = await fetch(
    `http://localhost:${port}/encontros/${encontroId}/presencas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': xUsuario },
      body: JSON.stringify({ codigo })
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

describe('Auditoria M3 — lacunas do parecer 2026-09-17', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('inscrição cancelada: POST /encontros/:id/presencas com código válido devolve 403 NAO_INSCRITO (R8)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    const inscricaoDeCarla = await inscreve(port, atividadeId, 'p-carla')
    assert.equal(inscricaoDeCarla.status, 'confirmada')
    await relogio(port, '2026-10-19T10:05:00-03:00')
    const cancelada = await fetch(
      `http://localhost:${port}/inscricoes/${inscricaoDeCarla.id}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'p-carla' } }
    )
    assert.equal(cancelada.status, 200)
    assert.equal((await cancelada.json()).status, 'cancelada')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  // A prova é com expirada: convocada nunca coexiste com a janela de presença,
  // porque a convocação vence no máximo no fechamento (início − 30 min) e a
  // janela abre em início − 15 min (spec M2).
  it('inscrição expirada: POST /encontros/:id/presencas com código válido devolve 403 NAO_INSCRITO (R8)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port, { vagas: 1 })
    await relogio(port, '2026-10-19T10:00:00-03:00')
    const deDiego = await inscreve(port, atividadeId, 'p-diego')
    assert.equal(deDiego.status, 'confirmada')
    const deCarla = await inscreve(port, atividadeId, 'p-carla')
    assert.equal(deCarla.status, 'em_espera')
    await relogio(port, '2026-10-19T18:00:00-03:00')
    const cancelada = await fetch(
      `http://localhost:${port}/inscricoes/${deDiego.id}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'p-diego' } }
    )
    assert.equal(cancelada.status, 200)
    const convocada = await (
      await fetch(`http://localhost:${port}/inscricoes/${deCarla.id}`, {
        headers: { 'X-Usuario': 'p-carla' }
      })
    ).json()
    assert.equal(convocada.status, 'convocada')
    assert.equal(
      Date.parse(convocada.convocadaAte),
      Date.parse('2026-10-19T18:30:00-03:00')
    )
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const expirada = await (
      await fetch(`http://localhost:${port}/inscricoes/${deCarla.id}`, {
        headers: { 'X-Usuario': 'p-carla' }
      })
    ).json()
    assert.equal(expirada.status, 'expirada')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('atividade cancelada: manual para quem já tem presença devolve 200 com a mesma presença e para quem não tem devolve 403 NAO_INSCRITO (R18)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await inscreve(port, atividadeId, 'p-diego')
    await relogio(port, '2026-10-19T18:47:00-03:00')
    const primeira = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-diego', justificativa: 'justificativa valida' },
      'org-ana'
    )
    assert.equal(primeira.status, 201)
    await relogio(port, '2026-10-19T18:50:00-03:00')
    const cancelamento = await fetch(
      `http://localhost:${port}/atividades/${atividadeId}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(cancelamento.status, 200)
    await relogio(port, '2026-10-19T18:55:00-03:00')
    const repetida = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-diego', justificativa: 'justificativa valida' },
      'org-ana'
    )
    assert.equal(repetida.status, 200)
    assert.equal(repetida.body.id, primeira.body.id)
    const semPresenca = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'justificativa valida' },
      'org-ana'
    )
    assert.equal(semPresenca.status, 403)
    assert.equal(semPresenca.body.erro, 'NAO_INSCRITO')
    assert.equal(typeof semPresenca.body.mensagem, 'string')
  })
})