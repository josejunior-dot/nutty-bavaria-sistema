import { prisma } from '../lib/prisma.js'

export async function getKpis(empresaId: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const [vendasHoje, vendasOntem, produtosBaixoEstoque] = await Promise.all([
    prisma.venda.aggregate({
      where: { empresaId, status: 'CONCLUIDA', createdAt: { gte: hoje, lt: amanha } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venda.aggregate({
      where: { empresaId, status: 'CONCLUIDA', createdAt: { gte: ontem, lt: hoje } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.produto.count({
      where: {
        empresaId,
        ativo: true,
        estoqueMinimo: { not: null },
        estoqueAtual: { lt: prisma.produto.fields.estoqueMinimo as any },
      },
    }).catch(() => {
      // Fallback: raw count for cross-column comparison
      return prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::int as count FROM produtos
        WHERE empresa_id = ${empresaId} AND ativo = true
        AND estoque_minimo IS NOT NULL AND estoque_atual < estoque_minimo
      `.then(r => Number(r[0]?.count ?? 0))
    }),
  ])

  const totalHoje = Number(vendasHoje._sum.total ?? 0)
  const totalOntem = Number(vendasOntem._sum.total ?? 0)
  const qtdHoje = vendasHoje._count
  const qtdOntem = vendasOntem._count

  return {
    vendasHoje: totalHoje,
    vendasOntem: totalOntem,
    ticketMedio: qtdHoje > 0 ? totalHoje / qtdHoje : 0,
    ticketMedioOntem: qtdOntem > 0 ? totalOntem / qtdOntem : 0,
    qtdVendas: qtdHoje,
    qtdVendasOntem: qtdOntem,
    produtosBaixoEstoque: typeof produtosBaixoEstoque === 'number' ? produtosBaixoEstoque : 0,
  }
}

export async function getVendasChart(empresaId: string, dias: number) {
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - dias)
  dataInicio.setHours(0, 0, 0, 0)

  const vendas = await prisma.$queryRaw<{ data: string; total: number }[]>`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') as data,
      COALESCE(SUM(total), 0)::float as total
    FROM vendas
    WHERE empresa_id = ${empresaId}
      AND status = 'CONCLUIDA'
      AND created_at >= ${dataInicio}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY data ASC
  `

  return vendas
}
