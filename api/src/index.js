import express from 'express'
import { pathToFileURL } from 'node:url'
import { usuarioExiste } from './usuarios.js'

const usuarioDesconhecido = 'USUARIO_DESCONHECIDO'

function identificacao(req, res, next) {
  const id = req.header('X-Usuario')
  if (!id || !usuarioExiste(id)) {
    return res
      .status(401)
      .json({ erro: usuarioDesconhecido, mensagem: 'Usuário desconhecido.' })
  }
  next()
}

function dadosInvalidos(err, _req, res, _next) {
  if (err) {
    return res
      .status(422)
      .json({ erro: 'DADOS_INVALIDOS', mensagem: 'Corpo deve ser JSON válido.' })
  }
  _next()
}

export function createApp() {
  const app = express()
  app.get('/', (_req, res) => res.status(200).end())
  app.get('/teste-protegida', identificacao, (_req, res) => res.status(200).end())
  app.post(
    '/teste-body',
    express.json({ type: '*/*' }),
    dadosInvalidos,
    (_req, res) => res.status(200).end()
  )
  return app
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const port = Number(process.env.PORT ?? 3000)
  createApp().listen(port, () => {
    console.log(`API escutando na porta ${port}`)
  })
}