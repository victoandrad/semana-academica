import QRCode from 'qrcode'
import { mostrarErro } from '../api.js'

// Tela da organização: escolhe um encontro e emite o código via QR.
// O relógio entra por agora() injetado no render — nunca Date.now().
export async function render(container, { api, agora }) {
  let timer

  async function abrirCodigo(encontro) {
    if (timer !== undefined) clearTimeout(timer)
    container.querySelector('.erro')?.remove()
    container.querySelector('.codigo-tela-cheia')?.remove()
    try {
      const r = await api.get(`/encontros/${encontro.id}/codigo`)
      await exibirTelaCheia(container, encontro, r.dados, () => {
        if (timer !== undefined) clearTimeout(timer)
      })
      agendarTroca(encontro, r.dados.trocaEm)
    } catch (erro) {
      mostrarErro(container, erro)
    }
  }

  // Quando o relógio chega em trocaEm, busca o próximo código sozinha.
  function agendarTroca(encontro, trocaEm) {
    if (timer !== undefined) clearTimeout(timer)
    const atraso = Math.max(0, Date.parse(trocaEm) - Date.parse(agora()))
    timer = setTimeout(() => abrirCodigo(encontro), atraso)
  }

  await carregarAtividades(container, api, abrirCodigo)
}

async function carregarAtividades(container, api, abrirCodigo) {
  container.textContent = 'Carregando atividades…'
  try {
    const r = await api.get('/atividades')
    listaDeAtividades(container, api, r.dados, abrirCodigo)
  } catch (erro) {
    mostrarErro(container, erro)
  }
}

function listaDeAtividades(container, api, atividades, abrirCodigo) {
  container.replaceChildren()
  const lista = document.createElement('div')
  lista.className = 'lista-atividades'
  for (const atividade of atividades) {
    const secao = document.createElement('section')
    const titulo = document.createElement('h3')
    titulo.textContent = atividade.titulo
    secao.append(titulo)
    for (const encontro of atividade.encontros) {
      const botao = document.createElement('button')
      botao.textContent = `${encontro.inicio} — ${encontro.fim}`
      botao.dataset.encontroId = encontro.id
      botao.addEventListener('click', () => abrirCodigo(encontro))
      secao.append(botao)
    }
    lista.append(secao)
  }
  container.append(lista)
}

async function exibirTelaCheia(container, encontro, dados, aoFechar) {
  const tela = document.createElement('section')
  tela.className = 'codigo-tela-cheia'

  const qrDiv = document.createElement('div')
  qrDiv.className = 'codigo-qr'
  const conteudo = `${encontro.id}:${dados.codigo}`
  qrDiv.dataset.conteudo = conteudo
  const svg = await QRCode.toString(conteudo, { type: 'svg' })
  qrDiv.innerHTML = svg

  const texto = document.createElement('div')
  texto.className = 'codigo-texto'
  texto.textContent = dados.codigo

  const fechar = document.createElement('button')
  fechar.textContent = 'Fechar'
  fechar.addEventListener('click', () => {
    aoFechar()
    tela.remove()
  })

  tela.append(qrDiv, texto, fechar)
  container.append(tela)
}