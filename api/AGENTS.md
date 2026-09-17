# AGENTS.md — api/

Regras para quem trabalha dentro de `api/`. As da raiz continuam valendo; estas são as que só fazem sentido aqui.

## Como roda

- `npm start` sobe `src/index.js` na porta de `PORT` (padrão 3000). O juiz roda com `MODO_TESTE=1` e `PORT=3000`. — `package.json:7`, `contrato-api.md:34`
- `npm test` roda `node --test test/*.test.js`. Sem framework, sem mock, sem dependência de teste. — `package.json:8`, `.opencode/skills/tdd/SKILL.md:21`
- `createApp()` é exportado de `src/index.js` e o teste sobe a própria app numa porta livre com `node:http`; o servidor só escuta quando o arquivo é o principal. — `src/index.js:20`, `src/index.js:54-61`, `test/salas.test.js:6-18`

## Estrutura

- Um arquivo por recurso em `src/` (`salas.js`, `usuarios.js`, `relogio.js`, …): exporta as funções de negócio e uma `resetX()` que o `POST /_teste/reset` chama. — `src/index.js:33-37`
- Um arquivo de teste por fatia em `test/`, com o `describe` nomeado pela fatia (`F3 — dados iniciais e GET /salas`) e cada `it` sendo a regra em português. — `test/salas.test.js:21`
- Todo teste começa com `POST /_teste/reset` e só avança o relógio por `PUT /_teste/relogio`. Nunca `Date.now()` no código de negócio: usa `agora()` de `src/relogio.js`, que devolve o relógio congelado em `MODO_TESTE` e o real fora dele. — `contrato-api.md:51`, `src/relogio.js:17-21`

## Contrato

- Erro é sempre `{ erro, mensagem }`; `erro` em SCREAMING_SNAKE, `mensagem` livre. Os códigos estão em `contrato-api.md` seção 6 — nenhum código novo. — `contrato-api.md:15`, `src/index.js:10-17`
- Ordem das verificações em toda rota: identificação (401) → perfil (403 `SOMENTE_…`) → existência (404) → corpo (422 `DADOS_INVALIDOS`) → regras do recurso, na ordem que a spec do módulo define. — `contrato-api.md:17`
- Identificadores gerados: prefixo + 8 hexadecimais minúsculos (`atv_`, `enc_`, `ins_`, `pre_`). — `contrato-api.md:14`
- Datas em ISO 8601 com fuso; o juiz compara o instante, não o texto. Compare com `Date.parse`, nunca com string. — `contrato-api.md:13`
- Rota fora do `contrato-api.md` não existe, nem para costura de teste. Teste que precisa de dado de outro módulo cria pelo `POST` do contrato. — `AGENTS.md` da raiz ("Regras que nasceram de erro", 2026-09-17)

## Fronteiras entre módulos

- M3 (presença) lê atividade/encontro de M1 e o status de inscrição de M2 pelas funções exportadas dos módulos deles, nunca acessando o banco deles direto. Se a função não existe ainda, o dono do módulo cria; o agente não improvisa. — `specs/M3-presenca.md` §7, `EQUIPE.md`
- Spec de outro módulo é contrato: se o código do seu módulo não bate com a spec do colega, pare e pergunte — não altere a spec dele. — `AGENTS.md` da raiz ("Método")

## Regras que nasceram de erro

- 2026-09-17: agente criou health check e rota temporária de teste fora do contrato. Regra: nenhuma rota fora do contrato, nem em `MODO_TESTE`. — commit `2d8bc2b`
- 2026-09-17: na F1 do M3, o agente derivou o código de presença só do minuto do relógio — todos os encontros tinham o mesmo código no mesmo minuto, e qualquer um podia calcular sem estar na sala. Regra: código de presença é sorteado por (encontro, minuto) e guardado; nunca é função só do tempo. — `src/presencas.js`, teste "dois encontros no mesmo minuto têm códigos diferentes"
