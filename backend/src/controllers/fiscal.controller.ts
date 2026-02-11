import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as fiscalService from '../services/fiscal.service.js'

export async function emitirNotaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ vendaId: z.string().uuid() })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos' })

  try {
    const nota = await fiscalService.emitirNota(request.user.empresaId, parsed.data.vendaId)
    return reply.status(201).send(nota)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function listarNotasHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.string().optional(),
  })
  const parsed = schema.safeParse(request.query)
  const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

  const result = await fiscalService.listarNotas(request.user.empresaId, params)
  return reply.send(result)
}

export async function getNotaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  const nota = await fiscalService.getNotaById(parsed.data.id, request.user.empresaId)
  if (!nota) return reply.status(404).send({ message: 'Nota fiscal não encontrada' })
  return reply.send(nota)
}

export async function cancelarNotaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  try {
    const nota = await fiscalService.cancelarNota(parsed.data.id, request.user.empresaId)
    return reply.send(nota)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function reenviarNotaHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  try {
    const nota = await fiscalService.reenviarNota(parsed.data.id, request.user.empresaId)
    return reply.send(nota)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function getResumoFiscalHandler(request: FastifyRequest, reply: FastifyReply) {
  const resumo = await fiscalService.getResumoFiscal(request.user.empresaId)
  return reply.send(resumo)
}
