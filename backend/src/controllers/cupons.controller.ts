import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as cuponsService from '../services/cupons.service.js'

export async function getCampanhasAtivasHandler(request: FastifyRequest, reply: FastifyReply) {
  const campanhas = await cuponsService.getCampanhasAtivas(request.user.empresaId)
  return reply.send(campanhas)
}

export async function verificarCuponsHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ vendaId: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  try {
    const result = await cuponsService.verificarCuponsVenda(parsed.data.vendaId)
    return reply.send(result)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function registrarCuponsHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    vendaId: z.string().uuid(),
    campanhaId: z.string().uuid(),
    codigos: z.array(z.string().min(1)).min(1),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })

  try {
    const cupons = await cuponsService.registrarCupons(parsed.data)
    return reply.status(201).send(cupons)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function listarCuponsHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    campanhaId: z.string().uuid().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  })
  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

  const result = await cuponsService.listarCupons(request.user.empresaId, params)
  return reply.send(result)
}

export async function listarCampanhasHandler(request: FastifyRequest, reply: FastifyReply) {
  const campanhas = await cuponsService.listarCampanhas(request.user.empresaId)
  return reply.send(campanhas)
}

export async function criarCampanhaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    nome: z.string().min(1),
    descricao: z.string().optional(),
    dataInicio: z.string(),
    dataFim: z.string(),
    valorMinimo: z.number().positive(),
    shoppingId: z.string().uuid(),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })

  const campanha = await cuponsService.criarCampanha({
    ...parsed.data,
    empresaId: request.user.empresaId,
  })
  return reply.status(201).send(campanha)
}

export async function atualizarCampanhaHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const params = paramsSchema.safeParse(request.params)
  if (!params.success) return reply.status(400).send({ message: 'ID inválido' })

  const campanha = await cuponsService.atualizarCampanha(params.data.id, request.body)
  return reply.send(campanha)
}

export async function desativarCampanhaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  await cuponsService.desativarCampanha(parsed.data.id)
  return reply.send({ message: 'Campanha desativada' })
}
