import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as caixaService from '../services/caixa.service.js'

export async function getMovimentoAbertoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ terminalId: z.string().uuid().optional() })
  const parsed = schema.safeParse(request.query)
  const terminalId = parsed.success ? parsed.data.terminalId : undefined

  const movimento = await caixaService.getMovimentoAberto(request.user.empresaId, terminalId)
  return reply.send(movimento)
}

export async function abrirCaixaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    terminalId: z.string().uuid(),
    valorAbertura: z.number().min(0),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })
  }

  try {
    const movimento = await caixaService.abrirCaixa({
      empresaId: request.user.empresaId,
      usuarioId: request.user.sub,
      terminalId: parsed.data.terminalId,
      valorAbertura: parsed.data.valorAbertura,
    })
    return reply.status(201).send(movimento)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function fecharCaixaHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const bodySchema = z.object({ valorFechamento: z.number().min(0) })

  const params = paramsSchema.safeParse(request.params)
  const body = bodySchema.safeParse(request.body)

  if (!params.success || !body.success) {
    return reply.status(400).send({ message: 'Dados inválidos' })
  }

  try {
    const movimento = await caixaService.fecharCaixa(params.data.id, body.data.valorFechamento)
    return reply.send(movimento)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function sangriaHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const bodySchema = z.object({
    valor: z.number().positive('Valor deve ser positivo'),
    observacao: z.string().min(1, 'Justificativa obrigatória'),
  })

  const params = paramsSchema.safeParse(request.params)
  const body = bodySchema.safeParse(request.body)

  if (!params.success) return reply.status(400).send({ message: 'ID inválido' })
  if (!body.success) return reply.status(400).send({ message: 'Dados inválidos', errors: body.error.flatten() })

  try {
    const operacao = await caixaService.registrarSangria(params.data.id, body.data.valor, body.data.observacao)
    return reply.status(201).send(operacao)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function suprimentoHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const bodySchema = z.object({
    valor: z.number().positive('Valor deve ser positivo'),
    observacao: z.string().min(1, 'Justificativa obrigatória'),
  })

  const params = paramsSchema.safeParse(request.params)
  const body = bodySchema.safeParse(request.body)

  if (!params.success) return reply.status(400).send({ message: 'ID inválido' })
  if (!body.success) return reply.status(400).send({ message: 'Dados inválidos', errors: body.error.flatten() })

  try {
    const operacao = await caixaService.registrarSuprimento(params.data.id, body.data.valor, body.data.observacao)
    return reply.status(201).send(operacao)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function getMovimentoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  const movimento = await caixaService.getMovimentoById(parsed.data.id)
  if (!movimento) return reply.status(404).send({ message: 'Movimento não encontrado' })
  return reply.send(movimento)
}

export async function listarMovimentosHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  })
  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

  const result = await caixaService.listarMovimentos(request.user.empresaId, params)
  return reply.send(result)
}

export async function getResumoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  const resumo = await caixaService.getResumo(parsed.data.id)
  return reply.send(resumo)
}
