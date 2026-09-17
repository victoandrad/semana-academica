// Único lugar que fala com a API. Recebe o fetch por parâmetro para o teste
// trocar por um falso (test/api-falsa.js). Rotas e campos: contrato-api.md.

export function criarApi({ fetch, base = 'http://localhost:3000', usuario }) {
  async function chamar(metodo, rota, corpo) {
    const cabecalhos = { 'X-Usuario': usuario() }
    if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'
    const res = await fetch(base + rota, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    })
    const texto = await res.text()
    const dados = texto ? JSON.parse(texto) : null
    if (!res.ok) {
      // A tela mostra exatamente o que a API devolveu: { erro, mensagem }.
      throw new ErroDaApi(res.status, dados)
    }
    return { status: res.status, dados }
  }
  return {
    get: (rota) => chamar('GET', rota),
    post: (rota, corpo) => chamar('POST', rota, corpo),
    patch: (rota, corpo) => chamar('PATCH', rota, corpo),
    delete: (rota) => chamar('DELETE', rota)
  }
}

export class ErroDaApi extends Error {
  constructor(status, corpo) {
    super(corpo?.mensagem ?? `HTTP ${status}`)
    this.status = status
    this.erro = corpo?.erro ?? 'DESCONHECIDO'
    this.mensagem = corpo?.mensagem ?? ''
  }
}

// Desenha um erro da API no container, sem traduzir nem esconder o código.
export function mostrarErro(container, erro) {
  const div = document.createElement('div')
  div.className = 'erro'
  const codigo = document.createElement('code')
  codigo.textContent = erro.erro ?? 'ERRO'
  div.append(codigo, ` — ${erro.mensagem ?? erro.message}`)
  container.prepend(div)
  return div
}
