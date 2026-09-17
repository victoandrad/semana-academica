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

async function andarRelogio(port, agora) {
  await fetch(`http://localhost:${port}/_teste/relogio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agora })
  })
}

async function criarAtividade(port, corpo = {}) {
  const res = await fetch(`http://localhost:${port}/atividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Usuario': 'org-ana' },
    body: JSON.stringify({
      titulo: 'Flutter do zero',
      tipo: 'minicurso',
      salaId: 'lab-3',
      vagas: 1,
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

async function inscrever(port, atividadeId, xUsuario) {
  return (
    await fetch(`http://localhost:${port}/atividades/${atividadeId}/inscricoes`, {
      method: 'POST',
      headers: { 'X-Usuario': xUsuario }
    })
  ).json()
}

async function cancelarInscricao(port, inscricaoId, xUsuario) {
  return await fetch(`http://localhost:${port}/inscricoes/${inscricaoId}/cancelamento`, {
    method: 'POST',
    headers: { 'X-Usuario': xUsuario }
  })
}

describe('F6 — cancelamento proprio', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('1 minuto antes do inicio o cancelamento devolve 200', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    await inscrever(port, atv.id, 'p-diego')
    await andarRelogio(port, '2026-10-19T18:59:00-03:00')
    const res = await cancelarInscricao(port, carla.id, 'p-carla')
    assert.equal(res.status, 200)
    assert.equal((await res.json()).status, 'cancelada')
  })

  it('no instante exato do inicio o cancelamento devolve 422 ATIVIDADE_JA_INICIADA', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await andarRelogio(port, '2026-10-19T19:00:00-03:00')
    const res = await cancelarInscricao(port, carla.id, 'p-carla')
    assert.equal(res.status, 422)
    assert.equal((await res.json()).erro, 'ATIVIDADE_JA_INICIADA')
    const exato = await cancelarInscricao(port, diego.id, 'p-diego')
    assert.equal(exato.status, 422)
    assert.equal((await exato.json()).erro, 'ATIVIDADE_JA_INICIADA')
  })

  it('depois do inicio o cancelamento devolve 422 ATIVIDADE_JA_INICIADA', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await andarRelogio(port, '2026-10-19T19:45:00-03:00')
    const res = await cancelarInscricao(port, carla.id, 'p-carla')
    assert.equal(res.status, 422)
    assert.equal((await res.json()).erro, 'ATIVIDADE_JA_INICIADA')
    const seguindo = await cancelarInscricao(port, diego.id, 'p-diego')
    assert.equal(seguindo.status, 422)
  })

  it('cancelar inscricao cancelada devolve 422 INSCRICAO_INATIVA', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const res = await cancelarInscricao(port, carla.id, 'p-carla')
    assert.equal(res.status, 200)
    const denovo = await cancelarInscricao(port, carla.id, 'p-carla')
    assert.equal(denovo.status, 422)
    assert.equal((await denovo.json()).erro, 'INSCRICAO_INATIVA')
  })

  it('cancelar inscricao expirada devolve 422 INSCRICAO_INATIVA', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    await cancelarInscricao(port, carla.id, 'p-carla')
    await andarRelogio(port, '2026-10-13T11:01:00-03:00')
    const diegoDepois = await (
      await fetch(`http://localhost:${port}/inscricoes`, {
        headers: { 'X-Usuario': 'p-diego' }
      })
    ).json()
    assert.equal(diegoDepois[0].status, 'expirada')
    const res = await cancelarInscricao(port, diego.id, 'p-diego')
    assert.equal(res.status, 422)
    assert.equal((await res.json()).erro, 'INSCRICAO_INATIVA')
  })

  it('inscricao cancelada em atividade ja iniciada devolve ATIVIDADE_JA_INICIADA (prioridade)', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const cancelada = await cancelarInscricao(port, carla.id, 'p-carla')
    assert.equal(cancelada.status, 200)
    await andarRelogio(port, '2026-10-19T19:00:00-03:00')
    const res = await cancelarInscricao(port, carla.id, 'p-carla')
    assert.equal(res.status, 422)
    assert.equal((await res.json()).erro, 'ATIVIDADE_JA_INICIADA')
  })

  it('cancelar convocada libera vaga e promove o proximo da fila', async () => {
    await reset(port)
    const atv = await criarAtividade(port)
    const carla = await inscrever(port, atv.id, 'p-carla')
    const diego = await inscrever(port, atv.id, 'p-diego')
    const elisa = await inscrever(port, atv.id, 'p-elisa')
    await cancelarInscricao(port, carla.id, 'p-carla')
    const diegoConvocado = await cancelarInscricao(port, diego.id, 'p-diego')
    assert.equal(diegoConvocado.status, 200)
    assert.equal((await diegoConvocado.json()).status, 'cancelada')
    const elisaDepois = (
      await (
        await fetch(`http://localhost:${port}/inscricoes`, {
          headers: { 'X-Usuario': 'p-elisa' }
        })
      ).json()
    )
    assert.equal(elisaDepois[0].status, 'convocada')
  })
})