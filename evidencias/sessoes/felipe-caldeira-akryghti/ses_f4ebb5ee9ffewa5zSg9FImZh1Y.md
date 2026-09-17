# Implementar F5: GET /encontros/:id/presencas

| | |
|---|---|
| Sessão | `ses_f4ebb5ee9ffewa5zSg9FImZh1Y` |
| Pasta | C:/semana-academica |
| Período | 17/09 18:27 → 17/09 18:29 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 29 |
| Tokens de entrada / saída | 51.561 / 16.225 |
| Skills | tdd |
| Subagentes | — |
| Execuções de teste | 1 vermelhas, 7 verdes |
| TDD | 1 ciclo(s) vermelho → verde · 5 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 6 de teste, 3 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 18:27` **prompt** — dentro da pasta api Use a skill tdd. Implemente só a fatia F5 de ../specs/M3-presenca.md: GET /encontros/:id/presencas (R19, R20, R21, R22, R24). Um teste por vez em test/presenca-f5.test.js: escreva o teste, mostre ele falhando, só então o código. Não altere spec nem testes existentes. Continue em src/presencas.js: exporte listarPresencas(encontroId) devolvendo cópias das presenças do encontro e…
- `17/09 18:27` carrega a skill **tdd**
- `17/09 18:28` edita teste `api/test/presenca-f5.test.js`
- `17/09 18:28` roda `node --test test/presenca-f5.test.js` → **vermelho** (0 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 18:28` edita código `api/src/presencas.js`
- `17/09 18:28` edita código `api/src/index.js` (2×)
- `17/09 18:28` roda `node --test test/presenca-f5.test.js` → verde (1 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 18:28` edita teste `api/test/presenca-f5.test.js`
- `17/09 18:28` roda `node --test test/presenca-f5.test.js` → verde (2 passaram) — _teste novo já nasceu verde_
- `17/09 18:29` edita teste `api/test/presenca-f5.test.js`
- `17/09 18:29` roda `node --test test/presenca-f5.test.js` → verde (3 passaram) — _teste novo já nasceu verde_
- `17/09 18:29` edita teste `api/test/presenca-f5.test.js`
- `17/09 18:29` roda `node --test test/presenca-f5.test.js` → verde (4 passaram) — _teste novo já nasceu verde_
- `17/09 18:29` edita teste `api/test/presenca-f5.test.js`
- `17/09 18:29` roda `node --test test/presenca-f5.test.js` → verde (6 passaram) — _teste novo já nasceu verde_
- `17/09 18:29` edita teste `api/test/presenca-f5.test.js`
- `17/09 18:29` roda `node --test test/presenca-f5.test.js` → verde (8 passaram) — _teste novo já nasceu verde_
- `17/09 18:29` roda `npm test` → verde (175 passaram)
