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

function cancelaAtividade(port, id, usuario = 'org-ana') {
  return fetch(`http://localhost:${port}/atividades/${id}/cancelamento`, {
    method: 'POST',
    headers: { 'X-Usuario': usuario }
  })
}

function getAtividades(port, query = '') {
  return fetch(`http://localhost:${port}/atividades${query}`, {
    headers: { 'X-Usuario': 'org-ana' }
  })
}

describe('F6 — listagem e filtros', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('listagem ordena pelo início do 1º encontro, desempatando por titulo', async () => {
    await reset(port)
    const zeta = await postAtividade(port, {
      titulo: 'Zeta',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T09:00:00-03:00' }
      ]
    })
    assert.equal(zeta.status, 201)
    const alfa = await postAtividade(port, {
      titulo: 'Alfa',
      tipo: 'palestra',
      salaId: 'sala-102',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T09:00:00-03:00' }
      ]
    })
    assert.equal(alfa.status, 201)
    const bravo = await postAtividade(port, {
      titulo: 'Bravo',
      tipo: 'palestra',
      salaId: 'sala-102',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00' }
      ]
    })
    assert.equal(bravo.status, 201)
    const lista = (await (await getAtividades(port)).json()).map(a => a.titulo)
    assert.deepEqual(lista, ['Alfa', 'Zeta', 'Bravo'])
  })

  it('atividade cancelada continua na listagem e aparece no filtro de dia', async () => {
    await reset(port)
    const cancelada = await postAtividade(port, {
      titulo: 'Cancelada',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T09:00:00-03:00' }
      ]
    })
    const { id } = await cancelada.json()
    assert.equal(cancelada.status, 201)
    const ativa = await postAtividade(port, {
      titulo: 'Ativa',
      tipo: 'palestra',
      salaId: 'sala-102',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T09:00:00-03:00' }
      ]
    })
    assert.equal(ativa.status, 201)
    const outroDia = await postAtividade(port, {
      titulo: 'OutroDia',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00' }
      ]
    })
    assert.equal(outroDia.status, 201)
    const cancel = await cancelaAtividade(port, id)
    assert.equal(cancel.status, 200)
    const lista = await (await getAtividades(port)).json()
    assert.equal(lista.length, 3)
    const naLista = lista.find(a => a.titulo === 'Cancelada')
    assert.equal(naLista.situacao, 'cancelada')
    const dia19 = (await (await getAtividades(port, '?dia=2026-10-19')).json()).map(
      a => a.titulo
    )
    assert.deepEqual(dia19, ['Ativa', 'Cancelada'])
    const dia20 = (await (await getAtividades(port, '?dia=2026-10-20')).json()).map(
      a => a.titulo
    )
    assert.deepEqual(dia20, ['OutroDia'])
  })

  it('?dia retorna quem tem encontro naquele dia do fuso de Brasília', async () => {
    await reset(port)
    const multi = await postAtividade(port, {
      titulo: 'Minicurso',
      tipo: 'minicurso',
      salaId: 'sala-101',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
        { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' }
      ]
    })
    assert.equal(multi.status, 201)
    const madrugada = await postAtividade(port, {
      titulo: 'Madrugada',
      tipo: 'palestra',
      salaId: 'sala-102',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-20T00:30:00-03:00', fim: '2026-10-20T01:30:00-03:00' }
      ]
    })
    assert.equal(madrugada.status, 201)
    const dia19 = (await (await getAtividades(port, '?dia=2026-10-19')).json()).map(
      a => a.titulo
    )
    assert.deepEqual(dia19, ['Minicurso'])
    const dia20 = (await (await getAtividades(port, '?dia=2026-10-20')).json()).map(
      a => a.titulo
    )
    assert.deepEqual(dia20, ['Minicurso', 'Madrugada'])
    const dia21 = await (await getAtividades(port, '?dia=2026-10-21')).json()
    assert.deepEqual(dia21, [])
  })

  it('?dia e ?tipo combinam em AND', async () => {
    await reset(port)
    const mini19 = await postAtividade(port, {
      titulo: 'Mini19',
      tipo: 'minicurso',
      salaId: 'sala-101',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T09:00:00-03:00' },
        { inicio: '2026-10-19T13:00:00-03:00', fim: '2026-10-19T14:00:00-03:00' }
      ]
    })
    assert.equal(mini19.status, 201)
    const palestra19 = await postAtividade(port, {
      titulo: 'Palestra19',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
      ]
    })
    assert.equal(palestra19.status, 201)
    const mini20 = await postAtividade(port, {
      titulo: 'Mini20',
      tipo: 'minicurso',
      salaId: 'sala-101',
      vagas: 10,
      encontros: [
        { inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00' },
        { inicio: '2026-10-20T13:00:00-03:00', fim: '2026-10-20T14:00:00-03:00' }
      ]
    })
    assert.equal(mini20.status, 201)
    const combinado = await getAtividades(port, '?dia=2026-10-19&tipo=minicurso')
    assert.equal(combinado.status, 200)
    assert.deepEqual(
      (await combinado.json()).map(a => a.titulo),
      ['Mini19']
    )
    const soPalestra = await getAtividades(port, '?tipo=palestra')
    assert.equal(soPalestra.status, 200)
    assert.deepEqual(
      (await soPalestra.json()).map(a => a.titulo),
      ['Palestra19']
    )
  })

  it('filtro com valor inválido devolve 422 DADOS_INVALIDOS', async () => {
    await reset(port)
    const dia = await getAtividades(port, '?dia=abc')
    assert.equal(dia.status, 422)
    assert.equal((await dia.json()).erro, 'DADOS_INVALIDOS')
    const tipo = await getAtividades(port, '?tipo=oficina')
    assert.equal(tipo.status, 422)
    assert.equal((await tipo.json()).erro, 'DADOS_INVALIDOS')
  })
})