# Spec — M1 Grade de atividades

## 1. Objetivo

Criar, listar/filtrar, alterar e cancelar as atividades (palestras e minicursos) da
Semana Acadêmica. O M1 é dono da grade: dados cadastrais (`titulo`, `tipo`, `salaId`,
`vagas`, `encontros`), da carga horária calculada e da `situacao` da atividade
(`prevista` | `em_andamento` | `encerrada` | `cancelada`), que nasce do relógio do modo
de teste.

Cada regra cita a pergunta (P-xx) da entrevista `entrevistas/M1-grade.md` que a
originou e a regra do documento (RN-xxx). Quando o documento não define a regra, a
fonte é registrada como `documento silente — decisão do grupo, 2026-09-17` — a decisão
é do grupo, não do cliente.

## 2. Fora de escopo

- Login, mais de um evento, pagamento, e-mail/push e certificado em PDF. (P-34)
- Alteração de encontros e troca de sala — o PATCH não aceita esses campos (R15/R16). (P-34, RN-110)
- Inscrição feita pela organização, check-out e importação de planilha. (P-34)
- `DELETE` de atividade ou encontro e criação/edição de sala — não há rota. (P-34)
- Inscrições e lista de espera (M2), presença (M3), certificados (M4) e painel (M5). (P-34)
- Identificação, formato de erro, formato de data/id e dados iniciais — já definidos
  pela spec de M0 (contrato §1, §3, §4). Não se repetem aqui.

## 3. Modelo

### 3.1 Atividade

| Campo | Tipo | Origem |
|---|---|---|
| id | string | gerado — `atv_` + 8 hex minúsculos (M0, contrato §1) |
| titulo | string | informado — sem restrição; duplicado permitido (R35) |
| tipo | string | informado — `"palestra"` \| `"minicurso"` (R4) |
| salaId | string | informado — referencia `Sala` dos dados iniciais (M0); inexistente → 404 (R3) |
| vagas | integer | informado — mínimo 1, máximo `capacidade` da sala (R10, R11) |
| encontros | [Encontro] | informado — quantidade por tipo (R5); imutáveis após criar (R34) |
| cargaHorariaMinutos | integer | calculado — soma de `(fim − início)` em minutos (R28) |
| situacao | string | calculado — `"prevista"` \| `"em_andamento"` \| `"encerrada"` \| `"cancelada"` (R21, R22) |
| ocupadas | integer | calculado — `confirmada` + `convocada` (R37; M2 R29) |
| vagasRestantes | integer | calculado — `vagas` − `ocupadas` (R29) |
| emEspera | integer | calculado — inscrições `em_espera` em ordem de `posicaoNaEspera` (R38; M2 R30) |

### 3.2 Encontro

| Campo | Tipo | Origem |
|---|---|---|
| id | string | gerado — `enc_` + 8 hex minúsculos (M0, contrato §1); nunca muda (R34) |
| inicio | datetime | informado |
| fim | datetime | informado |

## 4. Endpoints

| Método | Rota | Quem | Sucesso |
|---|---|---|---|
| GET | `/atividades` | todos | 200 `[Atividade]` — filtros `?dia=AAAA-MM-DD` e `?tipo=palestra\|minicurso` |
| GET | `/atividades/:id` | todos | 200 `Atividade` |
| POST | `/atividades` | organização | 201 `Atividade` |
| PATCH | `/atividades/:id` | organização | 200 `Atividade` |
| POST | `/atividades/:id/cancelamento` | organização | 200 `Atividade` |

```jsonc
// POST /atividades — entrada (contrato §5)
{
  "titulo": "Flutter do zero",
  "tipo": "minicurso",
  "salaId": "lab-3",
  "vagas": 20,
  "encontros": [
    { "inicio": "2026-10-19T19:00:00-03:00", "fim": "2026-10-19T22:00:00-03:00" }
  ]
}

// PATCH /atividades/:id — entrada: `titulo` e/ou `vagas` (R15, R16); qualquer outro
// campo, inclusive fora do contrato (ex.: `cargaHorariaMinutos`), → CAMPO_NAO_EDITAVEL (R16)
```

