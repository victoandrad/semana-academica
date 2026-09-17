import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { apiFalsaComGrade } from '../../test/api-falsa.js'
import { criarApi } from '../api.js'
import { montarDom } from '../../test/dom.js'
import { render } from './programacao.js'

const pausa = () => new Promise((r) => setImmediate(r))

function montar() {
  const falsa = apiFalsaComGrade()
  const api = criarApi({ fetch: falsa.fetch, usuario: () => 'p-carla' })
  const { window, container } = montarDom()
  return { falsa, api, window, container }
}

describe('tela da programação por dia (M1)', () => {
  it('ao abrir, busca GET /atividades?dia=2026-10-19 e lista o que a API devolveu, na ordem', async () => {
    const { falsa, api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    assert.deepEqual(falsa.chamadas[0], {
      metodo: 'GET',
      rota: '/atividades?dia=2026-10-19',
      cabecalhos: { 'X-Usuario': 'p-carla' },
      corpo: undefined
    })
    const itens = [...container.querySelectorAll('.atividade')]
    assert.deepEqual(
      itens.map((i) => i.dataset.atividadeId),
      ['atv_b2c3d4e5', 'atv_a1b2c3d4']
    )
    assert.match(container.textContent, /Go: primeiros passos/)
    assert.match(container.textContent, /Abertura/)
  })

  it('filtra por tipo dentro do dia, mandando ?dia=…&tipo=palestra', async () => {
    const { falsa, api, window, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    const select = container.querySelector('.filtro-tipo select')
    select.value = 'palestra'
    select.dispatchEvent(new window.Event('change'))
    await pausa()
    await pausa()

    assert.equal(falsa.chamadas.at(-1).rota, '/atividades?dia=2026-10-19&tipo=palestra')
    const itens = [...container.querySelectorAll('.atividade')]
    assert.deepEqual(itens.map((i) => i.dataset.atividadeId), ['atv_a1b2c3d4'])
  })

  it('trocar de dia refaz o GET com o dia escolhido', async () => {
    const { falsa, api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    container.querySelector('[data-dia="2026-10-20"]').click()
    await pausa()
    await pausa()

    assert.equal(falsa.chamadas.at(-1).rota, '/atividades?dia=2026-10-20')
    const itens = [...container.querySelectorAll('.atividade')]
    assert.deepEqual(itens.map((i) => i.dataset.atividadeId), ['atv_c3d4e5f6'])
  })

  it('atividade cancelada aparece na programação com a situação (R31)', async () => {
    const { api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    container.querySelector('[data-dia="2026-10-23"]').click()
    await pausa()
    await pausa()

    const item = container.querySelector('.atividade[data-atividade-id="atv_d4e5f6a7"]')
    assert.ok(item, 'cancelada não é escondida')
    assert.match(item.textContent, /cancelada/)
  })

  it('dia sem atividades mostra que não há nada', async () => {
    const { api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    container.querySelector('[data-dia="2026-10-22"]').click()
    await pausa()
    await pausa()

    assert.equal(container.querySelectorAll('.atividade').length, 0)
    assert.match(container.textContent, /Nenhuma atividade/)
  })

  it('mostra o erro que a API devolveu no filtro, sem traduzir (DADOS_INVALIDOS)', async () => {
    const { falsa, api, container } = montar()
    falsa.responde('GET /atividades?dia=2026-10-19', 422, {
      erro: 'DADOS_INVALIDOS',
      mensagem: 'dia fora do formato AAAA-MM-DD'
    })
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    const erro = container.querySelector('.erro')
    assert.match(erro.textContent, /DADOS_INVALIDOS/)
    assert.match(erro.textContent, /dia fora do formato AAAA-MM-DD/)
  })

  it('cada atividade leva ao detalhe', async () => {
    const { api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    const link = container.querySelector('.atividade[data-atividade-id="atv_a1b2c3d4"] a')
    assert.equal(link.getAttribute('href'), '#detalhe-atividade/atv_a1b2c3d4')
  })
})
