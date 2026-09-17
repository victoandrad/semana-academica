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

describe('F1 — criar e ler atividade', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('POST /atividades com org-ana e corpo válido devolve 201 com a Atividade', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' },
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.match(body.id, /^atv_[0-9a-f]{8}$/)
    assert.equal(body.titulo, 'Flutter do zero')
    assert.equal(body.tipo, 'minicurso')
    assert.equal(body.salaId, 'lab-3')
    assert.equal(body.vagas, 20)
    assert.equal(body.situacao, 'prevista')
    assert.equal(body.cargaHorariaMinutos, 360)
    assert.equal(body.encontros.length, 2)
    assert.match(body.encontros[0].id, /^enc_[0-9a-f]{8}$/)
    assert.equal(
      Date.parse(body.encontros[0].inicio),
      Date.parse('2026-10-19T19:00:00-03:00')
    )
    assert.equal(
      Date.parse(body.encontros[1].inicio),
      Date.parse('2026-10-20T19:00:00-03:00')
    )
  })

  it('POST /atividades devolve ocupadas 0, vagasRestantes igual a vagas e emEspera 0', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Flutter do zero',
        tipo: 'palestra',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.equal(body.ocupadas, 0)
    assert.equal(body.vagasRestantes, 20)
    assert.equal(body.emEspera, 0)
  })

  it('POST ignorando cargaHorariaMinutos enviado no corpo e devolvendo a soma', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 20,
        cargaHorariaMinutos: 999,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      })
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.equal(body.cargaHorariaMinutos, 360)
  })

  it('POST soma 90+75 minutos em 165, sem arredondamento', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Palestra relâmpago',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:30:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T20:15:00-03:00' }
        ]
      })
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.equal(body.cargaHorariaMinutos, 165)
  })

  it('POST /atividades com participante devolve 403 SOMENTE_ORGANIZACAO', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'p-carla' },
      body: JSON.stringify({
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    })
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.erro, 'SOMENTE_ORGANIZACAO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('GET /atividades com participante devolve 200 com a atividade criada', async () => {
    await reset(port)
    await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Flutter do zero',
        tipo: 'palestra',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    })
    const res = await fetch(`http://localhost:${port}/atividades`, {
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.length, 1)
    assert.equal(body[0].titulo, 'Flutter do zero')
    assert.equal(body[0].situacao, 'prevista')
  })

  it('GET /atividades/:id com org-ana devolve 200 com a atividade criada', async () => {
    await reset(port)
    const criada = await (await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Flutter do zero',
        tipo: 'palestra',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    })).json()
    const res = await fetch(
      `http://localhost:${port}/atividades/${criada.id}`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.id, criada.id)
    assert.equal(body.titulo, 'Flutter do zero')
    assert.equal(body.cargaHorariaMinutos, 180)
  })

  it('GET /atividades/:id em id inexistente devolve 404 NAO_ENCONTRADO', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/atividades/atv_00000000`, {
      headers: { 'X-Usuario': 'org-bruno' }
    })
    assert.equal(res.status, 404)
    const body = await res.json()
    assert.equal(body.erro, 'NAO_ENCONTRADO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('POST /atividades sem titulo devolve 422 DADOS_INVALIDOS', async () => {
    await reset(port)
    const corpo = {
      tipo: 'minicurso',
      salaId: 'lab-3',
      vagas: 20,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
      ]
    }
    const res = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify(corpo)
    })
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('POST /atividades com tipo "oficina" devolve 422 DADOS_INVALIDOS', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Oficina de origami',
        tipo: 'oficina',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    })
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'DADOS_INVALIDOS')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('POST /atividades com salaId inexistente devolve 404 NAO_ENCONTRADO', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Palestra no além',
        tipo: 'palestra',
        salaId: 'sala-xyz',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' }
        ]
      })
    })
    assert.equal(res.status, 404)
    const body = await res.json()
    assert.equal(body.erro, 'NAO_ENCONTRADO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('POST /_teste/reset apaga a atividade criada e devolve os dados iniciais intactos', async () => {
    await reset(port)
    const criada = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Flutter do zero',
        tipo: 'palestra',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      })
    })
    assert.equal(criada.status, 201)
    const antes = await (await fetch(`http://localhost:${port}/atividades`, {
      headers: { 'X-Usuario': 'org-ana' }
    })).json()
    assert.equal(antes.length, 1)
    await fetch(`http://localhost:${port}/_teste/relogio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agora: '2026-10-20T10:00:00-03:00' })
    })
    const resetRes = await fetch(`http://localhost:${port}/_teste/reset`, {
      method: 'POST'
    })
    assert.equal(resetRes.status, 204)
    const atividades = await (await fetch(`http://localhost:${port}/atividades`, {
      headers: { 'X-Usuario': 'org-ana' }
    })).json()
    assert.deepEqual(atividades, [])
    const salas = await (await fetch(`http://localhost:${port}/salas`, {
      headers: { 'X-Usuario': 'org-ana' }
    })).json()
    assert.deepEqual(salas, [
      { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
      { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
      { id: 'sala-102', nome: 'Sala 102', capacidade: 40 },
      { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }
    ])
    const relogioDepois = await (await fetch(`http://localhost:${port}/_teste/relogio`)).json()
    assert.equal(Date.parse(relogioDepois.agora), Date.parse('2026-10-13T09:00:00-03:00'))
  })
})