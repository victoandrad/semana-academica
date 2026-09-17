# AGENTS.md — app/

Regras para quem trabalha dentro de `app/`. As da raiz continuam valendo.

## Como roda

- `npm run dev` sobe o Vite; a interface fala com a API em `http://localhost:3000`, que precisa estar de pé (`MODO_TESTE=1 npm start` em `api/`). — `package.json:7`, `src/main.js:8`
- `npm test` roda `node --test` sobre `src/**/*.test.js` e `test/**/*.test.js`. O DOM vem do `happy-dom` (`test/dom.js`); não há navegador no teste. — `package.json:9`, `test/dom.js`
- HTML + JS sem framework: uma tela é um módulo em `src/telas/<nome>.js` que exporta `render(container, { api, agora })` e se registra em `src/main.js`. — `src/main.js:3-5`, `.opencode/skills/nova-tela/SKILL.md`

## API

- `src/api.js` é o único arquivo que chama `fetch`. Ele recebe o `fetch` por parâmetro; nos testes entra a API falsa de `test/api-falsa.js`. — `src/api.js:4`, `test/api-falsa.js`
- Nos testes da interface, a API real é sempre trocada pela falsa. A falsa responde só rotas do `contrato-api.md`, com dados escritos na mão, e registra cada chamada para o teste conferir o que a tela enviou. — enunciado ("Nos testes da interface, a API é trocada por uma versão falsa"), `test/api-falsa.js:12-25`
- Erro da API vira `ErroDaApi` com `status`, `erro` e `mensagem`; a tela mostra os três com `mostrarErro`, sem traduzir nem esconder o código. — `src/api.js:29-47`
- O usuário é o `X-Usuario` do seletor da casca; não existe login. Os ids são os da seção 4 do contrato. — `index.html:13-24`, `contrato-api.md:63-72`

## Regra de negócio fica na API

- A tela não decide prazo, janela, limite nem ordem: manda o pedido e mostra o que a API respondeu. `if (agora > fim)` para esconder um botão é a tela decidindo — não faça. — `.opencode/skills/nova-tela/SKILL.md` ("O que toda tela faz")
- A hora entra por `agora()` nas dependências do `render`, nunca por `Date.now()` dentro da tela, para que contagem regressiva e troca de QR sejam testáveis sem esperar. — `src/main.js:9`

## Offline (M3)

- Leitura sem rede fica em `localStorage` com o `lidoEm` da leitura e é reenviada no evento `online` ou pelo botão "enviar agora", com o mesmo `lidoEm`. A API responde 200 se já existir — reenviar é seguro. — `specs/M3-presenca.md` R9–R12
