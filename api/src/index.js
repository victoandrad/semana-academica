import express from 'express'
import { pathToFileURL } from 'node:url'

export function createApp() {
  const app = express()
  app.get('/', (_req, res) => res.status(200).end())
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