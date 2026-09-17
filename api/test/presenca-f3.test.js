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

describe('F3 — Presença offline (lidoEm)', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('envio às 20:00 com lidoEm 19:10:30 devolve 201 com origem qr_offline, lidoEm e registradaEm 20:00 (R10, R12)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:10:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: '2026-10-19T19:10:30-03:00'
    })
    assert.equal(status, 201)
    assert.equal(body.origem, 'qr_offline')
    assert.equal(
      Date.parse(body.lidoEm),
      Date.parse('2026-10-19T19:10:30-03:00')
    )
    assert.equal(
      Date.parse(body.registradaEm),
      Date.parse('2026-10-19T20:00:00-03:00')
    )
  })

  it('envio às 00:00:01 (fim + 2 h + 1 s) devolve 422 SINCRONIZACAO_TARDIA (R9)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:10:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-20T00:00:01-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: '2026-10-19T19:10:30-03:00'
    })
    assert.equal(status, 422)
    assert.equal(body.erro, 'SINCRONIZACAO_TARDIA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('envio às 00:00:00 (fim + 2 h, borda) com lidoEm 19:10:30 devolve 201 (R9)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:10:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-20T00:00:00-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: '2026-10-19T19:10:30-03:00'
    })
    assert.equal(status, 201)
    assert.equal(body.origem, 'qr_offline')
  })

  it('lidoEm 18:44:59 com envio dentro da janela devolve 422 FORA_DA_JANELA (R12)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:15:00-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: '2026-10-19T18:44:59-03:00'
    })
    assert.equal(status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('lidoEm 19:30:01 com envio depois do fechamento devolve 422 FORA_DA_JANELA (R12)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:15:00-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T19:30:02-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: '2026-10-19T19:30:01-03:00'
    })
    assert.equal(status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('lidoEm no futuro não é erro: devolve 201 e grava o instante do envio como lidoEm (R12)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:10:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: '2026-10-19T19:11:30-03:00'
    })
    assert.equal(status, 201)
    assert.equal(body.origem, 'qr_offline')
    assert.equal(
      Date.parse(body.lidoEm),
      Date.parse('2026-10-19T19:10:30-03:00')
    )
    assert.equal(
      Date.parse(body.registradaEm),
      Date.parse('2026-10-19T19:10:30-03:00')
    )
  })

  it('lidoEm que não é string ISO válida devolve 422 DADOS_INVALIDOS', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:10:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: 'ontem de tarde'
    })
    assert.equal(status, 422)
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('lidoEm de tipo errado devolve 422 DADOS_INVALIDOS', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:10:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: 12345
    })
    assert.equal(status, 422)
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('reenvio do mesmo lidoEm devolve 200 com o mesmo id e a mesma presença (R11)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:10:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T20:00:00-03:00')
    const corpo = { codigo, lidoEm: '2026-10-19T19:10:30-03:00' }
    const primeira = await enviaPresenca(port, encontroId, 'p-carla', corpo)
    assert.equal(primeira.status, 201)
    const segunda = await enviaPresenca(port, encontroId, 'p-carla', corpo)
    assert.equal(segunda.status, 200)
    assert.equal(segunda.body.id, primeira.body.id)
    assert.deepEqual(segunda.body, primeira.body)
  })

  it('código errado com envio tardio devolve 422 SINCRONIZACAO_TARDIA, antes de CODIGO_INVALIDO (R16)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T19:10:30-03:00')
    await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-20T00:00:01-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo: 'ABCDEF',
      lidoEm: '2026-10-19T19:10:30-03:00'
    })
    assert.equal(status, 422)
    assert.equal(body.erro, 'SINCRONIZACAO_TARDIA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('não inscrito com envio tardio devolve 403 NAO_INSCRITO, antes de SINCRONIZACAO_TARDIA (R16)', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:10:30-03:00')
    await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-20T00:00:01-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-diego', {
      codigo: 'ABCDEF',
      lidoEm: '2026-10-19T19:10:30-03:00'
    })
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('atividade cancelada antes do envio: presença lida antes do cancelamento devolve 403 NAO_INSCRITO (R18)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T18:47:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    await relogio(port, '2026-10-19T18:50:00-03:00')
    const cancelamento = await fetch(
      `http://localhost:${port}/atividades/${atividadeId}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(cancelamento.status, 200)
    await relogio(port, '2026-10-19T19:00:00-03:00')
    const { status, body } = await enviaPresenca(port, encontroId, 'p-carla', {
      codigo,
      lidoEm: '2026-10-19T18:47:00-03:00'
    })
    assert.equal(status, 403)
    assert.equal(body.erro, 'NAO_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('atividade cancelada depois da presença registrada: reenvio devolve 200 com a mesma presença (R18)', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T10:00:00-03:00')
    await inscreve(port, atividadeId, 'p-carla')
    await relogio(port, '2026-10-19T18:47:30-03:00')
    const codigo = await obtemCodigo(port, encontroId)
    const corpo = { codigo, lidoEm: '2026-10-19T18:47:00-03:00' }
    const primeira = await enviaPresenca(port, encontroId, 'p-carla', corpo)
    assert.equal(primeira.status, 201)
    await relogio(port, '2026-10-19T18:50:00-03:00')
    const cancelamento = await fetch(
      `http://localhost:${port}/atividades/${atividadeId}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(cancelamento.status, 200)
    await relogio(port, '2026-10-19T19:00:00-03:00')
    const segunda = await enviaPresenca(port, encontroId, 'p-carla', corpo)
    assert.equal(segunda.status, 200)
    assert.equal(segunda.body.id, primeira.body.id)
    assert.deepEqual(segunda.body, primeira.body)
  })
})