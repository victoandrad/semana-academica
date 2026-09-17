# Sessões — Victor de Andrade Miranda

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Início | Sessão | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| 17/09 10:11 | [Criação do AGENTS.md com regras do projeto](ses_f508211c5ffeGYEyFukTFPRRT2.md) | 30 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 11:18 | [Acrescentar regras de erro em AGENTS.md](ses_f5044502bffed3NUtifiSiCdSv.md) | 4 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 13:43 | [Perguntas M1 grade de atividades](ses_f4fbfd102ffeZ3Svdtqh47eAGt.md) | 65 | grilling, to-spec | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 16:28 | [Fatia 1 M1-grade com TDD e reset](ses_f4f286fd5ffekmWHZzEuh4ZGwa.md) | 68 | tdd | — | 1 / 0 | 0 | 0 | 0 | — |
| 17/09 16:36 | [Implementar fatia 2 da M1-grade com TDD](ses_f4f21424fffehaly4ON7I7Mt19.md) | 62 | tdd | — | 6 / 7 | 4 | 3 | 0 | — |
| 17/09 16:51 | [TDD fatias 3-6 da spec M1-grade](ses_f4f13bfdaffejadNinKMfyKto9.md) | 134 | tdd, nova-tela | — | 19 / 18 | 12 | 5 | 1 | — |
| 17/09 17:13 | [Entrevista M2: inscrições e lista de espera](ses_f4eff117bffeDps3moKUmdiUZ1.md) | 250 | grilling, to-spec, tdd (2), nova-tela | auditor, revisor-de-contrato | 1 / 0 | 0 | 0 | 0 | — |
| | **Total: 7 sessões** | 613 | grilling (3), to-spec (2), tdd (5), nova-tela (2) | auditor, revisor-de-contrato | 27 / 25 | 16 | 8 | 1 | — |
