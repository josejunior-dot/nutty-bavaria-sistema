import { prisma } from '../lib/prisma.js'

export async function criarEntrada(data: {
  empresaId: string
  fornecedorId?: string
  numeroNota?: string
  observacao?: string
  itens: { produtoId: string; quantidade: number; precoUnitario: number }[]
}) {
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.entradaEstoque.create({
      data: {
        empresaId: data.empresaId,
        fornecedorId: data.fornecedorId,
        numeroNota: data.numeroNota,
        observacao: data.observacao,
        itens: {
          create: data.itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
          })),
        },
      },
      include: {
        fornecedor: { select: { id: true, nome: true } },
        itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
      },
    })

    for (const item of data.itens) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: {
          estoqueAtual: { increment: item.quantidade },
          precoCusto: item.precoUnitario,
        },
      })
    }

    return entrada
  })
}

export async function listarEntradas(empresaId: string, params: { page?: number; limit?: number }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.entradaEstoque.findMany({
      where: { empresaId },
      include: {
        fornecedor: { select: { id: true, nome: true } },
        itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.entradaEstoque.count({ where: { empresaId } }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function criarSaida(data: {
  empresaId: string
  motivo: string
  observacao?: string
  itens: { produtoId: string; quantidade: number }[]
}) {
  return prisma.$transaction(async (tx) => {
    for (const item of data.itens) {
      const produto = await tx.produto.findUnique({ where: { id: item.produtoId } })
      if (!produto) throw new Error(`Produto não encontrado`)
      if (Number(produto.estoqueAtual) < item.quantidade) {
        throw new Error(`Estoque insuficiente para ${produto.nome}`)
      }
    }

    const saida = await tx.saidaEstoque.create({
      data: {
        empresaId: data.empresaId,
        motivo: data.motivo,
        observacao: data.observacao,
        itens: {
          create: data.itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
          })),
        },
      },
      include: {
        itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
      },
    })

    for (const item of data.itens) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { decrement: item.quantidade } },
      })
    }

    return saida
  })
}

export async function listarSaidas(empresaId: string, params: { page?: number; limit?: number }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.saidaEstoque.findMany({
      where: { empresaId },
      include: {
        itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.saidaEstoque.count({ where: { empresaId } }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function criarPedidoCompra(data: {
  empresaId: string
  fornecedorId: string
  observacao?: string
  itens: { produtoId: string; quantidade: number; precoUnitario: number }[]
}) {
  return prisma.pedidoCompra.create({
    data: {
      empresaId: data.empresaId,
      fornecedorId: data.fornecedorId,
      observacao: data.observacao,
      status: 'RASCUNHO',
      itens: {
        create: data.itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
        })),
      },
    },
    include: {
      fornecedor: { select: { id: true, nome: true } },
      itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
    },
  })
}

export async function listarPedidosCompra(
  empresaId: string,
  params: { page?: number; limit?: number; status?: string }
) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit
  const where: any = { empresaId }
  if (params.status) where.status = params.status

  const [data, total] = await Promise.all([
    prisma.pedidoCompra.findMany({
      where,
      include: {
        fornecedor: { select: { id: true, nome: true } },
        itens: { include: { produto: { select: { id: true, nome: true, codigo: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pedidoCompra.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function receberPedido(id: string, empresaId: string) {
  const pedido = await prisma.pedidoCompra.findFirst({
    where: { id, empresaId },
    include: { itens: true },
  })
  if (!pedido) throw new Error('Pedido não encontrado')
  if (pedido.status === 'RECEBIDO') throw new Error('Pedido já foi recebido')

  return prisma.$transaction(async (tx) => {
    await tx.pedidoCompra.update({ where: { id }, data: { status: 'RECEBIDO' } })

    const entrada = await tx.entradaEstoque.create({
      data: {
        empresaId,
        fornecedorId: pedido.fornecedorId,
        observacao: `Recebimento do pedido de compra`,
        itens: {
          create: pedido.itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
          })),
        },
      },
    })

    for (const item of pedido.itens) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: {
          estoqueAtual: { increment: Number(item.quantidade) },
          precoCusto: Number(item.precoUnitario),
        },
      })
    }

    return entrada
  })
}

export async function getSugestaoCompra(empresaId: string) {
  const produtos = await prisma.$queryRaw<any[]>`
    SELECT id, nome, codigo, unidade, estoque_atual::float as "estoqueAtual",
           estoque_minimo::float as "estoqueMinimo",
           (estoque_minimo - estoque_atual)::float as "sugestaoQuantidade"
    FROM produtos
    WHERE empresa_id = ${empresaId} AND ativo = true
    AND estoque_minimo IS NOT NULL AND estoque_atual < estoque_minimo
    ORDER BY (estoque_atual::float / NULLIF(estoque_minimo::float, 0)) ASC
  `
  return produtos
}
