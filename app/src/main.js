import { criarApi } from './api.js'
import { render as renderProgramacao } from './telas/programacao.js'
import { render as renderDetalheAtividade } from './telas/detalhe-atividade.js'
import { render as renderCriarAtividade } from './telas/criar-atividade.js'
import { render as renderCodigoDoEncontro } from './telas/codigo-do-encontro.js'
import { render as renderRegistrarPresenca } from './telas/registrar-presenca.js'

// As telas de cada módulo se registram aqui: { rota, titulo, render }.
// render(container, { api, agora, parametros }) — ver .opencode/skills/nova-tela/SKILL.md
// `menu: false` esconde a tela do menu (ela só abre por link, ex. detalhe com :id).
const telas = [
  { rota: 'programacao', titulo: 'Programação', render: renderProgramacao },
  { rota: 'criar-atividade', titulo: 'Criar atividade', render: renderCriarAtividade },
  { rota: 'codigo-do-encontro', titulo: 'Código do encontro', render: renderCodigoDoEncontro },
  { rota: 'registrar-presenca', titulo: 'Registrar presença (QR)', render: renderRegistrarPresenca },
  { rota: 'detalhe-atividade', titulo: 'Detalhe da atividade', render: renderDetalheAtividade, menu: false }
]

const seletor = document.querySelector('#usuario')
const api = criarApi({ fetch: (...a) => fetch(...a), usuario: () => seletor.value })
const agora = () => new Date().toISOString()

function navegar() {
  const hash = location.hash.slice(1)
  const [rota, ...parametros] = hash.split('/')
  const tela = telas.find(t => t.rota === (rota || telas[0]?.rota))
  const main = document.querySelector('#tela')
  main.replaceChildren()
  if (tela) tela.render(main, { api, agora, parametros })
  else main.textContent = 'Nenhuma tela registrada ainda.'
}

const menu = document.querySelector('#menu')
for (const t of telas) {
  if (t.menu === false) continue
  const a = document.createElement('a')
  a.href = '#' + t.rota
  a.textContent = t.titulo
  menu.append(a)
}
addEventListener('hashchange', navegar)
seletor.addEventListener('change', navegar)
navegar()
