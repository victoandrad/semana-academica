import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { apiFalsaComInscricoes } from '../../test/api-falsa.js'
import { criarApi } from '../api.js'
import { montarDom } from '../../test/dom.js'
import { render } from './minhas-inscricoes.js'

const pausa = () => new Promise((r) => setImmediate(r))

function montar() {
  const falsa = apiFalsaComInscricoes()
  const api = criarApi({ fetch: falsa.fetch, usuario: () => 'p-carla' })
  const { container } = montarDom()
  return { falsa, api, container }
}

async function renderizar({ falsa, api, container }) {
  await render(container, { api, agora: () => '2026-10-13T12:00:00-03:00' })
  assert.deepEqual(falsa.chamadas[0], {
    metodo: 'GET',
    rota: '/inscricoes',
    cabecalhos: { 'X-Usuario': 'p-carla' },
    corpo: undefined
  })
}

describe('tela de minhas inscrições (M2)', () => {
  it('lista GET /inscricoes e mostra status, posição na espera, convocadaAte e título da atividade (R2, R18)', async () => {
    const { falsa, api, container } = await montar()
    await renderizar({ falsa, api, container })

    assert.match(container.textContent, /Go: primeiros passos/)
    assert.match(container.textContent, /confirmada/)
    assert.match(container.textContent, /em_espera/)
    assert.match(container.textContent, /convocada/)
    assert.match(container.textContent, /cancelada/)
    assert.match(container.textContent, /expirada/)
    const linhas = [...container.querySelectorAll('.inscricao')]
    assert.equal(linhas.length, 5)
    const emEspera = linhas.find((l) => l.dataset.inscricaoId === 'ins_2b3c4d5e')
    assert.match(emEspera.querySelector('.campo-posicao').textContent, /2/)
    const convocada = linhas.find((l) => l.dataset.inscricaoId === 'ins_3c4d5e6f')
    assert.match(convocada.querySelector('.campo-convocada-ate').textContent, /2026-10-13T12:30:00-03:00/)
  })

  it('convocada mostra a contagem regressiva convocadaAte - agora(), sem hora do sistema', async () => {
    const { falsa, api, container } = await montar()
    await renderizar({ falsa, api, container })

    const convocada = [...container.querySelectorAll('.inscricao')]
      .find((l) => l.dataset.inscricaoId === 'ins_3c4d5e6f')
    assert.equal(convocada.querySelector('.restante').textContent, '0h 30min 0s')
    assert.ok(convocada.querySelector('.confirmar'))
  })

  it('clica em Confirmar, envia POST /inscricoes/:id/confirmacao e mostra confirmada (R19)', async () => {
    const { falsa, api, container } = await montar()
    await renderizar({ falsa, api, container })

    const convocada = [...container.querySelectorAll('.inscricao')]
      .find((l) => l.dataset.inscricaoId === 'ins_3c4d5e6f')
    convocada.querySelector('.confirmar').click()
    await pausa()

    assert.deepEqual(falsa.chamadas[2], {
      metodo: 'POST',
      rota: '/inscricoes/ins_3c4d5e6f/confirmacao',
      cabecalhos: { 'X-Usuario': 'p-carla' },
      corpo: undefined
    })
    assert.match(convocada.textContent, /confirmada/)
    assert.equal(convocada.querySelector('.restante'), null)
    assert.equal(convocada.querySelector('.confirmar'), null)
  })

  it('mostra SEM_CONVOCACAO, CONVOCACAO_EXPIRADA, CONFLITO_DE_HORARIO e LIMITE_DE_MINICURSOS como a API devolveu (R20, R21, R22)', async () => {
    const { falsa, api, container } = await montar()
    await renderizar({ falsa, api, container })

    for (const [status, erro, mensagem] of [
      [422, 'SEM_CONVOCACAO', 'Esta inscrição não foi convocada.'],
      [422, 'CONVOCACAO_EXPIRADA', 'O prazo da convocação venceu.'],
      [409, 'CONFLITO_DE_HORARIO', 'A confirmação gera conflito de horário.'],
      [422, 'LIMITE_DE_MINICURSOS', 'A confirmação estouraria o limite de minicursos.']
    ]) {
      falsa.responde('POST /inscricoes/ins_3c4d5e6f/confirmacao', status, { erro, mensagem })
      const convocada = [...container.querySelectorAll('.inscricao')]
        .find((l) => l.dataset.inscricaoId === 'ins_3c4d5e6f')
      convocada.querySelector('.confirmar').click()
      await pausa()
      const erroNaTela = container.querySelector('.erro')
      assert.match(erroNaTela.textContent, new RegExp(erro))
      assert.match(erroNaTela.textContent, new RegExp(mensagem))
    }
  })
})