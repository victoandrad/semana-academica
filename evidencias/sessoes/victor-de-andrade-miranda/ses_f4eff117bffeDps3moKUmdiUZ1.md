# Entrevista M2: inscrições e lista de espera

| | |
|---|---|
| Sessão | `ses_f4eff117bffeDps3moKUmdiUZ1` |
| Pasta | semana-academica/api |
| Período | 17/09 17:13 → 17/09 18:22 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 250 |
| Tokens de entrada / saída | 697.853 / 261.630 |
| Skills | grilling, to-spec, tdd (2), nova-tela |
| Subagentes | auditor, revisor-de-contrato |
| Execuções de teste | 1 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 42 de teste, 33 de código, 34 de entrevista, 9 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 17:13` **prompt** — Use a skill grilling para o módulo M2 (inscrições e lista de espera) da Semana Acadêmica. Leia o contrato-api.md inteiro, specs/M0-infraestrutura.md e specs/M1-grade.md — a base e a grade já existem; não repita nada. Aviso que muda como você conduz: eu não tenho nenhuma regra de cabeça. Minha resposta para toda pergunta que envolva número, prazo, limite, janela, fórmula, arredondamento ou ordem e…
- `17/09 17:13` carrega a skill **grilling**
- `17/09 17:17` edita entrevista `C:/Users/victo/Documents/Repositórios/semana-academica/entrevistas/M2-inscricoes.md`
- `17/09 17:19` **prompt** — Vamos fazer a rodada 2 da entrevista do M2. Leia entrevistas/M2-inscricoes.md. Trabalhe em blocos de 10: liste as 10 primeiras perguntas PENDENTE, num bloco numerado, só número e pergunta, sem recomendação. Eu respondo as 10 numa única mensagem. Registre cada resposta na linha correspondente e ponha na coluna Fonte a regra que eu citar. Só então passe para as 10 seguintes. Não crie perguntas nova…
- `17/09 17:20` **prompt** — P-02 — INSCRICOES_ENCERRADAS As inscrições fecham 30 minutos antes do início do primeiro encontro da atividade (RN-202). Essa regra vale para palestras e minicursos, pois sempre considera o primeiro encontro da atividade. requisitos-envolvido.md Pelas regras gerais de tempo: Um prazo que fecha em X já recusa em X. Portanto, no instante exato de 30 minutos antes do primeiro encontro, a inscrição j…
- `17/09 17:21` edita entrevista `C:/Users/victo/Documents/Repositórios/semana-academica/entrevistas/M2-inscricoes.md` (10×)
- `17/09 17:22` **prompt** — P-13 — Reconvocação Não. Uma inscrição que virou expirada sai do fluxo da fila. A RN-213 diz que, quando a convocação vence, a inscrição: vira expirada; sai da fila; convoca o próximo participante. requisitos-envolvido.md O documento não prevê reconvocação de uma inscrição expirada. P-14 — posicaoNaEspera O documento define que: posicaoNaEspera é calculada. A posição 1 é a próxima a ser convocada…
- `17/09 17:22` edita entrevista `C:/Users/victo/Documents/Repositórios/semana-academica/entrevistas/M2-inscricoes.md` (10×)
- `17/09 17:23` **prompt** — faça todas as perguntas dos blocos 3-10 de uma vez
- `17/09 17:24` **prompt** — P-14 — Desempate de posicaoNaEspera Não especificado. O documento diz apenas que: posicaoNaEspera é calculada. A posição 1 é a próxima a ser convocada. A ordem é a ordem de chegada. requisitos-envolvido.md Ele não define como desempatar duas inscrições com o mesmo criadaEm (relógio de teste parado). P-15 — Campos após confirmar a convocação Parcialmente especificado. Ao confirmar dentro do prazo:…
- `17/09 17:24` edita entrevista `C:/Users/victo/Documents/Repositórios/semana-academica/entrevistas/M2-inscricoes.md` (8×)
- `17/09 17:26` **prompt** — Use a skill to-spec. Escreva specs/M2-inscricoes.md a partir de entrevistas/M2-inscricoes.md. Cada regra cita a pergunta (P-xx) e, quando veio do documento, a regra dele (RN-xxx). Fonte "documento silente" aparece na regra, para ninguém achar que veio do cliente. Regra sem P-xx não entra. Se faltar algo, pare e pergunte só aquilo. Leia specs/M0-infraestrutura.md e specs/M1-grade.md; não repita na…
- `17/09 17:26` carrega a skill **to-spec**
- `17/09 17:28` edita entrevista `C:/Users/victo/Documents/Repositórios/semana-academica/entrevistas/M2-inscricoes.md` (5×)
- `17/09 17:29` edita spec `C:/Users/victo/Documents/Repositórios/semana-academica/specs/M2-inscricoes.md`
- `17/09 17:30` **prompt** — Use a skill tdd. Implemente todas as fatias de ../specs/M2-inscricoes.md. Um teste por vez: escreva o teste, rode e mostre ele falhando, e só então o código mínimo que faz passar. O valor esperado vem da spec, escrito à mão. Toda regra de tempo usa PUT /_teste/relogio. Nenhum teste depende da hora do sistema. Não crie rota fora do contrato-api.md. Se encontrar contradição entre uma regra e um cri…
- `17/09 17:31` carrega a skill **tdd**
- `17/09 17:34` edita teste `test/inscricoes-f1.test.js`
- `17/09 17:34` roda `npm test 2>&1 | Select-String -Pattern "inscricoes-f1|pass |fail " -Context 0,2` → **vermelho** — _teste novo falhando, como deve ser_
- `17/09 17:34` edita teste `test/inscricoes-f1.test.js`
- `17/09 17:35` edita código `src/inscricoes.js`
- `17/09 17:35` edita código `src/index.js` (4×)
- `17/09 17:35` edita teste `test/inscricoes-f1.test.js` (5×)
- `17/09 17:37` edita teste `test/inscricoes-f2.test.js` (2×)
- `17/09 17:37` edita código `src/inscricoes.js` (3×)
- `17/09 17:38` edita teste `test/inscricoes-f3.test.js`
- `17/09 17:38` edita código `src/inscricoes.js`
- `17/09 17:38` edita teste `test/inscricoes-f3.test.js`
- `17/09 17:39` edita código `src/inscricoes.js`
- `17/09 17:39` edita teste `test/inscricoes-f3.test.js` (2×)
- `17/09 17:39` edita código `src/inscricoes.js`
- `17/09 17:39` edita teste `test/inscricoes-f3.test.js` (2×)
- `17/09 17:40` edita código `src/inscricoes.js` (2×)
- `17/09 17:41` edita teste `test/inscricoes-f4.test.js`
- `17/09 17:41` edita código `src/inscricoes.js` (5×)
- `17/09 17:41` edita teste `test/inscricoes-f4.test.js`
- `17/09 17:42` edita código `src/atividades.js` (2×)
- `17/09 17:42` edita teste `test/inscricoes-f4.test.js` (2×)
- `17/09 17:43` edita teste `test/inscricoes-f5.test.js`
- `17/09 17:43` edita código `src/inscricoes.js` (2×)
- `17/09 17:43` edita teste `test/inscricoes-f5.test.js` (4×)
- `17/09 17:45` edita teste `test/inscricoes-f6.test.js`
- `17/09 17:45` edita código `src/inscricoes.js`
- `17/09 17:46` edita teste `test/inscricoes-f7.test.js`
- `17/09 17:46` edita código `src/inscricoes.js` (2×)
- `17/09 17:46` edita código `src/atividades.js` (4×)
- `17/09 17:47` edita teste `test/inscricoes-f7.test.js` (2×)
- `17/09 17:48` edita teste `test/inscricoes-f1.test.js` (2×)
- `17/09 17:49` edita teste `test/inscricoes-f4.test.js` (5×)
- `17/09 17:52` **prompt** — Use a skill tdd. As regras R29, R36, R37 e R38 de ../specs/M1-grade.md estavam pendentes de decisão do M2. Agora specs/M2-inscricoes.md decidiu quais status ocupam vaga. Primeiro: tire o marcador "Pendente (M2)" dessas quatro regras em specs/M1-grade.md, escrevendo a regra completa com a citação da regra do M2 que a resolveu, e me mostre o diff antes de gravar. Isso vai num commit só de spec. Dep…
- `17/09 17:52` carrega a skill **tdd**
- `17/09 17:53` edita spec `C:/Users/victo/Documents/Repositórios/semana-academica/specs/M1-grade.md` (8×)
- `17/09 17:55` **prompt** — Use a skill tdd. Implemente todas as fatias de ../specs/M2-inscricoes.md. Um teste por vez: escreva o teste, rode e mostre ele falhando, e só então o código mínimo que faz passar. O valor esperado vem da spec, escrito à mão. Toda regra de tempo usa PUT /_teste/relogio. Nenhum teste depende da hora do sistema. Não crie rota fora do contrato-api.md. Se encontrar contradição entre uma regra e um cri…
- `17/09 17:57` edita teste `test/inscricoes-f5.test.js` (2×)
- `17/09 17:58` **prompt** — Use a skill nova-tela. Crie as telas do módulo M2, conforme specs/M2-inscricoes.md: 1. inscrever e cancelar no detalhe da atividade; 2. "minhas inscrições", com status, posição na espera, contagem regressiva da convocação e botão de confirmar. Teste primeiro, com a API falsa. Nomes de campo são os do contrato-api.md.
- `17/09 17:58` carrega a skill **nova-tela**
- `17/09 18:00` edita teste `C:/Users/victo/Documents/Repositórios/semana-academica/app/test/api-falsa.js`
- `17/09 18:00` edita teste `C:/Users/victo/Documents/Repositórios/semana-academica/app/src/telas/detalhe-atividade.test.js` (2×)
- `17/09 18:01` edita teste `C:/Users/victo/Documents/Repositórios/semana-academica/app/src/telas/minhas-inscricoes.test.js`
- `17/09 18:02` edita código `C:/Users/victo/Documents/Repositórios/semana-academica/app/src/telas/detalhe-atividade.js`
- `17/09 18:02` edita teste `C:/Users/victo/Documents/Repositórios/semana-academica/app/src/telas/minhas-inscricoes.test.js`
- `17/09 18:02` edita código `C:/Users/victo/Documents/Repositórios/semana-academica/app/src/telas/minhas-inscricoes.js`
- `17/09 18:02` edita código `C:/Users/victo/Documents/Repositórios/semana-academica/app/src/main.js` (2×)
- `17/09 18:14` **prompt** — @auditor audite o módulo M1 contra specs/M1-grade.md
- `17/09 18:14` chama o subagente **auditor** — Auditar módulo M1
  > <task id="ses_f4ec735d3fferRYhjnFe55ZyUi" state="completed"> # Parecer de auditoria — M1 (Grade de atividades) Auditei a spec `specs/M1-grade.md` (working tree), a entrevista `entrevistas/M1-grade.md`, `contrato-api.md` (§5 M1, §6), a spec…
- `17/09 18:20` **prompt** — @revisor-de-contrato confira o módulo M1 contra o contrato-api.md
- `17/09 18:20` chama o subagente **revisor-de-contrato** — Revisar M1 vs contrato
  > <task id="ses_f4ec22db9ffeSjfE55vU8coHW2" state="completed"> Confirmei tudo por leitura de código, testes e validação empírica. Segue o parecer. --- ## Matriz por rota | Rota | Método | Divergências | Veredito | |---|---|---|---| | /salas …
