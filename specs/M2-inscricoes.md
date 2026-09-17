# Spec — M2 Inscrições e lista de espera

## 1. Objetivo

Permitir que o participante se inscreva nas atividades da Semana Acadêmica: com vaga,
a inscrição nasce confirmada; sem vaga, entra na lista de espera. Quando uma vaga se
abre, o 1º da fila é convocado automaticamente e tem prazo para confirmar; quem não
confirma no prazo é expirado em cascata. A organização só lê; quem mexe na inscrição é
o próprio dono. A decisão de quais status ocupam vaga alimenta os campos calculados do
M1 (`ocupadas`, `vagasRestantes`, `emEspera`) e a regra `VAGAS_ABAIXO_DOS_INSCRITOS`.

Cada regra cita a pergunta (P-xx) da entrevista `entrevistas/M2-inscricoes.md` que a
originou e a regra do documento (RN-xxx). Quando o documento não define a regra, a
fonte é registrada como `documento silente — decisão do grupo, 2026-09-17` — a decisão
é do grupo, não do cliente.

## 2. Fora de escopo

- Presença por QR (M3), certificados (M4) e painel/bloqueio da organização (M5). A
  `INSCRICAO_BLOQUEADA` só existe quando o projeto inclui o M5 — em grupo de 3 ela
  nunca é emitida, e esta spec não tem regra para ela. (P-27, RN-208, RN-507)
- Pagamento e notificação por e-mail/push: não há; a convocação só é vista por GET.
  (P-11, P-27)
- `DELETE` de inscrição: não existe rota; o estado muda por cancelamento. (P-27,
  RN-209, RN-210)
- Lista de espera como rota separada: a espera é um status da própria inscrição
  (`em_espera`, `convocada`, `confirmada`…). (P-27)
- Inscrição feita pela organização para terceiros: não há rota; escrita é só do
  participante dono. (P-22, RN-219)
- Perfil (401/403), formato de erro/data/id e dados iniciais — já definidos pela spec
  de M0 (contrato §1, §3, §4). Não se repetem aqui.
- Atividade e encontros — já definidos pela spec de M1; o M2 só os consome.

## 3. Modelo

### 3.1 Inscricao

| Campo | Tipo | Origem |
|---|---|---|
| id | string | gerado — `ins_` + 8 hex minúsculos (M0, contrato §1) |
| atividadeId | string | informado — referencia `Atividade` de M1 |
| participanteId | string | informado — o `X-Usuario` que inscreveu (o dono) |
| status | string | calculado — `"confirmada"` \| `"em_espera"` \| `"convocada"` \| `"cancelada"` \| `"expirada"` (contrato §5) |
| posicaoNaEspera | integer \| null | calculado — só quando `em_espera`, ordinal 1..n (R15) (contrato §5) |
| convocadaAte | datetime \| null | calculado — só quando `convocada` (R12) (contrato §5) |
| criadaEm | datetime | calculado — o relógio no instante da criação |

### 3.2 Transições de status

Calculadas pelo sistema, a partir do relógio do modo de teste (M0 R16):

| De \ Para | `confirmada` | `em_espera` | `convocada` | `cancelada` | `expirada` |
|---|---|---|---|---|---|
| nascimento | vaga livre (R7) | sem vaga (R7) | — | — | — |
| `em_espera` | — | — | vaga liberada (R11) | cancelamento (R20) | — |
| `convocada` | confirmação no prazo (R16) | — | — | cancelamento (R20) | prazo vencido (R13) |
| `confirmada` | — | — | — | cancelamento (R20) | — |
| qualquer ativa | — | — | — | cancelamento da atividade (R28) | — |

`cancelada`/`expirada` não transitam por ação do dono (R21); atividade cancelada não
promove ninguém (R28). (P-15, P-18, P-23)

## 4. Endpoints

