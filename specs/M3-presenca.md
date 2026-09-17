# Spec — M3 Presença por QR

## 1. Objetivo

Registrar e consultar presença nos encontros da Semana Acadêmica por QR code.
A organização emite, por encontro, um código de 6 caracteres que gira a cada
minuto; o participante o lê — online ou offline — dentro da janela do encontro e
ganha uma `Presenca`. A organização também pode registrar presença manual com
justificativa. A janela de presença é fixa e imutável: abre 15 minutos antes do
`inicio` e fecha 30 minutos depois dele (a manual vai até 2 horas depois do `fim`).

Cada regra cita a pergunta (P-xx) da entrevista `entrevistas/M3-presenca.md` que
a originou e a regra do documento (RN-xxx). Dependências de estado de inscrição e
de encontro vêm das specs de M2 e M1.

## 2. Fora de escopo

- Correção e apagamento de presença — não há rota de edição/delete. (P-18a, contrato §5)
- Check-out (saída) — não há rota de saída em M3. (P-18b, contrato §5)
- Cálculo de frequência — pertence a RN-404/RN-504 (frequência e certificados). (P-18d)
- Notificação ao participante — M3 não envia notificação. (P-18d)
- Fila offline no servidor — a fila offline vive só na tela/app; o servidor não a guarda. (P-18d)
- Alteração de encontros e troca de sala — encontros e sala não mudam após a criação da
  atividade; só título e vagas são editáveis. (P-20, P-20a, RN-110)
- Presença para quem não é participante — rotas exigem o perfil do contrato (R22). (P-18c)

## 3. Modelo

### 3.1 CodigoDoEncontro

| Campo | Tipo | Origem |
|---|---|---|
| encontroId | string | calculado — id do encontro vindo de M1 |
| codigo | string | calculado — 6 caracteres do alfabeto de R7 |
| trocaEm | datetime | calculado — próximo `hh:mm:00` do relógio |
| validoAte | datetime | calculado — `trocaEm` + 1 minuto |

### 3.2 Presenca

| Campo | Tipo | Origem |
|---|---|---|
| id | string | gerado — `pre_` + 8 hex minúsculos (contrato §1) |
| encontroId | string | derivado da rota (`/encontros/:id/`) |
| participanteId | string | derivado — `X-Usuario` na rota de QR; `participanteId` do corpo na manual |
| origem | string | calculado — `qr` \| `qr_offline` \| `manual` (R10) |
| lidoEm | datetime | informado (opcional) ou = instante do envio quando ausente/futuro |
| registradaEm | datetime | calculado — instante do envio |
| justificativa | string | informado — só na manual; `null` caso contrário |

## 4. Endpoints

| Método | Rota | Quem | Sucesso |
|---|---|---|---|
| GET | `/encontros/:id/codigo` | organização | 200 `CodigoDoEncontro` |
| POST | `/encontros/:id/presencas` | participante | 201 `Presenca` na primeira vez; 200 `Presenca` depois (repetição) |
| POST | `/encontros/:id/presencas/manual` | organização | 201 `Presenca` na primeira vez; 200 `Presenca` depois |
| GET | `/encontros/:id/presencas` | organização | 200 `[Presenca]` |

```jsonc
// POST /encontros/:id/presencas — entrada
{ "codigo": "K7M2QX", "lidoEm": "…" }        // lidoEm é opcional (contrato §5)

// POST /encontros/:id/presencas/manual — entrada
{ "participanteId": "p-carla", "justificativa": "…" }   // justificativa ausente também é JUSTIFICATIVA_OBRIGATORIA
```

## 5. Regras

R1. A janela de presença abre 15 minutos antes do `inicio`, borda incluída.
`inicio` 19:00 → 18:45:00 aceita; 18:44:59 → 422 `FORA_DA_JANELA`. (P-01, RN-301)

R2. A janela de presença fecha 30 minutos depois do `inicio` (não do `fim`),
borda incluída. `inicio` 19:00 → 19:30:00 aceita; 19:30:01 → 422 `FORA_DA_JANELA`.
(P-02, RN-301)

R3. `GET /encontros/:id/codigo` usa a mesma janela da presença: fora dela →
422 `FORA_DA_JANELA`, e a organização nem obtém o código. Atividade cancelada →
422 `ATIVIDADE_CANCELADA`. Quando as duas recusas valem ao mesmo tempo,
`ATIVIDADE_CANCELADA` vem antes de `FORA_DA_JANELA`. (P-03, P-32, RN-302)

