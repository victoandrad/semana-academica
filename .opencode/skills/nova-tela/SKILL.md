---
name: nova-tela
description: Cria uma tela da interface web em app/ a partir da spec de um módulo — HTML + JS sem framework, consumindo a API só pelo contrato-api.md, com teste que troca a API por uma falsa. Use quando pedirem "cria a tela de X", "faz a interface do módulo", "tela da organização", "tela do participante".
---

# Uma tela por vez, a partir da spec

A tela é a spec do módulo desenhada. Ela não inventa regra: o que a API recusa, a
tela mostra; o que a API aceita, a tela mostra. Se você se pegar decidindo um prazo,
um limite ou uma ordem na tela, pare — isso mora na spec e na API.

Você precisa de duas coisas antes de começar:

- `specs/Mx-*.md` do módulo — a lista de regras e os critérios de aceite;
- `contrato-api.md` — a rota, os campos e os códigos de erro que a tela vai consumir.

Sem a spec, pare. Sem o contrato, pare. Não crie rota nem campo que não esteja lá.

## Onde mora

```
app/
  index.html               a casca: <nav> com as telas e um <main id="tela">
  src/api.js               o único lugar que chama fetch — recebe a função fetch por
                           parâmetro, para o teste trocar por uma falsa
  src/telas/<nome>.js      uma tela = um módulo que exporta render(container, deps)
  src/telas/<nome>.test.js o teste da tela, com a API falsa
  test/api-falsa.js        a API falsa compartilhada: responde as rotas do contrato
                           com dados fixos e registra o que recebeu
```

Uma tela é uma função `render(container, { api, agora })`:

- `container` é o elemento onde ela desenha;
- `api` é o cliente de `src/api.js`, já com o `fetch` (real ou falso) e o `X-Usuario`;
- `agora` é uma função que devolve a hora — a tela nunca chama `Date.now()` direto,
  porque a contagem regressiva e a troca do QR precisam ser testáveis sem esperar.

## O ciclo

1. Leia a spec e liste, para a tela pedida, **quais regras aparecem nela**: o que ela
   mostra, o que ela envia, e cada erro do contrato que ela precisa exibir. Mostre a
   lista ao usuário antes de escrever.
2. Escreva a API falsa em `test/api-falsa.js` para as rotas que a tela usa — só as
   que o contrato tem, com o corpo e o status que o contrato diz. Erro é sempre
   `{ erro, mensagem }`.
3. Um teste por comportamento, em `src/telas/<nome>.test.js`, com `node --test`:
   monta um DOM mínimo, chama `render`, dispara a ação e confere o que apareceu.
   O nome do teste é a regra em português: `it('mostra FORA_DA_JANELA que a API devolveu')`.
4. Rode. Tem que falhar. Só então escreva a tela.
5. Rode `npm test` em `app/`. Verde? Próxima tela.

## O que toda tela faz

- **Mostra o erro que a API devolveu**, com o código e a mensagem — não traduz para
  um erro genérico, não esconde. O enunciado cobra isso literalmente.
- **Não decide regra de negócio.** Botão desabilitado porque "já passou o prazo" é a
  tela decidindo. A tela manda, a API recusa, a tela mostra a recusa.
- **Usa só rotas e campos do contrato.** Nome de campo é o do contrato, inclusive na
  API falsa.
- **Identifica o usuário** pelo cabeçalho `X-Usuario`, escolhido num seletor na casca
  (os ids estão na seção 4 do contrato). Não existe login.
- **Recebe a hora de fora** (`agora`), nunca do relógio do navegador direto.

## O que a API falsa faz

- Responde as rotas do contrato com dados fixos, escritos na mão a partir do contrato
  e da spec — não calcula nada, não tem regra.
- Registra cada chamada (`método`, `rota`, `cabeçalhos`, `corpo`) para o teste conferir
  **o que a tela enviou**, não só o que ela mostrou.
- Pode ser programada para responder um erro: `apiFalsa.responde('POST /x', 422, { erro: 'FORA_DA_JANELA', mensagem: '…' })`.
- Nunca é usada fora dos testes. O `index.html` usa o `fetch` real contra `http://localhost:3000`.

## Offline (M3)

Quando a tela precisa funcionar sem rede, a fila fica em `localStorage` e o envio é
uma função separada, chamada quando a rede volta (`online` do `window`) e também por
um botão "enviar agora". O teste simula: `fetch` falso que rejeita → item na fila →
`fetch` falso que aceita → fila vazia e chamada registrada com o `lidoEm` original.

## Três telas que não valem nada

- **Que decide** — tem `if (agora > fim)` para esconder um botão. A regra é da API.
- **Que engole erro** — `catch (e) { mostrar('Erro') }`. O usuário precisa ver
  `FORA_DA_JANELA` e a mensagem.
- **Que testa o DOM e não o comportamento** — confere que existe um `<button>` e não
  que clicar nele mandou o `POST` certo com o corpo certo.

## Fechamento

Terminada a tela, rode `npm test` em `app/` e relate o número real da saída. Depois
abra a API real (`MODO_TESTE=1 npm start` em `api/`) e a tela (`npm run dev` em
`app/`) e descreva, em uma linha por regra, o que você viu acontecer.
