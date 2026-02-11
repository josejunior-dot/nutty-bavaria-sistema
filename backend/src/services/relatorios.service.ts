import { prisma } from '../lib/prisma.js'

export async function getCurvaABC(empresaId: string, params: { dataInicio?: string; dataFim?: string }) {
  const where: any = { 'v.empresa_id': empresaId, 'v.status': 'CONCLUIDA' }
  let dateFilter = ''
  if (params.dataInicio) dateFilter += ` AND v.created_at >= '${params.dataInicio}'`
  if (params.dataFim) dateFilter += ` AND v.created_at <= '${params.dataFim}'`

  const produtos = await prisma.$queryRawUnsafe<any[]>(`
    SELECT p.id as "produtoId", p.nome, SUM(vi.subtotal)::float as "totalVendido"
    FROM venda_itens vi
    JOIN vendas v ON v.id = vi.venda_id
    JOIN produtos p ON p.id = vi.produto_id
    WHERE v.empresa_id = $1 AND v.status = 'CONCLUIDA' ${dateFilter}
    GROUP BY p.id, p.nome
    ORDER BY "totalVendido" DESC
  `, empresaId)

  const totalGeral = produtos.reduce((acc: number, p: any) => acc + p.totalVendido, 0)
  let acumulado = 0

  return produtos.map((p: any) => {
    const percentual = totalGeral > 0 ? (p.totalVendido / totalGeral) * 100 : 0
    acumulado += percentual
    return {
      ...p,
      percentual: Math.round(percentual * 100) / 100,
      percentualAcumulado: Math.round(acumulado * 100) / 100,
      classificacao: acumulado <= 80 ? 'A' : acumulado <= 95 ? 'B' : 'C',
    }
  })
}

export async function getVendasPorPeriodo(
  empresaId: string,
  params: { dataInicio: string; dataFim: string; agrupamento?: string }
) {
  const fmt = params.agrupamento === 'mes' ? 'YYYY-MM' : params.agrupamento === 'semana' ? 'IYYY-IW' : 'YYYY-MM-DD'

  return prisma.$queryRawUnsafe<any[]>(`
    SELECT TO_CHAR(created_at, $2) as data,
           COALESCE(SUM(total), 0)::float as total,
           COUNT(*)::int as quantidade
    FROM vendas
    WHERE empresa_id = $1 AND status = 'CONCLUIDA'
      AND created_at >= $3 AND created_at <= $4
    GROUP BY TO_CHAR(created_at, $2)
    ORDER BY data ASC
  `, empresaId, fmt, params.dataInicio, params.dataFim)
}

export async function getRankingVendedores(empresaId: string, params: { dataInicio?: string; dataFim?: string }) {
  let dateFilter = ''
  if (params.dataInicio) dateFilter += ` AND v.created_at >= '${params.dataInicio}'`
  if (params.dataFim) dateFilter += ` AND v.created_at <= '${params.dataFim}'`

  return prisma.$queryRawUnsafe<any[]>(`
    SELECT u.id as "usuarioId", u.nome,
           COALESCE(SUM(v.total), 0)::float as "totalVendas",
           COUNT(v.id)::int as "qtdVendas"
    FROM usuarios u
    LEFT JOIN vendas v ON v.usuario_id = u.id AND v.status = 'CONCLUIDA' ${dateFilter}
    WHERE u.empresa_id = $1 AND u.ativo = true
    GROUP BY u.id, u.nome
    ORDER BY "totalVendas" DESC
  `, empresaId)
}

export async function getComparativoQuiosques(params: { dataInicio?: string; dataFim?: string }) {
  let dateFilter = ''
  if (params.dataInicio) dateFilter += ` AND v.created_at >= '${params.dataInicio}'`
  if (params.dataFim) dateFilter += ` AND v.created_at <= '${params.dataFim}'`

  return prisma.$queryRawUnsafe<any[]>(`
    SELECT e.id as "empresaId", e.nome,
           COALESCE(SUM(v.total), 0)::float as "totalVendas",
           CASE WHEN COUNT(v.id) > 0 THEN (SUM(v.total) / COUNT(v.id))::float ELSE 0 END as "ticketMedio",
           COUNT(v.id)::int as "qtdVendas"
    FROM empresas e
    LEFT JOIN vendas v ON v.empresa_id = e.id AND v.status = 'CONCLUIDA' ${dateFilter}
    WHERE e.ativo = true
    GROUP BY e.id, e.nome
    ORDER BY "totalVendas" DESC
  `)
}

export async function getRelatorioComissoes(empresaId: string, params: { dataInicio?: string; dataFim?: string }) {
  let dateFilter = ''
  if (params.dataInicio) dateFilter += ` AND v.created_at >= '${params.dataInicio}'`
  if (params.dataFim) dateFilter += ` AND v.created_at <= '${params.dataFim}'`

  return prisma.$queryRawUnsafe<any[]>(`
    SELECT u.id as "usuarioId", u.nome,
           COALESCE(SUM(v.total), 0)::float as "totalVendas",
           COUNT(v.id)::int as "qtdVendas",
           COALESCE(cc.percentual, 0)::float as "percentual",
           (COALESCE(SUM(v.total), 0) * COALESCE(cc.percentual, 0) / 100)::float as "comissao"
    FROM usuarios u
    LEFT JOIN vendas v ON v.usuario_id = u.id AND v.status = 'CONCLUIDA' ${dateFilter}
    LEFT JOIN comissoes_config cc ON cc.empresa_id = u.empresa_id AND cc.ativo = true
    WHERE u.empresa_id = $1 AND u.ativo = true
    GROUP BY u.id, u.nome, cc.percentual
    ORDER BY "comissao" DESC
  `, empresaId)
}

export async function getRelatorioCupons(empresaId: string, params: { campanhaId?: string; dataInicio?: string; dataFim?: string }) {
  let filters = ''
  if (params.campanhaId) filters += ` AND cs.campanha_id = '${params.campanhaId}'`
  if (params.dataInicio) filters += ` AND cs.created_at >= '${params.dataInicio}'`
  if (params.dataFim) filters += ` AND cs.created_at <= '${params.dataFim}'`

  return prisma.$queryRawUnsafe<any[]>(`
    SELECT c.id as "campanhaId", c.nome as "campanhaNome",
           COUNT(cs.id)::int as "totalCupons",
           COALESCE(SUM(v.total), 0)::float as "totalVendas"
    FROM campanhas_shopping c
    LEFT JOIN cupons_shopping cs ON cs.campanha_id = c.id ${filters}
    LEFT JOIN vendas v ON v.id = cs.venda_id
    WHERE c.empresa_id = $1
    GROUP BY c.id, c.nome
    ORDER BY "totalCupons" DESC
  `, empresaId)
}
