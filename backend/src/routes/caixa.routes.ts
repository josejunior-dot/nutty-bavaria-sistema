import type { FastifyInstance } from 'fastify'
import {
  getMovimentoAbertoHandler,
  abrirCaixaHandler,
  fecharCaixaHandler,
  sangriaHandler,
  suprimentoHandler,
  getMovimentoHandler,
  listarMovimentosHandler,
  getResumoHandler,
} from '../controllers/caixa.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

export async function caixaRoutes(app: FastifyInstance) {
  app.get('/aberto', { preHandler: [authenticate] }, getMovimentoAbertoHandler)
  app.post('/abrir', { preHandler: [authenticate] }, abrirCaixaHandler)
  app.get('/', { preHandler: [authenticate] }, listarMovimentosHandler)
  app.get('/:id', { preHandler: [authenticate] }, getMovimentoHandler)
  app.get('/:id/resumo', { preHandler: [authenticate] }, getResumoHandler)
  app.post('/:id/fechar', { preHandler: [authenticate] }, fecharCaixaHandler)
  app.post('/:id/sangria', { preHandler: [authenticate] }, sangriaHandler)
  app.post('/:id/suprimento', { preHandler: [authenticate] }, suprimentoHandler)
}
