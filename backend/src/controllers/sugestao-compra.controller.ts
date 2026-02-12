import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as sugestaoService from '../services/sugestao-compra.service.js'
import * as eventoService from '../services/evento-sazonal.service.js'

export async function getSugestoesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const sugestoes = await sugestaoService.gerarSugestaoCompra(request.user.empresaId)
    return reply.send(sugestoes)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function listarEventosHandler(request: FastifyRequest, reply: FastifyReply) {
  const eventos = await eventoService.listar(request.user.empresaId)
  return reply.send(eventos)
}

export async function criarEventoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    nome: z.string().min(1, 'Nome obrigatório'),
    dataInicio: z.string().min(1),
    dataFim: z.string().min(1),
    multiplicador: z.number().min(0.1).max(10),
    recorrente: z.boolean().optional(),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })

  try {
    const evento = await eventoService.criar({ ...parsed.data, empresaId: request.user.empresaId })
    return reply.status(201).send(evento)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function atualizarEventoHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const parsedParams = paramsSchema.safeParse(request.params)
  if (!parsedParams.success) return reply.status(400).send({ message: 'ID inválido' })

  const schema = z.object({
    nome: z.string().min(1).optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    multiplicador: z.number().min(0.1).max(10).optional(),
    recorrente: z.boolean().optional(),
  })
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })

  try {
    const evento = await eventoService.atualizar(parsedParams.data.id, request.user.empresaId, parsed.data)
    return reply.send(evento)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}

export async function excluirEventoHandler(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(request.params)
  if (!parsed.success) return reply.status(400).send({ message: 'ID inválido' })

  try {
    await eventoService.excluir(parsed.data.id, request.user.empresaId)
    return reply.status(204).send()
  } catch (err: any) {
    return reply.status(400).send({ message: err.message })
  }
}