O `GET /salas`, já definido na spec de M0, não se repete.

## 5. Regras

### Perfil e existência

R1. Escrita (`POST /atividades`, `PATCH /atividades/:id`, `POST /atividades/:id/cancelamento`)
é de organização; participante → `403 SOMENTE_ORGANIZACAO`. Os GETs de M1 são de todos.
(P-01, contrato §5)

R2. `GET /atividades/:id`, `PATCH /atividades/:id` e `POST /atividades/:id/cancelamento`
em id inexistente → `404 NAO_ENCONTRADO`. (P-02, contrato §1, §6)

R3. `POST /atividades` com `salaId` inexistente (fora dos dados iniciais, ex. `sala-xyz`)
→ `404 NAO_ENCONTRADO`, na etapa de existência do contrato §1. (P-35, documento silente —
decisão do grupo, 2026-09-17). Vale até resposta no Classroom; se a resposta divergir,
a regra muda junto com o teste.

### Criação (POST /atividades)

R4. O corpo exige `titulo`, `tipo`, `salaId`, `vagas` e `encontros`. Ausente, não-JSON
ou de tipo errado, e `tipo` fora de `palestra`\|`minicurso` → `422 DADOS_INVALIDOS`.
(P-03, contrato §1, §5)

R5. Quantidade de encontros por tipo: palestra tem exatamente 1 encontro (RN-102);
minicurso de 2 a 5 (RN-103). Fora disso → `422 QUANTIDADE_DE_ENCONTROS`. (P-11,
RN-102, RN-103)

R6. Duração de cada encontro entre 1h (piso) e 4h (teto), inclusive, para qualquer
tipo. Encontro com `fim` igual ou anterior ao `inicio` não passa (ficaria abaixo do
piso) → `422 ENCONTRO_INVALIDO`. (P-12, RN-104)

R7. Cada encontro começa e termina no mesmo dia, inteiramente dentro de 19–23/10/2026
(RN-105). Atravessar a meia-noite é inválido (ex.: 23:00–00:30) → `422 ENCONTRO_INVALIDO`.
Criar atividade com encontro que já começou (início antes do relógio) **não é proibido**
→ 201. (P-13, RN-105)

R8. Não há restrição de dia da semana nem de faixa horária dentro do dia. A única
exigência é um único dia, dentro de 19–23/10/2026 (R7). Sábado/domingo do evento e
qualquer horário do dia são válidos. (P-14, RN-105)

R9. Encontros da mesma atividade não podem se sobrepor (RN-106). Toque (`fim` de um =
`inicio` de outro) conta como sobreposição → `422 ENCONTRO_INVALIDO`. (P-15, RN-106;
documento silente — decisão do grupo, 2026-09-17 para o toque). Vale até resposta no
Classroom; se a resposta divergir, a regra muda junto com o teste.

R10. `vagas` ≤ `capacidade` da sala; lotar exatamente até a capacidade é permitido.
Acima → `422 VAGAS_ACIMA_DA_CAPACIDADE`. (P-16, RN-107; P-05, contrato §6)

R11. `vagas` mínimo 1 (0 não é aceito). Vagas 0, negativa ou fracionária →
`422 DADOS_INVALIDOS` (a fracionária já é tipo errado, contrato §1; 0/negativa pela
decisão). (P-17, RN-107; documento silente — decisão do grupo, 2026-09-17). Vale até
resposta no Classroom; se a resposta divergir, a regra muda junto com o teste.

R12. Conflito de sala avaliado por encontro individual na mesma sala (RN-108). Deve
haver ≥ 15 min entre o fim de um encontro e o início do seguinte: começar 10:14 após
fim 10:00 → `409 CONFLITO_DE_SALA`; 10:15 → aceito. Toque (10:00→10:00) é conflito,
pois não respeita os 15 min. (P-18, RN-108)

R13. Cancelamento libera a sala: encontros de atividade cancelada não contam para
conflito de sala. (P-19, RN-108)

