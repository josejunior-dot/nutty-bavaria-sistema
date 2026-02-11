import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { getKpis, getVendasChart } from '../services/dashboard.service.js'

export async function getKpisHandler(request: FastifyRequest, reply: FastifyReply) {
  const kpis = await getKpis(request.user.empresaId)
  return reply.send(kpis)
}

export async function getVendasChartHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ dias: z.coerce.number().min(1).max(365).default(7) })
  const parsed = schema.safeParse(request.query)
  const dias = parsed.success ? parsed.data.dias : 7
  const chart = await getVendasChart(request.user.empresaId, dias)
  return reply.send(chart)
}
