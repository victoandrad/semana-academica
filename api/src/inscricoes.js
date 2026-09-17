import { buscarAtividade } from './atividades.js'
import { agora } from './relogio.js'

let inscricoes = []

function hex8() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)), b =>
    b.toString(16).padStart(2, '0')
  ).join('')
}

export function inscrever(atividadeId, participanteId) {
  processarEsperaDa(atividadeId)
  const atividade = buscarAtividade(atividadeId)
  if (!atividade) {
    return { erro: 'NAO_ENCONTRADO' }
  }
  if (atividade.cancelada) {
    return { erro: 'ATIVIDADE_CANCELADA' }
  }
  const FECHAM_ANTES = 30 * 60 * 1000
  const inicioPrimeiroEncontro = Date.parse(atividade.encontros[0].inicio)
  if (Date.parse(agora()) >= inicioPrimeiroEncontro - FECHAM_ANTES) {
    return { erro: 'INSCRICOES_ENCERRADAS' }
  }
  const ativa = ['confirmada', 'em_espera', 'convocada']
  const jaInscrito = inscricoes.some(
    i =>
      i.atividadeId === atividadeId &&
      i.participanteId === participanteId &&
      ativa.includes(i.status)
  )
  if (jaInscrito) {
    return { erro: 'JA_INSCRITO' }
  }
  const conflita = inscricoes.some(inscricao => {
    if (inscricao.participanteId !== participanteId) {
      return false
    }
    if (!['confirmada', 'convocada'].includes(inscricao.status)) {
      return false
    }
    const outra = buscarAtividade(inscricao.atividadeId)
    return (
      outra &&
      outra.encontros.some(encontroOutro =>
        atividade.encontros.some(
          encontroNovo =>
            Date.parse(encontroNovo.inicio) < Date.parse(encontroOutro.fim) &&
            Date.parse(encontroOutro.inicio) < Date.parse(encontroNovo.fim)
        )
      )
    )
  })
  if (conflita) {
    return { erro: 'CONFLITO_DE_HORARIO' }
  }
  const ocupadas = inscricoes.filter(
    i => i.atividadeId === atividadeId && ['confirmada', 'convocada'].includes(i.status)
  ).length
  const temVaga = ocupadas < atividade.vagas
  if (temVaga && atividade.tipo === 'minicurso') {
    const meusMinicursosOcupandoVaga = inscricoes.filter(
      i =>
        i.participanteId === participanteId &&
        ['confirmada', 'convocada'].includes(i.status) &&
        buscarAtividade(i.atividadeId)?.tipo === 'minicurso'
    ).length
    if (meusMinicursosOcupandoVaga >= 3) {
      return { erro: 'LIMITE_DE_MINICURSOS' }
    }
  }
  const naEspera = emEsperaDa(atividadeId).length
  const inscricao = {
    id: `ins_${hex8()}`,
    atividadeId,
    participanteId,
    status: temVaga ? 'confirmada' : 'em_espera',
    posicaoNaEspera: temVaga ? null : naEspera + 1,
    convocadaAte: null,
    criadaEm: agora()
  }
  inscricoes.push(inscricao)
  return formatar(inscricao)
}

export function listarInscricoes(xUsuario, papel, filtros = {}) {
  const todasAsAtividades = new Set(inscricoes.map(i => i.atividadeId))
  for (const atividadeId of todasAsAtividades) {
    processarEsperaDa(atividadeId)
  }
  let lista = inscricoes
  if (papel !== 'organizacao') {
    lista = lista.filter(i => i.participanteId === xUsuario)
  }
  if (filtros.atividadeId) {
    lista = lista.filter(i => i.atividadeId === filtros.atividadeId)
  }
  return lista.map(formatar)
}

export function buscarInscricao(id) {
  const inscricao = inscricoes.find(i => i.id === id)
  if (!inscricao) {
    return null
  }
  processarEsperaDa(inscricao.atividadeId)
  return formatar(inscricao)
}

export function cancelarInscricao(id, xUsuario) {
  const inscricao = inscricoes.find(i => i.id === id)
  if (!inscricao || inscricao.participanteId !== xUsuario) {
    return { erro: 'NAO_ENCONTRADO' }
  }
  const atividade = buscarAtividade(inscricao.atividadeId)
  if (atividade && Date.parse(agora()) >= Date.parse(atividade.encontros[0].inicio)) {
    return { erro: 'ATIVIDADE_JA_INICIADA' }
  }
  if (inscricao.status === 'cancelada' || inscricao.status === 'expirada') {
    return { erro: 'INSCRICAO_INATIVA' }
  }
  if (inscricao.status === 'em_espera') {
    inscricao.status = 'cancelada'
    inscricao.posicaoNaEspera = null
    reindexarEsperaDa(inscricao.atividadeId)
    return formatar(inscricao)
  }
  if (inscricao.status === 'confirmada' || inscricao.status === 'convocada') {
    inscricao.status = 'cancelada'
    inscricao.posicaoNaEspera = null
    inscricao.convocadaAte = null
    processarEsperaDa(inscricao.atividadeId)
    return formatar(inscricao)
  }
  return null
}

