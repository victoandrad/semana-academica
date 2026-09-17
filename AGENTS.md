# AGENTS.md — Semana Acadêmica

Regras que o agente de IA deve seguir neste repositório. Cada linha tem uma justificativa com fonte.

## Stack e pastas

- A API fica em `api/`: Node 22 + Express + `node:sqlite`, com `npm install` e `npm start`. — `projeto.json:2-8`
- A interface web fica em `app/`: HTML + JS, com `npm install` e `npm run dev`. — `projeto.json:9-13`
- Testes rodam com `node --test` (Node built-in). — `.opencode/skills/tdd/SKILL.md:21`

## Contrato

- `contrato-api.md` é imutável: rota, nome de campo e código de retorno não se negociam. — `contrato-api.md:3` ("Restrição do cliente")
- Toda regra de tempo usa o relógio do modo de teste (`PUT /_teste/relogio`), nunca a hora do sistema. — `contrato-api.md:51` ("Toda regra que depende de tempo usa esse relógio — nunca a hora do sistema direto.")
- A ordem das verificações é: identificação (401) → perfil (403) → existência (404) → corpo (422) → regras do recurso. — `contrato-api.md:17`

## Método

- `specs/` e `entrevistas/` são a fonte da verdade. Nenhuma regra entra na spec sem a pergunta P-xx que a originou. — `.opencode/skills/to-spec/SKILL.md:11-12` ("Regra que ninguém decidiu não entra.") e `.opencode/agent/auditor.md:36` (auditor confere origem P-xx de cada regra)
- Todo teste começa vermelho antes do código existir. — `.opencode/skills/tdd/SKILL.md:30-31`
- Teste que nasce verde ou é alterado para passar é teste inválido. — `.opencode/skills/tdd/SKILL.md:40-43` ("Se você mudar um teste para ele passar, você trocou o contrato pela sua implementação")

## Documento de requisitos

- Existe um documento de requisitos fora do repositório. Não procure, não leia, não anexe à conversa, não peça ao agente para ler. — `README.md:36-37`

## Commits

- Formato da mensagem de commit: `M2-R6: recusa conflito de horário` — `<módulo>-<regra>: <descrição curta>`. — enunciado da disciplina

## Auditorias

- Pareceres em `auditorias/` são salvos inteiros, sem edição. — `README.md:25`

## Equipe

- Victor é dono de M1 (grade de atividades) e M2 (inscrições). — `EQUIPE.md:7-8`
- Felipe é dono de M3 (presença por QR). — `EQUIPE.md:9`
- Infraestrutura da API é responsabilidade de Felipe. — `EQUIPE.md:9` + `projeto.json:3-8`

## Regras que nasceram de erro

- 2026-09-17: agente corrigiu typo em spec durante implementação sem perguntar. Regra: durante implementação, o agente não altera a spec — se código não bate, ele para e pergunta ao dono do módulo; alteração de spec é commit separado do código.
- 2026-09-17: spec de M0 inventou rotas fora do contrato (health check e rota temporária de teste). Regra: nenhuma rota fora de contrato-api.md entra no código, nem como costura de teste — testes usam rotas do contrato.
