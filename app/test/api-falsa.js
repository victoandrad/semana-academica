// API falsa: responde rotas do contrato com dados fixos e registra o que recebeu.
// Nunca calcula regra — o valor esperado é escrito na mão pelo teste.

export function apiFalsa() {
  const respostas = new Map()
  const chamadas = []
  const falsa = {
    chamadas,
    // Quando true, toda chamada rejeita, como o fetch faz sem rede.
    offline: false,
    // falsa.responde('POST /encontros/enc_1/presencas', 422, { erro: 'FORA_DA_JANELA', mensagem: '…' })
    responde(chave, status, corpo) {
      respostas.set(chave, { status, corpo })
      return falsa
    },
    async fetch(url, opcoes = {}) {
      const metodo = (opcoes.method ?? 'GET').toUpperCase()
      const u = new URL(url)
      const rota = u.pathname + u.search
      const corpo = opcoes.body ? JSON.parse(opcoes.body) : undefined
      chamadas.push({ metodo, rota, cabecalhos: opcoes.headers ?? {}, corpo })
      if (falsa.offline) throw new TypeError('Failed to fetch')
      const r = respostas.get(`${metodo} ${rota}`)
      if (!r) return resposta(404, { erro: 'NAO_ENCONTRADO', mensagem: `API falsa não tem ${metodo} ${rota}` })
      return resposta(r.status, r.corpo)
    }
  }
  return falsa
}

