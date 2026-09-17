import express from 'express'
import { pathToFileURL } from 'node:url'
import { usuarioExiste } from './usuarios.js'
import { listarSalas, resetSalas } from './salas.js'
import { setRelogio, lerRelogio, resetRelogio } from './relogio.js'

const usuarioDesconhecido = 'USUARIO_DESCONHECIDO'
const dadosInvalidos = 'DADOS_INVALIDOS'

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
  app.use(express.json())
  app.get('/salas', identificacao, (_req, res) =>
    res.status(200).json(listarSalas())
  )
  if (process.env.MODO_TESTE === '1') {
    app.put('/_teste/relogio', (req, res) => {
      setRelogio(req.body.agora)
      res.status(200).json({ agora: lerRelogio() })
    })
    app.get('/_teste/relogio', (_req, res) =>
      res.status(200).json({ agora: lerRelogio() })
    )
    app.post('/_teste/reset', (_req, res) => {
      resetRelogio()
      resetSalas()
      res.status(204).end()
    })
  }
  app.use((_req, res) =>
    res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Rota não encontrada.' })
  )
  app.use((err, _req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res
        .status(422)
        .json({ erro: dadosInvalidos, mensagem: 'Corpo deve ser JSON válido.' })
    }
    return next(err)
  })
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