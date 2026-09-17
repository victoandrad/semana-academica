const HORA_RESET = '2026-10-13T09:00:00-03:00'

let horaCongelada = HORA_RESET

export function setRelogio(iso) {
  horaCongelada = iso
}

export function resetRelogio() {
  horaCongelada = HORA_RESET
}

export function lerRelogio() {
  return horaCongelada
}

export function agora() {
  return process.env.MODO_TESTE === '1'
    ? horaCongelada
    : new Date().toISOString()
}