import type { FastifyInstance } from 'fastify'
import {
  criarVendaHandler,
  listarVendasHandler,
  getVendaHandler,
  cancelarVendaHandler,
} from '../controllers/vendas.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

export async function vendasRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [authenticate] }, criarVendaHandler)
  app.get('/', { preHandler: [authenticate] }, listarVendasHandler)
  app.get('/:id', { preHandler: [authenticate] }, getVendaHandler)
  app.post('/:id/cancelar', { preHandler: [authenticate] }, cancelarVendaHandler)
}
