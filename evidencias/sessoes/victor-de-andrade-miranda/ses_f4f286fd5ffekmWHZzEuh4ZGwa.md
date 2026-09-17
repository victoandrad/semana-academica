# Fatia 1 M1-grade com TDD e reset

| | |
|---|---|
| Sessão | `ses_f4f286fd5ffekmWHZzEuh4ZGwa` |
| Pasta | Repositórios/semana-academica |
| Período | 17/09 16:28 → 17/09 16:35 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 68 |
| Tokens de entrada / saída | 63.396 / 25.297 |
| Skills | tdd |
| Subagentes | — |
| Execuções de teste | 1 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 12 de teste, 26 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 16:28` **prompt** — Use a skill tdd. Implemente só a fatia 1 de ../specs/M1-grade.md. Um teste por vez: escreva o teste, rode e mostre ele falhando, e só então o código mínimo que faz passar. O valor esperado vem da spec, escrito à mão. Toda regra de tempo usa PUT /_teste/relogio. Nenhum teste depende da hora do sistema. Reaproveite o que specs/M0-infraestrutura.md já entregou: identificação, formato de erro, relógi…
- `17/09 16:28` carrega a skill **tdd**
- `17/09 16:29` edita teste `api/test/atividades.test.js`
- `17/09 16:29` roda `npm test` → **vermelho** — _teste novo falhando, como deve ser_
- `17/09 16:29` edita código `api/src/atividades.js` (3×)
- `17/09 16:30` edita código `api/src/index.js` (3×)
- `17/09 16:30` edita teste `api/test/atividades.test.js` (3×)
- `17/09 16:30` edita código `api/src/usuarios.js`
- `17/09 16:30` edita código `api/src/index.js` (4×)
- `17/09 16:31` edita teste `api/test/atividades.test.js`
- `17/09 16:31` edita código `api/src/atividades.js`
- `17/09 16:31` edita código `api/src/index.js` (2×)
- `17/09 16:31` edita teste `api/test/atividades.test.js`
- `17/09 16:31` edita código `api/src/atividades.js`
- `17/09 16:31` edita código `api/src/index.js` (2×)
- `17/09 16:32` edita teste `api/test/atividades.test.js` (2×)
- `17/09 16:32` edita código `api/src/atividades.js` (2×)
- `17/09 16:32` edita código `api/src/index.js`
- `17/09 16:32` edita teste `api/test/atividades.test.js`
- `17/09 16:32` edita código `api/src/atividades.js`
- `17/09 16:33` edita teste `api/test/atividades.test.js`
- `17/09 16:33` edita código `api/src/salas.js`
- `17/09 16:33` edita código `api/src/atividades.js` (2×)
- `17/09 16:33` edita código `api/src/index.js`
- `17/09 16:33` edita teste `api/test/atividades.test.js`
- `17/09 16:34` **prompt** — Falta um ajuste na F1: a Atividade devolvida não tem ocupadas, vagasRestantes nem emEspera, e o contrato-api.md define os três como campos da Atividade. Nome de campo é restrição do cliente e o juiz consome a forma exata. Devolver os três não antecipa a decisão do M2: no M1 não existe nenhuma inscrição, então ocupadas é 0, vagasRestantes é vagas e emEspera é 0 sob qualquer critério de contagem. O…
- `17/09 16:35` edita teste `api/test/atividades.test.js`
- `17/09 16:35` edita código `api/src/atividades.js`
