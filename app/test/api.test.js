import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { criarApi, ErroDaApi, mostrarErro } from '../src/api.js'
import { apiFalsa } from './api-falsa.js'
import { montarDom } from './dom.js'

describe('cliente da API (app/src/api.js) com a API falsa', () => {
  it('manda X-Usuario e o corpo em JSON, e devolve status e dados', async () => {
    const falsa = apiFalsa().responde('POST /encontros/enc_1/presencas', 201, { id: 'pre_1', origem: 'qr' })
    const api = criarApi({ fetch: falsa.fetch, usuario: () => 'p-carla' })
    const r = await api.post('/encontros/enc_1/presencas', { codigo: 'K7M2QX' })
    assert.equal(r.status, 201)
    assert.deepEqual(r.dados, { id: 'pre_1', origem: 'qr' })
    assert.deepEqual(falsa.chamadas[0], {
      metodo: 'POST',
      rota: '/encontros/enc_1/presencas',
      cabecalhos: { 'X-Usuario': 'p-carla', 'Content-Type': 'application/json' },
      corpo: { codigo: 'K7M2QX' }
    })
  })

  it('erro da API vira ErroDaApi com o código e a mensagem que ela devolveu', async () => {
    const falsa = apiFalsa().responde('GET /encontros/enc_1/codigo', 422, { erro: 'FORA_DA_JANELA', mensagem: 'Ainda não abriu.' })
    const api = criarApi({ fetch: falsa.fetch, usuario: () => 'org-ana' })
    await assert.rejects(api.get('/encontros/enc_1/codigo'), (e) => {
      assert.ok(e instanceof ErroDaApi)
      assert.equal(e.status, 422)
      assert.equal(e.erro, 'FORA_DA_JANELA')
      assert.equal(e.mensagem, 'Ainda não abriu.')
      return true
    })
  })

  it('mostrarErro desenha o código e a mensagem sem traduzir', () => {
    const { container } = montarDom()
    mostrarErro(container, new ErroDaApi(422, { erro: 'CODIGO_INVALIDO', mensagem: 'Código vencido.' }))
    assert.match(container.textContent, /CODIGO_INVALIDO/)
    assert.match(container.textContent, /Código vencido\./)
  })

  it('sem rede, o fetch falso rejeita como o navegador', async () => {
    const falsa = apiFalsa()
    falsa.offline = true
    const api = criarApi({ fetch: falsa.fetch, usuario: () => 'p-carla' })
    await assert.rejects(api.post('/encontros/enc_1/presencas', { codigo: 'K7M2QX' }), TypeError)
  })
})
