# Implementar GET /encontros/:id/codigo com TDD

| | |
|---|---|
| Sessão | `ses_f4eed556fffeNrbPmzQrQn5BGy` |
| Pasta | C:/semana-academica |
| Período | 17/09 17:33 → 17/09 18:02 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 62 |
| Tokens de entrada / saída | 92.730 / 27.784 |
| Skills | tdd, regra-de-tempo |
| Subagentes | — |
| Execuções de teste | 5 vermelhas, 10 verdes |
| TDD | 4 ciclo(s) vermelho → verde · 3 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 8 de teste, 13 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 17:33` **prompt** — Dentro da pasta api/ Use a skill tdd e a skill regra-de-tempo. Implemente só a fatia F1 de ../specs/M3-presenca.md: GET /encontros/:id/codigo (R3, R4, R5, R7 emitido, R22 parcial, R23). Um teste por vez em test/presenca-f1.test.js: escreva o teste, mostre ele falhando, e só então o código. Estrutura: código de negócio em src/presencas.js (funções puras dentroDaJanela, codigoDoMinuto etc. e um res…
- `17/09 17:33` carrega a skill **tdd**
- `17/09 17:33` carrega a skill **regra-de-tempo**
- `17/09 17:34` edita teste `api/test/presenca-f1.test.js`
- `17/09 17:34` roda `npm test -- --test-name-pattern="presenca-f1" 2>&1` → **vermelho** (48 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 17:34` edita código `api/src/index.js`
- `17/09 17:34` roda `npm test -- --test-name-pattern="presenca-f1" 2>&1` → verde (49 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 17:34` edita teste `api/test/presenca-f1.test.js`
- `17/09 17:34` roda `npm test -- --test-name-pattern="presenca-f1" 2>&1 | Select-String -Pattern "F1…` → **vermelho** — _teste novo falhando, como deve ser_
- `17/09 17:34` roda `node --test test/presenca-f1.test.js 2>&1` → **vermelho** (1 passaram, 1 falharam)
- `17/09 17:34` edita código `api/src/presencas.js`
- `17/09 17:35` edita código `api/src/index.js` (3×)
- `17/09 17:35` roda `node --test test/presenca-f1.test.js 2>&1` → verde (2 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 17:35` edita teste `api/test/presenca-f1.test.js`
- `17/09 17:35` roda `node --test test/presenca-f1.test.js 2>&1` → **vermelho** (2 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 17:35` edita código `api/src/presencas.js`
- `17/09 17:35` edita código `api/src/index.js` (4×)
- `17/09 17:35` roda `node --test test/presenca-f1.test.js 2>&1` → verde (3 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 17:35` edita teste `api/test/presenca-f1.test.js`
- `17/09 17:35` roda `node --test test/presenca-f1.test.js 2>&1` → verde (4 passaram) — _teste novo já nasceu verde_
- `17/09 17:36` edita teste `api/test/presenca-f1.test.js`
- `17/09 17:36` roda `node --test test/presenca-f1.test.js 2>&1` → verde (5 passaram) — _teste novo já nasceu verde_
- `17/09 17:36` edita teste `api/test/presenca-f1.test.js`
- `17/09 17:36` roda `node --test test/presenca-f1.test.js 2>&1` → verde (6 passaram) — _teste novo já nasceu verde_
- `17/09 17:36` edita teste `api/test/presenca-f1.test.js` (2×)
- `17/09 17:36` roda `node --test test/presenca-f1.test.js 2>&1` → **vermelho** (10 passaram, 2 falharam) — _teste novo falhando, como deve ser_
- `17/09 17:36` edita código `api/src/index.js`
- `17/09 17:36` roda `node --test test/presenca-f1.test.js 2>&1` → verde (12 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 17:36` roda `npm test 2>&1` → verde (60 passaram)
- `17/09 18:00` **prompt** — Faça o commit das alterações em api/src/presencas.js, api/src/index.js e api/test/presenca-f1.test.js com a mensagem: M3-F1: GET /encontros/:id/codigo (R3, R4, R5, R7, R22, R23, P-32) Não altere nenhum arquivo. Faça o commit da alteração em api/AGENTS.md com a mensagem: api/AGENTS.md: código de presença nunca é função só do tempo (erro do agente na F1 do M3) Não altere nenhum arquivo. Faça o comm…
- `17/09 18:01` **prompt** — da git push
- `17/09 18:02` edita código `api/src/index.js` (2×)
- `17/09 18:02` roda `npm test 2>&1 | Select-String -Pattern "^ℹ (tests|pass|fail)|F1 — Emitir"` → verde
- `17/09 18:02` roda `npm test 2>&1` → verde (110 passaram)
