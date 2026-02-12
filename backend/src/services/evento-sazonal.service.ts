import { prisma } from '../lib/prisma.js'

export async function listar(empresaId: string) {
  return prisma.eventoSazonal.findMany({
    where: { empresaId },
    orderBy: { dataInicio: 'desc' },
  })
}

export async function criar(data: {
  empresaId: string
  nome: string
  dataInicio: string
  dataFim: string
  multiplicador: number
  recorrente?: boolean
}) {
  return prisma.eventoSazonal.create({
    data: {
      empresaId: data.empresaId,
      nome: data.nome,
      dataInicio: new Date(data.dataInicio),
      dataFim: new Date(data.dataFim),
      multiplicador: data.multiplicador,
      recorrente: data.recorrente ?? false,
    },
  })
}

export async function atualizar(
  id: string,
  empresaId: string,
  data: {
    nome?: string
    dataInicio?: string
    dataFim?: string
    multiplicador?: number
    recorrente?: boolean
  }
) {
  const evento = await prisma.eventoSazonal.findFirst({ where: { id, empresaId } })
  if (!evento) throw new Error('Evento não encontrado')

  return prisma.eventoSazonal.update({
    where: { id },
    data: {
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.dataInicio !== undefined && { dataInicio: new Date(data.dataInicio) }),
      ...(data.dataFim !== undefined && { dataFim: new Date(data.dataFim) }),
      ...(data.multiplicador !== undefined && { multiplicador: data.multiplicador }),
      ...(data.recorrente !== undefined && { recorrente: data.recorrente }),
    },
  })
}

export async function excluir(id: string, empresaId: string) {
  const evento = await prisma.eventoSazonal.findFirst({ where: { id, empresaId } })
  if (!evento) throw new Error('Evento não encontrado')

  return prisma.eventoSazonal.delete({ where: { id } })
}
