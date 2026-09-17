import { randomInt } from 'node:crypto'
import { listarAtividades } from './atividades.js'

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const MINUTO = 60_000

// Códigos emitidos: `${encontroId}:${minuto}` → código. O código é do encontro
// e do minuto, sorteado na primeira emissão — não dá para calcular de fora da sala.
let codigos = new Map()

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

export function resetPresencas() {
  codigos = new Map()
}
