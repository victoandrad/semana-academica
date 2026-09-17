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
  const vagasOk = Number.isInteger(dados.vagas) && dados.vagas >= 1
  return camposOk && vagasOk && tiposValidos.includes(dados.tipo)
}

function quantidadeEhValida({ tipo, encontros }) {
  return tipo === 'palestra' ? encontros.length === 1 : encontros.length >= 2 && encontros.length <= 5
}

function duracaoEhValida({ inicio, fim }) {
  const minutos = (Date.parse(fim) - Date.parse(inicio)) / 60000
  return minutos >= 60 && minutos <= 240
}

const JANELA_INICIO = Date.parse('2026-10-19T00:00:00-03:00')
const JANELA_FIM = Date.parse('2026-10-24T00:00:00-03:00')

function diaEmBrasilia(instante) {
  const d = new Date(instante - 3 * 3600 * 1000)
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
}

function periodoEhValido({ inicio, fim }) {
  const ini = Date.parse(inicio)
  const fimMs = Date.parse(fim)
  return (
    diaEmBrasilia(ini) === diaEmBrasilia(fimMs) &&
    ini >= JANELA_INICIO &&
    fimMs < JANELA_FIM
  )
}

function encontrosSemSobreposicao(encontros) {
  const ordenados = [...encontros].sort(
    (a, b) => Date.parse(a.inicio) - Date.parse(b.inicio)
  )
  return ordenados.every(
    (encontro, i) =>
      i === 0 || Date.parse(encontro.inicio) > Date.parse(ordenados[i - 1].fim)
  )
}

export function criarAtividade(dados) {
  if (typeof dados.salaId === 'string' && !salaExiste(dados.salaId)) {
    return { erro: 'NAO_ENCONTRADO' }
  }
  if (!corpoEhValido(dados)) {
    return null
  }
  if (!quantidadeEhValida(dados)) {
    return { erro: 'QUANTIDADE_DE_ENCONTROS' }
  }
  if (!dados.encontros.every(duracaoEhValida)) {
    return { erro: 'ENCONTRO_INVALIDO' }
  }
  if (!dados.encontros.every(periodoEhValido)) {
    return { erro: 'ENCONTRO_INVALIDO' }
  }
  if (!encontrosSemSobreposicao(dados.encontros)) {
    return { erro: 'ENCONTRO_INVALIDO' }
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