| Método | Rota | Quem | Sucesso |
|---|---|---|---|
| POST | `/atividades/:id/inscricoes` | participante | 201 `Inscricao` (sem corpo na entrada) |
| GET | `/inscricoes` | todos | 200 `[Inscricao]` — participante só as próprias; filtro `?atividadeId=` |
| GET | `/inscricoes/:id` | todos | 200 `Inscricao` |
| POST | `/inscricoes/:id/cancelamento` | participante (o dono) | 200 `Inscricao` |
| POST | `/inscricoes/:id/confirmacao` | participante (o dono) | 200 `Inscricao` |

(contrato §5)

## 5. Regras

### Perfil, existência e visibilidade

R1. As três rotas de escrita de M2 (`POST /atividades/:id/inscricoes`,
`POST /inscricoes/:id/cancelamento`, `POST /inscricoes/:id/confirmacao`) são de
participante; organização → `403 SOMENTE_PARTICIPANTE`. (P-01, P-22; contrato §5, §6)

R2. Os GETs de M2 são de todos. `GET /inscricoes` devolve só as inscrições do próprio
participante (mesmo com `?atividadeId=`); a organização recebe a lista completa,
incluindo `cancelada`/`expirada`. (P-20; contrato §5)

R3. `GET /inscricoes/:id` é de todos: qualquer participante lê a inscrição de outro
pelo id; organização também. (P-21; contrato §5)

R4. As escritas de uma inscrição são só do dono: cancelar ou confirmar a inscrição de
outro participante → `404 NAO_ENCONTRADO` (não 403). (P-21; RN-218; contrato §1)

R5. Atividade/inscrição inexistente → `404 NAO_ENCONTRADO`, na etapa de existência do
contrato §1 (perfil 403 vem antes de existência 404). (P-01; contrato §1, §6)

### Inscrição (POST /atividades/:id/inscricoes)

R6. Ordem das recusas no POST (contrato §1 para 404, RN-208 para as regras):
recurso inexistente (404) → `ATIVIDADE_CANCELADA` → `INSCRICOES_ENCERRADAS` →
`INSCRICAO_BLOQUEADA` (só com M5; nunca em grupo de 3) → `JA_INSCRITO` →
`CONFLITO_DE_HORARIO` → `LIMITE_DE_MINICURSOS`. (P-09, P-27; RN-208)

R7. Inscrever em atividade cancelada → `422 ATIVIDADE_CANCELADA`. (P-03; contrato §6,
RN-203, M1 R24)

R8. As inscrições fecham 30 min antes do início do 1º encontro da atividade — para
qualquer tipo (sempre o 1º encontro). Prazo que fecha em X já recusa em X: no relógio
`início do 1º encontro − 30 min`, inclusive, a inscrição é recusada com
`422 INSCRICOES_ENCERRADAS`. Atividade `em_andamento` ou `encerrada` → o mesmo código
(o prazo já passou). (P-02; RN-202; regra geral de tempo)

R9. A inscrição é recusada com `409 JA_INSCRITO` quando o participante já tem inscrição
ativa na mesma atividade. Ativa = `confirmada`, `em_espera`, `convocada`. Quem tem
`cancelada` ou `expirada` pode se inscrever de novo, entrando no fim da fila de espera.
(P-04; RN-204)

R10. Status no nascimento: há vaga → `confirmada`; não há vaga → `em_espera` com a
próxima posição da fila. Lotação nunca é erro de inscrição. Vale para qualquer
atividade — palestra e minicurso têm lista de espera. (P-05; RN-205)

R11. `409 CONFLITO_DE_HORARIO` — definição: a checagem é por encontro individual
(não pela janela inteira da atividade); só sobreposição real gera conflito (início de
um < fim do outro e fim do outro > início de um); encostar (fim de um = início de
outro) não é conflito; não há margem de segurança entre atividades — os 15 min são
regra de conflito de sala do M1, não de horário do participante. (P-06; RN-206)

