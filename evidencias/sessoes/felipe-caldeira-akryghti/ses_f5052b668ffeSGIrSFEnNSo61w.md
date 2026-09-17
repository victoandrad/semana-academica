# Fatia 4: rotas /_teste/ e relógio congelado TDD

| | |
|---|---|
| Sessão | `ses_f5052b668ffeSGIrSFEnNSo61w` |
| Pasta | C:/semana-academica |
| Período | 17/09 11:02 → 17/09 11:12 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 41 |
| Tokens de entrada / saída | 50.813 / 31.816 |
| Skills | tdd |
| Subagentes | — |
| Execuções de teste | 6 vermelhas, 6 verdes |
| TDD | 5 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 7 de teste, 12 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 11:02` **prompt** — Use a skill tdd. Implemente só a fatia 4 de ../specs/M0-infraestrutura.md: as rotas de /_teste/ e o relógio congelado. Um teste por vez: escreva o teste, rode e mostre ele falhando, e só então o código mínimo que faz passar. Atenção a quatro coisas da seção 3 do contrato-api.md: - POST /_teste/reset responde 204, apaga tudo, recarrega os dados iniciais e põe o relógio em 2026-10-13T09:00:00-03:00…
- `17/09 11:02` carrega a skill **tdd**
- `17/09 11:08` roda `npm test` → verde (3 passaram)
- `17/09 11:08` edita teste `api/test/modo-teste.test.js`
- `17/09 11:08` roda `npm test` → **vermelho** (3 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 11:08` edita código `api/src/relogio.js`
- `17/09 11:08` edita código `api/src/index.js` (2×)
- `17/09 11:09` roda `npm test` → verde (4 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 11:09` edita teste `api/test/modo-teste.test.js`
- `17/09 11:09` roda `npm test` → **vermelho** (4 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 11:09` edita código `api/src/index.js` (2×)
- `17/09 11:09` roda `npm test` → verde (5 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 11:09` edita teste `api/test/modo-teste.test.js` (2×)
- `17/09 11:10` roda `npm test` → **vermelho** (5 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 11:10` edita código `api/src/index.js`
- `17/09 11:10` roda `npm test` → verde (6 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 11:10` edita teste `api/test/modo-teste.test.js`
- `17/09 11:10` roda `npm test` → **vermelho** (6 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 11:10` edita código `api/src/relogio.js`
- `17/09 11:10` edita código `api/src/salas.js`
- `17/09 11:10` edita código `api/src/index.js` (3×)
- `17/09 11:10` roda `npm test` → verde (7 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 11:11` edita teste `api/test/modo-teste.test.js`
- `17/09 11:11` roda `npm test` → **vermelho** (3 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 11:11` edita teste `api/test/modo-teste.test.js`
- `17/09 11:11` roda `npm test` → **vermelho** (7 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 11:11` edita código `api/src/index.js`
- `17/09 11:11` roda `npm test` → verde (8 passaram) — _fecha um ciclo vermelho → verde_