R14. Ordem das recusas no POST (quando mais de uma regra do recurso recusa a mesma
criação): `QUANTIDADE_DE_ENCONTROS` → `ENCONTRO_INVALIDO` → `VAGAS_ACIMA_DA_CAPACIDADE`
→ `CONFLITO_DE_SALA`. (P-32, documento silente — decisão do grupo, 2026-09-17). Vale até
resposta no Classroom; se a resposta divergir, a regra muda junto com o teste.

### Alteração (PATCH /atividades/:id)

R15. PATCH é permitido só antes de a atividade começar (`situacao` ainda `prevista`).
Desde a criação, só `titulo` e `vagas` são editáveis (RN-110); como `em_andamento`
começa no início do 1º encontro (RN-114), não há alteração após o início. Campo não
permitido ou PATCH após o início → `422 CAMPO_NAO_EDITAVEL`. (P-10, RN-110, RN-114)

R16. `tipo`, `salaId` e `encontros` não podem ser alterados (RN-110). Campo fora do
contrato no corpo (ex.: `cargaHorariaMinutos`) → `422 CAMPO_NAO_EDITAVEL`. Como
`salaId`/`encontros` não são editáveis, a validação de conflito/encontro da criação
não se reaplica no PATCH. (P-20, RN-110; documento silente — decisão do grupo,
2026-09-17 para o campo fora do contrato). Vale até resposta no Classroom; se a
resposta divergir, a regra muda junto com o teste.

R17. `vagas ≤ capacidade` também vale ao alterar — PATCH elevando `vagas` além da
capacidade → `422 VAGAS_ACIMA_DA_CAPACIDADE`. (P-05, contrato §6; P-16, RN-107)

R18. Ordem das recusas no PATCH (422 × 409): `ATIVIDADE_CANCELADA` → `CAMPO_NAO_EDITAVEL`
→ `VAGAS_ACIMA_DA_CAPACIDADE` → `VAGAS_ABAIXO_DOS_INSCRITOS`. (P-33, documento silente —
decisão do grupo, 2026-09-17). Vale até resposta no Classroom; se a resposta divergir,
a regra muda junto com o teste.

R36. PATCH reduzindo `vagas` abaixo do nº de ocupantes → `409 VAGAS_ABAIXO_DOS_INSCRITOS`;
reduzindo para exatamente o nº de ocupantes → 200. Ocupante = inscrição `confirmada` ou
`convocada`; `em_espera`, `cancelada` e `expirada` não ocupam (M2 R28). (P-26; decidido por
M2 R28)

### Cancelamento e situação

R19. PATCH e novo cancelamento em atividade cancelada → `422 ATIVIDADE_CANCELADA`.
Cancelar atividade já iniciada → `422 ATIVIDADE_JA_INICIADA`. (P-06, contrato §6)

R20. Só se cancela antes de a atividade começar (RN-112). "Começou" = relógio chegou
ao instante do início do 1º encontro, inclusive: antes → cancelamento 200; no instante
exato → `422 ATIVIDADE_JA_INICIADA`; depois → idem. (P-21, RN-112)

R21. Transições automáticas pelo relógio (RN-114): `prevista` → `em_andamento` no
início do 1º encontro, inclusive; `em_andamento` → `encerrada` no fim do último
encontro da atividade (não o fim do evento). (P-22, RN-114)

R22. `cancelada` prevalece sobre todas as outras (RN-114); como só se cancela antes de
começar (RN-112), cancelada nasce só de `prevista`. No instante exato do início do 1º
encontro, o GET já reporta `em_andamento`. (P-23, RN-114, RN-112)

R23. Leitura de cancelada é permitida: `GET /atividades/:id` → 200 com
`situacao: "cancelada"`. (P-09, contrato §6)

R24. Atividade cancelada: não pode ser alterada nem cancelada de novo (RN-113); não
aceita inscrição (RN-203); não gera código de presença (RN-302); não gera certificado
(RN-402); todas as inscrições ativas são canceladas (RN-217). (P-24, RN-113, RN-203,
RN-302, RN-402, RN-217)

