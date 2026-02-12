import { prisma } from '../lib/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'

export async function getMovimentoAberto(empresaId: string, terminalId?: string) {
  const where: Prisma.MovimentoWhereInput = { empresaId, status: 'ABERTO' }
  if (terminalId) where.terminalId = terminalId

  return prisma.movimento.findFirst({
    where,
    include: {
      usuario: { select: { id: true, nome: true } },
      terminal: { select: { id: true, nome: true, codigo: true } },
      operacoes: { orderBy: { createdAt: 'desc' } },
      _count: { select: { vendas: true } },
    },
    orderBy: { dataAbertura: 'desc' },
  })
}

export async function abrirCaixa(data: {
  empresaId: string
  usuarioId: string
  terminalId: string
  valorAbertura: number
}) {
  const existente = await prisma.movimento.findFirst({
    where: { empresaId: data.empresaId, terminalId: data.terminalId, status: 'ABERTO' },
  })
  if (existente) {
    throw new Error('Já existe um caixa aberto neste terminal')
  }

  return prisma.$transaction(async (tx) => {
    const movimento = await tx.movimento.create({
      data: {
        empresaId: data.empresaId,
        usuarioId: data.usuarioId,
        terminalId: data.terminalId,
        valorAbertura: data.valorAbertura,
        status: 'ABERTO',
      },
    })

    await tx.movimentoOperacao.create({
      data: {
        movimentoId: movimento.id,
        tipo: 'ABERTURA',
        valor: data.valorAbertura,
        observacao: 'Abertura de caixa',
      },
    })

    return tx.movimento.findUniqueOrThrow({
      where: { id: movimento.id },
      include: {
        usuario: { select: { id: true, nome: true } },
        terminal: { select: { id: true, nome: true, codigo: true } },
        operacoes: { orderBy: { createdAt: 'desc' } },
        _count: { select: { vendas: true } },
      },
    })
  })
}

export async function fecharCaixa(movimentoId: string, valorFechamento: number) {
  const movimento = await prisma.movimento.findUnique({ where: { id: movimentoId } })
  if (!movimento) throw new Error('Movimento não encontrado')
  if (movimento.status === 'FECHADO') throw new Error('Este caixa já está fechado')

  return prisma.$transaction(async (tx) => {
    await tx.movimentoOperacao.create({
      data: {
        movimentoId,
        tipo: 'FECHAMENTO',
        valor: valorFechamento,
        observacao: 'Fechamento de caixa',
      },
    })

    return tx.movimento.update({
      where: { id: movimentoId },
      data: {
        status: 'FECHADO',
        valorFechamento,
        dataFechamento: new Date(),
      },
      include: {
        usuario: { select: { id: true, nome: true } },
        terminal: { select: { id: true, nome: true, codigo: true } },
        operacoes: { orderBy: { createdAt: 'desc' } },
        _count: { select: { vendas: true } },
      },
    })
  })
}

export async function registrarSangria(movimentoId: string, valor: number, observacao: string) {
  const movimento = await prisma.movimento.findUnique({ where: { id: movimentoId } })
  if (!movimento) throw new Error('Movimento não encontrado')
  if (movimento.status === 'FECHADO') throw new Error('Caixa está fechado')

  return prisma.movimentoOperacao.create({
    data: { movimentoId, tipo: 'SANGRIA', valor, observacao },
  })
}

export async function registrarSuprimento(movimentoId: string, valor: number, observacao: string) {
  const movimento = await prisma.movimento.findUnique({ where: { id: movimentoId } })
  if (!movimento) throw new Error('Movimento não encontrado')
  if (movimento.status === 'FECHADO') throw new Error('Caixa está fechado')

  return prisma.movimentoOperacao.create({
    data: { movimentoId, tipo: 'SUPRIMENTO', valor, observacao },
  })
}

export async function getMovimentoById(id: string) {
  return prisma.movimento.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nome: true } },
      terminal: { select: { id: true, nome: true, codigo: true } },
      operacoes: { orderBy: { createdAt: 'desc' } },
      _count: { select: { vendas: true } },
    },
  })
}

export async function listarMovimentos(empresaId: string, params: { page?: number; limit?: number }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.movimento.findMany({
      where: { empresaId },
      include: {
        usuario: { select: { id: true, nome: true } },
        terminal: { select: { id: true, nome: true, codigo: true } },
        _count: { select: { vendas: true } },
      },
      orderBy: { dataAbertura: 'desc' },
      skip,
      take: limit,
    }),
    prisma.movimento.count({ where: { empresaId } }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getResumo(movimentoId: string) {
  const [vendas, operacoes] = await Promise.all([
    prisma.venda.aggregate({
      where: { movimentoId, status: 'CONCLUIDA' },
      _sum: { total: true },
    }),
    prisma.movimentoOperacao.findMany({
      where: { movimentoId },
    }),
  ])

  let totalSangrias = 0
  let totalSuprimentos = 0

  for (const op of operacoes) {
    if (op.tipo === 'SANGRIA') totalSangrias += Number(op.valor)
    if (op.tipo === 'SUPRIMENTO') totalSuprimentos += Number(op.valor)
  }

  const totalVendas = Number(vendas._sum.total ?? 0)
  const movimento = await prisma.movimento.findUnique({ where: { id: movimentoId } })
  const valorAbertura = Number(movimento?.valorAbertura ?? 0)
  const saldo = valorAbertura + totalVendas + totalSuprimentos - totalSangrias

  return {
    totalVendas,
    totalSangrias,
    totalSuprimentos,
    totalTrocas: 0,
    saldo,
  }
}
