import { mostrarErro } from '../api.js'

// Dias do evento (contrato §4). A tela só usa isso para montar as abas de filtro;
// qual atividade cai em qual dia é a API que decide (R30, R32).
const DIAS = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']

export async function render(container, { api, agora }) {
  container.replaceChildren()

  let dia = DIAS[0]
  let tipo = ''

  const filtros = document.createElement('section')
  filtros.className = 'filtros'

  const abas = document.createElement('div')
  abas.className = 'aba-dias'
  const botoes = []
  for (const valor of ['', ...DIAS]) {
    const botao = document.createElement('button')
    botao.type = 'button'
    botao.className = 'aba-dia'
    botao.dataset.dia = valor
    botao.textContent = valor === '' ? 'Todos os dias' : valor.split('-').reverse().join('/')
    botao.addEventListener('click', () => {
      dia = valor
      marcarAba()
      carregar()
    })
    botoes.push(botao)
    abas.append(botao)
  }

  const rotuloTipo = document.createElement('label')
  rotuloTipo.className = 'filtro-tipo'
  rotuloTipo.append('Tipo ')
  const selectTipo = document.createElement('select')
  for (const valor of ['', 'palestra', 'minicurso']) {
    const opcao = document.createElement('option')
    opcao.value = valor
    opcao.textContent = valor === '' ? 'todos' : valor
    selectTipo.append(opcao)
  }
  selectTipo.addEventListener('change', () => {
    tipo = selectTipo.value
    carregar()
  })
  rotuloTipo.append(selectTipo)

  filtros.append(abas, rotuloTipo)

  const lista = document.createElement('section')
  lista.className = 'programacao'

  container.append(filtros, lista)

  function marcarAba() {
    for (const botao of botoes) botao.classList.toggle('ativo', botao.dataset.dia === dia)
  }

  async function carregar() {
    lista.replaceChildren()
    try {
      const r = await api.get(rotaLista(dia, tipo))
      desenhar(lista, r.dados)
    } catch (erro) {
      lista.replaceChildren()
      mostrarErro(lista, erro)
    }
  }

  marcarAba()
  await carregar()
}

function rotaLista(dia, tipo) {
  const parametros = []
  if (dia) parametros.push(`dia=${dia}`)
  if (tipo) parametros.push(`tipo=${tipo}`)
  return parametros.length ? `/atividades?${parametros.join('&')}` : '/atividades'
}

function desenhar(area, atividades) {
  if (atividades.length === 0) {
    area.textContent = 'Nenhuma atividade neste dia.'
    return
  }
  for (const atividade of atividades) {
    const item = document.createElement('article')
    item.className = 'atividade'
    item.dataset.atividadeId = atividade.id

    const titulo = document.createElement('h3')
    const link = document.createElement('a')
    link.href = `#detalhe-atividade/${atividade.id}`
    link.textContent = atividade.titulo
    titulo.append(link)

    const info = document.createElement('p')
    info.textContent = `${atividade.tipo} · ${atividade.salaId} · ${atividade.situacao} · ${atividade.vagasRestantes}/${atividade.vagas} vagas`

    const horarios = document.createElement('ul')
    for (const encontro of atividade.encontros) {
      const li = document.createElement('li')
      li.textContent = `Encontro ${encontro.id}: ${encontro.inicio} — ${encontro.fim}`
      horarios.append(li)
    }

    item.append(titulo, info, horarios)
    area.append(item)
  }
}
