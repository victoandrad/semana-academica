import { mostrarErro } from '../api.js'

// Tela de M2: lista GET /inscricoes e junta o título por GET /atividades.
// A contagem regressiva é apresentação: vem de agora() injetado, nunca do
// relógio do navegador. Quem decide prazo/expiração/limite é a API (R20, R21, R22).
export async function render(container, { api, agora }) {
  container.replaceChildren()
  try {
    const [rInscricoes, rAtividades] = await Promise.all([
      api.get('/inscricoes'),
      api.get('/atividades')
    ])
    desenhar(container, api, rInscricoes.dados, rAtividades.dados, agora)
  } catch (erro) {
    container.replaceChildren()
    mostrarErro(container, erro)
  }
}

function desenhar(container, api, inscricoes, atividades, agora) {
  container.replaceChildren()
  if (inscricoes.length === 0) {
    container.textContent = 'Você ainda não tem inscrições.'
    return
  }
  for (const inscricao of inscricoes) {
    const linha = document.createElement('article')
    linha.className = 'inscricao'
    linha.dataset.inscricaoId = inscricao.id
    preencherLinha(linha, api, container, inscricao, atividades, agora)
    container.append(linha)
  }
}

async function preencherLinha(linha, api, area, inscricao, atividades, agora) {
  linha.replaceChildren()

  const atividade = atividades.find((a) => a.id === inscricao.atividadeId)
  const titulo = document.createElement('h3')
  titulo.className = 'titulo'
  titulo.textContent = atividade ? atividade.titulo : `Atividade ${inscricao.atividadeId}`
  linha.append(titulo)

  const campos = [
    ['Atividade', inscricao.atividadeId, 'atividade-id'],
    ['Status', inscricao.status, 'status']
  ]
  if (inscricao.posicaoNaEspera !== null) {
    campos.push(['Posição na espera', inscricao.posicaoNaEspera, 'posicao'])
  }
  if (inscricao.convocadaAte !== null) {
    campos.push(['Convocação até', inscricao.convocadaAte, 'convocada-ate'])
  }
  campos.push(['Criada em', inscricao.criadaEm, 'criada-em'])

  const lista = document.createElement('dl')
  for (const [rotulo, valor, classe] of campos) {
    const dt = document.createElement('dt')
    dt.textContent = rotulo
    const dd = document.createElement('dd')
    dd.className = `campo-${classe}`
    dd.textContent = String(valor)
    lista.append(dt, dd)
  }
  linha.append(lista)

  if (inscricao.status === 'convocada') {
    const restante = document.createElement('p')
    restante.className = 'restante'
    restante.textContent = formatarRestante(
      Date.parse(inscricao.convocadaAte) - Date.parse(agora())
    )
    linha.append(restante)

    const confirmar = document.createElement('button')
    confirmar.type = 'button'
    confirmar.className = 'confirmar'
    confirmar.textContent = 'Confirmar vaga'
    confirmar.addEventListener('click', async () => {
      area.querySelector('.erro')?.remove()
      try {
        const r = await api.post(`/inscricoes/${inscricao.id}/confirmacao`)
        await preencherLinha(linha, api, area, r.dados, atividades, agora)
      } catch (erro) {
        mostrarErro(area, erro)
      }
    })
    linha.append(confirmar)
  }
}

// Só formata o que convocadaAte - agora() dá; não decide nada.
function formatarRestante(ms) {
  const total = Math.max(0, ms)
  const h = Math.floor(total / 3_600_000)
  const m = Math.floor((total % 3_600_000) / 60_000)
  const s = Math.floor((total % 60_000) / 1000)
  return `${h}h ${m}min ${s}s`
}