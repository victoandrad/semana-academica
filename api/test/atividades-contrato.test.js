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

const CAMPOS_DA_ATIVIDADE = [
  'id',
  'titulo',
  'tipo',
  'salaId',
  'vagas',
  'encontros',
  'cargaHorariaMinutos',
  'situacao',
  'ocupadas',
  'vagasRestantes',
  'emEspera'
]

function corpoDaAtividade() {
  return {
    titulo: 'Flutter do zero',
    tipo: 'minicurso',
    salaId: 'lab-3',
    vagas: 20,
    encontros: [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
    ]
  }
}

async function criarAtividade(port) {
  const res = await fetch(`http://localhost:${port}/atividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
    body: JSON.stringify(corpoDaAtividade())
  })
  assert.equal(res.status, 201)
  return res.json()
}

function conferirFormatoDoContrato(body) {
  assert.equal('cancelada' in body, false)
  assert.deepEqual(Object.keys(body).sort(), [...CAMPOS_DA_ATIVIDADE].sort())
}

describe('Contrato — Atividade sem o campo interno cancelada', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('POST /atividades responde Atividade com exatamente os campos do contrato', async () => {
    await reset(port)
    conferirFormatoDoContrato(await criarAtividade(port))
  })

  it('GET /atividades/:id responde Atividade com exatamente os campos do contrato', async () => {
    await reset(port)
    const criada = await criarAtividade(port)
    const res = await fetch(
      `http://localhost:${port}/atividades/${criada.id}`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 200)
    conferirFormatoDoContrato(await res.json())
  })

  it('POST /atividades/:id/cancelamento responde Atividade com exatamente os campos do contrato', async () => {
    await reset(port)
    const criada = await criarAtividade(port)
    const res = await fetch(
      `http://localhost:${port}/atividades/${criada.id}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 200)
    const body = await res.json()
    conferirFormatoDoContrato(body)
    assert.equal(body.situacao, 'cancelada')
  })
})