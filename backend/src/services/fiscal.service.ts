import { prisma } from '../lib/prisma.js'

function gerarChaveNfe(): string {
  return Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('')
}

export async function emitirNota(empresaId: string, vendaId: string) {
  const venda = await prisma.venda.findFirst({ where: { id: vendaId, empresaId } })
  if (!venda) throw new Error('Venda não encontrada')

  const existente = await prisma.notaFiscal.findUnique({ where: { vendaId } })
  if (existente) throw new Error('Já existe nota fiscal para esta venda')

  return prisma.notaFiscal.create({
    data: {
      empresaId,
      vendaId,
      numero: String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0'),
      serie: '001',
      chave: gerarChaveNfe(),
      status: 'EMITIDA',
    },
    include: { venda: { select: { id: true, numero: true, total: true } } },
  })
}

export async function listarNotas(
  empresaId: string,
  params: { page?: number; limit?: number; status?: string }
) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit
  const where: any = { empresaId }
  if (params.status) where.status = params.status

  const [data, total] = await Promise.all([
    prisma.notaFiscal.findMany({
      where,
      include: { venda: { select: { id: true, numero: true, total: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notaFiscal.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getNotaById(id: string, empresaId: string) {
  return prisma.notaFiscal.findFirst({
    where: { id, empresaId },
    include: { venda: { select: { id: true, numero: true, total: true } } },
  })
}

export async function cancelarNota(id: string, empresaId: string) {
  const nota = await prisma.notaFiscal.findFirst({ where: { id, empresaId } })
  if (!nota) throw new Error('Nota fiscal não encontrada')
  if (nota.status !== 'EMITIDA') throw new Error('Apenas notas emitidas podem ser canceladas')

  const horasDesdeEmissao = (Date.now() - nota.createdAt.getTime()) / (1000 * 60 * 60)
  if (horasDesdeEmissao > 24) throw new Error('Prazo de cancelamento expirado (24h)')

  return prisma.notaFiscal.update({
    where: { id },
    data: { status: 'CANCELADA' },
    include: { venda: { select: { id: true, numero: true, total: true } } },
  })
}

export async function reenviarNota(id: string, empresaId: string) {
  const nota = await prisma.notaFiscal.findFirst({ where: { id, empresaId } })
  if (!nota) throw new Error('Nota fiscal não encontrada')
  if (nota.status !== 'REJEITADA') throw new Error('Apenas notas rejeitadas podem ser reenviadas')

  return prisma.notaFiscal.update({
    where: { id },
    data: { status: 'EMITIDA', chave: gerarChaveNfe() },
    include: { venda: { select: { id: true, numero: true, total: true } } },
  })
}

export async function getResumoFiscal(empresaId: string) {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [emitidas, pendentes, rejeitadas] = await Promise.all([
    prisma.notaFiscal.count({ where: { empresaId, status: 'EMITIDA', createdAt: { gte: inicioMes } } }),
    prisma.notaFiscal.count({ where: { empresaId, status: 'PENDENTE' } }),
    prisma.notaFiscal.count({ where: { empresaId, status: 'REJEITADA' } }),
  ])

  return { emitidas, recebidas: 0, pendentes, rejeitadas }
}
