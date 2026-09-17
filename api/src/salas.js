export const salasIniciais = [
  { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
  { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
  { id: 'sala-102', nome: 'Sala 102', capacidade: 40 },
  { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }
]

let dados = [...salasIniciais]

export function listarSalas() {
  return dados
}

export function salaExiste(id) {
  return dados.some(s => s.id === id)
}

export function resetSalas() {
  dados = [...salasIniciais]
}