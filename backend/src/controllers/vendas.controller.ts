import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as vendasService from '../services/vendas.service.js'

const tipoPagamentoEnum = z.enum(['DINHEIRO', 'CREDITO', 'DEBITO', 'PIX', 'VOUCHER'])

const criarVendaSchema = z.object({
  movimentoId: z.string().uuid(),
  clienteId: z.string().uuid().optional(),
  desconto: z.number().min(0).optional(),
  itens: z.array(z.object({
    produtoId: z.string().uuid(),
    quantidade: z.number().positive(),
    precoUnitario: z.number().positive(),
  })).min(1, 'Adicione pelo menos um item'),
  pagamentos: z.array(z.object({
    tipo: tipoPagamentoEnum,
    valor: z.number().positive(),
  })).min(1, 'Selecione a forma de pagamento'),
})

export async function criarVendaHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = criarVendaSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })
  }

  try {
    const venda = await vendasService.criarVenda({
      empresaId: request.user.empresaId,
      usuarioId: request.user.sub,
      terminalId: '', // Will be derived from movimento
      ...parsed.data,
    })
    return reply.status(201).send(venda)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function listarVendasHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    status: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
  })

  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

  const result = await vendasService.listarVendas(request.user.empresaId, params)
  return reply.send(result)
}

export async function getVendaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  const venda = await vendasService.getVendaById(parsed.data.id, request.user.empresaId)
  if (!venda) return reply.status(404).send({ message: 'Venda não encontrada' })
  return reply.send(venda)
}

export async function cancelarVendaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  try {
    const venda = await vendasService.cancelarVenda(parsed.data.id, request.user.empresaId)
    return reply.send(venda)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}
