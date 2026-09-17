# Criação do AGENTS.md com regras do projeto

| | |
|---|---|
| Sessão | `ses_f508211c5ffeGYEyFukTFPRRT2` |
| Pasta | Repositórios/semana-academica |
| Período | 17/09 10:11 → 17/09 11:01 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 30 |
| Tokens de entrada / saída | 197.949 / 16.573 |
| Skills | grilling |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 1 de entrevista, 0 de spec, 10 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 10:11` **prompt** — Crie o AGENTS.md da raiz deste repositório. Antes de escrever, leia: README.md, contrato-api.md, projeto.json, EQUIPE.md, .opencode/agent/auditor.md e as quatro skills em .opencode/skills/. Contexto: projeto final da disciplina. Somos 2 pessoas. Victor é dono de M1 (grade de atividades) e M2 (inscrições); Felipe é dono de M3 (presença por QR) e da infraestrutura da API. O método é obrigatório: en…
- `17/09 10:14` edita contexto `AGENTS.md`
- `17/09 10:16` **prompt** — Adaptar tdd (tirar biblioteca-api, criarServidor(), verificacoes/livros.spec.js) e to-spec (ela grava spec-<recurso>.md na raiz; o auditor e o enunciado esperam specs/Mx-*.md).
- `17/09 10:16` edita contexto `.opencode/skills/tdd/SKILL.md` (5×)
- `17/09 10:17` edita contexto `.opencode/skills/to-spec/SKILL.md` (4×)
- `17/09 10:18` **prompt** — Commit: chore: stack, projeto.json e AGENTS.md da raiz.
- `17/09 10:52` **prompt** — Use a skill grilling. Vamos decidir o módulo M1 (grade de atividades) da Semana Acadêmica antes de qualquer código. Leia o contrato-api.md inteiro, com atenção à seção 5 (as rotas do M1: salas, atividades, alteração e cancelamento), à seção 6 (os códigos de retorno que aparecem em criar, alterar e cancelar atividade) e à seção 7. Cada código de erro da seção 6 existe porque existe uma regra que o…
- `17/09 10:52` carrega a skill **grilling**
- `17/09 10:54` edita entrevista `entrevistas/M1-grade.md`
- `17/09 11:01` **prompt** — Pendência de vocês dois: a seção "Regras que nasceram de erro" do AGENTS.md continua vazia. A regra sobre não editar spec durante a implementação acabou de ser aplicada duas vezes seguidas com sucesso — é a melhor hora pra escrever ela, e é ponto na entrega.
