---
name: regra-de-tempo
description: Implementa e testa uma regra que depende do relógio — janela, prazo, borda, troca por minuto, tolerância — usando só o relógio do modo de teste da API. Use quando a regra da spec tiver "antes de", "depois de", "até", "a cada", "expira", "fecha em", ou quando um teste precisar andar o tempo.
---

# Tempo é dado de entrada, não hora do sistema

Toda regra de tempo deste projeto é verificada pelo juiz com o relógio parado do modo
de teste (`contrato-api.md`, seção 3). Se o seu código olha `Date.now()` ou
`new Date()`, o juiz não consegue provar a regra — e o seu teste também não.

Uma regra de tempo tem sempre quatro partes. Encontre as quatro na spec antes de
escrever qualquer coisa; se faltar uma, pare e pergunte ao dono do módulo:

1. **A âncora** — de que instante conta (`inicio` do encontro, `fim`, o momento do
   cancelamento, o `lidoEm` enviado).
2. **A distância** — quanto (15 min, 30 min, 2 h, 1 minuto alinhado).
3. **A borda** — o próprio instante-limite entra ou não. No documento do cliente:
   "até X" aceita X; "fecha em X" recusa em X; "começou" e "acabou" são inclusivos.
4. **O relógio** — qual instante é comparado: o do envio (`agora()`) ou um instante
   informado no corpo (`lidoEm`).

## No código

- A hora vem só de `agora()` em `api/src/relogio.js`. Nunca importe `Date` para
  descobrir "agora" — só para fazer conta com instantes que já vieram como dado.
- Compare instantes em milissegundos (`Date.parse`), nunca strings: o contrato deixa
  a API responder em qualquer fuso e o juiz compara o instante.
- Escreva a regra como uma função pura que recebe os instantes e devolve verdadeiro
  ou falso — sem `req`, sem banco:

  ```js
  // janela de presença: [inicio − 15 min, inicio + 30 min], bordas incluídas
  export function dentroDaJanela(instante, inicio) {
    const t = Date.parse(instante), i = Date.parse(inicio)
    return t >= i - 15 * 60_000 && t <= i + 30 * 60_000
  }
  ```

  A rota chama a função com `agora()` ou com o `lidoEm`; a função não sabe qual.
- Janela alinhada ao relógio (troca por minuto): o índice é `Math.floor(t / 60_000)`;
  o próximo instante de troca é `(indice + 1) * 60_000`. Não some 60 s ao momento da
  primeira chamada — isso desalinha do relógio.
- Cascata que acontece "mesmo sem ninguém acessar" (convocação que expira e convoca o
  próximo): recalcule ao ler, a partir dos instantes gravados. Não use `setTimeout`.

## No teste

Cada regra de tempo tem **no mínimo dois testes**: um em cada lado da borda, com
1 segundo de diferença. Um só teste no meio da janela não prova a borda.

```js
it('aceita presença em inicio − 15 min (borda da abertura)', async () => {
  await relogio('2026-10-19T18:45:00-03:00')
  …  assert.equal(res.status, 201)
})
it('recusa presença em inicio − 15 min − 1 s', async () => {
  await relogio('2026-10-19T18:44:59-03:00')
  …  assert.equal(res.status, 422); assert.equal(body.erro, 'FORA_DA_JANELA')
})
```

- O teste começa com `POST /_teste/reset` e põe o relógio com `PUT /_teste/relogio`.
  O reset deixa o relógio em `2026-10-13T09:00:00-03:00`; o evento é de 19 a 23/10.
- Os instantes do teste são escritos na mão, com fuso `-03:00`, lidos da spec — nunca
  calculados com a mesma fórmula do código (teste tautológico).
- Quando a regra compara um instante do corpo (`lidoEm`) com o do envio (`agora()`),
  o teste controla os dois: `lidoEm` no corpo, `agora()` pelo relógio de teste.
- Fuso é pegadinha: `2026-10-20T21:00:00-03:00` é dia 20 em Brasília e dia 21 em UTC.
  Se a regra fala em "dia", teste um caso depois das 21:00.

## Antes de dar por pronto

- [ ] Nenhum `Date.now()` / `new Date()` sem argumento em `api/src/`.
- [ ] Cada borda tem um teste de cada lado.
- [ ] O teste diz o instante em ISO com fuso, copiado da spec.
- [ ] A função da regra é pura e o nome dela é a regra (`dentroDaJanela`,
      `sincronizacaoTardia`, `codigoDoMinuto`).
