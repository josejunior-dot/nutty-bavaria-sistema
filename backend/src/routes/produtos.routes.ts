import type { FastifyInstance } from 'fastify'
import {
  listarProdutosHandler,
  getProdutoHandler,
  criarProdutoHandler,
  atualizarProdutoHandler,
  desativarProdutoHandler,
  getProdutosEstoqueBaixoHandler,
  getProdutosVendaHandler,
} from '../controllers/produtos.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

export async function produtosRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, listarProdutosHandler)
  app.get('/venda', { preHandler: [authenticate] }, getProdutosVendaHandler)
  app.get('/estoque-baixo', { preHandler: [authenticate] }, getProdutosEstoqueBaixoHandler)
  app.get('/:id', { preHandler: [authenticate] }, getProdutoHandler)
  app.post('/', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, criarProdutoHandler)
  app.put('/:id', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, atualizarProdutoHandler)
  app.delete('/:id', { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }, desativarProdutoHandler)
}
