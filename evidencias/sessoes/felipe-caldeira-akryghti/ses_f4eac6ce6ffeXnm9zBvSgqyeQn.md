# Resolver achados M3-R8/R18 com TDD

| | |
|---|---|
| Sessão | `ses_f4eac6ce6ffeXnm9zBvSgqyeQn` |
| Pasta | C:/semana-academica |
| Período | 17/09 18:43 → 17/09 18:45 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 20 |
| Tokens de entrada / saída | 72.356 / 12.803 |
| Skills | tdd |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 4 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 3 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 4 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 18:43` **prompt** — Dentro da pasta api/ Use a skill tdd. Resolva os dois achados do parecer ../auditorias/M3-2026-09-17.md sobre ../specs/M3-presenca.md, em test/presenca-auditoria.test.js. Um teste por vez: escreva, mostre falhando ou explique por que já nasce verde (o código já cobre, falta só a prova), e não altere spec, código nem testes existentes a menos que um teste novo fique vermelho. Cenário base: palestr…
- `17/09 18:44` carrega a skill **tdd**
- `17/09 18:44` edita teste `api/test/presenca-auditoria.test.js`
- `17/09 18:44` roda `node --test --test-name-pattern "inscrição cancelada" test/presenca-auditoria.t…` → verde (1 passaram) — _teste novo já nasceu verde_
- `17/09 18:44` edita teste `api/test/presenca-auditoria.test.js`
- `17/09 18:44` roda `node --test --test-name-pattern "inscrição expirada" test/presenca-auditoria.te…` → verde (1 passaram) — _teste novo já nasceu verde_
- `17/09 18:45` edita teste `api/test/presenca-auditoria.test.js` (2×)
- `17/09 18:45` roda `node --test --test-name-pattern "expirada|atividade cancelada: manual" test/pre…` → verde (2 passaram) — _teste novo já nasceu verde_
- `17/09 18:45` roda `npm test` → verde (178 passaram)
