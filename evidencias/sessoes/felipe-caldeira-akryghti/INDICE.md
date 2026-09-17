# Sessões — Felipe Caldeira Akryghti

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Início | Sessão | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| 17/09 10:23 | [Elaboração da spec M0-infraestrutura](ses_f50766f2effeNAEugz0AzEKsEz.md) | 24 | to-spec, tdd | — | 1 / 2 | 0 | 0 | 1 | — |
| 17/09 10:37 | [TDD para fatia 2 de M0-infraestrutura.md](ses_f506966d5ffe1YeEpJ6kkv8g8M.md) | 41 | tdd | — | 7 / 6 | 3 | 1 | 0 | — |
| 17/09 10:49 | [TDD para fatia 3: GET /salas e dados iniciais](ses_f505e7e76ffeThT7XLllt15v7s.md) | 27 | tdd | — | 3 / 6 | 1 | 1 | 1 | — |
| 17/09 11:02 | [Fatia 4: rotas /_teste/ e relógio congelado TDD](ses_f5052b668ffeSGIrSFEnNSo61w.md) | 41 | tdd | — | 6 / 6 | 5 | 0 | 0 | — |
| 17/09 11:19 | [Edição F5 na Seção 8 de M0-infraestrutura.md](ses_f5042edacffe35ROmWEWBC7CXh.md) | 9 | — | explore | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 11:37 | [Decisão do módulo M3 presença por QR](ses_f5032700dffe5qbaj518NLaASR.md) | 38 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 14:26 | [New session - 2026-09-17T17:26:37.413Z](ses_f4f980d9affe2GtgKbEdqJ2uGh.md) | 4 | to-spec | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 14:54 | [New session - 2026-09-17T17:54:47.981Z](ses_f4f7e41d2ffeelQz7iLMhIC2Zl.md) | 5 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 14:56 | [New session - 2026-09-17T17:56:22.139Z](ses_f4f7cd204fferiOuZcdvAremkN.md) | 4 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 15:11 | [New session - 2026-09-17T18:11:04.911Z](ses_f4f6f59b0ffejRZI1HuGoOAN8A.md) | 16 | novo-subagente | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 15:20 | [New session - 2026-09-17T18:20:04.971Z](ses_f4f671c14ffe1oUq68ceOWkSRL.md) | 56 | — | — | 5 / 7 | 2 | 1 | 1 | — |
| 17/09 15:37 | [New session - 2026-09-17T18:37:07.075Z](ses_f4f57837cffe5bbnGONSelu7uD.md) | 50 | — | — | 7 / 7 | 6 | 0 | 0 | — |
| 17/09 17:33 | [Implementar GET /encontros/:id/codigo com TDD](ses_f4eed556fffeNrbPmzQrQn5BGy.md) | 62 | tdd, regra-de-tempo | — | 5 / 10 | 4 | 3 | 0 | — |
| 17/09 18:04 | [F2 presenças POST /encontros com TDD](ses_f4ed030abffeCbbAzwK6qb6t7V.md) | 60 | tdd | — | 12 / 12 | 3 | 2 | 1 | — |
| 17/09 18:14 | [Implementar F3: presenças offline com lidoEm](ses_f4ec75fedffe6ZMo6gndyDQgWt.md) | 43 | tdd | — | 6 / 12 | 2 | 6 | 0 | — |
| 17/09 18:21 | [Implementar F4 presença manual com TDD](ses_f4ec10135ffeDYMAzORM5En9qB.md) | 37 | tdd | — | 1 / 8 | 1 | 6 | 0 | — |
| 17/09 18:27 | [Commit M3-R17: justificativa antes de presença](ses_f4ebbeb76ffeMNl3Hr5QBf3X60.md) | 4 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 18:27 | [Implementar F5: GET /encontros/:id/presencas](ses_f4ebb5ee9ffewa5zSg9FImZh1Y.md) | 29 | tdd | — | 1 / 7 | 1 | 5 | 0 | — |
| 17/09 18:37 | [Auditoria módulo M3 contra M3-presenca.md](ses_f4eb24f3dffeR5ttxOAN6KIkDa.md) | 5 | — | auditor | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 18:43 | [Resolver achados M3-R8/R18 com TDD](ses_f4eac6ce6ffeXnm9zBvSgqyeQn.md) | 20 | tdd | — | 0 / 4 | 0 | 3 | 0 | — |
| 17/09 18:49 | [Revisão de API e interface contra contrato-api.md](ses_f4ea785c6ffe13v6N1G9A7sZCp.md) | 5 | — | revisor-de-contrato | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 19:01 | [Resposta de Atividade sem campo cancelada](ses_f4e9bfb89ffeYVtTEPORowOc5U.md) | 16 | tdd | — | 2 / 3 | 1 | 0 | 0 | — |
| | **Total: 22 sessões** | 596 | to-spec (2), tdd (11), grilling (2), novo-subagente, regra-de-tempo | explore, auditor, revisor-de-contrato | 56 / 90 | 29 | 28 | 4 | — |
