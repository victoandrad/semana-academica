import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { apiFalsaComGrade, goM1 } from '../../test/api-falsa.js'
import { criarApi } from '../api.js'
import { montarDom } from '../../test/dom.js'
import { render } from './detalhe-atividade.js'

function montar() {
  const falsa = apiFalsaComGrade()
  const api = criarApi({ fetch: falsa.fetch, usuario: () => 'p-carla' })
  const { container } = montarDom()
  return { falsa, api, container }
}

describe('tela de detalhe da atividade (M1)', () => {
  it('busca GET /atividades/:id e mostra os encontros e as vagas como a API devolveu', async () => {
    const { falsa, api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00', id: 'atv_b2c3d4e5' })

    assert.deepEqual(falsa.chamadas[0], {
      metodo: 'GET',
      rota: '/atividades/atv_b2c3d4e5',
      cabecalhos: { 'X-Usuario': 'p-carla' },
      corpo: undefined
    })
    assert.match(container.textContent, /Go: primeiros passos/)
    assert.match(container.textContent, /minicurso/)
    assert.match(container.textContent, /sala-101/)
    assert.match(container.textContent, /360/)
    assert.match(container.textContent, /28/)
    const encontros = [...container.querySelectorAll('.encontro')]
    assert.deepEqual(
      encontros.map((e) => e.dataset.encontroId),
      ['enc_f2a3b4c5', 'enc_a3b4c5d6']
    )
  })

  it('mostra o 404 NAO_ENCONTRADO que a API devolveu', async () => {
    const { falsa, api, container } = montar()
    falsa.responde('GET /atividades/atv_00000000', 404, {
      erro: 'NAO_ENCONTRADO',
      mensagem: 'Atividade não existe.'
    })
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00', id: 'atv_00000000' })

    const erro = container.querySelector('.erro')
    assert.match(erro.textContent, /NAO_ENCONTRADO/)
    assert.match(erro.textContent, /Atividade não existe\./)
  })

  it('atividade cancelada é 200 e aparece com situacao cancelada (R23)', async () => {
    const { api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00', id: 'atv_d4e5f6a7' })

    assert.match(container.textContent, /Encerramento/)
    assert.match(container.textContent, /cancelada/)
  })

  it('aceita o id vindo do parâmetro de rota (#detalhe-atividade/:id)', async () => {
    const { falsa, api, container } = montar()
    await render(container, {
      api,
      agora: () => '2026-10-13T09:00:00-03:00',
      parametros: ['atv_b2c3d4e5']
    })

    assert.equal(falsa.chamadas[0].rota, `/atividades/${goM1.id}`)
  })
})
