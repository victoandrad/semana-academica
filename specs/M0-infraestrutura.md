# Spec — M0 Infraestrutura

## 1. Objetivo

Fornecer a base sobre a qual M1 a M3 se apoiam: servidor HTTP, identificação do
usuário pelo cabeçalho, formato único de erro, formato de identificadores e datas,
dados iniciais (10 usuários e 4 salas), leitura de salas e rotas de teste com relógio
congelado.

Toda regra abaixo é **citada direto do contrato** — esta spec não nasce de entrevista,
porque a base não tem regra de negócio própria. A notação `(contrato §X)` indica a seção
do contrato de onde a regra veio, para que o auditor não a marque como SEM ORIGEM.

## 2. Fora de escopo

- Atividades, encontros, inscrições, presenças, certificados e painel — tudo isso é
  módulo de negócio (M1 a M5).
- Qualquer regra com prazo, limite, janela ou tolerância — essas nascem da entrevista
  de cada módulo, não desta spec.
- Perfis de acesso (403 SOMENTE_ORGANIZACAO / SOMENTE_PARTICIPANTE) — quando
  aplicável, cada módulo define suas rotas.

## 3. Modelo

### 3.1 Evento

| Campo | Tipo | Origem |
|---|---|---|
| nome | string | informado — "Semana Acadêmica 2026" |
| inicio | date | informado — 2026-10-19 (segunda) |
| fim | date | informado — 2026-10-23 (sexta) |
| fuso | string | informado — Brasília (−03:00) |

### 3.2 Usuario

| Campo | Tipo | Origem |
|---|---|---|
| id | string | informado — ex.: `org-ana`, `p-carla` |
| nome | string | informado |
| papel | string | informado — `"organizacao"` ou `"participante"` |

### 3.3 Sala

| Campo | Tipo | Origem |
|---|---|---|
| id | string | informado — ex.: `auditorio`, `sala-101` |
| nome | string | informado |
| capacidade | integer | informado |

## 4. Endpoints

### 4.1 Dados e leitura

| Método | Rota | Quem | Sucesso |
|---|---|---|---|
| GET | `/salas` | todos | 200 `[Sala]` |

### 4.2 Modo de teste

| Método | Rota | Quem | Sucesso |
|---|---|---|---|
| POST | `/_teste/reset` | — | 204 |
| PUT | `/_teste/relogio` | — | 200 `{"agora": "<ISO>"}` |
| GET | `/_teste/relogio` | — | 200 `{"agora": "<ISO>"}` |

## 5. Regras

R1. A API escuta na porta indicada pela variável de ambiente `PORT`, com valor padrão
3000. (contrato §2)

R2. Entrada e saída são JSON UTF-8. (contrato §1)

R3. Toda rota exigindo identificação recebe o cabeçalho `X-Usuario: <id>`. Rotas
`GET /certificados/:codigo` e `/_teste/*` não exigem. (contrato §1)

R4. Sem cabeçalho `X-Usuario` ou com id inexistente → `401 USUARIO_DESCONHECIDO`.
(contrato §1)

R5. Corpo que não é JSON, campo obrigatório ausente ou de tipo errado →
`422 DADOS_INVALIDOS`. (contrato §1)

R6. O formato de erro é sempre `{"erro": "CODIGO", "mensagem": "texto livre"}`.
O juiz confere status e `erro`; a mensagem é livre. (contrato §1)

R7. A ordem das verificações é: identificação (401) → perfil (403) → existência (404)
→ corpo (422) → regras do recurso. (contrato §1)

R8. Datas usam ISO 8601 com fuso — ex.: `2026-10-19T19:00:00-03:00` ou
`2026-10-19T22:00:00Z`. A API pode responder em qualquer fuso; o juiz compara o
instante, não o texto. (contrato §1)

R9. Identificadores gerados seguem o formato: prefixo + 8 hexadecimais minúsculos —
ex.: `atv_1a2b3c4d`, `enc_5e6f7a8b`, `ins_9c0d1e2f`, `pre_3a4b5c6d`. (contrato §1)

R10. Os dados iniciais são 10 usuários e 4 salas conforme tabela do contrato §4.
Eles são carregados na primeira subida da API e a cada `POST /_teste/reset`.
Não há rota para criar usuário ou sala. (contrato §4)

R11. `GET /salas` retorna 200 com o array `[Sala]` dos dados iniciais. Não há
filtros, paginação nem criação por rota. (contrato §5, rota M1 — GET /salas)

