# TDD para fatia 3: GET /salas e dados iniciais

| | |
|---|---|
| Sessão | `ses_f505e7e76ffeThT7XLllt15v7s` |
| Pasta | C:/semana-academica |
| Período | 17/09 10:49 → 17/09 11:01 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 27 |
| Tokens de entrada / saída | 37.803 / 19.259 |
| Skills | tdd |
| Subagentes | — |
| Execuções de teste | 3 vermelhas, 6 verdes |
| TDD | 1 ciclo(s) vermelho → verde · 1 teste(s) que já nasceram verdes · 1 vez(es) teste e código juntos |
| Arquivos editados | 3 de teste, 7 de código, 0 de entrevista, 1 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 10:49` **prompt** — Use a skill tdd. Implemente só a fatia 3 de ../specs/M0-infraestrutura.md: os dados iniciais e GET /salas. Um teste por vez: escreva o teste, rode e mostre ele falhando, e só então o código mínimo que faz passar. As 4 salas e os 10 usuários são os da seção 4 do contrato-api.md, com os ids exatos. Não implemente nada da fatia 4 em diante. Quando GET /salas estiver verde, faça mais duas coisas, nes…
- `17/09 10:51` carrega a skill **tdd**
- `17/09 10:54` roda `npm test` → verde (5 passaram)
- `17/09 10:54` edita teste `api/test/salas.test.js`
- `17/09 10:54` roda `npx node --test test/salas.test.js` → **vermelho** (0 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 10:54` roda `node --version; if ($?) { node --test test/salas.test.js }` → **vermelho** (0 passaram, 1 falharam)
- `17/09 10:54` edita código `api/src/usuarios.js`
- `17/09 10:54` edita código `api/src/salas.js`
- `17/09 10:54` edita código `api/src/index.js` (2×)
- `17/09 10:55` roda `npm test` → verde (6 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 10:55` edita teste `api/test/salas.test.js`
- `17/09 10:55` roda `node --test test/salas.test.js` → verde (3 passaram) — _teste novo já nasceu verde_
- `17/09 10:55` edita código `api/src/index.js`
- `17/09 10:55` edita teste `api/test/identificacao.test.js`
- `17/09 10:55` roda `npm test` → verde (6 passaram) — _teste e código mudaram juntos: não houve vermelho para ver_
- `17/09 10:55` edita código `api/src/index.js`
- `17/09 10:55` roda `npm test` → verde (5 passaram)
- `17/09 10:56` edita código `api/src/index.js`
- `17/09 10:56` roda `npm test; if ($?) { rg -n "app\.(get|post|put|patch|delete)\(" src }` → **vermelho** (3 passaram)
- `17/09 11:01` **prompt** — Pode gravar.
- `17/09 11:01` edita spec `specs/M0-infraestrutura.md`
- `17/09 11:01` roda `npm test` → verde (3 passaram)
