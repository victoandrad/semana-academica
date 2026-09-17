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

function setRelogio(port, agora) {
  return fetch(`http://localhost:${port}/_teste/relogio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agora })
  })
}

function corpoAtividade(extra) {
  return {
    titulo: 'Da janela 19-23/10',
    tipo: 'palestra',
    salaId: 'sala-101',
    vagas: 10,
    encontros: [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' }
    ],
    ...extra
  }
}

describe('F2 — validações da criação', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('recusa quantidade de encontros fora do limite por tipo', async () => {
    await reset(port)
    const recusados = [
      {
        ...corpoAtividade({ tipo: 'palestra' }),
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T20:00:00-03:00' }
        ]
      },
      corpoAtividade({
        tipo: 'minicurso',
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' }
        ]
      }),
      corpoAtividade({
        tipo: 'minicurso',
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T20:00:00-03:00' },
          { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T20:00:00-03:00' },
          { inicio: '2026-10-22T19:00:00-03:00', fim: '2026-10-22T20:00:00-03:00' },
          { inicio: '2026-10-23T19:00:00-03:00', fim: '2026-10-23T20:00:00-03:00' },
          { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' }
        ]
      })
    ]
    for (const corpo of recusados) {
      const res = await postAtividade(port, corpo)
      assert.equal(res.status, 422)
      const body = await res.json()
      assert.equal(body.erro, 'QUANTIDADE_DE_ENCONTROS')
    }
    const valido = await postAtividade(port, corpoAtividade({ tipo: 'palestra' }))
    assert.equal(valido.status, 201)
  })

  it('recusa encontro fora da janela ou atravessando a meia-noite, mas aceita qualquer horário', async () => {
    await reset(port)
    const recusados = [
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-17T19:00:00-03:00', fim: '2026-10-17T20:00:00-03:00' }
        ]
      }),
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-19T23:00:00-03:00', fim: '2026-10-20T00:30:00-03:00' }
        ]
      }),
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-23T22:00:00-03:00', fim: '2026-10-24T00:00:00-03:00' }
        ]
      })
    ]
    for (const corpo of recusados) {
      const res = await postAtividade(port, corpo)
      assert.equal(res.status, 422)
      const body = await res.json()
      assert.equal(body.erro, 'ENCONTRO_INVALIDO')
    }
    const madrugada = await postAtividade(
      port,
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-20T02:00:00-03:00', fim: '2026-10-20T03:00:00-03:00' }
        ]
      })
    )
    assert.equal(madrugada.status, 201)
    await setRelogio(port, '2026-10-19T20:00:00-03:00')
    const jaIniciada = await postAtividade(
      port,
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    )
    assert.equal(jaIniciada.status, 201)
  })

  it('recusa encontros da mesma atividade que se sobrepõem ou se tocam', async () => {
    await reset(port)
    const recusados = [
      corpoAtividade({
        tipo: 'minicurso',
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-19T20:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }
        ]
      }),
      corpoAtividade({
        tipo: 'minicurso',
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' },
          { inicio: '2026-10-19T20:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }
        ]
      })
    ]
    for (const corpo of recusados) {
      const res = await postAtividade(port, corpo)
      assert.equal(res.status, 422)
      const body = await res.json()
      assert.equal(body.erro, 'ENCONTRO_INVALIDO')
    }
    const valido = await postAtividade(
      port,
      corpoAtividade({
        tipo: 'minicurso',
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' },
          { inicio: '2026-10-19T21:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    )
    assert.equal(valido.status, 201)
  })

  it('recusa encontro com duração fora de 1h a 4h inclusive', async () => {
    await reset(port)
    const recusados = [
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T19:30:00-03:00' }
        ]
      }),
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T14:00:00-03:00' }
        ]
      }),
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T19:00:00-03:00' }
        ]
      })
    ]
    for (const corpo of recusados) {
      const res = await postAtividade(port, corpo)
      assert.equal(res.status, 422)
      const body = await res.json()
      assert.equal(body.erro, 'ENCONTRO_INVALIDO')
    }
    const valido = await postAtividade(
      port,
      corpoAtividade({
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    )
    assert.equal(valido.status, 201)
  })

  it('recusa vagas 0, negativa ou fracionária como DADOS_INVALIDOS', async () => {
    await reset(port)
    for (const vagas of [0, -1, 1.5]) {
      const res = await postAtividade(port, corpoAtividade({ vagas }))
      assert.equal(res.status, 422)
      const body = await res.json()
      assert.equal(body.erro, 'DADOS_INVALIDOS')
    }
    const minimo = await postAtividade(port, corpoAtividade({ vagas: 1 }))
    assert.equal(minimo.status, 201)
  })

  it('prioriza QUANTIDADE_DE_ENCONTROS sobre ENCONTRO_INVALIDO', async () => {
    await reset(port)
    const res = await postAtividade(
      port,
      corpoAtividade({
        tipo: 'palestra',
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T19:30:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T20:00:00-03:00' }
        ]
      })
    )
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'QUANTIDADE_DE_ENCONTROS')
  })
})