R25. Os campos calculados continuam sendo calculados depois do cancelamento. (P-24,
documento silente — decisão do grupo, 2026-09-17). Vale até resposta no Classroom; se a
resposta divergir, a regra muda junto com o teste.

### Campos calculados

R26. Os encontros vêm na resposta em ordem crescente de início, desde a criação.
(P-04, contrato §5)

R27. `cargaHorariaMinutos` é calculado; a organização pode enviá-lo no corpo, mas o
valor é ignorado — o campo retornado sempre reflete a soma. (P-07, RN-109)

R28. `cargaHorariaMinutos` = soma de `(fim − início)` de todos os encontros, em
minutos (RN-109). Sem arredondamento, teto ou mínimo sobre a soma; não varia por tipo.
(P-25, RN-109)

R29. `vagasRestantes` = `vagas` − `ocupadas`. `ocupadas` conta o que ocupa vaga:
`confirmada` e `convocada`; `em_espera`, `cancelada` e `expirada` não ocupam (M2 R28). (P-08,
contrato §5; decidido por M2 R28/R29)

R37. `ocupadas` conta as inscrições que ocupam vaga: `confirmada` + `convocada`.
`em_espera`, `cancelada` e `expirada` não ocupam. Com a atividade cancelada, `ocupadas`
continua calculado e vale 0 — todas as ativas viraram `cancelada` (M2 R27) e `cancelada`
não ocupa vaga (R24, R25; M2 R29). (P-27; decidido por M2 R28/R29)

R38. `emEspera` conta as inscrições `em_espera` da atividade, em ordem de
`posicaoNaEspera` (ordem de chegada). `cancelada`/`expirada`/`convocada` não entram.
(P-27; decidido por M2 R30)

### Listagem (GET /atividades)

R30. A listagem vem ordenada por início do 1º encontro; empate por `titulo` (RN-115).
Não é por ordem de criação. (P-28, RN-115)

R31. Atividade cancelada aparece na listagem e nos filtros (RN-115); os filtros
dia/tipo não a excluem — excluir canceladas é só do painel da organização (RN-502,
M5). (P-29, RN-115, RN-502)

R32. `?dia=AAAA-MM-DD` retorna atividades com ≥ 1 encontro naquele dia (fuso de
Brasília) (RN-116). Encontro que atravessa a meia-noite nunca aparece em dois dias —
esse encontro é inválido na criação (R7). (P-30, RN-116, RN-105)

R33. `?dia` + `?tipo` combinam em AND (RN-116). Parâmetro com valor inválido (dia fora
de `AAAA-MM-DD` ou tipo fora de `palestra`\|`minicurso`) → `422 DADOS_INVALIDOS`.
(P-31, RN-116; documento silente — decisão do grupo, 2026-09-17). Vale até resposta no
Classroom; se a resposta divergir, a regra muda junto com o teste.

### Campos do POST não editáveis

R34. Encontros e sala não mudam depois da criação: o PATCH não aceita esses campos
(R15/R16) e os `id` `enc_xxxxxxxx` nunca são preservados/regenerados/recriados — por
construção, nunca mudam. (P-36, RN-110)

R35. `titulo` sem restrição: aceita qualquer string (inclusive vazio ou 1 caractere)
e duas atividades podem ter o mesmo título; não há código de erro do campo — as únicas
regras são alterável (RN-110, R15) e desempate na listagem (RN-115, R30). (P-37,
documento silente — decisão do grupo, 2026-09-17). Vale até resposta no Classroom; se a
resposta divergir, a regra muda junto com o teste.

## 6. Critérios de aceite

1. (R1) POST `/atividades` com `X-Usuario: p-carla` → 403 `SOMENTE_ORGANIZACAO`;
   GET /atividades com qualquer usuário → 200.
