import { ErroDaApi, mostrarErro } from '../api.js'

export const CHAVE_FILA = 'm3-fila-presencas'

let filaAtual = null

export function render(container, { api, agora }) {
  container.replaceChildren()

  if (typeof window !== 'undefined' && !window.__m3FilaOnline) {
    window.__m3FilaOnline = true
    addEventListener('online', () => filaAtual?.())
  }

  const rotuloEncontro = criarRotulo('Encontro', document.createElement('select'))
  const select = rotuloEncontro.querySelector('select')
  select.className = 'select-encontro'

  const rotuloCodigo = criarRotulo('Código', document.createElement('input'))
  const inputCodigo = rotuloCodigo.querySelector('input')
  inputCodigo.className = 'input-codigo'
  inputCodigo.placeholder = 'Código de 6 caracteres'

  const botao = document.createElement('button')
  botao.className = 'registrar'
  botao.textContent = 'Registrar presença'

  const areaLista = document.createElement('section')
  areaLista.append(rotuloEncontro, rotuloCodigo, botao)

  const areaResultado = document.createElement('section')
  areaResultado.className = 'resultado'

  const areaFila = document.createElement('section')
  areaFila.className = 'fila'

  container.append(areaLista, areaResultado, areaFila)

  const aoEnviarFila = () => reenviarFila({ api, agora, areaResultado, areaFila, aoEnviarFila })
  filaAtual = aoEnviarFila

  botao.addEventListener('click', () =>
    registrarLeitura({ api, agora, areaResultado, areaFila, aoEnviarFila, encontroId: select.value, codigo: inputCodigo.value.trim() })
  )

  iniciarScanner((conteudo) => {
    const [encontroId, codigo] = String(conteudo).trim().split(':')
    if (!encontroId || !codigo) return
    registrarLeitura({ api, agora, areaResultado, areaFila, aoEnviarFila, encontroId, codigo })
  })

  carregarAtividades(areaLista, select, api)
  desenharFila(areaFila, aoEnviarFila)
}

async function registrarLeitura({ api, agora, areaResultado, areaFila, aoEnviarFila, encontroId, codigo }) {
  if (!encontroId) return
  areaResultado.replaceChildren()
  try {
    const r = await api.post(`/encontros/${encontroId}/presencas`, { codigo })
    mostrarPresenca(areaResultado, r.dados)
  } catch (erro) {
    if (erro instanceof ErroDaApi) {
      mostrarErro(areaResultado, erro)
      return
    }
    const item = { encontroId, codigo, lidoEm: agora() }
    adicionarAFila(item)
    mostrarAvisoOffline(areaResultado, item)
    desenharFila(areaFila, aoEnviarFila)
  }
}

function mostrarPresenca(area, presenca) {
  const div = document.createElement('div')
  div.className = 'presenca'
  div.textContent = `Presença registrada — origem ${presenca.origem}, lidoEm ${presenca.lidoEm}`
  area.prepend(div)
}

function mostrarAvisoOffline(area, item) {
  const div = document.createElement('div')
  div.className = 'aviso-offline'
  div.textContent = `Sem rede: leitura de ${item.encontroId} (${item.codigo}) guardada; será enviada quando a rede voltar.`
  area.prepend(div)
}

function adicionarAFila(item) {
  const fila = lerFila()
  fila.push(item)
  localStorage.setItem(CHAVE_FILA, JSON.stringify(fila))
}

function lerFila() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_FILA) ?? '[]')
  } catch {
    return []
  }
}

async function reenviarFila({ api, agora, areaResultado, areaFila, aoEnviarFila }) {
  const fila = lerFila()
  const restantes = []
  for (const item of fila) {
    try {
      const r = await api.post(`/encontros/${item.encontroId}/presencas`, {
        codigo: item.codigo,
        lidoEm: item.lidoEm
      })
      mostrarPresenca(areaResultado, r.dados)
    } catch (erro) {
      if (erro instanceof ErroDaApi) {
        mostrarErro(areaResultado, erro)
      } else {
        restantes.push(item)
      }
    }
  }
  localStorage.setItem(CHAVE_FILA, JSON.stringify(restantes))
  desenharFila(areaFila, aoEnviarFila)
}

function desenharFila(area, aoEnviarFila) {
  area.replaceChildren()
  const fila = lerFila()
  if (fila.length === 0) {
    area.textContent = 'Nenhuma leitura pendente.'
    return
  }
  const lista = document.createElement('ul')
  lista.className = 'fila-pendente'
  for (const item of fila) {
    const li = document.createElement('li')
    li.textContent = `${item.encontroId} · ${item.codigo} · lidoEm ${item.lidoEm}`
    lista.append(li)
  }
  const botao = document.createElement('button')
  botao.className = 'enviar-agora'
  botao.textContent = 'Enviar agora'
  botao.addEventListener('click', aoEnviarFila)
  area.append(lista, botao)
}

async function carregarAtividades(area, select, api) {
  try {
    const r = await api.get('/atividades')
    for (const atividade of r.dados) {
      for (const encontro of atividade.encontros) {
        const opcao = document.createElement('option')
        opcao.value = encontro.id
        opcao.textContent = `${atividade.titulo} — ${encontro.inicio} a ${encontro.fim}`
        select.append(opcao)
      }
    }
  } catch (erro) {
    mostrarErro(area, erro)
  }
}

function criarRotulo(texto, campo) {
  const label = document.createElement('label')
  const span = document.createElement('span')
  span.textContent = texto
  label.append(span, campo)
  return label
}

function iniciarScanner(aoLer) {
  const Detector = window.BarcodeDetector
  if (!Detector) return
  if (!navigator.mediaDevices?.getUserMedia) return
  const video = document.createElement('video')
  video.autoplay = true
  let parado = false
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then((stream) => {
      if (parado) return
      try {
        video.srcObject = stream
      } catch {}
      try {
        const tocar = video.play()
        if (tocar?.catch) tocar.catch(() => {})
      } catch {}
      const detector = new Detector()
      // O mesmo QR fica na frente da câmera por vários frames: registra uma vez
      // por conteúdo e espera entre leituras, para não disparar um POST por frame.
      let ultimo = null
      const proximo = () => { if (!parado) setTimeout(ler, 500) }
      const ler = () => {
        if (parado) return
        detector.detect(video)
          .then((leituras = []) => {
            if (parado) return
            for (const leitura of leituras) {
              if (leitura.rawValue === ultimo) continue
              ultimo = leitura.rawValue
              aoLer(leitura.rawValue)
            }
            proximo()
          })
          .catch(proximo)
      }
      ler()
    })
    .catch(() => {})
}