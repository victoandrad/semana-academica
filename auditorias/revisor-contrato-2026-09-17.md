Resultado da revisão: 1 divergência em 18 rotas conferidas.
Divergência — Respostas de Atividade incluem o campo cancelada, que não existe no schema do contrato (contrato-api.md:108-123). Origem: spread ...atividade + cancelada: false no objeto armazenado.
Atinge 5 rotas:
- GET /atividades e GET /atividades/:id
- POST /atividades e PATCH /atividades/:id
- POST /atividades/:id/cancelamento
Locais: api/src/atividades.js:96 (spread em formatar) e api/src/atividades.js:159 (cancelada: false salvo). Demais campos (ocupadas, vagasRestantes, emEspera) são sobrescritos em formatar, mas cancelada vaza.
Veredito: não aceito — o campo deve ser removido. As outras 13 rotas estão conforme o contrato (M1–M3 + modo de teste).