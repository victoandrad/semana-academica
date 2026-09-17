export const usuarios = [
  { id: 'org-ana', nome: 'Ana Beatriz Lima', papel: 'organizacao' },
  { id: 'org-bruno', nome: 'Bruno Tavares', papel: 'organizacao' },
  { id: 'p-carla', nome: 'Carla Mendes Souza', papel: 'participante' },
  { id: 'p-diego', nome: 'Diego Alves', papel: 'participante' },
  { id: 'p-elisa', nome: 'Elisa Fernandes da Rocha', papel: 'participante' },
  { id: 'p-fabio', nome: 'Fábio Nogueira', papel: 'participante' },
  { id: 'p-gabriela', nome: 'Gabriela Moura Castro', papel: 'participante' },
  { id: 'p-heitor', nome: 'Heitor Campos', papel: 'participante' },
  { id: 'p-isadora', nome: 'Isadora Ribeiro dos Santos', papel: 'participante' },
  { id: 'p-joao', nome: 'João Pedro Martins', papel: 'participante' }
]

export function usuarioExiste(id) {
  return usuarios.some(u => u.id === id)
}

export function papelDe(id) {
  return usuarios.find(u => u.id === id).papel
}