2. (R2) PATCH e cancelamento em `atv_00000000` → 404 `NAO_ENCONTRADO`.
3. (R4) POST sem `titulo` → 422 `DADOS_INVALIDOS`; `tipo: "oficina"` → idem.
4. (R3) POST com `salaId: "sala-xyz"` → 404 `NAO_ENCONTRADO`.
5. (R5) POST palestra com 2 encontros → 422 `QUANTIDADE_DE_ENCONTROS`; minicurso
   com 1 → idem; minicurso com 6 → idem; palestra com 1 → 201.
6. (R6) Encontro de 30 min → 422 `ENCONTRO_INVALIDO`; de 5h → idem; `fim` = `inicio`
   → idem; encontro de 3h → 201.
7. (R7) Encontro em 17/10 (sábado, fora da janela) → 422 `ENCONTRO_INVALIDO`;
   23:00–00:30 (meia-noite) → idem; início antes do relógio → 201 (não proibido).
8. (R8) Encontro às 02h de um dia do evento → 201 (sem restrição de faixa horária).
9. (R9) Encontro D dentro da janela de E (mesma atividade) → 422 `ENCONTRO_INVALIDO`;
   fim de D = início de E → idem.
10. (R10, R11) `vagas: 41` em `sala-101` (cap. 40) → 422 `VAGAS_ACIMA_DA_CAPACIDADE`;
    `vagas: 40` → 201; `vagas: 0` → 422 `DADOS_INVALIDOS`; `vagas: -1` → idem;
    `vagas: 1.5` → idem.
11. (R12) B com encontro começando 10:14 após fim 10:00 de A na mesma sala →
    409 `CONFLITO_DE_SALA`; 10:15 → 201; toque 10:00→10:00 → 409.
12. (R13) Cancelar A (sala X, horário H) e criar B em X/H → 201.
13. (R14) POST violando quantidade + encontro + vagas + conflito → código da 1ª regra
    na ordem definida; testar cada par para confirmar a sequência.
14. (R15, R16, R18) PATCH com `tipo`/`salaId`/`encontros`/`cargaHorariaMinutos` →
    422 `CAMPO_NAO_EDITAVEL`; PATCH só `titulo` → 200; PATCH com 1º encontro já começado
    (relógio) → 422 `CAMPO_NAO_EDITAVEL`; PATCH em cancelada → 422 `ATIVIDADE_CANCELADA`
    (vence o `CAMPO_NAO_EDITAVEL` da ordem).
15. (R17) PATCH elevando `vagas` além da capacidade → 422 `VAGAS_ACIMA_DA_CAPACIDADE`.
16. (R19, R20) Cancelar depois do início ou no instante exato → 422 `ATIVIDADE_JA_INICIADA`;
    cancelamento em cancelada → 422 `ATIVIDADE_CANCELADA`; 1 min antes → 200.
17. (R21) Relógio = início do 1º encontro → GET mostra `em_andamento`; relógio = fim do
    último encontro → `encerrada`; conferir o instante exato e o imediatamente anterior.
18. (R22, R23) Cancelar; GET /:id → 200 com `situacao: "cancelada"`.
19. (R24, R25) Cancelar atividade com inscrições; GET /:id → `situacao` cancelada e os
    campos calculados continuam calculados (valores exatos dependem de M2 — R37/R38).
20. (R26, R27, R28) Criar com encontros fora de ordem → resposta em ordem de início;
    `cargaHorariaMinutos` de 2 encontros de 3h → 360; enviar 999 no campo → retorno
    continua 360; encontros de 90+75 min → 165 (sem arredondamento).
21. (R29, R37) Atividade com 10 `confirmada` + 2 `convocada` + 3 `em_espera` →
    `vagasRestantes` = `vagas` − 12 (M2 critério 17).
22. (R30, R31) Criar 3 atividades com 1ºs encontros distintos → GET na ordem da RN-115;
    empate → por `titulo`; cancelar uma → continua na listagem e nos filtros.
23. (R32) Atividade com encontros em 19 e 20 → `?dia=2026-10-20` retorna; sem encontro
    naquele dia → não retorna.
24. (R33) `?dia=2026-10-19&tipo=minicurso` → só minicursos do dia 19; `?dia=abc` →
    422 `DADOS_INVALIDOS`; `?tipo=oficina` → idem.
