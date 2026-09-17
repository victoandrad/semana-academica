export const usuarios = []

export function usuarioExiste(id) {
  return usuarios.some(u => u.id === id)
}