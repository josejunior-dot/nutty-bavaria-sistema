import { prisma } from '../lib/prisma.js'

export async function getCampanhasAtivas(empresaId: string) {
  const agora = new Date()
  return prisma.campanhaShopping.findMany({
    where: {
      empresaId,
      ativo: true,
      dataInicio: { lte: agora },
      dataFim: { gte: agora },
    },
    include: {
      shopping: { select: { id: true, nome: true } },
      _count: { select: { cupons: true } },
    },
  })
}

export async function verificarCuponsVenda(vendaId: string) {
  const venda = await prisma.venda.findUnique({
    where: { id: vendaId },
    select: { total: true, empresaId: true },
  })
  if (!venda) throw new Error('Venda não encontrada')

  const campanhas = await getCampanhasAtivas(venda.empresaId)
  const total = Number(venda.total)

  return campanhas
    .filter((c) => total >= Number(c.valorMinimo))
    .map((c) => ({
      campanhaId: c.id,
      campanhaNome: c.nome,
      qtdCupons: Math.floor(total / Number(c.valorMinimo)),
    }))
}

export async function registrarCupons(data: {
  vendaId: string
  campanhaId: string
  codigos: string[]
}) {
  return prisma.cupomShopping.createManyAndReturn({
    data: data.codigos.map((codigo) => ({
      codigo,
      campanhaId: data.campanhaId,
      vendaId: data.vendaId,
    })),
  })
}

export async function listarCupons(
  empresaId: string,
  params: { campanhaId?: string; page?: number; limit?: number }
) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const where: any = { campanha: { empresaId } }
  if (params.campanhaId) where.campanhaId = params.campanhaId

  const [data, total] = await Promise.all([
    prisma.cupomShopping.findMany({
      where,
      include: { campanha: { select: { id: true, nome: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.cupomShopping.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function listarCampanhas(empresaId: string) {
  return prisma.campanhaShopping.findMany({
    where: { empresaId },
    include: {
      shopping: { select: { id: true, nome: true } },
      _count: { select: { cupons: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function criarCampanha(data: {
  nome: string
  descricao?: string
  dataInicio: string
  dataFim: string
  valorMinimo: number
  shoppingId: string
  empresaId: string
}) {
  return prisma.campanhaShopping.create({
    data: {
      nome: data.nome,
      descricao: data.descricao,
      dataInicio: new Date(data.dataInicio),
      dataFim: new Date(data.dataFim),
      valorMinimo: data.valorMinimo,
      shoppingId: data.shoppingId,
      empresaId: data.empresaId,
      ativo: true,
    },
    include: { shopping: { select: { id: true, nome: true } } },
  })
}

export async function atualizarCampanha(id: string, data: any) {
  const updateData: any = { ...data }
  if (data.dataInicio) updateData.dataInicio = new Date(data.dataInicio)
  if (data.dataFim) updateData.dataFim = new Date(data.dataFim)
  delete updateData.id
  delete updateData.empresaId

  return prisma.campanhaShopping.update({
    where: { id },
    data: updateData,
    include: { shopping: { select: { id: true, nome: true } } },
  })
}

export async function desativarCampanha(id: string) {
  return prisma.campanhaShopping.update({
    where: { id },
    data: { ativo: false },
  })
}
