import { mostrarErro } from '../api.js'

// Tela do detalhe: busca GET /atividades/:id e desenha exatamente o que a API
// devolveu. Nenhuma regra (situação, vagas, prazo) é decidida aqui (R2, R23, R26, R28).
// As ações de M2 moram na mesma tela: a inscrição do usuário vem de
// GET /inscricoes?atividadeId= e as escritas são POST do contrato (§5).
export async function render(container, { api, agora, id, parametros }) {
  container.replaceChildren()

  const atividadeId = id ?? parametros?.[0]
  if (!atividadeId) {
    container.textContent = 'Escolha uma atividade na programação.'
    return
  }

  try {
    const r = await api.get(`/atividades/${atividadeId}`)
    const areaInscricoes = desenhar(container, r.dados)
    await carregarInscricoes(areaInscricoes, api, r.dados.id)
  } catch (erro) {
    container.replaceChildren()
    mostrarErro(container, erro)
  }
}

function desenhar(container, atividade) {
  container.replaceChildren()

  const artigo = document.createElement('article')
  artigo.className = 'atividade-detalhe'
  artigo.dataset.atividadeId = atividade.id

  const titulo = document.createElement('h2')
  titulo.className = 'titulo'
  titulo.textContent = atividade.titulo
  artigo.append(titulo)

  const campos = [
    ['Tipo', atividade.tipo, 'tipo'],
    ['Sala', atividade.salaId, 'sala'],
    ['Situação', atividade.situacao, 'situacao'],
    ['Vagas', atividade.vagas, 'vagas'],
    ['Ocupadas', atividade.ocupadas, 'ocupadas'],
    ['Vagas restantes', atividade.vagasRestantes, 'vagas-restantes'],
    ['Em espera', atividade.emEspera, 'em-espera'],
    ['Carga horária (min)', atividade.cargaHorariaMinutos, 'carga-horaria']
  ]
  const lista = document.createElement('dl')
  lista.className = 'campos'
  for (const [rotulo, valor, classe] of campos) {
    const dt = document.createElement('dt')
    dt.textContent = rotulo
    const dd = document.createElement('dd')
    dd.className = `campo-${classe}`
    dd.textContent = String(valor)
    lista.append(dt, dd)
  }
  artigo.append(lista)

  const encontros = document.createElement('ul')
  encontros.className = 'encontros'
  for (const encontro of atividade.encontros) {
    const li = document.createElement('li')
    li.className = 'encontro'
    li.dataset.encontroId = encontro.id
    li.textContent = `${encontro.id}: ${encontro.inicio} — ${encontro.fim}`
    encontros.append(li)
  }
  artigo.append(encontros)

  const areaInscricoes = document.createElement('section')
  areaInscricoes.className = 'inscricoes'
  artigo.append(areaInscricoes)

  container.append(artigo)
  return areaInscricoes
}

async function carregarInscricoes(area, api, atividadeId) {
  try {
    const r = await api.get(`/inscricoes?atividadeId=${atividadeId}`)
    desenharInscricoes(area, api, r.dados, atividadeId)
  } catch (erro) {
    area.replaceChildren()
    mostrarErro(area, erro)
  }
}

function desenharInscricoes(area, api, inscricoes, atividadeId) {
  area.replaceChildren()
  const titulo = document.createElement('h3')
  titulo.className = 'titulo-inscricoes'
  titulo.textContent = 'Inscrição'
  area.append(titulo)

  if (inscricoes.length === 0) {
    const botao = document.createElement('button')
    botao.type = 'button'
    botao.className = 'inscrever'
    botao.textContent = 'Inscrever'
    botao.addEventListener('click', () => inscrever(area, api, atividadeId, botao))
    area.append(botao)
    return
  }

  for (const inscricao of inscricoes) {
    const linha = document.createElement('article')
    linha.className = 'inscricao'
    linha.dataset.inscricaoId = inscricao.id
    desenharInscricao(linha, api, area, inscricao)
    area.append(linha)
  }
}

async function inscrever(area, api, atividadeId, botao) {
  area.querySelector('.erro')?.remove()
  try {
    const r = await api.post(`/atividades/${atividadeId}/inscricoes`)
    botao.remove()
    const linha = document.createElement('article')
    linha.className = 'inscricao'
    linha.dataset.inscricaoId = r.dados.id
    desenharInscricao(linha, api, area, r.dados)
    area.append(linha)
  } catch (erro) {
    mostrarErro(area, erro)
  }
}

function desenharInscricao(linha, api, area, inscricao) {
  linha.replaceChildren()

  const lista = document.createElement('dl')
  const campos = [
    ['Inscrição', inscricao.id, 'id'],
    ['Status', inscricao.status, 'status']
  ]
  if (inscricao.posicaoNaEspera !== null) {
    campos.push(['Posição na espera', inscricao.posicaoNaEspera, 'posicao'])
  }
  if (inscricao.convocadaAte !== null) {
    campos.push(['Convocação até', inscricao.convocadaAte, 'convocada-ate'])
  }
  campos.push(['Criada em', inscricao.criadaEm, 'criada-em'])
  for (const [rotulo, valor, classe] of campos) {
    const dt = document.createElement('dt')
    dt.textContent = rotulo
    const dd = document.createElement('dd')
    dd.className = `campo-${classe}`
    dd.textContent = String(valor)
    lista.append(dt, dd)
  }
  linha.append(lista)

  const cancelar = document.createElement('button')
  cancelar.type = 'button'
  cancelar.className = 'cancelar'
  cancelar.textContent = 'Cancelar inscrição'
  cancelar.addEventListener('click', async () => {
    area.querySelector('.erro')?.remove()
    try {
      const r = await api.post(`/inscricoes/${inscricao.id}/cancelamento`)
      desenharInscricao(linha, api, area, r.dados)
    } catch (erro) {
      mostrarErro(area, erro)
    }
  })
  linha.append(cancelar)
}