R4. O código gira a cada minuto, alinhado ao relógio do modo de teste: de
`hh:mm:00` a `hh:mm:59` vale um código, e `trocaEm` aponta o próximo `hh:mm:00`.
Dentro do mesmo minuto, o código, o `trocaEm` e o `validoAte` são sempre os
mesmos; ao cruzar o minuto, giram. (P-04, P-29, RN-303)

R5. Um código emitido vale para o minuto atual e o anterior: `validoAte` =
`trocaEm` + 1 minuto. Ex.: código das 19:03 → `trocaEm` 19:04:00, `validoAte`
19:05:00; envio 19:04:59 aceito; no instante 19:05:00 → 422 `CODIGO_INVALIDO`.
(P-05, RN-304)

R6. Código emitido para um encontro, submetido em outro → 422 `CODIGO_INVALIDO`.
(P-19, RN-304)

R7. Alfabeto do código: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (tem L; não tem 0,
O, 1, I). O código emitido tem 6 caracteres desse alfabeto (contrato §5). A
leitura aceita minúscula e ignora espaço. Código ausente ou de tipo errado →
422 `DADOS_INVALIDOS`; caractere fora do alfabeto → 422 `CODIGO_INVALIDO`.
(P-09, RN-305)

R8. Só participante com inscrição `confirmada` registra presença, na rota de QR
ou na manual. `em_espera`, `convocada`, `cancelada` ou sem inscrição →
403 `NAO_INSCRITO`. O status da inscrição é o da **spec de M2** (P-31). (P-13,
P-26, P-31, RN-306)

R9. O envio de um `lidoEm` é aceito até 2 horas depois do `fim`, borda incluída,
contando do `fim` (não do `lidoEm`). `fim` 22:00 → envio 00:00:00 aceito;
00:00:01 → 422 `SINCRONIZACAO_TARDIA`. (P-06, RN-310)

R10. `origem` da presença: `qr` = lida e enviada na hora (sem `lidoEm`);
`qr_offline` = veio com `lidoEm`; `manual` = rota manual. (P-10, P-12, RN-315,
RN-309)

R11. Presença já registrada naquele encontro → 200 com a mesma presença, mesmo
`id`, sem criar segunda. A repetição é conferida **antes** de não inscrito, janela
e código: com presença existente, mesmo fora da janela ou com código errado → 200.
Reenvio offline do mesmo `lidoEm` → 200 com a mesma presença. (P-11, P-27,
RN-307, RN-314)

R12. Com `lidoEm`, a janela (R1/R2) e o código (R5) são conferidos no instante
da leitura; sem `lidoEm`, no instante do envio. A sincronização (R9) é sempre
conferida no envio. Ex.: `lidoEm` = `inicio` − 16 min → 422 `FORA_DA_JANELA`.
`lidoEm` no futuro não é erro — vale o instante do envio, origem continua
`qr_offline`. (P-21, P-24, P-12, RN-308, RN-301, RN-309)

R13. Na presença manual, a `justificativa` tem no mínimo 10 caracteres. Ausente,
vazia ou menor que 10 → 422 `JUSTIFICATIVA_OBRIGATORIA`; tipo errado →
422 `DADOS_INVALIDOS`. É a primeira regra de recurso conferida na manual. (P-14,
RN-311, RN-314)

R14. Limite de presenças manuais por encontro: 10% das inscrições confirmadas da
atividade, arredondando para cima; a tentativa N+1ª → 422 `LIMITE_DE_MANUAIS`.
Ex.: 20 confirmadas → 2; 21 → 3; 5 → 1. (P-07, RN-313)

R15. A janela da manual vai da abertura da janela (15 min antes do `inicio`) até
2 horas depois do `fim` — é mais longa que a janela da presença automática.
(P-15, RN-312)

R16. Ordem das verificações da presença automática (`POST /encontros/:id/presencas`):
404 `NAO_ENCONTRADO` → corpo (422 `DADOS_INVALIDOS`, contrato §1) → presença
existente (200) → não inscrito (`NAO_INSCRITO`) → sincronização tardia
(`SINCRONIZACAO_TARDIA`) → fora da janela (`FORA_DA_JANELA`) → código inválido
(`CODIGO_INVALIDO`). (P-08, P-22, P-23, RN-314)

R17. Ordem das verificações da presença manual (`POST /encontros/:id/presencas/manual`):
corpo (422 `DADOS_INVALIDOS`) → justificativa (`JUSTIFICATIVA_OBRIGATORIA`) →
presença existente (200) → não inscrito (`NAO_INSCRITO`) → fora da janela
(`FORA_DA_JANELA`) → limite de manuais (`LIMITE_DE_MANUAIS`). (P-14, P-26,
RN-311, RN-314)

