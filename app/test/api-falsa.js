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

// Falsa já pronta com a lista de atividades do contrato, usada nas telas de M1 e M3.
export function apiFalsaComAtividades() {
  return apiFalsa().responde('GET /atividades', 200, atividadesM1)
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
