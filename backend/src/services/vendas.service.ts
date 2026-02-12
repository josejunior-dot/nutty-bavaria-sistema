import { prisma } from '../lib/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'

export async function criarVenda(data: {
  empresaId: string
  usuarioId: string
  terminalId: string
  movimentoId: string
  clienteId?: string
  itens: { produtoId: string; quantidade: number; precoUnitario: number }[]
  pagamentos: { tipo: 'DINHEIRO' | 'CREDITO' | 'DEBITO' | 'PIX' | 'VOUCHER'; valor: number }[]
  desconto?: number
}) {
  const movimento = await prisma.movimento.findUnique({ where: { id: data.movimentoId } })
  if (!movimento || movimento.status !== 'ABERTO') {
    throw new Error('Caixa não está aberto')
  }

  const subtotal = data.itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0)
  const desconto = data.desconto ?? 0
  const total = subtotal - desconto

  const totalPagamentos = data.pagamentos.reduce((acc, p) => acc + p.valor, 0)
  if (totalPagamentos < total - 0.01) {
    throw new Error('Pagamento insuficiente')
  }

  return prisma.$transaction(async (tx) => {
    const lastVenda = await tx.venda.findFirst({
      where: { empresaId: data.empresaId },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    })
    const numero = (lastVenda?.numero ?? 0) + 1

    const venda = await tx.venda.create({
      data: {
        numero,
        empresaId: data.empresaId,
        usuarioId: data.usuarioId,
        terminalId: movimento.terminalId,
        movimentoId: data.movimentoId,
        clienteId: data.clienteId,
        subtotal,
        desconto,
        total,
        status: 'CONCLUIDA',
        itens: {
          create: data.itens.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.quantidade * item.precoUnitario,
          })),
        },
        pagamentos: {
          create: data.pagamentos.map((p) => ({
            tipo: p.tipo,
            valor: p.valor,
          })),
        },
      },
      include: {
        usuario: { select: { id: true, nome: true } },
        itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
        pagamentos: true,
        cupons: true,
      },
    })

    // Decrease stock
    for (const item of data.itens) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { decrement: item.quantidade } },
      })
    }

    return venda
  })
}

export async function listarVendas(
  empresaId: string,
  params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    dataInicio?: string
    dataFim?: string
  }
) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const where: Prisma.VendaWhereInput = { empresaId }

  if (params.status) where.status = params.status as any
  if (params.dataInicio) where.createdAt = { ...where.createdAt as any, gte: new Date(params.dataInicio) }
  if (params.dataFim) where.createdAt = { ...where.createdAt as any, lte: new Date(params.dataFim) }
  if (params.search) {
    const num = parseInt(params.search)
    if (!isNaN(num)) {
      where.numero = num
    }
  }

  const [data, total] = await Promise.all([
    prisma.venda.findMany({
      where,
      include: {
        usuario: { select: { id: true, nome: true } },
        itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
        pagamentos: true,
        cupons: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.venda.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getVendaById(id: string, empresaId: string) {
  return prisma.venda.findFirst({
    where: { id, empresaId },
    include: {
      usuario: { select: { id: true, nome: true } },
      itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
      pagamentos: true,
      cupons: { include: { campanha: { select: { id: true, nome: true } } } },
    },
  })
}

export async function cancelarVenda(id: string, empresaId: string) {
  const venda = await prisma.venda.findFirst({
    where: { id, empresaId },
    include: { itens: true },
  })
  if (!venda) throw new Error('Venda não encontrada')
  if (venda.status === 'CANCELADA') throw new Error('Venda já está cancelada')

  return prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of venda.itens) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { increment: Number(item.quantidade) } },
      })
    }

    return tx.venda.update({
      where: { id },
      data: { status: 'CANCELADA' },
      include: {
        usuario: { select: { id: true, nome: true } },
        itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
        pagamentos: true,
      },
    })
  })
}