R12. `409 CONFLITO_DE_HORARIO` — quem é checado: só inscrições que ocupam vaga
(`confirmada`, `convocada`); quem está `em_espera` não é verificado. A mesma checagem
vale no POST e na confirmação (R18). (P-07; RN-206)

R13. `422 LIMITE_DE_MINICURSOS` — o participante ocupa vaga em até 3 minicursos
simultaneamente. Conta: minicurso `confirmada` ou `convocada`. Não conta: `em_espera`,
palestra, `cancelada` e `expirada` (deixaram de ocupar vaga). No POST, quebra o limite
a inscrição que nasceria `confirmada` deixando 4 minicursos ocupando vaga; a que nasce
`em_espera` não é recusada aqui — o limite é revalidado na confirmação (R18).
(P-08, P-16; RN-207, RN-214)

### Fila de espera e convocação

R14. A promoção do 1º da fila (`em_espera` → `convocada`) acontece no instante em que
a vaga é liberada — por cancelamento de inscrição, convocação vencida ou aumento de
`vagas` no PATCH. A cascata acontece mesmo sem ninguém acessar o sistema: a convocação
não é lazy, ela passa a existir automaticamente. (P-10; RN-211, RN-213)

R15. `convocadaAte`: prazo de 2 horas contado do instante em que a inscrição vira
`convocada`. Nunca ultrapassa o fechamento das inscrições (R8) — se `turno + 2h` passa
do fechamento, vale o fechamento. Borda: prazo "até X" aceita X inclusive — confirmar
em `convocadaAte` (no instante exato) é aceito; depois, vira expirada (R16).
(P-11; RN-211, RN-212, RN-213; regra geral de tempo)

R16. No vencimento de `convocadaAte`, a inscrição vira `expirada` automaticamente
(mesmo sem ninguém acessar o sistema), sai da fila, e o próximo é convocado, com o
prazo dele contado do vencimento da convocação anterior — em cascata. (P-12, P-13;
RN-213)

R17. Inscrição `expirada` nunca é reconvocada: sai do fluxo da fila. (P-13; RN-213)

R18. `posicaoNaEspera`: calculada, ordinal (1, 2, …), por ordem de chegada — a posição
1 é a próxima a ser convocada. Quando alguém é convocado, cancela ou expira, os demais
reindexam: a posição é recalculada sobre quem permanece `em_espera`. Duas inscrições
criadas no mesmo instante (relógio de teste parado entre POSTs, `criadaEm` igual) são
desempatadas pela ordem de inserção no banco. (P-14; RN-216; desempate: documento
silente — decisão do grupo, 2026-09-17)

### Confirmação (POST /inscricoes/:id/confirmacao)

R19. Confirmar no prazo: `convocada` → `confirmada`; `convocadaAte` e `posicaoNaEspera`
passam a `null` (consistentes com contrato §5 — campo existe "só quando" o status
correspondente). (P-15; RN-214; null: documento silente — decisão do grupo,
2026-09-17; contrato §5)

R20. `422 SEM_CONVOCACAO` ao confirmar inscrição que não está `convocada` — vale para
`confirmada`, `em_espera`, `cancelada` e `expirada`. `422 CONVOCACAO_EXPIRADA` ao
confirmar `convocada` cujo `convocadaAte` já venceu. (P-15; RN-215)

R21. A confirmação revalida `CONFLITO_DE_HORARIO` (R11/R12) e `LIMITE_DE_MINICURSOS`
(R13) contra as inscrições vigentes: um conflito ou limite que não existia quando a
convocação foi criada pode recusar a confirmação. Se recusada, a convocação continua
válida até o fim do prazo (a recusa não a expira antecipadamente). (P-16; RN-214)

R22. Ordem das recusas na confirmação: `SEM_CONVOCACAO` → `CONVOCACAO_EXPIRADA` →
`CONFLITO_DE_HORARIO` → `LIMITE_DE_MINICURSOS`. (P-17; RN-215 (parcial), documento
silente — decisão do grupo, 2026-09-17)

