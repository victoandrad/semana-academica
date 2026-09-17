# Implementar fatia 2 da M1-grade com TDD

| | |
|---|---|
| Sessão | `ses_f4f21424fffehaly4ON7I7Mt19` |
| Pasta | Repositórios/semana-academica |
| Período | 17/09 16:36 → 17/09 16:47 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 62 |
| Tokens de entrada / saída | 154.108 / 47.123 |
| Skills | tdd |
| Subagentes | — |
| Execuções de teste | 6 vermelhas, 7 verdes |
| TDD | 4 ciclo(s) vermelho → verde · 3 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 19 de teste, 9 de código, 0 de entrevista, 2 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 16:36` **prompt** — Use a skill tdd. Implemente só a fatia 2 de ../specs/M1-grade.md. Um teste por vez: escreva o teste, rode e mostre ele falhando, e só então o código mínimo que faz passar. O valor esperado vem da spec, escrito à mão. Toda regra de tempo usa PUT /_teste/relogio. Nenhum teste depende da hora do sistema. Reaproveite o que specs/M0-infraestrutura.md já entregou: identificação, formato de erro, relógi…
- `17/09 16:36` carrega a skill **tdd**
- `17/09 16:38` edita teste `api/test/atividades-f2.test.js` (3×)
- `17/09 16:38` roda `node --test test/atividades-f2.test.js` → **vermelho** (0 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 16:39` edita código `api/src/atividades.js`
- `17/09 16:39` edita código `api/src/index.js`
- `17/09 16:39` roda `node --test test/atividades-f2.test.js; if ($?) { node --test test/*.test.js }` → **vermelho** (1 passaram)
- `17/09 16:40` edita teste `api/test/atividades.test.js` (4×)
- `17/09 16:40` roda `node --test test/*.test.js` → verde (21 passaram) — _teste novo já nasceu verde_
- `17/09 16:40` edita teste `api/test/atividades-f2.test.js` (2×)
- `17/09 16:40` roda `node --test test/atividades-f2.test.js` → **vermelho** (1 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 16:40` edita código `api/src/atividades.js` (2×)
- `17/09 16:40` roda `node --test test/*.test.js` → verde (22 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 16:41` edita teste `api/test/atividades-f2.test.js` (3×)
- `17/09 16:41` roda `node --test test/atividades-f2.test.js` → **vermelho** (2 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 16:41` edita código `api/src/atividades.js` (2×)
- `17/09 16:41` roda `node --test test/*.test.js` → verde (23 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 16:42` edita teste `api/test/atividades-f2.test.js`
- `17/09 16:42` roda `node --test test/atividades-f2.test.js` → **vermelho** (3 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 16:42` edita código `api/src/atividades.js` (2×)
- `17/09 16:42` roda `node --test test/*.test.js` → verde (24 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 16:42` edita teste `api/test/atividades-f2.test.js` (2×)
- `17/09 16:42` roda `node --test test/atividades-f2.test.js` → **vermelho** (4 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 16:42` edita código `api/src/atividades.js`
- `17/09 16:43` roda `node --test test/*.test.js` → verde (25 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 16:43` edita teste `api/test/atividades-f2.test.js`
- `17/09 16:43` roda `node --test test/atividades-f2.test.js` → verde (6 passaram) — _teste novo já nasceu verde_
- `17/09 16:44` edita teste `api/test/atividades.test.js` (3×)
- `17/09 16:44` roda `node --test test/*.test.js` → verde (26 passaram) — _teste novo já nasceu verde_
- `17/09 16:46` **prompt** — Dois critérios de aceite de specs/M1-grade.md estão internamente contraditórios com as regras da própria spec. Corrija só eles, não mexa em nenhuma regra da seção 5. Critério 8 (R8): pede 201 para "encontro em sábado do evento". Não existe sábado no evento — a R7 restringe a 19 a 23/10/2026, segunda a sexta. Reescreva o critério usando só o que a R8 realmente prova: horário fora do comercial dent…
- `17/09 16:47` **prompt** — sim
- `17/09 16:47` edita spec `specs/M1-grade.md` (2×)
