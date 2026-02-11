import type { FastifyInstance } from 'fastify'
import {
  curvaABCHandler,
  vendasPeriodoHandler,
  rankingVendedoresHandler,
  comparativoQuiosquesHandler,
  comissoesHandler,
  cuponsHandler,
} from '../controllers/relatorios.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

export async function relatoriosRoutes(app: FastifyInstance) {
  app.get('/curva-abc', { preHandler: [authenticate] }, curvaABCHandler)
  app.get('/vendas-periodo', { preHandler: [authenticate] }, vendasPeriodoHandler)
  app.get('/ranking-vendedores', { preHandler: [authenticate] }, rankingVendedoresHandler)
  app.get('/comparativo-quiosques', { preHandler: [requireRole('FRANQUEADOR')] }, comparativoQuiosquesHandler)
  app.get('/comissoes', { preHandler: [authenticate] }, comissoesHandler)
  app.get('/cupons', { preHandler: [authenticate] }, cuponsHandler)
}