### Cancelamento (POST /inscricoes/:id/cancelamento)

R23. O participante cancela a própria inscrição até a atividade começar. "Começou"
inclui o instante inicial: antes do início do 1º encontro → 200; no instante exato →
`422 ATIVIDADE_JA_INICIADA`. Canceláveis: `confirmada`, `em_espera`, `convocada`.
(P-18, P-19; RN-209; definição geral de tempo)

R24. `422 INSCRICAO_INATIVA` ao cancelar inscrição `cancelada` ou `expirada`.
(P-18; RN-210)

R25. Cancelar `em_espera` tira da fila e os demais reindexam (R18). Cancelar
`confirmada` ou `convocada` libera a vaga → o 1º da fila é convocado (R14).
(P-18; RN-211, RN-216)

R26. Prioridade no cancelamento: `ATIVIDADE_JA_INICIADA` vence `INSCRICAO_INATIVA`
quando ambas recusam o mesmo cancelamento (ex.: inscrição `cancelada` em atividade já
iniciada). (P-19; documento silente — decisão do grupo, 2026-09-17)

### Destino das inscrições quando a atividade é cancelada

R27. Ao cancelar a atividade, todas as inscrições ativas (`confirmada`, `em_espera`,
`convocada`) tornam-se `cancelada`. Não há promoção da fila de espera: a atividade
cancelada não aceita novas inscrições (RN-203) — o cancelamento encerra toda a fila e
ninguém é convocado. (P-23; RN-217, RN-203)

### Regras do M1 que dependem do M2

R28. Quem ocupa vaga: `confirmada` e `convocada`. Não ocupam: `em_espera`, `cancelada`,
`expirada`. (P-24; RN-111) — desbloqueia a R36 do M1
(`VAGAS_ABAIXO_DOS_INSCRITOS`): o PATCH reduzindo `vagas` abaixo do nº de ocupantes →
`409 VAGAS_ABAIXO_DOS_INSCRITOS`.

R29. `ocupadas` conta as inscrições que ocupam vaga — `confirmada` + `convocada`.
Com a atividade cancelada, `ocupadas` continua calculado e vale 0: todas as ativas
viraram `cancelada` (R27) e `cancelada` não ocupa vaga. (P-25; RN-111, RN-217;
valor pós-cancelamento: documento silente — decisão do grupo, 2026-09-17, consistente
com M1 R25) — desbloqueia a R37 do M1 e, com ela, a R29 do M1
(`vagasRestantes` = `vagas` − `ocupadas`).

R30. `emEspera` conta as inscrições ativas `em_espera`, e a fila segue
`posicaoNaEspera` (ordem de chegada). (P-26; RN-205, RN-216) — desbloqueia a R38 do M1.

## 6. Critérios de aceite

