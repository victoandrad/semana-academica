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

describe('F2 — formato de erro e identificação', () => {
  let server, port

  before(async () => {
    ({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('recusa rota protegida sem X-Usuario com 401 USUARIO_DESCONHECIDO', async () => {
    const res = await fetch(`http://localhost:${port}/teste-protegida`)
    const body = await res.json()
    assert.equal(res.status, 401)
    assert.equal(body.erro, 'USUARIO_DESCONHECIDO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('recusa rota protegida com X-Usuario inexistente com 401 USUARIO_DESCONHECIDO', async () => {
    const res = await fetch(`http://localhost:${port}/teste-protegida`, {
      headers: { 'X-Usuario': 'nao-existe' }
    })
    const body = await res.json()
    assert.equal(res.status, 401)
    assert.equal(body.erro, 'USUARIO_DESCONHECIDO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('rejeita corpo não-JSON com 422 DADOS_INVALIDOS', async () => {
    const res = await fetch(`http://localhost:${port}/teste-body`, {
      method: 'POST',
      headers: { 'X-Usuario': 'nao-existe', 'Content-Type': 'text/plain' },
      body: 'isto não é json'
    })
    const body = await res.json()
    assert.equal(res.status, 422)
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('todo erro devolve apenas os campos erro e mensagem', async () => {
    const semHeader = await fetch(`http://localhost:${port}/teste-protegida`)
    const semHeaderBody = await semHeader.json()
    assert.equal(semHeader.status, 401)
    assert.deepEqual(Object.keys(semHeaderBody).sort(), ['erro', 'mensagem'])

    const semJson = await fetch(`http://localhost:${port}/teste-body`, {
      method: 'POST',
      headers: { 'X-Usuario': 'nao-existe', 'Content-Type': 'text/plain' },
      body: 'não é json'
    })
    const semJsonBody = await semJson.json()
    assert.equal(semJson.status, 422)
    assert.deepEqual(Object.keys(semJsonBody).sort(), ['erro', 'mensagem'])
  })
})