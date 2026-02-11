import type { FastifyInstance } from 'fastify'
import {
  getCampanhasAtivasHandler,
  verificarCuponsHandler,
  registrarCuponsHandler,
  listarCuponsHandler,
  listarCampanhasHandler,
  criarCampanhaHandler,
  atualizarCampanhaHandler,
  desativarCampanhaHandler,
} from '../controllers/cupons.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

export async function cuponsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, listarCuponsHandler)
  app.get('/campanhas/ativas', { preHandler: [authenticate] }, getCampanhasAtivasHandler)
  app.get('/campanhas', { preHandler: [authenticate] }, listarCampanhasHandler)
  app.get('/verificar/:vendaId', { preHandler: [authenticate] }, verificarCuponsHandler)
  app.post('/registrar', { preHandler: [authenticate] }, registrarCuponsHandler)
  app.post('/campanhas', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, criarCampanhaHandler)
  app.put('/campanhas/:id', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, atualizarCampanhaHandler)
  app.delete('/campanhas/:id', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, desativarCampanhaHandler)
}
