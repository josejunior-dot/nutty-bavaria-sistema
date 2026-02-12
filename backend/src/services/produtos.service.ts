import { prisma } from '../lib/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'

export async function listarProdutos(
  empresaId: string,
  params: { page?: number; limit?: number; search?: string; ativo?: boolean }
) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const where: Prisma.ProdutoWhereInput = { empresaId }
  if (params.ativo !== undefined) where.ativo = params.ativo
  if (params.search) {
    where.OR = [
      { nome: { contains: params.search, mode: 'insensitive' } },
      { codigo: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.produto.findMany({ where, orderBy: { nome: 'asc' }, skip, take: limit }),
    prisma.produto.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getProdutoById(id: string, empresaId: string) {
  return prisma.produto.findFirst({ where: { id, empresaId } })
}

export async function criarProduto(data: {
  nome: string
  codigo: string
  unidade?: string
  precoVenda: number
  precoCusto?: number
  estoqueMinimo?: number
  leadTimeDias?: number
  loteMinimo?: number
  coberturaDias?: number
  fornecedorPadraoId?: string
  empresaId: string
}) {
  return prisma.produto.create({
    data: {
      nome: data.nome,
      codigo: data.codigo,
      unidade: (data.unidade as any) ?? 'UN',
      precoVenda: data.precoVenda,
      precoCusto: data.precoCusto,
      estoqueMinimo: data.estoqueMinimo ?? 0,
      estoqueAtual: 0,
      leadTimeDias: data.leadTimeDias,
      loteMinimo: data.loteMinimo,
      coberturaDias: data.coberturaDias,
      fornecedorPadraoId: data.fornecedorPadraoId,
      empresaId: data.empresaId,
    },
  })
}

export async function atualizarProduto(id: string, empresaId: string, data: any) {
  const updateData = { ...data }
  delete updateData.id
  delete updateData.empresaId

  return prisma.produto.update({
    where: { id },
    data: updateData,
  })
}

export async function desativarProduto(id: string, empresaId: string) {
  return prisma.produto.update({
    where: { id },
    data: { ativo: false },
  })
}

export async function getProdutosEstoqueBaixo(empresaId: string) {
  const produtos = await prisma.$queryRaw<any[]>`
    SELECT * FROM produtos
    WHERE empresa_id = ${empresaId} AND ativo = true
    AND estoque_minimo IS NOT NULL AND estoque_atual < estoque_minimo
    ORDER BY (estoque_atual::float / NULLIF(estoque_minimo::float, 0)) ASC
  `
  return produtos
}

export async function getProdutosParaVenda(empresaId: string) {
  return prisma.produto.findMany({
    where: { empresaId, ativo: true },
    select: {
      id: true,
      nome: true,
      codigo: true,
      precoVenda: true,
      estoqueAtual: true,
      unidade: true,
    },
    orderBy: { nome: 'asc' },
  })
}