R12. Com `MODO_TESTE=1` no ambiente, a API expõe as rotas `/_teste/*`. Sem
`MODO_TESTE`, as rotas `/_teste/*` respondem 404. (contrato §3)

R13. `POST /_teste/reset` → 204. Apaga tudo, recarrega dados iniciais (R10) e põe o
relógio em `2026-10-13T09:00:00-03:00`. (contrato §3)

R14. `PUT /_teste/relogio` recebe `{"agora": "<ISO>"}` no corpo e responde
`{"agora": "<ISO>"}` com o valor recebido. O relógio da API avança para esse instante.
(contrato §3)

R15. `GET /_teste/relogio` retorna `{"agora": "<ISO>"}` com o instante atual do
relógio de teste. (contrato §3)

R16. No modo de teste, o relógio fica parado: só muda por `PUT /_teste/relogio`.
Toda regra que depende de tempo usa esse relógio — nunca a hora do sistema direto.
(contrato §3)

R17. O juiz sempre começa com `POST /_teste/reset` e depois só avança o relógio.
(contrato §3)

R18. A API não depende de serviço externo: banco embutido (SQLite ou arquivo), nada
de servidor de banco, Docker ou nuvem. (contrato §2)

## 6. Critérios de aceite

1. (R1, R18) API inicia com `npm start` sem serviço externo, escuta na porta 3000.
2. (R4) GET `/salas` sem cabeçalho → 401 `USUARIO_DESCONHECIDO`.
3. (R4) GET `/salas` com `X-Usuario: inexistente` → 401 `USUARIO_DESCONHECIDO`.
4. (R10, R11) GET `/salas` com `X-Usuario: p-carla` → 200, array com 4 salas.
5. (R5) PUT `/_teste/relogio` com corpo não-JSON → 422 `DADOS_INVALIDOS`.
6. (R6) Qualquer erro retorna `{"erro": "...", "mensagem": "..."}`.
7. (R9) Identificadores gerados seguem prefixo + 8 hex minúsculos.
8. (R12) GET `/_teste/relogio` sem `MODO_TESTE=1` → 404.
9. (R13) POST `/_teste/reset` → 204; GET `/salas` em seguida retorna 4 salas.
10. (R14) PUT `/_teste/relogio` com `{"agora": "2026-10-20T10:00:00-03:00"}` → 200, `{"agora": "2026-10-20T10:00:00-03:00"}`.
11. (R15) GET `/_teste/relogio` retorna o último horário definido por PUT.
12. (R16) Após PUT para 10:00, sem novo PUT, o relógio continua em 10:00.

## 7. Como isto será verificado

Testes HTTP diretos, chamando a API por `fetch` (ou equivalente) via `node --test`.
Cada teste sobe a API ou usa uma instância já rodando, envia requisições e valida
status e corpo da resposta. A costura é a HTTP — a mesma que o juiz usa.

## 8. Fatias de entrega

**F1 — Servidor sobe na porta certa**
Levantar Express e ler `PORT` do ambiente (padrão 3000). Verificar que a API inicia
sem erro. A prova de subida é o próprio teste de `GET /salas` (F3) — não há rota de
health check fora do contrato.

**F2 — Formato de erro e identificação**
Criar middleware de identificação que lê `X-Usuario`, valida existência, e devolve
401 `USUARIO_DESCONHECIDO` conforme R4/R6. A prova do 401 é feita contra `GET /salas`
(F3), sem rota temporária. A validação de corpo não-JSON → 422 `DADOS_INVALIDOS`
(R5) é comprovada em F4 contra `PUT /_teste/relogio` — a primeira rota do contrato
que recebe corpo.

**F3 — Dados iniciais e GET /salas**
Carregar os 10 usuários e 4 salas no startup do banco. Implementar `GET /salas`
retornando 200 com o array. Este teste também comprova o 401 (R4/R6) e a subida
do servidor (R1).

**F4 — Rotas de teste e relógio congelado**
Implementar `POST /_teste/reset` (204, recarrega dados, poe relógio em 09:00),
`PUT /_teste/relogio` e `GET /_teste/relogio`. Validar que sem `MODO_TESTE=1` as
rotas retornam 404. Validar que o relógio só avança com PUT.

**F5 — Reset integra**
Criar atividade via rota auxiliar (ou manipulação direta), chamar `POST /_teste/reset`,
confirmar que a atividade sumiu e que os dados iniciais retornaram intactos.
