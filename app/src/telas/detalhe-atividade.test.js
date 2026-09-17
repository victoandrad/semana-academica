import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { apiFalsaComGradeEInscricoes, goM1 } from '../../test/api-falsa.js'
import { criarApi } from '../api.js'
import { montarDom } from '../../test/dom.js'
import { render } from './detalhe-atividade.js'

const pausa = () => new Promise((r) => setImmediate(r))

function montar() {
  const falsa = apiFalsaComGradeEInscricoes()
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

  it('procura a inscrição do usuário por GET /inscricoes?atividadeId= (M2 R2 e R9)', async () => {
    const { falsa, api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00', id: 'atv_b2c3d4e5' })

    assert.deepEqual(falsa.chamadas[1], {
      metodo: 'GET',
      rota: '/inscricoes?atividadeId=atv_b2c3d4e5',
      cabecalhos: { 'X-Usuario': 'p-carla' },
      corpo: undefined
    })
    assert.ok(container.querySelector('.inscrever'))
  })

  it('clica em Inscrever, envia POST /atividades/:id/inscricoes e mostra a inscrição devolvida (M2 R7, R10)', async () => {
    const { falsa, api, container } = montar()
    const nova = {
      id: 'ins_6f7a8b9c',
      atividadeId: 'atv_b2c3d4e5',
      participanteId: 'p-carla',
      status: 'confirmada',
      posicaoNaEspera: null,
      convocadaAte: null,
      criadaEm: '2026-10-13T09:30:00-03:00'
    }
    falsa.responde('POST /atividades/atv_b2c3d4e5/inscricoes', 201, nova)
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00', id: 'atv_b2c3d4e5' })

    container.querySelector('.inscrever').click()
    await pausa()

    assert.deepEqual(falsa.chamadas[2], {
      metodo: 'POST',
      rota: '/atividades/atv_b2c3d4e5/inscricoes',
      cabecalhos: { 'X-Usuario': 'p-carla' },
      corpo: undefined
    })
    const inscricao = container.querySelector('.inscricao')
    assert.match(inscricao.textContent, /ins_6f7a8b9c/)
    assert.match(inscricao.textContent, /confirmada/)
    assert.ok(inscricao.querySelector('.cancelar'))
  })

  it('já inscrito mostra a inscrição existente e clicar em Cancelar envia POST /inscricoes/:id/cancelamento', async () => {
    const { falsa, api, container } = montar()
    const inscrita = {
      id: 'ins_7f8a9b0c',
      atividadeId: 'atv_c3d4e5f6',
      participanteId: 'p-carla',
      status: 'convocada',
      posicaoNaEspera: null,
      convocadaAte: '2026-10-13T11:00:00-03:00',
      criadaEm: '2026-10-13T09:00:00-03:00'
    }
    falsa.responde('GET /inscricoes?atividadeId=atv_c3d4e5f6', 200, [inscrita])
    falsa.responde('POST /inscricoes/ins_7f8a9b0c/cancelamento', 200, {
      ...inscrita,
      status: 'cancelada',
      convocadaAte: null
    })
    await render(container, { api, agora: () => '2026-10-13T10:00:00-03:00', id: 'atv_c3d4e5f6' })

    const inscricao = container.querySelector('.inscricao')
    assert.match(inscricao.textContent, /convocada/)
    inscricao.querySelector('.cancelar').click()
    await pausa()

    assert.deepEqual(falsa.chamadas[2], {
      metodo: 'POST',
      rota: '/inscricoes/ins_7f8a9b0c/cancelamento',
      cabecalhos: { 'X-Usuario': 'p-carla' },
      corpo: undefined
    })
    assert.match(inscricao.textContent, /cancelada/)
  })

  it('mostra JA_INSCRITO, CONFLITO_DE_HORARIO, LIMITE_DE_MINICURSOS, INSCRICOES_ENCERRADAS e SOMENTE_PARTICIPANTE como a API devolveu (M2 R6, R1)', async () => {
    const { falsa, api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00', id: 'atv_b2c3d4e5' })

    for (const [status, erro, mensagem] of [
      [409, 'JA_INSCRITO', 'Você já está inscrito nesta atividade.'],
      [409, 'CONFLITO_DE_HORARIO', 'A atividade tem encontro no mesmo horário.'],
      [422, 'LIMITE_DE_MINICURSOS', 'Você já ocupa vaga em 3 minicursos.'],
      [422, 'INSCRICOES_ENCERRADAS', 'As inscrições fecham 30 min antes do início.'],
      [403, 'SOMENTE_PARTICIPANTE', 'Somente participantes se inscrevem.']
    ]) {
      falsa.responde('POST /atividades/atv_b2c3d4e5/inscricoes', status, { erro, mensagem })
      container.querySelector('.inscrever').click()
      await pausa()
      const erroNaTela = container.querySelector('.erro')
      assert.match(erroNaTela.textContent, new RegExp(erro))
      assert.match(erroNaTela.textContent, new RegExp(mensagem))
    }
  })
})
