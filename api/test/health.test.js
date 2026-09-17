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

describe('F1 — servidor sobe e responde na porta certa', () => {
  let server, port

  before(async () => {
    ({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('responde 200 no health check', async () => {
    const res = await fetch(`http://localhost:${port}/`)
    assert.equal(res.status, 200)
  })
})
