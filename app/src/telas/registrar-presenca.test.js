import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { apiFalsaComAtividades } from '../../test/api-falsa.js'
import { criarApi } from '../api.js'
import { montarDom } from '../../test/dom.js'
import { CHAVE_FILA, render } from './registrar-presenca.js'

const pausa = () => new Promise((r) => setImmediate(r))

async function montar() {
  const falsa = apiFalsaComAtividades()
  const api = criarApi({ fetch: falsa.fetch, usuario: () => 'p-carla' })
  const { window, container } = montarDom()
  return { falsa, api, window, container }
}

describe('tela do participante — registrar presença (M3)', () => {
  it('lista as atividades do contrato para o participante escolher o encontro', async () => {
    const { falsa, api, container } = await montar()
    await render(container, { api, agora: () => '2026-10-19T19:10:00-03:00' })
    await pausa()

    assert.equal(falsa.chamadas[0].metodo, 'GET')
    assert.equal(falsa.chamadas[0].rota, '/atividades')
    const ids = [...container.querySelectorAll('.select-encontro option')].map((o) => o.value)
    assert.ok(ids.includes('enc_5e6f7a8b'), 'lista os encontros da atividade')
    assert.ok(ids.includes('enc_9c0d1e2f'))
  })

  it('escolhe o encontro, digita o código e envia POST { codigo }, mostrando a Presenca (origem, lidoEm)', async () => {
    const { falsa, api, container } = await montar()
    const presenca = {
      id: 'pre_3a4b5c6d',
      encontroId: 'enc_5e6f7a8b',
      participanteId: 'p-carla',
      origem: 'qr',
      lidoEm: '2026-10-19T19:10:00-03:00',
      registradaEm: '2026-10-19T19:10:00-03:00',
      justificativa: null
    }
    falsa.responde('POST /encontros/enc_5e6f7a8b/presencas', 201, presenca)
    await render(container, { api, agora: () => '2026-10-19T19:10:00-03:00' })
    await pausa()

    container.querySelector('.select-encontro').value = 'enc_5e6f7a8b'
    container.querySelector('.input-codigo').value = 'K7M2QX'
    container.querySelector('.registrar').click()
    await pausa()
    await pausa()

    assert.deepEqual(falsa.chamadas[1], {
      metodo: 'POST',
      rota: '/encontros/enc_5e6f7a8b/presencas',
      cabecalhos: { 'X-Usuario': 'p-carla', 'Content-Type': 'application/json' },
      corpo: { codigo: 'K7M2QX' }
    })
    const presencaMostrada = container.querySelector('.presenca')
    assert.match(presencaMostrada.textContent, /origem qr/)
    assert.match(presencaMostrada.textContent, /2026-10-19T19:10:00-03:00/)
  })

  it('mostra o erro da API com o código e a mensagem (FORA_DA_JANELA e CODIGO_INVALIDO)', async () => {
    const { falsa, api, container } = await montar()
    falsa.responde('POST /encontros/enc_5e6f7a8b/presencas', 422, {
      erro: 'FORA_DA_JANELA',
      mensagem: 'A janela de presença ainda não abriu.'
    })
    await render(container, { api, agora: () => '2026-10-19T19:10:00-03:00' })
    await pausa()

    container.querySelector('.select-encontro').value = 'enc_5e6f7a8b'
    container.querySelector('.input-codigo').value = 'Z9XW4Q'
    container.querySelector('.registrar').click()
    await pausa()
    await pausa()

    let erro = container.querySelector('.erro')
    assert.match(erro.textContent, /FORA_DA_JANELA/)
    assert.match(erro.textContent, /A janela de presença ainda não abriu\./)

    falsa.responde('POST /encontros/enc_5e6f7a8b/presencas', 422, {
      erro: 'CODIGO_INVALIDO',
      mensagem: 'Código não existe para esta leitura.'
    })
    container.querySelector('.select-encontro').value = 'enc_5e6f7a8b'
    container.querySelector('.input-codigo').value = 'WX4QZ9'
    container.querySelector('.registrar').click()
    await pausa()
    await pausa()

    erro = container.querySelector('.erro')
    assert.match(erro.textContent, /CODIGO_INVALIDO/)
    assert.match(erro.textContent, /Código não existe para esta leitura\./)
  })

  it('sem rede, guarda a leitura em localStorage com { encontroId, codigo, lidoEm: agora() } e avisa que será enviada', async () => {
    const { falsa, api, container } = await montar()
    await render(container, { api, agora: () => '2026-10-19T19:10:00-03:00' })
    await pausa()

    falsa.offline = true
    container.querySelector('.select-encontro').value = 'enc_5e6f7a8b'
    container.querySelector('.input-codigo').value = 'K7M2QX'
    container.querySelector('.registrar').click()
    await pausa()
    await pausa()
    await pausa()

    assert.deepEqual(JSON.parse(localStorage.getItem(CHAVE_FILA)), [
      {
        encontroId: 'enc_5e6f7a8b',
        codigo: 'K7M2QX',
        lidoEm: '2026-10-19T19:10:00-03:00'
      }
    ])
    assert.match(container.textContent, /quando a rede voltar/)
    assert.match(container.querySelector('.fila').textContent, /K7M2QX/)
  })

  it('o botão enviar agora reenvia a fila com o lidoEm original e esvazia a fila mostrando a presença', async () => {
    const { falsa, api, container } = await montar()
    falsa.responde('POST /encontros/enc_5e6f7a8b/presencas', 201, {
      id: 'pre_3a4b5c6d',
      encontroId: 'enc_5e6f7a8b',
      participanteId: 'p-carla',
      origem: 'qr_offline',
      lidoEm: '2026-10-19T19:10:00-03:00',
      registradaEm: '2026-10-19T23:50:00-03:00',
      justificativa: null
    })
    localStorage.setItem(CHAVE_FILA, JSON.stringify([
      { encontroId: 'enc_5e6f7a8b', codigo: 'K7M2QX', lidoEm: '2026-10-19T19:10:00-03:00' }
    ]))
    await render(container, { api, agora: () => '2026-10-19T23:50:00-03:00' })
    await pausa()

    container.querySelector('.enviar-agora').click()
    await pausa()
    await pausa()

    const chamada = falsa.chamadas.find((c) => c.metodo === 'POST')
    assert.deepEqual(chamada, {
      metodo: 'POST',
      rota: '/encontros/enc_5e6f7a8b/presencas',
      cabecalhos: { 'X-Usuario': 'p-carla', 'Content-Type': 'application/json' },
      corpo: { codigo: 'K7M2QX', lidoEm: '2026-10-19T19:10:00-03:00' }
    })
    assert.equal(localStorage.getItem(CHAVE_FILA), '[]')
    assert.match(container.querySelector('.presenca').textContent, /origem qr_offline/)
    assert.match(container.querySelector('.presenca').textContent, /2026-10-19T19:10:00-03:00/)
  })

  it('erro 4xx ao reenviar tira o item da fila e mostra o erro com o código e a mensagem', async () => {
    const { falsa, api, container } = await montar()
    falsa.responde('POST /encontros/enc_5e6f7a8b/presencas', 403, {
      erro: 'NAO_INSCRITO',
      mensagem: 'Você não está com inscrição confirmada neste encontro.'
    })
    localStorage.setItem(CHAVE_FILA, JSON.stringify([
      { encontroId: 'enc_5e6f7a8b', codigo: 'K7M2QX', lidoEm: '2026-10-19T19:10:00-03:00' }
    ]))
    await render(container, { api, agora: () => '2026-10-19T23:50:00-03:00' })
    await pausa()

    container.querySelector('.enviar-agora').click()
    await pausa()
    await pausa()

    assert.equal(localStorage.getItem(CHAVE_FILA), '[]')
    const erro = container.querySelector('.erro')
    assert.match(erro.textContent, /NAO_INSCRITO/)
    assert.match(erro.textContent, /inscrição confirmada/)
  })

  it('se a rede falhar de novo ao reenviar, o item fica na fila', async () => {
    const { falsa, api, container } = await montar()
    localStorage.setItem(CHAVE_FILA, JSON.stringify([
      { encontroId: 'enc_5e6f7a8b', codigo: 'K7M2QX', lidoEm: '2026-10-19T19:10:00-03:00' }
    ]))
    await render(container, { api, agora: () => '2026-10-19T23:50:00-03:00' })
    await pausa()

    falsa.offline = true
    container.querySelector('.enviar-agora').click()
    await pausa()
    await pausa()
    await pausa()

    const fila = JSON.parse(localStorage.getItem(CHAVE_FILA))
    assert.equal(fila.length, 1)
    assert.deepEqual(fila[0], {
      encontroId: 'enc_5e6f7a8b',
      codigo: 'K7M2QX',
      lidoEm: '2026-10-19T19:10:00-03:00'
    })
    assert.match(container.querySelector('.fila').textContent, /K7M2QX/)
  })

  it('no evento online da janela, reenvia a fila com o lidoEm original', async () => {
    const { falsa, api, window, container } = await montar()
    falsa.responde('POST /encontros/enc_5e6f7a8b/presencas', 200, {
      id: 'pre_3a4b5c6d',
      encontroId: 'enc_5e6f7a8b',
      participanteId: 'p-carla',
      origem: 'qr_offline',
      lidoEm: '2026-10-19T19:10:00-03:00',
      registradaEm: '2026-10-19T19:10:00-03:00',
      justificativa: null
    })
    localStorage.setItem(CHAVE_FILA, JSON.stringify([
      { encontroId: 'enc_5e6f7a8b', codigo: 'K7M2QX', lidoEm: '2026-10-19T19:10:00-03:00' }
    ]))
    await render(container, { api, agora: () => '2026-10-19T23:50:00-03:00' })
    await pausa()

    window.dispatchEvent(new window.Event('online'))
    await pausa()
    await pausa()

    const chamada = falsa.chamadas.find((c) => c.metodo === 'POST')
    assert.deepEqual(chamada.corpo, { codigo: 'K7M2QX', lidoEm: '2026-10-19T19:10:00-03:00' })
    assert.equal(localStorage.getItem(CHAVE_FILA), '[]')
  })

  it('com BarcodeDetector no navegador, lê o QR da câmera ("enc_5e6f7a8b:K7M2QX") e registra a presença', async () => {
    const { falsa, api, window, container } = await montar()
    falsa.responde('POST /encontros/enc_5e6f7a8b/presencas', 201, {
      id: 'pre_3a4b5c6d',
      encontroId: 'enc_5e6f7a8b',
      participanteId: 'p-carla',
      origem: 'qr',
      lidoEm: '2026-10-19T19:10:00-03:00',
      registradaEm: '2026-10-19T19:10:00-03:00',
      justificativa: null
    })
    let deteccoes = 0
    window.BarcodeDetector = class {
      detect() {
        deteccoes += 1
        if (deteccoes === 1) return Promise.resolve([{ rawValue: 'enc_5e6f7a8b:K7M2QX' }])
        return new Promise(() => {})
      }
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve({}) }
    })
    await render(container, { api, agora: () => '2026-10-19T19:10:00-03:00' })
    await pausa()
    await pausa()
    await pausa()

    const chamada = falsa.chamadas.find((c) => c.metodo === 'POST')
    assert.deepEqual(chamada.corpo, { codigo: 'K7M2QX' })
    assert.match(container.querySelector('.presenca').textContent, /origem qr/)
  })
})