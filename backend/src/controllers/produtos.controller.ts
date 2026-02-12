import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as produtosService from '../services/produtos.service.js'

export async function listarProdutosHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    ativo: z.coerce.boolean().optional(),
  })
  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

  const result = await produtosService.listarProdutos(request.user.empresaId, params)
  return reply.send(result)
}

export async function getProdutoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  const produto = await produtosService.getProdutoById(parsed.data.id, request.user.empresaId)
  if (!produto) return reply.status(404).send({ message: 'Produto não encontrado' })
  return reply.send(produto)
}

export async function criarProdutoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    nome: z.string().min(1),
    codigo: z.string().min(1),
    unidade: z.string().optional(),
    precoVenda: z.number().positive(),
    precoCusto: z.number().positive().optional(),
    estoqueMinimo: z.number().min(0).optional(),
    leadTimeDias: z.number().int().min(0).optional().nullable(),
    loteMinimo: z.number().int().min(1).optional().nullable(),
    coberturaDias: z.number().int().min(1).optional().nullable(),
    fornecedorPadraoId: z.string().uuid().optional().nullable(),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })

  try {
    const { leadTimeDias, loteMinimo, coberturaDias, fornecedorPadraoId, ...rest } = parsed.data
    const produto = await produtosService.criarProduto({
      ...rest,
      leadTimeDias: leadTimeDias ?? undefined,
      loteMinimo: loteMinimo ?? undefined,
      coberturaDias: coberturaDias ?? undefined,
      fornecedorPadraoId: fornecedorPadraoId ?? undefined,
      empresaId: request.user.empresaId,
    })
    return reply.status(201).send(produto)
  } catch (err: any) {
    if (err.code === 'P2002') return reply.status(400).send({ message: 'Código de produto já existe' })
    return reply.status(400).send({ message: err.message })
  }
}

export async function atualizarProdutoHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const params = paramsSchema.safeParse(request.params)
  if (!params.success) return reply.status(400).send({ message: 'ID inválido' })

  try {
    const produto = await produtosService.atualizarProduto(params.data.id, request.user.empresaId, request.body)
    return reply.send(produto)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function desativarProdutoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  await produtosService.desativarProduto(parsed.data.id, request.user.empresaId)
  return reply.send({ message: 'Produto desativado' })
}

export async function getProdutosEstoqueBaixoHandler(request: FastifyRequest, reply: FastifyReply) {
  const produtos = await produtosService.getProdutosEstoqueBaixo(request.user.empresaId)
  return reply.send(produtos)
}

export async function getProdutosVendaHandler(request: FastifyRequest, reply: FastifyReply) {
  const produtos = await produtosService.getProdutosParaVenda(request.user.empresaId)
  return reply.send(produtos)
}
