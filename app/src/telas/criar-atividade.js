import { mostrarErro } from '../api.js'

// Tela da organização: monta o POST /atividades e mostra o que a API respondeu.
// Nenhuma validação de regra mora aqui — quem recusa é a API, e a tela exibe o
// código e a mensagem devolvidos, sem traduzir (R1, R3, R4, R5, R6, R7, R9, R10, R12).
export async function render(container, { api, agora }) {
  container.replaceChildren()

  const form = document.createElement('form')
  form.className = 'form-atividade'

  form.append(campoTexto('Título', 'campo-titulo'))

  const rotuloTipo = document.createElement('label')
  rotuloTipo.append('Tipo ')
  const selectTipo = document.createElement('select')
  selectTipo.className = 'campo-tipo'
  for (const tipo of ['palestra', 'minicurso']) {
    const opcao = document.createElement('option')
    opcao.value = tipo
    opcao.textContent = tipo
    selectTipo.append(opcao)
  }
  rotuloTipo.append(selectTipo)
  form.append(rotuloTipo)

  const rotuloSala = document.createElement('label')
  rotuloSala.append('Sala ')
  const selectSala = document.createElement('select')
  selectSala.className = 'campo-sala'
  rotuloSala.append(selectSala)
  form.append(rotuloSala)

  form.append(campoTexto('Vagas', 'campo-vagas', 'number'))

  const campoEncontros = document.createElement('section')
  campoEncontros.className = 'campo-encontros'
  const listaEncontros = document.createElement('div')
  listaEncontros.className = 'lista-encontros'
  const adicionar = document.createElement('button')
  adicionar.type = 'button'
  adicionar.className = 'adicionar-encontro'
  adicionar.textContent = 'Adicionar encontro'
  adicionar.addEventListener('click', () => listaEncontros.append(linhaEncontro()))
  listaEncontros.append(linhaEncontro())
  campoEncontros.append(listaEncontros, adicionar)
  form.append(campoEncontros)

  const enviar = document.createElement('button')
  enviar.type = 'submit'
  enviar.className = 'criar'
  enviar.textContent = 'Criar atividade'
  form.append(enviar)

  const areaErro = document.createElement('section')
  areaErro.className = 'area-erro'
  const resultado = document.createElement('section')
  resultado.className = 'resultado'

  container.append(areaErro, form, resultado)

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    areaErro.replaceChildren()
    resultado.replaceChildren()

    const corpo = {
      titulo: form.querySelector('.campo-titulo').value,
      tipo: form.querySelector('.campo-tipo').value,
      salaId: form.querySelector('.campo-sala').value,
      vagas: Number(form.querySelector('.campo-vagas').value),
      encontros: [...form.querySelectorAll('.encontro')].map((linha) => ({
        inicio: paraIso(linha.querySelector('.encontro-inicio').value),
        fim: paraIso(linha.querySelector('.encontro-fim').value)
      }))
    }

    try {
      const r = await api.post('/atividades', corpo)
      mostrarSucesso(resultado, r.dados)
    } catch (erro) {
      areaErro.replaceChildren()
      mostrarErro(areaErro, erro)
    }
  })

  await carregarSalas(selectSala, api, areaErro)
}

function campoTexto(rotulo, classe, tipo = 'text') {
  const label = document.createElement('label')
  label.append(`${rotulo} `)
  const input = document.createElement('input')
  input.type = tipo
  input.className = classe
  label.append(input)
  return label
}

function linhaEncontro() {
  const linha = document.createElement('div')
  linha.className = 'encontro'

  const rotuloInicio = document.createElement('label')
  rotuloInicio.append('Início ')
  const inicio = document.createElement('input')
  inicio.type = 'datetime-local'
  inicio.className = 'encontro-inicio'
  rotuloInicio.append(inicio)

  const rotuloFim = document.createElement('label')
  rotuloFim.append('Fim ')
  const fim = document.createElement('input')
  fim.type = 'datetime-local'
  fim.className = 'encontro-fim'
  rotuloFim.append(fim)

  const remover = document.createElement('button')
  remover.type = 'button'
  remover.className = 'remover-encontro'
  remover.textContent = 'Remover'
  remover.addEventListener('click', () => linha.remove())

  linha.append(rotuloInicio, rotuloFim, remover)
  return linha
}

// datetime-local vem sem fuso; o evento é em Brasília (contrato §4).
function paraIso(valor) {
  if (!valor) return valor
  return valor.length === 16 ? `${valor}:00-03:00` : `${valor}-03:00`
}

async function carregarSalas(select, api, areaErro) {
  try {
    const r = await api.get('/salas')
    for (const sala of r.dados) {
      const opcao = document.createElement('option')
      opcao.value = sala.id
      opcao.textContent = `${sala.nome} (${sala.capacidade})`
      select.append(opcao)
    }
  } catch (erro) {
    mostrarErro(areaErro, erro)
  }
}

function mostrarSucesso(area, atividade) {
  const div = document.createElement('div')
  div.className = 'sucesso'
  div.textContent = `Atividade criada: ${atividade.id} — ${atividade.titulo} (${atividade.situacao})`
  area.append(div)
}
