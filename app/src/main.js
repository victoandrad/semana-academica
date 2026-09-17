import { criarApi } from './api.js'
import { render as renderCodigoDoEncontro } from './telas/codigo-do-encontro.js'

// As telas de cada módulo se registram aqui: { rota, titulo, render }.
// render(container, { api, agora }) — ver .opencode/skills/nova-tela/SKILL.md
const telas = [
  { rota: 'codigo-do-encontro', titulo: 'Código do encontro', render: renderCodigoDoEncontro }
]

const seletor = document.querySelector('#usuario')
const api = criarApi({ fetch: (...a) => fetch(...a), usuario: () => seletor.value })
const agora = () => new Date().toISOString()

function navegar() {
  const hash = location.hash.slice(1) || (telas[0]?.rota ?? '')
  const tela = telas.find(t => t.rota === hash)
  const main = document.querySelector('#tela')
  main.replaceChildren()
  if (tela) tela.render(main, { api, agora })
  else main.textContent = 'Nenhuma tela registrada ainda.'
}

const menu = document.querySelector('#menu')
for (const t of telas) {
  const a = document.createElement('a')
  a.href = '#' + t.rota
  a.textContent = t.titulo
  menu.append(a)
}
addEventListener('hashchange', navegar)
seletor.addEventListener('change', navegar)
navegar()
