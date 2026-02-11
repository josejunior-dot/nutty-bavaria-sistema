import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as relatoriosService from '../services/relatorios.service.js'

const dateParams = z.object({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
})

export async function curvaABCHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dateParams.safeParse(request.query)
  const params = parsed.success ? parsed.data : {}
  return reply.send(await relatoriosService.getCurvaABC(request.user.empresaId, params))
}

export async function vendasPeriodoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    dataInicio: z.string(),
    dataFim: z.string(),
    agrupamento: z.enum(['dia', 'semana', 'mes']).default('dia'),
  })
  const parsed = schema.safeParse(request.query)
  if (!parsed.success) return reply.status(400).send({ message: 'Informe período' })
  return reply.send(await relatoriosService.getVendasPorPeriodo(request.user.empresaId, parsed.data))
}

export async function rankingVendedoresHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dateParams.safeParse(request.query)
  const params = parsed.success ? parsed.data : {}
  return reply.send(await relatoriosService.getRankingVendedores(request.user.empresaId, params))
}

export async function comparativoQuiosquesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dateParams.safeParse(request.query)
  const params = parsed.success ? parsed.data : {}
  return reply.send(await relatoriosService.getComparativoQuiosques(params))
}

export async function comissoesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dateParams.safeParse(request.query)
  const params = parsed.success ? parsed.data : {}
  return reply.send(await relatoriosService.getRelatorioComissoes(request.user.empresaId, params))
}

export async function cuponsHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    campanhaId: z.string().uuid().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
  })
  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : {}
  return reply.send(await relatoriosService.getRelatorioCupons(request.user.empresaId, params))
}
