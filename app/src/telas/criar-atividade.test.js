import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { apiFalsaComGrade } from '../../test/api-falsa.js'
import { criarApi } from '../api.js'
import { montarDom } from '../../test/dom.js'
import { render } from './criar-atividade.js'

const pausa = () => new Promise((r) => setImmediate(r))

const criada = {
  id: 'atv_e5f6a7b8',
  titulo: 'Flutter do zero',
  tipo: 'minicurso',
  salaId: 'lab-3',
  vagas: 20,
  encontros: [
    { id: 'enc_e7f8a9b0', inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
    { id: 'enc_f8a9b0c1', inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
  ],
  cargaHorariaMinutos: 360,
  situacao: 'prevista',
  ocupadas: 0,
  vagasRestantes: 20,
  emEspera: 0
}

function montar(usuario = 'org-ana') {
  const falsa = apiFalsaComGrade()
  const api = criarApi({ fetch: falsa.fetch, usuario: () => usuario })
  const { window, container } = montarDom()
  return { falsa, api, window, container }
}

function preencherFormulario(container) {
  container.querySelector('.campo-titulo').value = 'Flutter do zero'
  container.querySelector('.campo-tipo').value = 'minicurso'
  container.querySelector('.campo-sala').value = 'lab-3'
  container.querySelector('.campo-vagas').value = '20'
  const [e1] = container.querySelectorAll('.encontro')
  e1.querySelector('.encontro-inicio').value = '2026-10-19T19:00'
  e1.querySelector('.encontro-fim').value = '2026-10-19T22:00'
  container.querySelector('.adicionar-encontro').click()
  const e2 = container.querySelectorAll('.encontro')[1]
  e2.querySelector('.encontro-inicio').value = '2026-10-20T19:00'
  e2.querySelector('.encontro-fim').value = '2026-10-20T22:00'
}

function enviar(container) {
  const win = container.ownerDocument.defaultView
  container.querySelector('.form-atividade').dispatchEvent(new win.Event('submit', { cancelable: true }))
}

describe('tela de criar atividade (M1, organização)', () => {
  it('carrega GET /salas e oferece as salas e capacidades no select', async () => {
    const { falsa, api, container } = montar()
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    assert.equal(falsa.chamadas[0].rota, '/salas')
    const opcoes = [...container.querySelectorAll('.campo-sala option')]
    assert.deepEqual(opcoes.map((o) => o.value), ['auditorio', 'sala-101', 'sala-102', 'lab-3'])
    assert.match(opcoes[3].textContent, /Laboratório 3 \(20\)/)
  })

  it('envia POST /atividades com titulo, tipo, salaId, vagas e encontros em ISO', async () => {
    const { falsa, api, container } = montar()
    falsa.responde('POST /atividades', 201, criada)
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })

    preencherFormulario(container)
    enviar(container)
    await pausa()
    await pausa()

    const chamada = falsa.chamadas.find((c) => c.metodo === 'POST')
    assert.deepEqual(chamada, {
      metodo: 'POST',
      rota: '/atividades',
      cabecalhos: { 'X-Usuario': 'org-ana', 'Content-Type': 'application/json' },
      corpo: {
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      }
    })
    assert.match(container.querySelector('.sucesso').textContent, /atv_e5f6a7b8/)
  })

  it('mostra SOMENTE_ORGANIZACAO e NAO_ENCONTRADO que a API devolveu', async () => {
    const { falsa, api, container } = montar('p-carla')
    falsa.responde('POST /atividades', 403, {
      erro: 'SOMENTE_ORGANIZACAO',
      mensagem: 'Só a organização cria atividade.'
    })
    await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })
    preencherFormulario(container)
    enviar(container)
    await pausa()
    await pausa()

    let erro = container.querySelector('.erro')
    assert.match(erro.textContent, /SOMENTE_ORGANIZACAO/)
    assert.match(erro.textContent, /Só a organização cria atividade\./)

    falsa.responde('POST /atividades', 404, {
      erro: 'NAO_ENCONTRADO',
      mensagem: 'sala-xyz não existe.'
    })
    container.querySelector('.campo-sala').value = 'sala-xyz'
    enviar(container)
    await pausa()
    await pausa()

    erro = container.querySelector('.erro')
    assert.match(erro.textContent, /NAO_ENCONTRADO/)
    assert.match(erro.textContent, /sala-xyz não existe\./)
  })

  it('mostra QUANTIDADE_DE_ENCONTROS, ENCONTRO_INVALIDO, VAGAS_ACIMA_DA_CAPACIDADE e CONFLITO_DE_SALA com o código e a mensagem', async () => {
    const casos = [
      ['QUANTIDADE_DE_ENCONTROS', 'palestra tem exatamente 1 encontro.'],
      ['ENCONTRO_INVALIDO', 'Duração fora de 1h–4h.'],
      ['VAGAS_ACIMA_DA_CAPACIDADE', 'Vagas acima da capacidade da sala.'],
      ['CONFLITO_DE_SALA', 'Menos de 15 min entre encontros na mesma sala.']
    ]
    for (const [codigo, mensagem] of casos) {
      const { falsa, api, container } = montar()
      falsa.responde('POST /atividades', 422, { erro: codigo, mensagem })
      await render(container, { api, agora: () => '2026-10-13T09:00:00-03:00' })
      preencherFormulario(container)
      enviar(container)
      await pausa()
      await pausa()

      const erro = container.querySelector('.erro')
      assert.match(erro.textContent, new RegExp(codigo))
      assert.match(erro.textContent, new RegExp(mensagem))
    }
  })
})
