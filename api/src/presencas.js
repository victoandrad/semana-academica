import { randomInt } from 'node:crypto'
import { listarAtividades } from './atividades.js'
import { listarInscricoes } from './inscricoes.js'
import { agora } from './relogio.js'

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const MINUTO = 60_000

// Códigos emitidos: `${encontroId}:${minuto}` → código. O código é do encontro
// e do minuto, sorteado na primeira emissão — não dá para calcular de fora da sala.
let codigos = new Map()

let presencas = []

export function buscarEncontro(id) {
  for (const atividade of listarAtividades()) {
    const encontro = atividade.encontros.find(e => e.id === id)
    if (encontro) {
      return { atividade, encontro }
    }
  }
  return null
}

export function dentroDaJanela(instante, inicio) {
  const t = Date.parse(instante)
  const i = Date.parse(inicio)
  return t >= i - 15 * MINUTO && t <= i + 30 * MINUTO
}

function minutoDe(instante) {
  return Math.floor(Date.parse(instante) / MINUTO)
}

function sortearCodigo() {
  let codigo = ''
  for (let i = 0; i < 6; i += 1) {
    codigo += ALFABETO[randomInt(ALFABETO.length)]
  }
  return codigo
}

// Mesmo código dentro do minuto (R4); um código por encontro (R6).
export function codigoDoMinuto(encontroId, instante) {
  const chave = `${encontroId}:${minutoDe(instante)}`
  if (!codigos.has(chave)) codigos.set(chave, sortearCodigo())
  return codigos.get(chave)
}

export function trocaDeCodigo(instante) {
  const minuto = minutoDe(instante)
  return {
    trocaEm: new Date((minuto + 1) * MINUTO).toISOString(),
    validoAte: new Date((minuto + 2) * MINUTO).toISOString()
  }
}

function normalizarCodigo(codigo) {
  return codigo.replace(/\s+/g, '').toUpperCase()
}

// Leitura de R7: minúscula e espaço são aceitos; o código vale para o
// minuto atual e o anterior (R5) e é do encontro (R6).
function codigoEhValido(encontroId, codigo, instante) {
  const normalizado = normalizarCodigo(codigo)
  if (
    normalizado.length !== 6 ||
    [...normalizado].some(c => !ALFABETO.includes(c))
  ) {
    return false
  }
  // Só códigos já emitidos valem: o minuto anterior sem GET não tem código.
  const minuto = minutoDe(instante)
  const atual = codigos.get(`${encontroId}:${minuto}`)
  const anterior = codigos.get(`${encontroId}:${minuto - 1}`)
  return normalizado === atual || normalizado === anterior
}

export function resetPresencas() {
  codigos = new Map()
  presencas = []
}

function hex8() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)), b =>
    b.toString(16).padStart(2, '0')
  ).join('')
}

export function registrarPresenca(encontrado, participanteId, codigo) {
  const { atividade, encontro } = encontrado
  const existente = presencas.find(
    p => p.encontroId === encontro.id && p.participanteId === participanteId
  )
  if (existente) {
    return { presenca: { ...existente }, jaExistia: true }
  }
  const inscricoes = listarInscricoes(participanteId, 'participante', {
    atividadeId: atividade.id
  })
  if (!inscricoes.some(i => i.status === 'confirmada')) {
    return { erro: 'NAO_INSCRITO' }
  }
  const instante = agora()
  if (!dentroDaJanela(instante, encontro.inicio)) {
    return { erro: 'FORA_DA_JANELA' }
  }
  if (!codigoEhValido(encontro.id, codigo, instante)) {
    return { erro: 'CODIGO_INVALIDO' }
  }
  const presenca = {
    id: `pre_${hex8()}`,
    encontroId: encontro.id,
    participanteId,
    origem: 'qr',
    lidoEm: instante,
    registradaEm: instante,
    justificativa: null
  }
  presencas.push(presenca)
  return { presenca, jaExistia: false }
}
