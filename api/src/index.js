import express from 'express'
import { pathToFileURL } from 'node:url'
import { usuarioExiste } from './usuarios.js'
import { listarSalas } from './salas.js'

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

export function createApp() {
  const app = express()
  app.get('/salas', identificacao, (_req, res) =>
    res.status(200).json(listarSalas())
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