// Dados fixos, escritos na mão a partir do contrato: M1 Atividade e M3 CodigoDoEncontro.
export const atividadesM1 = [
  {
    id: 'atv_1a2b3c4d',
    titulo: 'Flutter do zero',
    tipo: 'minicurso',
    salaId: 'lab-3',
    vagas: 20,
    encontros: [
      { id: 'enc_5e6f7a8b', inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
      { id: 'enc_9c0d1e2f', inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
    ],
    cargaHorariaMinutos: 360,
    situacao: 'prevista',
    ocupadas: 0,
    vagasRestantes: 20,
    emEspera: 0
  }
]

export const codigoDoEncontroM3 = {
  encontroId: 'enc_5e6f7a8b',
  codigo: 'K7M2QX',
  trocaEm: '2026-10-19T18:46:00-03:00',
  validoAte: '2026-10-19T18:47:00-03:00'
}

// Dados fixos das telas de grade do M1, escritos à mão pelo contrato (§4, §5).
export const salasM1 = [
  { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
  { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
  { id: 'sala-102', nome: 'Sala 102', capacidade: 40 },
  { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }
]

export const aberturaM1 = {
  id: 'atv_a1b2c3d4',
  titulo: 'Abertura',
  tipo: 'palestra',
  salaId: 'auditorio',
  vagas: 200,
  encontros: [
    { id: 'enc_e1f2a3b4', inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' }
  ],
  cargaHorariaMinutos: 60,
  situacao: 'prevista',
  ocupadas: 0,
  vagasRestantes: 200,
  emEspera: 0
}

export const goM1 = {
  id: 'atv_b2c3d4e5',
  titulo: 'Go: primeiros passos',
  tipo: 'minicurso',
  salaId: 'sala-101',
  vagas: 40,
  encontros: [
    { id: 'enc_f2a3b4c5', inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T17:00:00-03:00' },
    { id: 'enc_a3b4c5d6', inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T17:00:00-03:00' }
  ],
  cargaHorariaMinutos: 360,
  situacao: 'prevista',
  ocupadas: 12,
  vagasRestantes: 28,
  emEspera: 3
}

export const flutterM1 = {
  id: 'atv_c3d4e5f6',
  titulo: 'Flutter do zero',
  tipo: 'minicurso',
  salaId: 'lab-3',
  vagas: 20,
  encontros: [
    { id: 'enc_b4c5d6e7', inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' },
    { id: 'enc_c5d6e7f8', inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T22:00:00-03:00' }
  ],
  cargaHorariaMinutos: 360,
  situacao: 'prevista',
  ocupadas: 0,
  vagasRestantes: 20,
  emEspera: 0
}

export const encerramentoM1 = {
  id: 'atv_d4e5f6a7',
  titulo: 'Encerramento',
  tipo: 'palestra',
  salaId: 'auditorio',
  vagas: 200,
  encontros: [
    { id: 'enc_d6e7f8a9', inicio: '2026-10-23T19:00:00-03:00', fim: '2026-10-23T20:30:00-03:00' }
  ],
  cargaHorariaMinutos: 90,
  situacao: 'cancelada',
  ocupadas: 0,
  vagasRestantes: 200,
  emEspera: 0
}

// Ordem da RN-115: por início do 1º encontro (Go 14h, Abertura 19h, Flutter, Encerramento).
export const gradeM1 = [goM1, aberturaM1, flutterM1, encerramentoM1]

// Falsa pronta para as telas de M1: salas, listas por dia/tipo e cada atividade.
export function apiFalsaComGrade() {
  const falsa = apiFalsa()
  falsa.responde('GET /salas', 200, salasM1)
  falsa.responde('GET /atividades', 200, gradeM1)
  falsa.responde('GET /atividades?dia=2026-10-19', 200, [goM1, aberturaM1])
  falsa.responde('GET /atividades?dia=2026-10-19&tipo=palestra', 200, [aberturaM1])
  falsa.responde('GET /atividades?dia=2026-10-19&tipo=minicurso', 200, [goM1])
  falsa.responde('GET /atividades?dia=2026-10-20', 200, [flutterM1])
  falsa.responde('GET /atividades?dia=2026-10-22', 200, [])
  falsa.responde('GET /atividades?dia=2026-10-23', 200, [encerramentoM1])
  for (const a of gradeM1) falsa.responde(`GET /atividades/${a.id}`, 200, a)
  return falsa
}

// Falsa já pronta com a lista de atividades do contrato, usada nas telas de M1 e M3.
export function apiFalsaComAtividades() {
  return apiFalsa().responde('GET /atividades', 200, atividadesM1)
}

// Dados fixos das inscrições do M2, escritos à mão pelo contrato (§5 Inscricao).
// Todas de p-carla; os atividadeId referenciam a grade de M1 (gradeM1).
export const inscricoesM2 = [
  {
    id: 'ins_1a2b3c4d',
    atividadeId: 'atv_b2c3d4e5',
    participanteId: 'p-carla',
    status: 'confirmada',
    posicaoNaEspera: null,
    convocadaAte: null,
    criadaEm: '2026-10-13T09:00:00-03:00'
  },
  {
    id: 'ins_2b3c4d5e',
    atividadeId: 'atv_c3d4e5f6',
    participanteId: 'p-carla',
    status: 'em_espera',
    posicaoNaEspera: 2,
    convocadaAte: null,
    criadaEm: '2026-10-13T09:05:00-03:00'
  },
  {
    id: 'ins_3c4d5e6f',
    atividadeId: 'atv_a1b2c3d4',
    participanteId: 'p-carla',
    status: 'convocada',
    posicaoNaEspera: null,
    convocadaAte: '2026-10-13T12:30:00-03:00',
    criadaEm: '2026-10-13T09:10:00-03:00'
  },
  {
    id: 'ins_4d5e6f7a',
    atividadeId: 'atv_d4e5f6a7',
    participanteId: 'p-carla',
    status: 'cancelada',
    posicaoNaEspera: null,
    convocadaAte: null,
    criadaEm: '2026-10-13T09:15:00-03:00'
  },
  {
    id: 'ins_5e6f7a8b',
    atividadeId: 'atv_b2c3d4e5',
    participanteId: 'p-carla',
    status: 'expirada',
    posicaoNaEspera: null,
    convocadaAte: null,
    criadaEm: '2026-10-13T09:20:00-03:00'
  }
]

function inscricaoComStatus(inscricao, status) {
  return {
    ...inscricao,
    status,
    posicaoNaEspera: status === 'em_espera' ? inscricao.posicaoNaEspera : null,
    convocadaAte: status === 'convocada' ? inscricao.convocadaAte : null
  }
}

// Falsa pronta para as telas de M2: lista de inscrições, por atividade e as
// escritas de confirmação/cancelamento devolvendo a inscrição transicionada.
export function apiFalsaComInscricoes() {
  const falsa = apiFalsa()
  falsa.responde('GET /inscricoes', 200, inscricoesM2)
  falsa.responde('GET /atividades', 200, gradeM1)
  for (const a of gradeM1) falsa.responde(`GET /atividades/${a.id}`, 200, a)
  falsa.responde(
    'GET /inscricoes?atividadeId=atv_b2c3d4e5',
    200,
    inscricoesM2.filter((i) => i.atividadeId === 'atv_b2c3d4e5')
  )
  falsa.responde(
    'GET /inscricoes?atividadeId=atv_c3d4e5f6',
    200,
    inscricoesM2.filter((i) => i.atividadeId === 'atv_c3d4e5f6')
  )
  falsa.responde(
    'POST /inscricoes/ins_3c4d5e6f/confirmacao',
    200,
    inscricaoComStatus(inscricoesM2[2], 'confirmada')
  )
  falsa.responde(
    'POST /inscricoes/ins_2b3c4d5e/cancelamento',
    200,
    inscricaoComStatus(inscricoesM2[1], 'cancelada')
  )
  return falsa
}

// A grade com as rotas de M2 que a tela de detalhe da atividade consulta: por
// padrão o participante ainda não tem inscrição (lista vazia naquela atividade).
export function apiFalsaComGradeEInscricoes() {
  const falsa = apiFalsaComGrade()
  falsa.responde('GET /inscricoes?atividadeId=atv_a1b2c3d4', 200, [])
  falsa.responde('GET /inscricoes?atividadeId=atv_b2c3d4e5', 200, [])
  falsa.responde('GET /inscricoes?atividadeId=atv_c3d4e5f6', 200, [])
  falsa.responde('GET /inscricoes?atividadeId=atv_d4e5f6a7', 200, [])
  return falsa
}

function resposta(status, corpo) {
  const texto = corpo === null || corpo === undefined ? '' : JSON.stringify(corpo)
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => texto,
    json: async () => JSON.parse(texto)
  }
}
