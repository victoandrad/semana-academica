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

async function relogio(port, iso) {
  await fetch(`http://localhost:${port}/_teste/relogio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agora: iso })
  })
}

async function criaPalestra(port) {
  const resposta = await fetch(`http://localhost:${port}/atividades`, {
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
  const atividade = await resposta.json()
  return { atividadeId: atividade.id, encontroId: atividade.encontros[0].id }
}

describe('F1 — Emitir o código do encontro', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('participante em GET /encontros/:id/codigo recebe 403 SOMENTE_ORGANIZACAO', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'p-carla' } }
    )
    const body = await res.json()
    assert.equal(res.status, 403)
    assert.equal(body.erro, 'SOMENTE_ORGANIZACAO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('GET /encontros/:id/codigo em encontro inexistente devolve 404 NAO_ENCONTRADO', async () => {
    await reset(port)
    await relogio(port, '2026-10-19T19:00:00-03:00')
    const res = await fetch(
      `http://localhost:${port}/encontros/enc_00000000/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    const body = await res.json()
    assert.equal(res.status, 404)
    assert.equal(body.erro, 'NAO_ENCONTRADO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('GET /encontros/:id/codigo em 18:45:00 (inicio - 15 min) devolve 200 com o CodigoDoEncontro', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T18:45:00-03:00')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    const body = await res.json()
    assert.equal(res.status, 200)
    assert.equal(body.encontroId, encontroId)
    assert.equal(typeof body.codigo, 'string')
    assert.equal(typeof body.trocaEm, 'string')
    assert.equal(typeof body.validoAte, 'string')
  })

  it('GET /encontros/:id/codigo em 18:44:59 devolve 422 FORA_DA_JANELA', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T18:44:59-03:00')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    const body = await res.json()
    assert.equal(res.status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('GET /encontros/:id/codigo em 19:30:00 (inicio + 30 min) devolve 200', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:30:00-03:00')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(res.status, 200)
  })

  it('GET /encontros/:id/codigo em 19:30:01 devolve 422 FORA_DA_JANELA', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:30:01-03:00')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    const body = await res.json()
    assert.equal(res.status, 422)
    assert.equal(body.erro, 'FORA_DA_JANELA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('código das 19:03 tem 6 caracteres do alfabeto, trocaEm 19:04:00 e validoAte 19:05:00', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    const body = await res.json()
    assert.equal(res.status, 200)
    assert.match(body.codigo, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
    assert.equal(
      Date.parse(body.trocaEm),
      Date.parse('2026-10-19T19:04:00-03:00')
    )
    assert.equal(
      Date.parse(body.validoAte),
      Date.parse('2026-10-19T19:05:00-03:00')
    )
  })

  it('dois GET /encontros/:id/codigo no mesmo minuto devolvem o mesmo código, trocaEm e validoAte', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const url = `http://localhost:${port}/encontros/${encontroId}/codigo`
    const primeiro = await (
      await fetch(url, { headers: { 'X-Usuario': 'org-ana' } })
    ).json()
    const segundo = await (
      await fetch(url, { headers: { 'X-Usuario': 'org-ana' } })
    ).json()
    assert.equal(primeiro.codigo, segundo.codigo)
    assert.equal(primeiro.trocaEm, segundo.trocaEm)
    assert.equal(primeiro.validoAte, segundo.validoAte)
  })

  it('ao cruzar o minuto o código gira e trocaEm aponta o próximo hh:mm:00', async () => {
    await reset(port)
    const { encontroId } = await criaPalestra(port)
    const url = `http://localhost:${port}/encontros/${encontroId}/codigo`
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const antes = await (
      await fetch(url, { headers: { 'X-Usuario': 'org-ana' } })
    ).json()
    await relogio(port, '2026-10-19T19:04:00-03:00')
    const depois = await (
      await fetch(url, { headers: { 'X-Usuario': 'org-ana' } })
    ).json()
    assert.notEqual(depois.codigo, antes.codigo)
    assert.equal(
      Date.parse(depois.trocaEm),
      Date.parse('2026-10-19T19:05:00-03:00')
    )
    assert.equal(
      Date.parse(depois.validoAte),
      Date.parse('2026-10-19T19:06:00-03:00')
    )
  })

  it('GET /encontros/:id/codigo em atividade cancelada devolve 422 ATIVIDADE_CANCELADA', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T18:45:00-03:00')
    await fetch(`http://localhost:${port}/atividades/${atividadeId}/cancelamento`, {
      method: 'POST',
      headers: { 'X-Usuario': 'org-ana' }
    })
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    const body = await res.json()
    assert.equal(res.status, 422)
    assert.equal(body.erro, 'ATIVIDADE_CANCELADA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('atividade cancelada fora da janela devolve ATIVIDADE_CANCELADA antes de FORA_DA_JANELA', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T18:44:59-03:00')
    await fetch(`http://localhost:${port}/atividades/${atividadeId}/cancelamento`, {
      method: 'POST',
      headers: { 'X-Usuario': 'org-ana' }
    })
    const res = await fetch(
      `http://localhost:${port}/encontros/${encontroId}/codigo`,
      { headers: { 'X-Usuario': 'org-ana' } }
    )
    const body = await res.json()
    assert.equal(res.status, 422)
    assert.equal(body.erro, 'ATIVIDADE_CANCELADA')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('PATCH de título/vagas não muda o código nem a validade no mesmo minuto', async () => {
    await reset(port)
    const { atividadeId, encontroId } = await criaPalestra(port)
    await relogio(port, '2026-10-19T18:45:00-03:00')
    const url = `http://localhost:${port}/encontros/${encontroId}/codigo`
    const antes = await (
      await fetch(url, { headers: { 'X-Usuario': 'org-ana' } })
    ).json()
    await fetch(`http://localhost:${port}/atividades/${atividadeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({ titulo: 'Palestra renomeada', vagas: 90 })
    })
    const depois = await (
      await fetch(url, { headers: { 'X-Usuario': 'org-ana' } })
    ).json()
    assert.equal(depois.codigo, antes.codigo)
    assert.equal(depois.trocaEm, antes.trocaEm)
    assert.equal(depois.validoAte, antes.validoAte)
  })

  it('dois encontros no mesmo minuto têm códigos diferentes (o código é do encontro, não do minuto)', async () => {
    await reset(port)
    const { encontroId: a } = await criaPalestra(port)
    const outra = await fetch(`http://localhost:${port}/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
      body: JSON.stringify({
        titulo: 'Minicurso paralelo',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      })
    })
    const b = (await outra.json()).encontros[0].id
    await relogio(port, '2026-10-19T19:03:45-03:00')
    const codigoDe = async id =>
      (await (await fetch(`http://localhost:${port}/encontros/${id}/codigo`, { headers: { 'X-Usuario': 'org-ana' } })).json()).codigo
    assert.notEqual(await codigoDe(a), await codigoDe(b))
  })
})
