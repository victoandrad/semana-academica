import express from 'express'
import { pathToFileURL } from 'node:url'
import { usuarioExiste, papelDe } from './usuarios.js'
import { listarSalas, resetSalas } from './salas.js'
import {
  criarAtividade,
  listarAtividades,
  buscarAtividade,
  alterarAtividade,
  cancelarAtividade,
  resetAtividades
} from './atividades.js'
import {
  inscrever,
  listarInscricoes,
  buscarInscricao,
  cancelarInscricao,
  confirmarInscricao,
  resetInscricoes
} from './inscricoes.js'
import { setRelogio, lerRelogio, resetRelogio } from './relogio.js'

const usuarioDesconhecido = 'USUARIO_DESCONHECIDO'
const dadosInvalidos = 'DADOS_INVALIDOS'
const somenteOrganizacao = 'SOMENTE_ORGANIZACAO'
const somenteParticipante = 'SOMENTE_PARTICIPANTE'

const statusDoErro = {
  CONFLITO_DE_SALA: 409,
  VAGAS_ABAIXO_DOS_INSCRITOS: 409,
  JA_INSCRITO: 409,
  CONFLITO_DE_HORARIO: 409
}

function identificacao(req, res, next) {
  const id = req.header('X-Usuario')
  if (!id || !usuarioExiste(id)) {
    return res
      .status(401)
      .json({ erro: usuarioDesconhecido, mensagem: 'Usuário desconhecido.' })
  }
  next()
}

function organizacao(req, res, next) {
  if (papelDe(req.header('X-Usuario')) !== 'organizacao') {
    return res
      .status(403)
      .json({ erro: somenteOrganizacao, mensagem: 'Apenas organização.' })
  }
  next()
}

function participante(req, res, next) {
  if (papelDe(req.header('X-Usuario')) !== 'participante') {
    return res
      .status(403)
      .json({ erro: somenteParticipante, mensagem: 'Apenas participante.' })
  }
  next()
}

export function createApp() {
  const app = express()
  app.use(express.json())
  app.get('/salas', identificacao, (_req, res) =>
    res.status(200).json(listarSalas())
  )
  app.get('/atividades', identificacao, (req, res) => {
    const resultado = listarAtividades(req.query)
    if (resultado && resultado.erro) {
      return res
        .status(422)
        .json({ erro: resultado.erro, mensagem: 'Filtro inválido.' })
    }
    return res.status(200).json(resultado)
  })
  app.get('/atividades/:id', identificacao, (req, res) => {
    const atividade = buscarAtividade(req.params.id)
    if (!atividade) {
      return res
        .status(404)
        .json({ erro: 'NAO_ENCONTRADO', mensagem: 'Atividade não encontrada.' })
    }
    return res.status(200).json(atividade)
  })
  app.post('/atividades', identificacao, organizacao, (req, res) => {
    const atividade = criarAtividade(req.body)
    if (atividade && atividade.erro === 'NAO_ENCONTRADO') {
      return res
        .status(404)
        .json({ erro: 'NAO_ENCONTRADO', mensagem: 'Sala não encontrada.' })
    }
    if (atividade && atividade.erro) {
      return res
        .status(statusDoErro[atividade.erro] ?? 422)
        .json({ erro: atividade.erro, mensagem: 'Atividade não pode ser criada.' })
    }
    if (!atividade) {
      return res
        .status(422)
        .json({ erro: dadosInvalidos, mensagem: 'Corpo inválido para atividade.' })
    }
    return res.status(201).json(atividade)
  })
  app.patch('/atividades/:id', identificacao, organizacao, (req, res) => {
    const resultado = alterarAtividade(req.params.id, req.body)
    if (resultado && resultado.erro === 'NAO_ENCONTRADO') {
      return res
        .status(404)
        .json({ erro: 'NAO_ENCONTRADO', mensagem: 'Atividade não encontrada.' })
    }
    if (resultado && resultado.erro) {
      return res
        .status(statusDoErro[resultado.erro] ?? 422)
        .json({ erro: resultado.erro, mensagem: 'Atividade não pode ser alterada.' })
    }
    return res.status(200).json(resultado)
  })
  app.post('/atividades/:id/cancelamento', identificacao, organizacao, (req, res) => {
    const resultado = cancelarAtividade(req.params.id)
    if (resultado && resultado.erro === 'NAO_ENCONTRADO') {
      return res
        .status(404)
        .json({ erro: 'NAO_ENCONTRADO', mensagem: 'Atividade não encontrada.' })
    }
    if (resultado && resultado.erro) {
      return res
        .status(statusDoErro[resultado.erro] ?? 422)
        .json({ erro: resultado.erro, mensagem: 'Atividade não pode ser cancelada.' })
    }
    return res.status(200).json(resultado)
  })
  app.post('/atividades/:id/inscricoes', identificacao, participante, (req, res) => {
    const resultado = inscrever(req.params.id, req.header('X-Usuario'))
    if (resultado && resultado.erro === 'NAO_ENCONTRADO') {
      return res
        .status(404)
        .json({ erro: 'NAO_ENCONTRADO', mensagem: 'Atividade não encontrada.' })
    }
    if (resultado && resultado.erro) {
      return res
        .status(statusDoErro[resultado.erro] ?? 422)
        .json({ erro: resultado.erro, mensagem: 'Inscrição não pode ser feita.' })
    }
    return res.status(201).json(resultado)
  })
  app.get('/inscricoes', identificacao, (req, res) => {
    const xUsuario = req.header('X-Usuario')
    return res.status(200).json(listarInscricoes(xUsuario, papelDe(xUsuario), req.query))
  })
  app.get('/inscricoes/:id', identificacao, (req, res) => {
    const inscricao = buscarInscricao(req.params.id)
    if (!inscricao) {
      return res
        .status(404)
        .json({ erro: 'NAO_ENCONTRADO', mensagem: 'Inscrição não encontrada.' })
    }
    return res.status(200).json(inscricao)
  })
  app.post('/inscricoes/:id/cancelamento', identificacao, participante, (req, res) => {
    const resultado = cancelarInscricao(req.params.id, req.header('X-Usuario'))
    if (resultado && resultado.erro === 'NAO_ENCONTRADO') {
      return res
        .status(404)
        .json({ erro: 'NAO_ENCONTRADO', mensagem: 'Inscrição não encontrada.' })
    }
    if (resultado && resultado.erro) {
      return res
        .status(statusDoErro[resultado.erro] ?? 422)
        .json({ erro: resultado.erro, mensagem: 'Inscrição não pode ser cancelada.' })
    }
    return res.status(200).json(resultado)
  })
  app.post('/inscricoes/:id/confirmacao', identificacao, participante, (req, res) => {
    const resultado = confirmarInscricao(req.params.id, req.header('X-Usuario'))
    if (resultado && resultado.erro === 'NAO_ENCONTRADO') {
      return res
        .status(404)
        .json({ erro: 'NAO_ENCONTRADO', mensagem: 'Inscrição não encontrada.' })
    }
    if (resultado && resultado.erro) {
      return res
        .status(statusDoErro[resultado.erro] ?? 422)
        .json({ erro: resultado.erro, mensagem: 'Inscrição não pode ser confirmada.' })
    }
    return res.status(200).json(resultado)
  })
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
      resetAtividades()
      resetInscricoes()
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