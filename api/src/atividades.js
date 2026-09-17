import { salaExiste, capacidadeDe } from './salas.js'
import { agora } from './relogio.js'

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

const INTERVALO_SALA_MIN = 15 * 60 * 1000

function situacaoDa(atividade) {
  if (atividade.cancelada) {
    return 'cancelada'
  }
  const agoraMs = Date.parse(agora())
  const primeiro = Date.parse(atividade.encontros[0].inicio)
  const ultimo = Date.parse(atividade.encontros[atividade.encontros.length - 1].fim)
  if (agoraMs >= ultimo) {
    return 'encerrada'
  }
  if (agoraMs >= primeiro) {
    return 'em_andamento'
  }
  return 'prevista'
}

function formatar(atividade) {
  return { ...atividade, situacao: situacaoDa(atividade) }
}

function encontrosConflitam(a, b) {
  const [x, y] =
    Date.parse(a.inicio) <= Date.parse(b.inicio) ? [a, b] : [b, a]
  return Date.parse(y.inicio) < Date.parse(x.fim) + INTERVALO_SALA_MIN
}

function temConflitoDeSala(encontroNovo, salaId) {
  return atividades.some(
    atv =>
      atv.salaId === salaId &&
      !atv.cancelada &&
      atv.encontros.some(e => encontrosConflitam(encontroNovo, e))
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
  if (dados.vagas > capacidadeDe(dados.salaId)) {
    return { erro: 'VAGAS_ACIMA_DA_CAPACIDADE' }
  }
  if (dados.encontros.some(e => temConflitoDeSala(e, dados.salaId))) {
    return { erro: 'CONFLITO_DE_SALA' }
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
    cancelada: false,
    ocupadas: 0,
    vagasRestantes: dados.vagas,
    emEspera: 0
  }
  atividades.push(atividade)
  return formatar(atividade)
}

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/

export function listarAtividades(filtros = {}) {
  if (filtros.dia !== undefined && !FORMATO_DIA.test(filtros.dia)) {
    return { erro: 'DADOS_INVALIDOS' }
  }
  if (filtros.tipo !== undefined && !tiposValidos.includes(filtros.tipo)) {
    return { erro: 'DADOS_INVALIDOS' }
  }
  const dia = filtros.dia
    ? Number(String(filtros.dia).replaceAll('-', ''))
    : null
  const tipo = filtros.tipo
  return atividades
    .map(formatar)
    .filter(
      a =>
        (dia === null ||
          a.encontros.some(e => diaEmBrasilia(Date.parse(e.inicio)) === dia)) &&
        (tipo === undefined || a.tipo === tipo)
    )
    .sort(
      (a, b) =>
        Date.parse(a.encontros[0].inicio) - Date.parse(b.encontros[0].inicio) ||
        (a.titulo < b.titulo ? -1 : a.titulo > b.titulo ? 1 : 0)
    )
}

export function buscarAtividade(id) {
  const atividade = atividades.find(a => a.id === id)
  return atividade ? formatar(atividade) : null
}

export function alterarAtividade(id, dados) {
  const atividade = atividades.find(a => a.id === id)
  if (!atividade) {
    return { erro: 'NAO_ENCONTRADO' }
  }
  if (atividade.cancelada) {
    return { erro: 'ATIVIDADE_CANCELADA' }
  }
  if (situacaoDa(atividade) !== 'prevista') {
    return { erro: 'CAMPO_NAO_EDITAVEL' }
  }
  const camposEditaveis = ['titulo', 'vagas']
  const chaves = dados ? Object.keys(dados) : []
  if (chaves.some(c => !camposEditaveis.includes(c))) {
    return { erro: 'CAMPO_NAO_EDITAVEL' }
  }
  if ('vagas' in dados && dados.vagas > capacidadeDe(atividade.salaId)) {
    return { erro: 'VAGAS_ACIMA_DA_CAPACIDADE' }
  }
  if ('vagas' in dados) {
    atividade.vagas = dados.vagas
  }
  if ('titulo' in dados) {
    atividade.titulo = dados.titulo
  }
  return formatar(atividade)
}

export function cancelarAtividade(id) {
  const atividade = atividades.find(a => a.id === id)
  if (!atividade) {
    return { erro: 'NAO_ENCONTRADO' }
  }
  if (atividade.cancelada) {
    return { erro: 'ATIVIDADE_CANCELADA' }
  }
  if (situacaoDa(atividade) !== 'prevista') {
    return { erro: 'ATIVIDADE_JA_INICIADA' }
  }
  atividade.cancelada = true
  return formatar(atividade)
}

export function resetAtividades() {
  atividades = []
}