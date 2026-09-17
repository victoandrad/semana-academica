// DOM mínimo para testar telas com node --test, sem navegador.
import { Window } from 'happy-dom'

export function montarDom() {
  const window = new Window({ url: 'http://localhost/' })
  globalThis.window = window
  globalThis.document = window.document
  globalThis.localStorage = window.localStorage
  globalThis.addEventListener = window.addEventListener.bind(window)
  globalThis.dispatchEvent = window.dispatchEvent.bind(window)
  const container = window.document.createElement('main')
  window.document.body.append(container)
  return { window, container }
}
