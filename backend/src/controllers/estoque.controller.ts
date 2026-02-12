import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as estoqueService from '../services/estoque.service.js'

export async function criarEntradaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    fornecedorId: z.string().uuid().optional(),
    numeroNota: z.string().optional(),
    observacao: z.string().optional(),
    itens: z.array(z.object({
      produtoId: z.string().uuid(),
      quantidade: z.number().positive(),
      precoUnitario: z.number().positive(),
    })).min(1),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })

  try {
    const entrada = await estoqueService.criarEntrada({ ...parsed.data, empresaId: request.user.empresaId })
    return reply.status(201).send(entrada)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function listarEntradasHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  })
  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

  const result = await estoqueService.listarEntradas(request.user.empresaId, params)
  return reply.send(result)
}

export async function criarSaidaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    motivo: z.string().min(1, 'Motivo obrigatório'),
    observacao: z.string().optional(),
    itens: z.array(z.object({
      produtoId: z.string().uuid(),
      quantidade: z.number().positive(),
    })).min(1),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })

  try {
    const saida = await estoqueService.criarSaida({ ...parsed.data, empresaId: request.user.empresaId })
    return reply.status(201).send(saida)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function listarSaidasHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  })
  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

  const result = await estoqueService.listarSaidas(request.user.empresaId, params)
  return reply.send(result)
}

export async function criarPedidoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    fornecedorId: z.string().uuid(),
    observacao: z.string().optional(),
    itens: z.array(z.object({
      produtoId: z.string().uuid(),
      quantidade: z.number().positive(),
      precoUnitario: z.number().positive(),
    })).min(1),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })

  try {
    const pedido = await estoqueService.criarPedidoCompra({ ...parsed.data, empresaId: request.user.empresaId })
    return reply.status(201).send(pedido)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function listarPedidosHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.string().optional(),
  })
  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

  const result = await estoqueService.listarPedidosCompra(request.user.empresaId, params)
  return reply.send(result)
}

export async function receberPedidoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  try {
    const entrada = await estoqueService.receberPedido(parsed.data.id, request.user.empresaId)
    return reply.status(201).send(entrada)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}
