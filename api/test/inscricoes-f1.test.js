import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp } from '../src/index.js'

const CLOCK_INICIAL = '2026-10-13T09:00:00-03:00'

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

async function criarAtividade(port, corpo = {}) {
  const res = await fetch(`http://localhost:${port}/atividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
    body: JSON.stringify({
      titulo: 'Flutter do zero',
      tipo: 'minicurso',
      salaId: 'lab-3',
      vagas: 20,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
      ],
      ...corpo
    })
  })
  assert.equal(res.status, 201)
  return res.json()
}

describe('F1 — criar, ler e listar inscrição', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('POST /atividades/:id/inscricoes com vaga devolve 201 com Inscricao confirmada completa', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const res = await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.match(body.id, /^ins_[0-9a-f]{8}$/)
    assert.equal(body.atividadeId, atv.id)
    assert.equal(body.participanteId, 'p-carla')
    assert.equal(body.status, 'confirmada')
    assert.equal(body.posicaoNaEspera, null)
    assert.equal(body.convocadaAte, null)
    assert.equal(Date.parse(body.criadaEm), Date.parse(CLOCK_INICIAL))
  })

  it('POST /atividades/:id/inscricoes com organizacao devolve 403 SOMENTE_PARTICIPANTE mesmo em atividade inexistente', async () => {
    await reset(port)
    const res = await fetch(
      `http://localhost:${port}/atividades/atv_00000000/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'org-ana' }
      }
    )
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.erro, 'SOMENTE_PARTICIPANTE')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('POST /atividades/:id/inscricoes em atividade inexistente devolve 404 NAO_ENCONTRADO', async () => {
    await reset(port)
    const res = await fetch(
      `http://localhost:${port}/atividades/atv_00000000/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      }
    )
    assert.equal(res.status, 404)
    const body = await res.json()
    assert.equal(body.erro, 'NAO_ENCONTRADO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('segunda inscricao da mesma pessoa na mesma atividade devolve 409 JA_INSCRITO', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const primeira = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      }
    )
    assert.equal(primeira.status, 201)
    const segunda = await fetch(
      `http://localhost:${port}/atividades/${atv.id}/inscricoes`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      }
    )
    assert.equal(segunda.status, 409)
    const body = await segunda.json()
    assert.equal(body.erro, 'JA_INSCRITO')
    assert.equal(typeof body.mensagem, 'string')
  })

  it('GET /inscricoes com participante devolve so as proprias e com filtro atividadeId', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const outra = await criarAtividade(port, {
      titulo: 'Palestra de banco de dados',
      tipo: 'palestra',
      encontros: [
        { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T20:30:00-03:00' }
      ]
    })
    await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    await fetch(`http://localhost:${port}/atividades/${outra.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-carla' }
    })
    await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': 'p-diego' }
    })
    const res = await fetch(`http://localhost:${port}/inscricoes`, {
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.length, 2)
    assert.ok(body.every(i => i.participanteId === 'p-carla'))
    const filtrado = await (
      await fetch(`http://localhost:${port}/inscricoes?atividadeId=${atv.id}`, {
        headers: { 'X-Usuario': 'p-carla' }
      })
    ).json()
    assert.equal(filtrado.length, 1)
    assert.equal(filtrado[0].atividadeId, atv.id)
    const org = await (
      await fetch(`http://localhost:${port}/inscricoes`, {
        headers: { 'X-Usuario': 'org-ana' }
      })
    ).json()
    assert.equal(org.length, 3)
  })

  it('GET /inscricoes/:id de outro participante devolve 200 com a inscricao alheia', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const deDiego = await (
      await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
        method: 'POST',
        headers: { 'X-Usuario': 'p-diego' }
      })
    ).json()
    const res = await fetch(
      `http://localhost:${port}/inscricoes/${deDiego.id}`,
      { headers: { 'X-Usuario': 'p-carla' } }
    )
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.id, deDiego.id)
    assert.equal(body.participanteId, 'p-diego')
  })

  it('cancelar ou confirmar inscricao de outro participante devolve 404 NAO_ENCONTRADO', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const deCarla = await (
      await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      })
    ).json()
    const cancelamento = await fetch(
      `http://localhost:${port}/inscricoes/${deCarla.id}/cancelamento`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-diego' }
      }
    )
    assert.equal(cancelamento.status, 404)
    const corpoCancelamento = await cancelamento.json()
    assert.equal(corpoCancelamento.erro, 'NAO_ENCONTRADO')
    const confirmacao = await fetch(
      `http://localhost:${port}/inscricoes/${deCarla.id}/confirmacao`,
      {
        method: 'POST',
        headers: { 'X-Usuario': 'p-diego' }
      }
    )
    assert.equal(confirmacao.status, 404)
    const corpoConfirmacao = await confirmacao.json()
    assert.equal(corpoConfirmacao.erro, 'NAO_ENCONTRADO')
  })

  it('GET /inscricoes/:id inexistente devolve 404 NAO_ENCONTRADO', async () => {
    await reset(port)
    const res = await fetch(`http://localhost:${port}/inscricoes/ins_00000000`, {
      headers: { 'X-Usuario': 'p-carla' }
    })
    assert.equal(res.status, 404)
    const body = await res.json()
    assert.equal(body.erro, 'NAO_ENCONTRADO')
  })

  it('organizacao nas tres escritas de M2 devolve 403 SOMENTE_PARTICIPANTE', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const deCarla = await (
      await fetch(`http://localhost:${port}/atividades/${atv.id}/inscricoes`, {
        method: 'POST',
        headers: { 'X-Usuario': 'p-carla' }
      })
    ).json()
    const escrever = async path => {
      const res = await fetch(`http://localhost:${port}/${path}`, {
        method: 'POST',
        headers: { 'X-Usuario': 'org-ana' }
      })
      assert.equal(res.status, 403)
      assert.equal((await res.json()).erro, 'SOMENTE_PARTICIPANTE')
    }
    await escrever(`atividades/${atv.id}/inscricoes`)
    await escrever(`inscricoes/${deCarla.id}/cancelamento`)
    await escrever(`inscricoes/${deCarla.id}/confirmacao`)
  })
})