1. (R1, R5) `POST /atividades/:id/inscricoes` com `org-ana` → 403 `SOMENTE_PARTICIPANTE`
(perfil antes de existência: mesmo em atividade inexistente é 403); com `p-carla` em
atividade inexistente → 404 `NAO_ENCONTRADO`.
2. (R9, R10) Atividade de 1 vaga: 1ª inscrição → 201 `confirmada` (`posicaoNaEspera` e
`convocadaAte` null); 2ª → 201 `em_espera` `posicaoNaEspera: 1`; 2ª inscrição da mesma
pessoa na mesma atividade → 409 `JA_INSCRITO`; cancelar a 1ª e tentar de novo → 201
(entra no fim da fila); repetir com `expirada`.
3. (R8, R6) Atividade com 1º encontro às 19h: relógio 18h29 → 201; 18h30 (inclusive) →
422 `INSCRICOES_ENCERRADAS`; 18h31 → idem; com a atividade `em_andamento`/`encerrada` →
idem; POST violando cancelada+encerrada+JA_INSCRITO → código da 1ª regra na ordem da
R6 (testar cada par para confirmar a sequência).
4. (R7) Cancelar a atividade e `POST /atividades/:id/inscricoes` → 422
`ATIVIDADE_CANCELADA`.
5. (R11, R12) A 19:00–21:00 `confirmada` e B 20:00–22:00 → 409 `CONFLITO_DE_HORARIO`;
B 21:00–21:30 (encosta) → 201; B colidindo só com inscrição `em_espera` → 201; conflito
por encontro: atividade multiencontro com colisão só no 2º encontro → 409.
6. (R13) 3 minicursos ocupando vaga + POST no 4º com vaga livre → 422
`LIMITE_DE_MINICURSOS`; 4º sem vaga → 201 `em_espera` (espera não conta); 4º palestra
→ 201; com 1 dos 3 cancelado, o 4º com vaga → 201 `confirmada`.
7. (R14, R18) Lotar com 3 na espera; cancelar 1 e, sem outro acesso, `GET /inscricoes`
→ 1º da fila já `convocada`, os demais reindexados (2º vira 1º); PATCH aumentando
`vagas` → idem.
8. (R15) Convocada às T → `convocadaAte: T+2h`; se T+2h > fechamento das inscrições →
`convocadaAte` = fechamento; confirmar em `convocadaAte` → 200; 1 min depois → recusa
(R20).
9. (R16, R17) `convocadaAte` vence sem acesso → `GET /inscricoes` mostra `expirada` e o
próximo já `convocada`, com prazo contado do vencimento anterior, em cascata (Diego e
Elisa expiram, Fábio aparece convocado); o expirado nunca é reconvocado.
10. (R20, R19) Confirmar `em_espera` → 422 `SEM_CONVOCACAO`; confirmar `convocada`
vencida → 422 `CONVOCACAO_EXPIRADA`; confirmar no prazo → 200, status `confirmada`,
`convocadaAte: null`, `posicaoNaEspera: null`.
11. (R21, R22) `convocada` no prazo mas com novo conflito criado depois → 409
`CONFLITO_DE_HORARIO` (continua `convocada` até o fim do prazo); idem com o 4º
minicurso → 422 `LIMITE_DE_MINICURSOS`; convocada vencida + conflito → 422
`CONVOCACAO_EXPIRADA` (a 1ª condição da ordem R22); testar pares para confirmar a
	sequência completa.
12. (R23, R24, R26) Relógio 1 min antes do 1º encontro → cancelamento 200; no instante
exato → 422 `ATIVIDADE_JA_INICIADA`; depois → idem; cancelar `cancelada`/`expirada` →
422 `INSCRICAO_INATIVA`; inscrição `cancelada` em atividade já iniciada → 422
`ATIVIDADE_JA_INICIADA` (prioridade da R26).
13. (R25, R14) Cancelar `em_espera` → 200 e a fila reindexa; cancelar `confirmada`/`convocada`
→ 200 e o 1º da fila é convocado.
14. (R2, R3, R4) `GET /inscricoes` com `p-carla` → só as inscrições de `p-carla`,
mesmo com `?atividadeId=`; com `org-ana` → todas; `GET /inscricoes/<ins-de-p-diego>`
com `p-carla` → 200; `p-diego` cancelando/confirmando a inscrição de `p-carla` → 404.
15. (R1) `org-ana` `GET /inscricoes` → 200 lista completa; as três escritas de `org-ana`
→ 403 `SOMENTE_PARTICIPANTE`.
16. (R27) Cancelar atividade com `confirmada`+`em_espera`+`convocada` → `GET /inscricoes`
→ todas `cancelada`; a fila não promove ninguém; a atividade cancelada rejeita nova
inscrição com `ATIVIDADE_CANCELADA`.
17. (R28, R29, R30) 10 `confirmada` + 2 `convocada` + 3 `em_espera` → `GET /atividades/:id`
mostra `ocupadas: 12`, `emEspera: 3`, `vagasRestantes: vagas−12`; PATCH reduzindo
`vagas` abaixo de 12 → 409 `VAGAS_ABAIXO_DOS_INSCRITOS`; reduzindo para exatamente 12
→ 200; cancelada a atividade → `ocupadas: 0`, `emEspera: 0`, `vagasRestantes: vagas`
(campos continuam calculados — M1 R25).

