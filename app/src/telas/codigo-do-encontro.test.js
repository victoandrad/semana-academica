import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { apiFalsaComAtividades, codigoDoEncontroM3 } from '../../test/api-falsa.js'
import { criarApi } from '../api.js'
import { montarDom } from '../../test/dom.js'
import { render } from './codigo-do-encontro.js'

const pausa = () => new Promise((r) => setImmediate(r))

async function montar() {
  const falsa = apiFalsaComAtividades()
  const api = criarApi({ fetch: falsa.fetch, usuario: () => 'org-ana' })
  const { container } = montarDom()
  return { falsa, api, container }
}

describe('tela do código do encontro (M3)', () => {
  it('lista as atividades do contrato e seus encontros', async () => {
    const { falsa, api, container } = await montar()
    await render(container, { api, agora: () => '2026-10-19T18:45:00-03:00' })

    assert.equal(falsa.chamadas[0].metodo, 'GET')
    assert.equal(falsa.chamadas[0].rota, '/atividades')
    assert.match(container.textContent, /Flutter do zero/)
    assert.match(container.textContent, /2026-10-19/)
    assert.match(container.textContent, /2026-10-20/)
  })

  it('escolher um encontro busca o código e mostra em tela cheia com QR', async () => {
    const { falsa, api, container } = await montar()
    falsa.responde('GET /encontros/enc_5e6f7a8b/codigo', 200, codigoDoEncontroM3)
    await render(container, { api, agora: () => '2026-10-19T18:45:00-03:00' })

    const botao = [...container.querySelectorAll('button')]
      .find((b) => b.dataset.encontroId === 'enc_5e6f7a8b')
    botao.click()
    await pausa()
    await pausa()

    assert.deepEqual(falsa.chamadas[1], {
      metodo: 'GET',
      rota: '/encontros/enc_5e6f7a8b/codigo',
      cabecalhos: { 'X-Usuario': 'org-ana' },
      corpo: undefined
    })
    const tela = container.querySelector('.codigo-tela-cheia')
    assert.ok(tela, 'código aparece em tela cheia')
    assert.equal(tela.querySelector('.codigo-texto').textContent, 'K7M2QX')
    assert.equal(tela.querySelector('.codigo-qr').dataset.conteudo, 'enc_5e6f7a8b:K7M2QX')
    assert.ok(tela.querySelector('.codigo-qr svg'), 'desenha o QR como svg')
    tela.querySelector('button').click()
  })

  it('mostra FORA_DA_JANELA, ATIVIDADE_CANCELADA e SOMENTE_ORGANIZACAO com o código e a mensagem que a API devolveu', async () => {
    const { falsa, api, container } = await montar()
    falsa.responde('GET /encontros/enc_5e6f7a8b/codigo', 422, {
      erro: 'FORA_DA_JANELA',
      mensagem: 'A janela ainda não abriu.'
    })
    await render(container, { api, agora: () => '2026-10-19T18:45:00-03:00' })

    const botao = [...container.querySelectorAll('button')]
      .find((b) => b.dataset.encontroId === 'enc_5e6f7a8b')
    botao.click()
    await pausa()
    await pausa()

    const erro = container.querySelector('.erro')
    assert.match(erro.textContent, /FORA_DA_JANELA/)
    assert.match(erro.textContent, /A janela ainda não abriu\./)

    falsa.responde('GET /encontros/enc_9c0d1e2f/codigo', 422, {
      erro: 'ATIVIDADE_CANCELADA',
      mensagem: 'Atividade cancelada pela organização.'
    })
    falsa.responde('GET /encontros/enc_5e6f7a8b/codigo', 422, {
      erro: 'SOMENTE_ORGANIZACAO',
      mensagem: 'Somente a organização emite o código.'
    })
    for (const [id, codigo, texto] of [
      ['enc_9c0d1e2f', 'ATIVIDADE_CANCELADA', 'Atividade cancelada pela organização.'],
      ['enc_5e6f7a8b', 'SOMENTE_ORGANIZACAO', 'Somente a organização emite o código.']
    ]) {
      const b = [...container.querySelectorAll('button')].find((x) => x.dataset.encontroId === id)
      b.click()
      await pausa()
      await pausa()
      const e = container.querySelector('.erro')
      assert.match(e.textContent, new RegExp(codigo))
      assert.match(e.textContent, new RegExp(texto))
    }
  })

  it('quando o relógio de agora() chega em trocaEm, busca o próximo código sozinha', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const { falsa, api, container } = await montar()
    falsa.responde('GET /encontros/enc_5e6f7a8b/codigo', 200, codigoDoEncontroM3)
    let relogio = '2026-10-19T18:45:00-03:00'
    await render(container, { api, agora: () => relogio })

    const botao = [...container.querySelectorAll('button')]
      .find((b) => b.dataset.encontroId === 'enc_5e6f7a8b')
    botao.click()
    await pausa()
    await pausa()
    assert.equal(container.querySelector('.codigo-texto').textContent, 'K7M2QX')

    falsa.responde('GET /encontros/enc_5e6f7a8b/codigo', 200, {
      encontroId: 'enc_5e6f7a8b',
      codigo: '9QXAMK',
      trocaEm: '2026-10-19T18:47:00-03:00',
      validoAte: '2026-10-19T18:48:00-03:00'
    })
    relogio = '2026-10-19T18:46:00-03:00'
    t.mock.timers.tick(60_000)
    await pausa()
    await pausa()

    const codigo = falsa.chamadas.filter((c) => c.rota === '/encontros/enc_5e6f7a8b/codigo')
    assert.equal(codigo.length, 2, 'a tela busca o próximo código sozinha')
    assert.equal(container.querySelector('.codigo-texto').textContent, '9QXAMK')

    container.querySelector('.codigo-tela-cheia button').click()
    t.mock.timers.reset()
  })
})