25. (R34, R35) PATCH tentando mexer em encontro → `CAMPO_NAO_EDITAVEL`; `enc_...` do
    GET posterior é o mesmo id; `titulo` vazio/1 caractere → 201; títulos duplicados
    → 201.
26. (R36, R37, R38) PATCH reduzindo `vagas` abaixo de `ocupadas` (`confirmada` +
    `convocada`) → 409 `VAGAS_ABAIXO_DOS_INSCRITOS`; reduzindo para exatamente o nº de
    ocupantes → 200. `GET /atividades/:id` mostra `ocupadas`, `emEspera` e
    `vagasRestantes` calculados; cancelada a atividade, `ocupadas: 0` e `emEspera: 0`
    (M2 critério 17).

## 7. Como isto será verificado

Testes HTTP diretos, chamando a API por `fetch` via `node --test`, sem rota fora do
contrato. Cada teste sobe a API (ou usa instância rodando com `MODO_TESTE=1`), faz
`POST /_teste/reset`, anda o relógio com `PUT /_teste/relogio` e valida status e corpo
(`erro`, campos calculados, ordem da lista). A costura é a HTTP — a mesma que o juiz
usa. M1 só depende de M0; testes usam só rotas do contrato.

## 8. Fatias de entrega

**F1 — Criar e ler atividade** (R1, R2, R3, R4, R26, R27, R28)
Implementar `POST /atividades` para dados válidos: 201 com `Atividade` completa,
encontros em ordem (R26), `cargaHorariaMinutos` correto (R27/R28) e `situacao: "prevista"`.
Perfil (R1, 403 para participante), corpo (R4, DADOS_INVALIDOS), `salaId` inexistente
(R3, 404) e leituras `GET /atividades` e `GET /atividades/:id` (R2, 404 em id inexistente).
Esta fatia fecha também o `POST /atividades` que a fatia F5 de M0 aguardava.

**F2 — Validações da criação** (R5, R6, R7, R8, R9, R11, R14)
Quantidade por tipo (R5), duração 1h–4h e `fim` ≤ `inicio` (R6), período/mesmo
dia/meia-noite e criação com encontro já iniciado (R7), ausência de restrição de
dia/faixa (R8), sobreposição e toque na mesma atividade (R9), mínimo de vagas e
fracionário (R11). Conferir a ordem de R14 quando duas regras recusam a mesma criação.

**F3 — Vagas e conflito de sala** (R10, R12, R13, R17)
Capacidade e lotação máxima (R10), conflito por encontro individual com 15 min
(R12), cancelada libera a sala (R13). No PATCH, `VAGAS_ACIMA_DA_CAPACIDADE` (R17).

**F4 — Alterar atividade** (R15, R16, R18, R34, R35)
PATCH só `titulo`/`vagas` em `prevista` (R15), `CAMPO_NAO_EDITAVEL` para os demais e
para campo fora do contrato (R16), ordem R18 (incluindo `ATIVIDADE_CANCELADA`),
imutabilidade de encontros/sala e ids `enc_` (R34) e `titulo` sem restrição (R35).
`VAGAS_ABAIXO_DOS_INSCRITOS` (R36) é verificado com o M2 (M2 critério 17).

**F5 — Cancelamento e situação** (R19, R20, R21, R22, R23, R24, R25)
Cancelar antes de começar com borda inclusive (R20), `ATIVIDADE_JA_INICIADA` e
`ATIVIDADE_CANCELADA` (R19), transições de `situacao` pelo relógio (R21), prevalência
de `cancelada` e leitura 200 (R22, R23), pós-cancelamento: proibições (R24) e campos
calculados que continuam calculados (R25).

**F6 — Listagem e filtros** (R30, R31, R32, R33)
Ordem por 1º encontro com desempate por `titulo` (R30), canceladas na listagem e nos
filtros (R31), `?dia` com fuso Brasília (R32), `?dia`+`?tipo` em AND e inválidos →
DADOS_INVALIDOS (R33).