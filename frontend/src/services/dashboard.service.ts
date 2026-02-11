import { api } from "./api"
import type { DashboardKpi, VendasChart } from "@/types"

export async function getKpis(): Promise<DashboardKpi> {
  const { data } = await api.get<DashboardKpi>("/dashboard/kpis")
  return data
}

export async function getVendasChart(dias?: number): Promise<VendasChart[]> {
  const { data } = await api.get<VendasChart[]>("/dashboard/chart", {
    params: { dias: dias ?? 7 },
  })
  return data
}