export function confirmarInscricao(id, xUsuario) {
  const inscricao = inscricoes.find(i => i.id === id)
  if (!inscricao || inscricao.participanteId !== xUsuario) {
    return { erro: 'NAO_ENCONTRADO' }
  }
  if (inscricao.status !== 'convocada') {
    return { erro: 'SEM_CONVOCACAO' }
  }
  if (Date.parse(agora()) > Date.parse(inscricao.convocadaAte)) {
    return { erro: 'CONVOCACAO_EXPIRADA' }
  }
  const atividade = buscarAtividade(inscricao.atividadeId)
  const conflita = inscricoes.some(ins => {
    if (ins.id === id || ins.participanteId !== xUsuario) {
      return false
    }
    if (!['confirmada', 'convocada'].includes(ins.status)) {
      return false
    }
    const outra = buscarAtividade(ins.atividadeId)
    return (
      outra &&
      outra.encontros.some(encontroOutro =>
        atividade.encontros.some(
          encontroNovo =>
            Date.parse(encontroNovo.inicio) < Date.parse(encontroOutro.fim) &&
            Date.parse(encontroOutro.inicio) < Date.parse(encontroNovo.fim)
        )
      )
    )
  })
  if (conflita) {
    return { erro: 'CONFLITO_DE_HORARIO' }
  }
  if (atividade.tipo === 'minicurso') {
    const meusMinicursosOcupandoVaga = inscricoes.filter(
      i =>
        i.id !== id &&
        i.participanteId === xUsuario &&
        ['confirmada', 'convocada'].includes(i.status) &&
        buscarAtividade(i.atividadeId)?.tipo === 'minicurso'
    ).length
    if (meusMinicursosOcupandoVaga >= 3) {
      return { erro: 'LIMITE_DE_MINICURSOS' }
    }
  }
  inscricao.status = 'confirmada'
  inscricao.convocadaAte = null
  inscricao.posicaoNaEspera = null
  return formatar(inscricao)
}

export function resetInscricoes() {
  inscricoes = []
}

export function contadoresDe(atividadeId) {
  const daAtividade = inscricoes.filter(i => i.atividadeId === atividadeId)
  return {
    ocupadas: daAtividade.filter(i =>
      ['confirmada', 'convocada'].includes(i.status)
    ).length,
    emEspera: daAtividade.filter(i => i.status === 'em_espera').length
  }
}

export function cancelarInscricoesDaAtividade(atividadeId) {
  for (const inscricao of inscricoes) {
    if (
      inscricao.atividadeId === atividadeId &&
      ['confirmada', 'em_espera', 'convocada'].includes(inscricao.status)
    ) {
      inscricao.status = 'cancelada'
      inscricao.posicaoNaEspera = null
      inscricao.convocadaAte = null
    }
  }
}

function emEsperaDa(atividadeId) {
  return inscricoes
    .map((inscricao, indice) => ({ inscricao, indice }))
    .filter(
      x =>
        x.inscricao.atividadeId === atividadeId &&
        x.inscricao.status === 'em_espera'
    )
    .sort(
      (a, b) =>
        a.inscricao.posicaoNaEspera - b.inscricao.posicaoNaEspera || a.indice - b.indice
    )
    .map(x => x.inscricao)
}

function reindexarEsperaDa(atividadeId) {
  emEsperaDa(atividadeId).forEach((inscricao, i) => {
    inscricao.posicaoNaEspera = i + 1
  })
}

const FECHAM_ANTES = 30 * 60 * 1000
const PRAZO_CONVOCACAO = 2 * 60 * 60 * 1000

function emHorarioDeBrasilia(instanteMs) {
  const d = new Date(instanteMs - 3 * 3600 * 1000)
  const pad = n => String(n).padStart(2, '0')
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}-03:00`
  )
}

function convocadaAtePara(atividade, instanteBase) {
  const fechamento = Date.parse(atividade.encontros[0].inicio) - FECHAM_ANTES
  return emHorarioDeBrasilia(Math.min(instanteBase + PRAZO_CONVOCACAO, fechamento))
}

export function processarEsperaDa(atividadeId) {
  const atividade = buscarAtividade(atividadeId)
  if (!atividade || atividade.cancelada) {
    return
  }
  let baseDaProxima = null
  let mudou = true
  while (mudou) {
    mudou = false
    const daAtividade = inscricoes.filter(i => i.atividadeId === atividadeId)
    const vencida = daAtividade.find(
      i =>
        i.status === 'convocada' &&
        Date.parse(i.convocadaAte) < Date.parse(agora())
    )
    if (vencida) {
      baseDaProxima = Date.parse(vencida.convocadaAte)
      vencida.status = 'expirada'
      vencida.convocadaAte = null
      vencida.posicaoNaEspera = null
      mudou = true
      continue
    }
    const ocupadas = daAtividade.filter(
      i => ['confirmada', 'convocada'].includes(i.status)
    ).length
    if (ocupadas < atividade.vagas) {
      const proximo = daAtividade
        .filter(i => i.status === 'em_espera')
        .sort((a, b) => a.posicaoNaEspera - b.posicaoNaEspera)[0]
      if (proximo) {
        const base = baseDaProxima ?? Date.parse(agora())
        proximo.status = 'convocada'
        proximo.posicaoNaEspera = null
        proximo.convocadaAte = convocadaAtePara(atividade, base)
        baseDaProxima = null
        mudou = true
        continue
      }
    }
  }
  reindexarEsperaDa(atividadeId)
}

function formatar(inscricao) {
  return {
    id: inscricao.id,
    atividadeId: inscricao.atividadeId,
    participanteId: inscricao.participanteId,
    status: inscricao.status,
    posicaoNaEspera: inscricao.posicaoNaEspera,
    convocadaAte: inscricao.convocadaAte,
    criadaEm: inscricao.criadaEm
  }
}