R18. Com atividade cancelada, presença QR ou manual: o cancelamento cancela as
inscrições (spec de M2 — RN-217), então ninguém está `confirmada` →
403 `NAO_INSCRITO`, salvo quem já tem presença, que recebe 200. Código em
atividade cancelada → `ATIVIDADE_CANCELADA` (R3). (P-16, P-30, RN-302, RN-217,
RN-306, RN-307)

R19. `GET /encontros/:id/presencas` retorna a lista em ordem crescente de
`registradaEm`; empate por `id`. (P-17)

R20. Não há rota de edição nem de apagamento de presença — tentativa →
404 `NAO_ENCONTRADO`. (P-18a, contrato §5)

R21. Não há check-out: nenhuma rota de saída entre as rotas de M3. (P-18b,
contrato §5)

R22. Perfil das rotas: `GET /encontros/:id/codigo`, `POST /encontros/:id/presencas/manual`
e `GET /encontros/:id/presencas` são de organização → participante recebe
403 `SOMENTE_ORGANIZACAO`; `POST /encontros/:id/presencas` é de participante →
organização recebe 403 `SOMENTE_PARTICIPANTE`. (P-18c, contrato §5)

R23. Encontros e sala não mudam depois de criada a atividade — só título e vagas
(PATCH de M1). A janela de um encontro é fixa por construção e nunca muda nem
invalida códigos já emitidos. (P-20, P-20a, RN-110)

R24. Presenças continuam listadas depois do cancelamento da atividade: presença é
histórico e não há apagamento (R20). Cancelar cancela inscrições, não presenças.
(P-25, RN-217, P-18a)

## 6. Critérios de aceite

1. (R1, R16) Relógio 18:44:59, `inicio` 19:00 → POST `/encontros/:id/presencas`
   com código válido → 422 `FORA_DA_JANELA`; em 18:45:00 → 201.
2. (R2, R16) Relógio 19:30:00 → 201; 19:30:01 → 422 `FORA_DA_JANELA`.
3. (R3) `GET /encontros/:id/codigo` em 18:45:00 (15 min antes do `inicio`) → 200;
   em 18:44:59 → 422 `FORA_DA_JANELA`; atividade cancelada → 422 `ATIVIDADE_CANCELADA`,
   inclusive fora da janela (cancelada + 18:44:59 → `ATIVIDADE_CANCELADA`, P-32).
4. (R4, P-29) Dois `GET` no mesmo minuto → mesmo `codigo`, `trocaEm` e `validoAte`;
   cruzar o minuto → `trocaEm` = próximo `hh:mm:00` e código novo.
5. (R5) Código das 19:03; envio 19:04:59 → 201; envio 19:05:00 → 422 `CODIGO_INVALIDO`.
6. (R6) Código emitido para `enc_1`, enviado em `enc_2` → 422 `CODIGO_INVALIDO`.
7. (R7) Código em minúscula → 201; com espaço → 201; um dos caracteres proibidos
   (0, O, 1, I) no lugar → 422 `CODIGO_INVALIDO`; `codigo` ausente →
   422 `DADOS_INVALIDOS`.
8. (R8, R16) Participante com inscrição `em_espera`, `convocada` ou `cancelada`,
   ou sem inscrição → 403 `NAO_INSCRITO`; `confirmada` → 201. (status da spec de M2)
9. (R9, R12) `lidoEm` 19:10 (dentro da janela), `fim` 22:00: envio 00:00:00
   (= `fim` + 2h, borda) → 201; envio 00:00:01 → 422 `SINCRONIZACAO_TARDIA`.
10. (R10) POST sem `lidoEm` → `origem` `qr`; com `lidoEm` → `qr_offline`; rota
    manual → `manual`.
11. (R11) Repetir POST → 200 com o mesmo `id`; presença existente + fora da janela
    → 200; presença existente + código errado → 200; reenvio com o mesmo `lidoEm`
    → 200 com o mesmo `id`, e a lista tem uma só presença.
12. (R12) `lidoEm` = envio + 1 min → 201, grava o instante do envio, origem
    `qr_offline`; `lidoEm` = `inicio` − 16 min → 422 `FORA_DA_JANELA`.
13. (R13) Manual com `justificativa` ausente, vazia ou `"abc"` →
    422 `JUSTIFICATIVA_OBRIGATORIA`; tipo errado → 422 `DADOS_INVALIDOS`;
    `"justificativa de 10+"` → segue.
