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

describe('F3 — dados iniciais e GET /salas', () => {
  let server, port

  before(async () => {
    ({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('GET /salas com X-Usuario: p-carla retorna 200 com as 4 salas iniciais', async () => {
    const res = await fetch(`http://localhost:${port}/salas`, {
      headers: { 'X-Usuario': 'p-carla' }
    })
    const body = await res.json()
    assert.equal(res.status, 200)
    assert.deepEqual(body, [
      { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
      { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
      { id: 'sala-102', nome: 'Sala 102', capacidade: 40 },
      { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }
    ])
  })

  it('GET /salas sem X-Usuario devolve 401 USUARIO_DESCONHECIDO', async () => {
    const res = await fetch(`http://localhost:${port}/salas`)
    const body = await res.json()
    assert.equal(res.status, 401)
    assert.equal(body.erro, 'USUARIO_DESCONHECIDO')
    assert.equal(typeof body.mensagem, 'string')
    assert.deepEqual(Object.keys(body).sort(), ['erro', 'mensagem'])
  })

  it('GET /salas com X-Usuario inexistente devolve 401 USUARIO_DESCONHECIDO', async () => {
    const res = await fetch(`http://localhost:${port}/salas`, {
      headers: { 'X-Usuario': 'nao-existe' }
    })
    const body = await res.json()
    assert.equal(res.status, 401)
    assert.equal(body.erro, 'USUARIO_DESCONHECIDO')
    assert.equal(typeof body.mensagem, 'string')
  })
})