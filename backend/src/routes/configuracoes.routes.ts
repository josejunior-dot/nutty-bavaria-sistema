import type { FastifyInstance } from 'fastify'
import { requireRole } from '../middleware/auth.middleware.js'
import {
  listarUsuariosHandler, criarUsuarioHandler, atualizarUsuarioHandler, desativarUsuarioHandler,
  listarFornecedoresHandler, criarFornecedorHandler, atualizarFornecedorHandler, excluirFornecedorHandler,
  listarClientesHandler, criarClienteHandler, atualizarClienteHandler, excluirClienteHandler,
  listarTerminaisHandler, criarTerminalHandler, atualizarTerminalHandler,
  listarComissoesHandler, criarComissaoHandler, atualizarComissaoHandler, excluirComissaoHandler,
  listarShoppingsHandler,
} from '../controllers/configuracoes.controller.js'

export async function configuracoesRoutes(app: FastifyInstance) {
  const opts = { preHandler: [requireRole('GERENTE', 'FRANQUEADOR')] }

  // Usuários
  app.get('/usuarios', opts, listarUsuariosHandler)
  app.post('/usuarios', opts, criarUsuarioHandler)
  app.put('/usuarios/:id', opts, atualizarUsuarioHandler)
  app.delete('/usuarios/:id', opts, desativarUsuarioHandler)

  // Fornecedores
  app.get('/fornecedores', opts, listarFornecedoresHandler)
  app.post('/fornecedores', opts, criarFornecedorHandler)
  app.put('/fornecedores/:id', opts, atualizarFornecedorHandler)
  app.delete('/fornecedores/:id', opts, excluirFornecedorHandler)

  // Clientes
  app.get('/clientes', opts, listarClientesHandler)
  app.post('/clientes', opts, criarClienteHandler)
  app.put('/clientes/:id', opts, atualizarClienteHandler)
  app.delete('/clientes/:id', opts, excluirClienteHandler)

  // Terminais
  app.get('/terminais', opts, listarTerminaisHandler)
  app.post('/terminais', opts, criarTerminalHandler)
  app.put('/terminais/:id', opts, atualizarTerminalHandler)

  // Comissões
  app.get('/comissoes', opts, listarComissoesHandler)
  app.post('/comissoes', opts, criarComissaoHandler)
  app.put('/comissoes/:id', opts, atualizarComissaoHandler)
  app.delete('/comissoes/:id', opts, excluirComissaoHandler)

  // Shoppings
  app.get('/shoppings', opts, listarShoppingsHandler)
}
