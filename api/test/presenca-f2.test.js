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

describe('F2 — Presença QR online', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('organização em POST /encontros/:id/presencas recebe 403 SOMENTE_PARTICIPANTE mesmo em encontro inexistente', async () => {
    await reset(port)
    const res = await fetch(
      `http://localhost:${port}/encontros/enc_00000000/presencas`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
        body: JSON.stringify({ codigo: 'K7M2QX' })
      }
    )
    const body = await res.json()
    assert.equal(res.status, 403)
    assert.equal(body.erro, 'SOMENTE_PARTICIPANTE')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('POST /encontros/:id/presencas em encontro inexistente devolve 404 NAO_ENCONTRADO', async () => {
    await reset(port)
    const res = await fetch(
      `http://localhost:${port}/encontros/enc_00000000/presencas`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Usuario': 'p-carla' },
        body: JSON.stringify({ codigo: 'K7M2QX' })
      }
    )
    const body = await res.json()
    assert.equal(res.status, 404)
    assert.equal(body.erro, 'NAO_ENCONTRADO')
    assert.equal(body.mensagem, 'Encontro não encontrado.')
  })

  it('encontro inexistente com corpo inválido devolve 404 (existência antes do corpo)', async () => {
    await reset(port)
    const res = await fetch(
      `http://localhost:${port}/encontros/enc_00000000/presencas`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Usuario': 'p-carla' },
        body: JSON.stringify({})
      }
    )
    const body = await res.json()
    assert.equal(res.status, 404)
    assert.equal(body.erro, 'NAO_ENCONTRADO')
    assert.equal(body.mensagem, 'Encontro não encontrado.')
  })

  it('POST sem codigo no corpo devolve 422 DADOS_INVALIDOS', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/presencas`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Usuario': 'p-carla' },
        body: JSON.stringify({})
      }
    )
    const body = await res.json()
    assert.equal(res.status, 422)
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('POST com codigo de tipo errado devolve 422 DADOS_INVALIDOS', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/presencas`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Usuario': 'p-carla' },
        body: JSON.stringify({ codigo: 1234 })
      }
    )
    const body = await res.json()
    assert.equal(res.status, 422)
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('primeira presença devolve 201 com Presenca qr completa no instante do envio', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 201)
    assert.match(body.id, /^pre_[0-9a-f]{8}$/)
    assert.equal(body.encontroId, encontroId)
    assert.equal(body.participanteId, 'p-carla')
    assert.equal(body.origem, 'qr')
    assert.equal(
      Date.parse(body.lidoEm),
      Date.parse('2026-10-19T19:03:45-03:00')
    )
    assert.equal(
      Date.parse(body.registradaEm),
      Date.parse('2026-10-19T19:03:45-03:00')
    )
    assert.equal(body.justificativa, null)
  })

  it('repetir o POST devolve 200 com a mesma presença, mesmo id e mesmos instantes', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const primeira = (
      await enviaPresenca(port, encontroId, 'p-carla', codigo)
    )
    assert.equal(primeira.status, 201)
    const segunda = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(segunda.status, 200)
    assert.equal(segunda.body.id, primeira.body.id)
    assert.deepEqual(segunda.body, primeira.body)
  })

  it('POST sem inscrição na atividade devolve 403 NAO_INSCRITO', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('POST com inscrição em_espera devolve 403 NAO_INSCRITO', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port, { vagas: 1 })
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-diego')
    const deCarla = await inscreve(port, atividadeId, 'p-carla')
    assert.equal(deCarla.status, 'em_espera')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('aceita presença em 18:45:00 (inicio - 15 min, borda da abertura)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T18:45:00-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 201)
  })

  it('recusa presença em 18:44:59 (inicio - 15 min - 1 s, fora da janela)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T18:44:59-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('aceita presença em 19:30:00 (inicio + 30 min, borda do fechamento)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:30:00-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 201)
  })

  it('recusa presença em 19:30:01 (inicio + 30 min + 1 s, fora da janela)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T19:30:01-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('aceita código emitido às 19:03 enviado às 19:04:59 (minuto anterior)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T19:04:59-03:00')
    const { status } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 201)
  })

  it('recusa código emitido às 19:03 enviado às 19:05:00 (validoAte)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T19:05:00-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 422)
    assert.equal(body.erro, 'CODIGO_INVALIDO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('aceita código em minúscula', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status } = await enviaPresenca(port, encontroId, 'p-carla', codigo.toLowerCase())
    assert.equal(status, 201)
  })

  it('aceita código com espaço', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const comEspaco = `${codigo.slice(0, 3)} ${codigo.slice(3)}`
    const { status } = await enviaPresenca(port, encontroId, 'p-carla', comEspaco)
    assert.equal(status, 201)
  })

  it('recusa código com caractere fora do alfabeto com 422 CODIGO_INVALIDO', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', 'K7M2Q0')
    assert.equal(status, 422)
    assert.equal(body.erro, 'CODIGO_INVALIDO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('recusa código emitido para outro encontro com 422 CODIGO_INVALIDO', async () => {
    await reset(port)
    const primeiro = await criaPalestra(port)
    const segundo = await criaPalestra(port, {
      titulo: 'Palestra de tecnologia',
      salaId: 'sala-101',
      vagas: 40
    })
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, segundo.atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigoDoPrimeiro = await obtemCodigo(port, primeiro.encontroId)
    const { status, body } = await enviaPresenca(
      port,
      segundo.encontroId,
      'p-carla',
      codigoDoPrimeiro
    )
    assert.equal(status, 422)
    assert.equal(body.erro, 'CODIGO_INVALIDO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('presença existente fora da janela devolve 200 com a mesma presença (R11 antes de R1)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const primeira = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(primeira.status, 201)
    await relogio(port, '2026-10-19T18:44:59-03:00')
    const segunda = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(segunda.status, 200)
    assert.equal(segunda.body.id, primeira.body.id)
  })

  it('presença existente com código errado devolve 200 com a mesma presença (R11 antes de R6/R7)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const primeira = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(primeira.status, 201)
    const segunda = await enviaPresenca(port, encontroId, 'p-carla', 'ABCDEF')
    assert.equal(segunda.status, 200)
    assert.equal(segunda.body.id, primeira.body.id)
  })

  it('não inscrito, fora da janela e código válido devolve 403 NAO_INSCRITO (R8 antes de R1)', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T18:44:59-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', codigo)
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('fora da janela com código errado devolve 422 FORA_DA_JANELA (R1 antes de R6/R7)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:03:45-03:00')
    await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T18:44:59-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', 'ABCDEF')
    assert.equal(status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })
})