14. (R14) `N` = teto(10% das confirmadas); N manuais aceitas; a N+1ª →
    422 `LIMITE_DE_MANUAIS`.
15. (R15) Manual em 20:00 (após 19:30, dentro de `fim` 22:00 + 2h) → 201; após
    `fim` + 2h → 422 `FORA_DA_JANELA`.
16. (R16) Fora da janela + código errado → 422 `FORA_DA_JANELA`; não inscrito +
    fora da janela + código válido → 403 `NAO_INSCRITO`; código errado + envio
    tardio → 422 `SINCRONIZACAO_TARDIA`; encontro inexistente → 404 `NAO_ENCONTRADO`.
17. (R17) Manual de participante `em_espera` com justificativa curta →
    422 `JUSTIFICATIVA_OBRIGATORIA` (justificativa primeiro); com justificativa
    válida → 403 `NAO_INSCRITO`.
18. (R18) Cancelar a atividade; POST de quem já tem presença → 200; de quem não
    tem → 403 `NAO_INSCRITO`; `GET /encontros/:id/codigo` → 422 `ATIVIDADE_CANCELADA`.
19. (R19) Duas presenças → lista em ordem crescente de `registradaEm`; empate →
    ordem por `id`.
20. (R20, R21) Tentar rota de edição/apagamento de presença ou de check-out →
    404 `NAO_ENCONTRADO`.
21. (R22) Organização em `POST /encontros/:id/presencas` → 403 `SOMENTE_PARTICIPANTE`;
    participante em `GET /encontros/:id/codigo` → 403 `SOMENTE_ORGANIZACAO`.
22. (R23) Emitido um código e feito PATCH de título/vagas em M1, `GET` no mesmo
    minuto → mesmo código, janela e validade inalterados.
23. (R24) Registrar presença; cancelar a atividade; `GET /encontros/:id/presencas`
    → a presença continua na lista.

## 7. Como isto será verificado

Testes HTTP diretos, chamando a API por `fetch` via `node --test`, sem rota fora
do contrato. Cada teste sobe a API (ou usa instância rodando com `MODO_TESTE=1`),
faz `POST /_teste/reset`, anda o relógio com `PUT /_teste/relogio` e valida status
e corpo (`erro`, `origem`, `id`, ordem da lista). Os testes dependem de M1 e M2
para criar atividade/encontros e inscrições com os mesmos `POST` do contrato — a
costura é a HTTP, a mesma que o juiz usa.

## 8. Fatias de entrega

Dependências transversais: M0 (identificação, relógio, formato de erro) e M1
(atividades e encontros). A partir de F2, também M2 (inscrições e `confirmacao`).

**F1 — Emitir o código do encontro** (R3, R4, R5, R7 emitido, R22 parcial, R23)
Implementar `GET /encontros/:id/codigo`: código de 6 caracteres do alfabeto de R7,
mesmo código dentro do minuto, giro ao cruzar o minuto, `trocaEm` e `validoAte`,
`FORA_DA_JANELA`, `ATIVIDADE_CANCELADA` e `SOMENTE_ORGANIZACAO`. Depende de M1
para existir um encontro.

**F2 — Presença QR online** (R1, R2, R6, R7 leitura, R8, R10 `qr`, R11, R16, R22)
Implementar `POST /encontros/:id/presencas` sem `lidoEm`: 201 na primeira vez com
`origem` `qr` (R10), janela (R1/R2), código válido, de outro encontro e alfabeto
(R5/R6/R7), inscrição confirmada (R8), repetição 200 (R11), ordem das verificações
(R16) e `SOMENTE_PARTICIPANTE`. Depende de M1 + M2.

**F3 — Presença offline** (R9, R10, R12, R18)
Com `lidoEm` no corpo: origem `qr_offline`, sincronização tardia (R9), janela e
código no instante da leitura (R12), `lidoEm` futuro (R12/R10) e atividade
cancelada (R18).

**F4 — Presença manual** (R13, R14, R15, R17)
Implementar `POST /encontros/:id/presencas/manual`: justificativa (R13), limite de
manuais (R14), janela manual (R15), ordem da manual (R17), inscrição confirmada
(R8) e `SOMENTE_ORGANIZACAO`.

**F5 — Lista de presenças** (R19, R20, R21, R22, R24)
Implementar `GET /encontros/:id/presencas`: ordem por `registradaEm`/`id` (R19),
lista persiste após cancelamento (R24) e ausência de rotas de edição, apagamento
e check-out — qualquer tentativa responde 404 (R20, R21).