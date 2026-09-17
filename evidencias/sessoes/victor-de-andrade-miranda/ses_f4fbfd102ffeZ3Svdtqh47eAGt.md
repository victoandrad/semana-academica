# Perguntas M1 grade de atividades

| | |
|---|---|
| Sessão | `ses_f4fbfd102ffeZ3Svdtqh47eAGt` |
| Pasta | Repositórios/semana-academica |
| Período | 17/09 13:43 → 17/09 16:26 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 65 |
| Tokens de entrada / saída | 329.873 / 153.284 |
| Skills | grilling, to-spec |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 43 de entrevista, 14 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 13:43` **prompt** — Use a skill grilling para o módulo M1 (grade de atividades) da Semana Acadêmica. Leia o contrato-api.md inteiro e specs/M0-infraestrutura.md — a base da API já existe, com relógio do modo de teste, identificação por X-Usuario e dados iniciais. Não repita nada que já está lá. Aviso que muda como você conduz: eu não tenho nenhuma regra de cabeça. Minha resposta para toda pergunta que envolva número…
- `17/09 13:43` carrega a skill **grilling**
- `17/09 13:51` edita entrevista `entrevistas/M1-grade.md`
- `17/09 15:01` **prompt** — Três ajustes antes de eu commitar. 1. A P-10 volta para PENDENTE. Sua conclusão ("§6 não lista ATIVIDADE_JA_INICIADA para PATCH, logo editar depois do início é permitido") é inferência do silêncio, não fato do contrato: a seção 6 diz onde cada código aparece, não o que é permitido. Reescreva a pergunta como "PATCH é permitido depois que a atividade começou? Se não for, qual código?", Resposta PEN…
- `17/09 15:02` edita entrevista `entrevistas/M1-grade.md` (3×)
- `17/09 15:04` **prompt** — eu apaguei sem querer os arquivos, cria de novo oq vc fez
- `17/09 15:05` edita entrevista `entrevistas/M1-grade.md` (2×)
- `17/09 15:08` **prompt** — Vamos fazer a rodada 2 da entrevista do M1. Leia entrevistas/M1-grade.md. Trabalhe em blocos de 10: liste as 10 primeiras perguntas que estão como PENDENTE, num bloco numerado, só o número e a pergunta — sem recomendação e sem comentário. Eu respondo as 10 numa única mensagem, consultando o documento de requisitos. Registre cada resposta na linha correspondente da tabela e ponha na coluna Fonte a…
- `17/09 15:12` **prompt** — -10 — PATCH é permitido depois que a atividade começou? Se não for, qual código? Não. Depois de criada, a atividade só pode alterar título e vagas (RN-110). Além disso, a situação em_andamento começa no início do primeiro encontro (RN-114), então não há alteração após o início. O código de erro para tentar alterar campos não permitidos é CAMPO_NAO_EDITAVEL. requisitos-envolvido.md P-11 — QUANTIDA…
- `17/09 15:12` edita entrevista `entrevistas/M1-grade.md` (10×)
- `17/09 15:13` **prompt** — P-20 — CAMPO_NAO_EDITAVEL O PATCH aceita apenas dois campos: titulo e vagas. Os campos tipo, salaId e encontros não podem ser alterados depois da criação da atividade (RN-110). requisitos-envolvido.md Campos permitidos: titulo, vagas. Campos não permitidos: tipo, salaId, encontros. O documento associa essa regra ao código CAMPO_NAO_EDITAVEL. requisitos-envolvido.md Sobre as outras perguntas: Se s…
- `17/09 15:14` edita entrevista `entrevistas/M1-grade.md` (10×)
- `17/09 15:15` **prompt** — P-32 — Ordem no POST (prioridade dos erros) O documento não define uma ordem de prioridade para os erros do POST /atividades. Ele define os códigos associados às regras, mas não existe uma seção equivalente à RN-208 (inscrições) ou RN-314 (presença) estabelecendo qual erro vence quando várias regras falham ao mesmo tempo. requisitos-envolvido.md requisitos-envolvido.md requisitos-envolvido.md Por…
- `17/09 15:16` edita entrevista `entrevistas/M1-grade.md` (6×)
- `17/09 15:16` **prompt** — pode alinhar
- `17/09 15:16` edita entrevista `entrevistas/M1-grade.md`
- `17/09 15:19` **prompt** — Nas perguntas P-15, P-31, P-32, P-33, P-35 e P-37 o documento de requisitos não define a regra. Registre nas seis, na coluna Fonte: "documento silente — decisão do grupo, 2026-09-17", e na coluna Resposta a decisão que eu te der agora. Não decida por mim e não deixe nenhuma como PENDENTE sem essa marcação. Antes, para cada uma, me mostre em uma linha quais são as opções possíveis, sem recomendar …
- `17/09 15:19` edita entrevista `entrevistas/M1-grade.md`
- `17/09 15:19` **prompt** — Pergunta Situação no Markdown Opções em aberto P-15 Não especifica se encontros da mesma atividade podem "encostar". (a) toque é sobreposição → 422 ENCONTRO_INVALIDO; ou (b) toque não é sobreposição → 201. P-31 Não especifica o comportamento de filtros inválidos. (a) 422 DADOS_INVALIDOS; (b) 200 lista vazia; (c) ignorar o filtro e listar tudo. P-32 Não define prioridade dos erros no POST de criaç…
- `17/09 15:20` edita entrevista `entrevistas/M1-grade.md` (6×)
- `17/09 15:22` **prompt** — Use a skill to-spec. Escreva specs/M1-grade.md a partir de entrevistas/M1-grade.md. Cada regra cita a pergunta que a originou (P-xx) e, quando a resposta veio do documento, também a regra dele (RN-xxx). Quando a fonte for "documento silente — decisão do grupo", cite assim na regra: ninguém pode ler a spec e achar que aquilo veio do cliente. Regra sem P-xx não entra. Se faltar alguma coisa para a …
- `17/09 15:22` carrega a skill **to-spec**
- `17/09 15:47` edita entrevista `entrevistas/M1-grade.md` (3×)
- `17/09 15:49` edita spec `specs/M1-grade.md` (2×)
- `17/09 16:06` **prompt** — Três ajustes em specs/M1-grade.md. Não mexa em mais nada. 1. R29 (vagasRestantes = vagas − ocupadas) não aparece em nenhuma fatia da seção 8, mas tem critério de aceite na seção 6. Como ela depende de `ocupadas`, que é a R37 e está bloqueada pelo M2, marque a R29 como Pendente (M2) no mesmo formato de R36–R38, e ajuste o critério de aceite dela na seção 6 para refletir isso. 2. R14 aparece nas fa…
- `17/09 16:25` **prompt** — Itens 1 e 2 confirmados, pode gravar. O item 3 está incompleto. Na spec, nove regras carregam o marcador "documento silente", não seis: R3, R9, R11, R14, R16, R18, R25, R33 e R35. Seu diff cobre só seis — faltam R11, R16 e R25, que vêm de P-17, P-20 e P-24. Aplique a mesma nota do Classroom nas nove. Depois me confirme, listando os nove números, que nenhuma ficou de fora.
- `17/09 16:25` edita spec `specs/M1-grade.md` (12×)
