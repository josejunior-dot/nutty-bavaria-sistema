import type { FastifyInstance } from 'fastify'
import {
  criarEntradaHandler,
  listarEntradasHandler,
  criarSaidaHandler,
  listarSaidasHandler,
  criarPedidoHandler,
  listarPedidosHandler,
  receberPedidoHandler,
  getSugestaoCompraHandler,
} from '../controllers/estoque.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

export async function estoqueRoutes(app: FastifyInstance) {
  app.post('/entradas', { preHandler: [authenticate] }, criarEntradaHandler)
  app.get('/entradas', { preHandler: [authenticate] }, listarEntradasHandler)
  app.post('/saidas', { preHandler: [authenticate] }, criarSaidaHandler)
  app.get('/saidas', { preHandler: [authenticate] }, listarSaidasHandler)
  app.post('/pedidos', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, criarPedidoHandler)
  app.get('/pedidos', { preHandler: [authenticate] }, listarPedidosHandler)
  app.post('/pedidos/:id/receber', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, receberPedidoHandler)
  app.get('/sugestao-compra', { preHandler: [authenticate] }, getSugestaoCompraHandler)
}
