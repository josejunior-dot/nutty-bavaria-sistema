import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as configService from '../services/configuracoes.service.js'

// ─── Usuários ────────────────────────────────────────
export async function listarUsuariosHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ page: z.coerce.number().default(1), limit: z.coerce.number().default(20), search: z.string().optional() })
  const p = schema.parse(request.query)
  return reply.send(await configService.listarUsuarios(request.user.empresaId, p))
}

export async function criarUsuarioHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    nome: z.string().min(1), email: z.string().email(), senha: z.string().min(6),
    role: z.enum(['OPERADORA', 'GERENTE', 'FRANQUEADOR']),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })
  try {
    const user = await configService.criarUsuario({ ...parsed.data, empresaId: request.user.empresaId })
    return reply.status(201).send(user)
  } catch (err: any) {
    if (err.code === 'P2002') return reply.status(400).send({ message: 'Email já cadastrado' })
    return reply.status(400).send({ message: err.message })
  }
}

export async function atualizarUsuarioHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  const user = await configService.atualizarUsuario(id, request.body)
  return reply.send(user)
}

export async function desativarUsuarioHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  await configService.desativarUsuario(id)
  return reply.send({ message: 'Usuário desativado' })
}

// ─── Fornecedores ────────────────────────────────────
export async function listarFornecedoresHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ page: z.coerce.number().default(1), limit: z.coerce.number().default(20), search: z.string().optional() })
  const p = schema.parse(request.query)
  return reply.send(await configService.listarFornecedores(request.user.empresaId, p))
}

export async function criarFornecedorHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ nome: z.string().min(1), cnpj: z.string().optional(), telefone: z.string().optional(), email: z.string().optional() })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos' })
  const f = await configService.criarFornecedor({ ...parsed.data, empresaId: request.user.empresaId })
  return reply.status(201).send(f)
}

export async function atualizarFornecedorHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  return reply.send(await configService.atualizarFornecedor(id, request.body))
}

export async function excluirFornecedorHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  await configService.excluirFornecedor(id)
  return reply.send({ message: 'Fornecedor excluído' })
}

// ─── Clientes ────────────────────────────────────────
export async function listarClientesHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ page: z.coerce.number().default(1), limit: z.coerce.number().default(20), search: z.string().optional() })
  const p = schema.parse(request.query)
  return reply.send(await configService.listarClientes(request.user.empresaId, p))
}

export async function criarClienteHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ nome: z.string().min(1), cpf: z.string().optional(), telefone: z.string().optional(), email: z.string().optional() })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos' })
  const c = await configService.criarCliente({ ...parsed.data, empresaId: request.user.empresaId })
  return reply.status(201).send(c)
}

export async function atualizarClienteHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  return reply.send(await configService.atualizarCliente(id, request.body))
}

export async function excluirClienteHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  await configService.excluirCliente(id)
  return reply.send({ message: 'Cliente excluído' })
}

// ─── Terminais ───────────────────────────────────────
export async function listarTerminaisHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await configService.listarTerminais(request.user.empresaId))
}

export async function criarTerminalHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ nome: z.string().min(1), codigo: z.string().min(1) })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos' })
  try {
    const t = await configService.criarTerminal({ ...parsed.data, empresaId: request.user.empresaId })
    return reply.status(201).send(t)
  } catch (err: any) {
    if (err.code === 'P2002') return reply.status(400).send({ message: 'Código já existe' })
    return reply.status(400).send({ message: err.message })
  }
}

export async function atualizarTerminalHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  return reply.send(await configService.atualizarTerminal(id, request.body))
}

// ─── Comissões ───────────────────────────────────────
export async function listarComissoesHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await configService.listarComissoes(request.user.empresaId))
}

export async function criarComissaoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ nome: z.string().min(1), percentual: z.number().min(0).max(100) })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos' })
  const c = await configService.criarComissao({ ...parsed.data, empresaId: request.user.empresaId })
  return reply.status(201).send(c)
}

export async function atualizarComissaoHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  return reply.send(await configService.atualizarComissao(id, request.body))
}

export async function excluirComissaoHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  await configService.excluirComissao(id)
  return reply.send({ message: 'Comissão excluída' })
}

// ─── Shoppings ───────────────────────────────────────
export async function listarShoppingsHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await configService.listarShoppings(request.user.empresaId))
}
