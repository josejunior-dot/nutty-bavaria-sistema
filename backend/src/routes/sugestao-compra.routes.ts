import type { FastifyInstance } from 'fastify'
import {
  getSugestoesHandler,
  listarEventosHandler,
  criarEventoHandler,
  atualizarEventoHandler,
  excluirEventoHandler,
} from '../controllers/sugestao-compra.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

export async function sugestaoCompraRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, getSugestoesHandler)
  app.get('/eventos', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, listarEventosHandler)
  app.post('/eventos', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, criarEventoHandler)
  app.put('/eventos/:id', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, atualizarEventoHandler)
  app.delete('/eventos/:id', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, excluirEventoHandler)
}
