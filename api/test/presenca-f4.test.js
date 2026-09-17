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

describe('F4 — Presença manual', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('manual válida às 20:00 por org-ana para p-carla confirmada devolve 201 com origem manual e justificativa gravada (R10, R15)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 201)
    assert.match(body.id, /^pre_[0-9a-f]{8}$/)
    assert.equal(body.encontroId, encontroId)
    assert.equal(body.participanteId, 'p-carla')
    assert.equal(body.origem, 'manual')
    assert.equal(
      Date.parse(body.lidoEm),
      Date.parse('2026-10-19T20:00:00-03:00')
    )
    assert.equal(
      Date.parse(body.registradaEm),
      Date.parse('2026-10-19T20:00:00-03:00')
    )
    assert.equal(body.justificativa, 'chegou atrasada')
  })

  it('manual aceita em 18:45:00 (inicio − 15 min, borda da abertura da janela manual)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T18:45:00-03:00')
    const { status } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 201)
  })

  it('manual recusada em 18:44:59 (inicio − 15 min − 1 s) com 422 FORA_DA_JANELA', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T18:44:59-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual aceita às 00:00:00 de 20/10 (fim + 2 h, borda do fechamento da janela manual)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-20T00:00:00-03:00')
    const { status } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 201)
  })

  it('manual recusada às 00:00:01 de 20/10 (fim + 2 h + 1 s) com 422 FORA_DA_JANELA', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-20T00:00:01-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual sem justificativa devolve 422 JUSTIFICATIVA_OBRIGATORIA (R13)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'JUSTIFICATIVA_OBRIGATORIA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual com justificativa vazia devolve 422 JUSTIFICATIVA_OBRIGATORIA (R13)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: '' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'JUSTIFICATIVA_OBRIGATORIA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual com justificativa só de espaços devolve 422 JUSTIFICATIVA_OBRIGATORIA (R13)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: '   ' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'JUSTIFICATIVA_OBRIGATORIA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual com justificativa de 3 caracteres devolve 422 JUSTIFICATIVA_OBRIGATORIA (R13)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'abc' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'JUSTIFICATIVA_OBRIGATORIA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual com justificativa de tipo errado devolve 422 DADOS_INVALIDOS (R13)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 12345 },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual sem participanteId devolve 422 DADOS_INVALIDOS', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual para participante em_espera devolve 403 NAO_INSCRITO (R8)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port, { vagas: 1 })
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-diego')
    const deCarla = await inscreve(port, atividadeId, 'p-carla')
    assert.equal(deCarla.status, 'em_espera')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('manual para participanteId desconhecido devolve 403 NAO_INSCRITO (R8)', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-ninguem', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('com 5 confirmadas, a 1ª manual devolve 201 e a 2ª (para outro participante) devolve 422 LIMITE_DE_MANUAIS (R14)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    for (const p of ['p-carla', 'p-diego', 'p-elisa', 'p-fabio', 'p-gabriela']) {
      await inscreve(port, atividadeId, p)
    }
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const primeira = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(primeira.status, 201)
    const segunda = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-diego', justificativa: 'falta justificada' },
      'org-ana'
    )
    assert.equal(segunda.status, 422)
    assert.equal(segunda.body.erro, 'LIMITE_DE_MANUAIS')
    assert.equal(typeof segunda.body.mensagem, 'string')
  })

  it('com 1 confirmada, a 1ª manual ainda devolve 201 (10% arredondando para cima, R14)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 201)
  })

  it('manual repetida para quem já tem presença QR devolve 200 com a mesma presença (R11 antes de R8/R15)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigoRes = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(codigoRes.status, 200)
    const codigo = (await codigoRes.json()).codigo
    const presencaQr = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/presencas`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Usuario': 'p-carla' },
        body: JSON.stringify({ codigo })
      }
    )
    assert.equal(presencaQr.status, 201)
    const qrBody = await presencaQr.json()
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(status, 200)
    assert.equal(body.id, qrBody.id)
    assert.deepEqual(body, qrBody)
  })

  it('manual repetida para quem já tem presença manual devolve 200 com a mesma presença, antes do limite (R17)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const primeira = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(primeira.status, 201)
    const segunda = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'outra justificativa longa' },
      'org-ana'
    )
    assert.equal(segunda.status, 200)
    assert.equal(segunda.body.id, primeira.body.id)
    assert.deepEqual(segunda.body, primeira.body)
  })

  it('em_espera com justificativa curta devolve 422 JUSTIFICATIVA_OBRIGATORIA, antes de NAO_INSCRITO (R17)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port, { vagas: 1 })
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-diego')
    const deCarla = await inscreve(port, atividadeId, 'p-carla')
    assert.equal(deCarla.status, 'em_espera')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'abc' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'JUSTIFICATIVA_OBRIGATORIA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('limite atingido e fora da janela devolve 422 FORA_DA_JANELA, antes de LIMITE_DE_MANUAIS (R17)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    for (const p of ['p-carla', 'p-diego', 'p-elisa', 'p-fabio', 'p-gabriela']) {
      await inscreve(port, atividadeId, p)
    }
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const primeira = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'org-ana'
    )
    assert.equal(primeira.status, 201)
    await relogio(port, '2026-10-20T00:00:01-03:00')
    const segunda = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-diego', justificativa: 'falta justificada' },
      'org-ana'
    )
    assert.equal(segunda.status, 422)
    assert.equal(segunda.body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof segunda.body.mensagem, 'string')
  })

  it('participante em POST /encontros/:id/presencas/manual devolve 403 SOMENTE_ORGANIZACAO (R22)', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'chegou atrasada' },
      'p-carla'
    )
    assert.equal(status, 403)
    assert.equal(body.erro, 'SOMENTE_ORGANIZACAO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('quem já tem presença manual, com justificativa curta, recebe 422 JUSTIFICATIVA_OBRIGATORIA — justificativa vem antes da presença existente (R17)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const primeira = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'celular sem bateria' },
      'org-ana'
    )
    assert.equal(primeira.status, 201)
    const { status, body } = await enviaManual(
      port,
      encontroId,
      { participanteId: 'p-carla', justificativa: 'abc' },
      'org-ana'
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'JUSTIFICATIVA_OBRIGATORIA')
  })
})