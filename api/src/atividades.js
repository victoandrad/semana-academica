import { salaExiste } from './salas.js'

let atividades = []

function hex8() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)), b =>
    b.toString(16).padStart(2, '0')
  ).join('')
}

const camposObrigatorios = {
  titulo: 'string',
  tipo: 'string',
  salaId: 'string',
  vagas: 'number',
  encontros: 'array'
}

const tiposValidos = ['palestra', 'minicurso']

function corpoEhValido(dados) {
  const camposOk = Object.entries(camposObrigatorios).every(([campo, tipo]) => {
    if (tipo === 'array') {
      return Array.isArray(dados[campo])
    }
    return typeof dados[campo] === tipo
  })
  return camposOk && tiposValidos.includes(dados.tipo)
}

export function criarAtividade(dados) {
  if (typeof dados.salaId === 'string' && !salaExiste(dados.salaId)) {
    return { erro: 'NAO_ENCONTRADO' }
  }
  if (!corpoEhValido(dados)) {
    return null
  }
  const encontros = [...dados.encontros]
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
    .map(e => ({ id: `enc_${hex8()}`, inicio: e.inicio, fim: e.fim }))
  const cargaHorariaMinutos = encontros.reduce(
    (soma, e) => soma + (Date.parse(e.fim) - Date.parse(e.inicio)) / 60000,
    0
  )
  const atividade = {
    id: `atv_${hex8()}`,
    titulo: dados.titulo,
    tipo: dados.tipo,
    salaId: dados.salaId,
    vagas: dados.vagas,
    encontros,
    cargaHorariaMinutos,
    situacao: 'prevista',
    ocupadas: 0,
    vagasRestantes: dados.vagas,
    emEspera: 0
  }
  atividades.push(atividade)
  return atividade
}

export function listarAtividades() {
  return atividades
}

export function buscarAtividade(id) {
  return atividades.find(a => a.id === id)
}

export function resetAtividades() {
  atividades = []
}