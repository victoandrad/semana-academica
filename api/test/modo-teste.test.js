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

describe('F4 — rotas de teste ativas com MODO_TESTE=1', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('PUT /_teste/relogio com {agora} responde 200 com o valor recebido', async () => {
    const res = await fetch(`http://localhost:${port}/_teste/relogio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agora: '2026-10-20T10:00:00-03:00' })
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(Date.parse(body.agora), Date.parse('2026-10-20T10:00:00-03:00'))
  })

  it('PUT /_teste/relogio com corpo não-JSON devolve 422 DADOS_INVALIDOS', async () => {
    const res = await fetch(`http://localhost:${port}/_teste/relogio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"agora": '
    })
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('GET /_teste/relogio retorna o último horário definido por PUT e fica parado', async () => {
    await fetch(`http://localhost:${port}/_teste/relogio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agora: '2026-10-20T10:00:00-03:00' })
    })
    const antes = await (await fetch(`http://localhost:${port}/_teste/relogio`)).json()
    const depois = await (await fetch(`http://localhost:${port}/_teste/relogio`)).json()
    assert.equal(Date.parse(antes.agora), Date.parse('2026-10-20T10:00:00-03:00'))
    assert.equal(Date.parse(depois.agora), Date.parse(antes.agora))
  })

  it('POST /_teste/reset zera o relógio em 09:00 e mantém as 4 salas', async () => {
    await fetch(`http://localhost:${port}/_teste/relogio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agora: '2026-10-20T10:00:00-03:00' })
    })
    const res = await fetch(`http://localhost:${port}/_teste/reset`, { method: 'POST' })
    assert.equal(res.status, 204)
    const relogio = await (await fetch(`http://localhost:${port}/_teste/relogio`)).json()
    assert.equal(Date.parse(relogio.agora), Date.parse('2026-10-13T09:00:00-03:00'))
    const salas = await (await fetch(`http://localhost:${port}/salas`, {
      headers: { 'X-Usuario': 'p-carla' }
    })).json()
    assert.equal(salas.length, 4)
  })
})

describe('F4 — sem MODO_TESTE=1 as rotas /_teste respondem 404', () => {
  let server, port

  before(() => {
    delete process.env.MODO_TESTE
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('GET, POST e PUT em /_teste/* devolvem 404', async () => {
    const rotas = [
      ['GET', '/_teste/relogio'],
      ['POST', '/_teste/reset'],
      ['PUT', '/_teste/relogio']
    ]
    for (const [method, caminho] of rotas) {
      const res = await fetch(`http://localhost:${port}${caminho}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'PUT' ? JSON.stringify({ agora: '2026-10-20T10:00:00-03:00' }) : undefined
      })
      assert.equal(res.status, 404, `${method} ${caminho} deveria ser 404`)
      const body = await res.json()
      assert.equal(typeof body.erro, 'string')
    }
  })
})