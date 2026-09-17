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

function resposta(status, corpo) {
  const texto = corpo === null || corpo === undefined ? '' : JSON.stringify(corpo)
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => texto,
    json: async () => JSON.parse(texto)
  }
}
