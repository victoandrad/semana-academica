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

function patchAtividade(port, id, corpo, usuario = 'org-ana') {
  return fetch(`http://localhost:${port}/atividades/${id}`, {
    method: 'PATCH',
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
    titulo: 'da fatia F4',
    tipo: 'palestra',
    salaId: 'sala-101',
    vagas: 10,
    encontros: [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' }
    ],
    ...extra
  }
}

describe('F4 — alterar atividade', () => {
  let server, port

  before(() => {
    process.env.MODO_TESTE = '1'
  })

  before(async () => {
    ;({ server, port } = await listen(createApp()))
  })

  after(() => close(server))

  it('PATCH aceita só titulo e vagas; tipo/salaId/encontros/campo fora devolvem CAMPO_NAO_EDITAVEL', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    const recusados = [
      { tipo: 'minicurso' },
      { salaId: 'auditorio' },
      {
        encontros: [
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T20:00:00-03:00' }
        ]
      },
      { cargaHorariaMinutos: 999 }
    ]
    for (const corpo of recusados) {
      const res = await patchAtividade(port, id, corpo)
      assert.equal(res.status, 422)
      const body = await res.json()
      assert.equal(body.erro, 'CAMPO_NAO_EDITAVEL')
    }
    const titulo = await patchAtividade(port, id, { titulo: 'Novo título' })
    assert.equal(titulo.status, 200)
    assert.equal((await titulo.json()).titulo, 'Novo título')
  })

  it('PATCH com o 1º encontro já começado pelo relógio devolve 422 CAMPO_NAO_EDITAVEL', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    await setRelogio(port, '2026-10-19T19:00:00-03:00')
    const inicio = await patchAtividade(port, id, { titulo: 'Tarde demais' })
    assert.equal(inicio.status, 422)
    assert.equal((await inicio.json()).erro, 'CAMPO_NAO_EDITAVEL')
    await setRelogio(port, '2026-10-19T10:00:00-03:00')
    const antes = await patchAtividade(port, id, { titulo: 'Ainda dá tempo' })
    assert.equal(antes.status, 200)
    assert.equal((await antes.json()).titulo, 'Ainda dá tempo')
  })

  it('PATCH em atividade cancelada devolve ATIVIDADE_CANCELADA, vencendo CAMPO_NAO_EDITAVEL', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    const cancel = await fetch(
      `http://localhost:${port}/atividades/${id}/cancelamento`,
      { method: 'POST', headers: { 'X-Usuario': 'org-ana' } }
    )
    assert.equal(cancel.status, 200)
    const res = await patchAtividade(port, id, { salaId: 'auditorio' })
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'ATIVIDADE_CANCELADA')
  })

  it('prioriza CAMPO_NAO_EDITAVEL sobre VAGAS_ACIMA_DA_CAPACIDADE no PATCH', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const { id } = await criada.json()
    const res = await patchAtividade(port, id, { salaId: 'auditorio', vagas: 41 })
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.erro, 'CAMPO_NAO_EDITAVEL')
  })

  it('PATCH não muda sala nem encontros, e os ids enc_ continuam os mesmos', async () => {
    await reset(port)
    const criada = await postAtividade(port, corpoAtividade())
    const original = await criada.json()
    const res = await patchAtividade(port, original.id, { titulo: 'Renomeada' })
    assert.equal(res.status, 200)
    const alterada = await res.json()
    assert.equal(alterada.salaId, original.salaId)
    assert.deepEqual(alterada.encontros, original.encontros)
    const lida = await (
      await fetch(`http://localhost:${port}/atividades/${original.id}`, {
        headers: { 'X-Usuario': 'org-ana' }
      })
    ).json()
    assert.deepEqual(lida.encontros, original.encontros)
    assert.equal(lida.encontros[0].id, original.encontros[0].id)
  })

  it('titulo aceita string vazia, um caractere e duplicado; PATCH também', async () => {
    await reset(port)
    const vazio = await postAtividade(port, corpoAtividade({ titulo: '' }))
    assert.equal(vazio.status, 201)
    const umChar = await postAtividade(port, corpoAtividade({
      titulo: 'z',
      encontros: [
        { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }
      ]
    }))
    assert.equal(umChar.status, 201)
    const primeirinho = await postAtividade(port, corpoAtividade({
      titulo: 'Flutter do zero',
      encontros: [
        { inicio: '2026-10-19T11:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }
      ]
    }))
    assert.equal(primeirinho.status, 201)
    const duplicado = await postAtividade(port, corpoAtividade({
      titulo: 'Flutter do zero',
      encontros: [
        { inicio: '2026-10-19T13:00:00-03:00', fim: '2026-10-19T14:00:00-03:00' }
      ]
    }))
    assert.equal(duplicado.status, 201)
    const patch = await patchAtividade(port, (await vazio.json()).id, { titulo: '  ' })
    assert.equal(patch.status, 200)
    assert.equal((await patch.json()).titulo, '  ')
  })
})