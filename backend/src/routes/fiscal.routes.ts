import type { FastifyInstance } from 'fastify'
import {
  emitirNotaHandler,
  listarNotasHandler,
  getNotaHandler,
  cancelarNotaHandler,
  reenviarNotaHandler,
  getResumoFiscalHandler,
} from '../controllers/fiscal.controller.js'
import { requireRole } from '../middleware/auth.middleware.js'

export async function fiscalRoutes(app: FastifyInstance) {
  const opts = { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }

  app.post('/', opts, emitirNotaHandler)
  app.get('/', opts, listarNotasHandler)
  app.get('/resumo', opts, getResumoFiscalHandler)
  app.get('/:id', opts, getNotaHandler)
  app.post('/:id/cancelar', opts, cancelarNotaHandler)
  app.post('/:id/reenviar', opts, reenviarNotaHandler)
}
