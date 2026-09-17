import { mostrarErro } from '../api.js'

// Tela do detalhe: busca GET /atividades/:id e desenha exatamente o que a API
// devolveu. Nenhuma regra (situação, vagas, prazo) é decidida aqui (R2, R23, R26, R28).
export async function render(container, { api, agora, id, parametros }) {
  container.replaceChildren()

  const atividadeId = id ?? parametros?.[0]
  if (!atividadeId) {
    container.textContent = 'Escolha uma atividade na programação.'
    return
  }

  try {
    const r = await api.get(`/atividades/${atividadeId}`)
    desenhar(container, r.dados)
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

  container.append(artigo)
}