## 7. Como isto será verificado

Testes HTTP diretos, chamando a API por `fetch` via `node --test`, sem rota fora do
contrato. Cada teste sobe a API (ou usa instância rodando com `MODO_TESTE=1`), faz
`POST /_teste/reset`, anda o relógio com `PUT /_teste/relogio` e valida status e corpo
(`erro`, campos calculados, transições de status). Atividades para os testes são
criadas pelo `POST /atividades` do contrato (M1). A costura é a HTTP — a mesma que o
juiz usa. M2 consome M0 e M1; testa por fora dos módulos.

## 8. Fatias de entrega

**F1 — Criar, ler e listar** (R1, R2, R3, R4, R5, R10, R9)
`POST /atividades/:id/inscricoes` para dados válidos com vaga: 201 `Inscricao`
`confirmada` com a resposta completa (campos §3). Perfil (R1, 403), existência (R5,
404), `JA_INSCRITO` (R9) e leituras: `GET /inscricoes` (R2, só as próprias/filtro),
`GET /inscricoes/:id` (R3, de todos) e posse nas escritas (R4, 404 para inscrição
alheia).

**F2 — Lista de espera** (R10, R18)
Nascimento `em_espera` com `posicaoNaEspera` correta (R10), posições por ordem de
chegada, reindexação ao cancelar/promover/expirar e desempate por ordem de inserção
(R18). Vale para palestra (mesma regra de R10).

**F3 — Fechamento e recusas do POST** (R6, R7, R8, R11, R12, R13)
`ATIVIDADE_CANCELADA` (R7), `INSCRICOES_ENCERRADAS` com a borda de 30 min e a condição
`em_andamento`/`encerrada` (R8), `CONFLITO_DE_HORARIO` por encontro com toque aceito
(R11) sobre só `confirmada`/`convocada` (R12), `LIMITE_DE_MINICURSOS` (R13) e a ordem
completa da R6 quando mais de uma recusa ocorre.

**F4 — Convocação e expiração** (R14, R15, R16, R17)
Promoção automática do 1º da fila no instante da liberação da vaga, sem lazy (R14),
`convocadaAte` = 2h limitada pelo fechamento com borda "até X" (R15), expiração
automática em cascata sem acesso (R16) e ausência de reconvocação (R17).

**F5 — Confirmação** (R19, R20, R21, R22)
Confirmar no prazo → `confirmada` com campos null (R19), `SEM_CONVOCACAO` /
`CONVOCACAO_EXPIRADA` (R20), revalidação de conflito e limite (R21) e ordem completa
das recusas (R22).

**F6 — Cancelamento próprio** (R23, R24, R25, R26)
Cancelar `confirmada`/`em_espera`/`convocada` antes do início com borda inclusiva
(R23), `INSCRICAO_INATIVA` para `cancelada`/`expirada` (R24), efeito na fila e
promoção do próximo (R25) e prioridade `ATIVIDADE_JA_INICIADA` (R26).

**F7 — Atividade cancelada + campos do M1** (R27, R28, R29, R30)
Cancelar atividade com inscrições em vários status → todas `cancelada`, sem promoção
(R27). Conferir em `GET /atividades/:id` os campos que o M1 marcou como dependentes:
`VAGAS_ABAIXO_DOS_INSCRITOS` (R28), `ocupadas`/`vagasRestantes` inclusive pós-
cancelamento (R29) e `emEspera` (R30).