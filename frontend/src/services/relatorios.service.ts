import { api } from "./api"
import type {
  CurvaABCItem,
  VendasPeriodoItem,
  RankingVendedor,
  ComparativoQuiosque,
} from "@/types"

export async function getCurvaABC(
  params?: { dataInicio?: string; dataFim?: string }
): Promise<CurvaABCItem[]> {
  const { data } = await api.get<CurvaABCItem[]>("/relatorios/curva-abc", {
    params,
  })
  return data
}

export async function getVendasPeriodo(params: {
  dataInicio: string
  dataFim: string
  agrupamento?: string
}): Promise<VendasPeriodoItem[]> {
  const { data } = await api.get<VendasPeriodoItem[]>(
    "/relatorios/vendas-periodo",
    { params }
  )
  return data
}

export async function getRankingVendedores(
  params?: { dataInicio?: string; dataFim?: string }
): Promise<RankingVendedor[]> {
  const { data } = await api.get<RankingVendedor[]>(
    "/relatorios/ranking-vendedores",
    { params }
  )
  return data
}

export async function getComparativoQuiosques(
  params?: { dataInicio?: string; dataFim?: string }
): Promise<ComparativoQuiosque[]> {
  const { data } = await api.get<ComparativoQuiosque[]>(
    "/relatorios/comparativo-quiosques",
    { params }
  )
  return data
}

export async function getRelatorioComissoes(
  params?: { dataInicio?: string; dataFim?: string }
): Promise<any[]> {
  const { data } = await api.get<any[]>("/relatorios/comissoes", { params })
  return data
}

export async function getRelatorioCupons(
  params?: { campanhaId?: string; dataInicio?: string; dataFim?: string }
): Promise<any[]> {
  const { data } = await api.get<any[]>("/relatorios/cupons", { params })
  return data
}
