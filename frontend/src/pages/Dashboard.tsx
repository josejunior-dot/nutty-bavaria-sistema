import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import * as dashboardService from "@/services/dashboard.service"
import type { DashboardKpi, VendasChart } from "@/types"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "0%"
  const pct = ((current - previous) / previous) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`
}

const iconBgColors = [
  "bg-emerald-50 text-emerald-600",
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-600",
  "bg-red-50 text-red-600",
]

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKpi | null>(null)
  const [chart, setChart] = useState<VendasChart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [k, c] = await Promise.all([
          dashboardService.getKpis(),
          dashboardService.getVendasChart(7),
        ])
        setKpis(k)
        setChart(c)
      } catch {
        // silently fail, show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = kpis
    ? [
        {
          title: "Vendas Hoje",
          value: formatCurrency(kpis.vendasHoje),
          change: percentChange(kpis.vendasHoje, kpis.vendasOntem),
          icon: DollarSign,
        },
        {
          title: "Qtd. Vendas",
          value: String(kpis.qtdVendas),
          change: percentChange(kpis.qtdVendas, kpis.qtdVendasOntem),
          icon: ShoppingCart,
        },
        {
          title: "Ticket Médio",
          value: formatCurrency(kpis.ticketMedio),
          change: percentChange(kpis.ticketMedio, kpis.ticketMedioOntem),
          icon: TrendingUp,
        },
        {
          title: "Estoque Baixo",
          value: String(kpis.produtosBaixoEstoque),
          change: kpis.produtosBaixoEstoque > 0 ? "Atenção" : "OK",
          icon: AlertTriangle,
          alert: kpis.produtosBaixoEstoque > 0,
        },
      ]
    : []

  const maxChart = Math.max(...chart.map((c) => c.total), 1)

  return (
    <PageWrapper title="Dashboard" subtitle="Visão geral do seu quiosque">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          : cards.map((kpi, i) => (
              <Card key={kpi.title} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${iconBgColors[i]}`}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className={kpi.change.startsWith("+") ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                      {kpi.change}
                    </span>{" "}
                    vs ontem
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Bar chart */}
      <Card className="mt-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Vendas dos últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-end gap-3 h-48">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="flex-1 h-full" />
              ))}
            </div>
          ) : chart.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">
              Nenhuma venda no período
            </p>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {chart.map((item) => {
                const height = Math.max((item.total / maxChart) * 100, 4)
                return (
                  <div key={item.data} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {formatCurrency(item.total)}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-[#7c3a12] to-[#d4a056] rounded-t-md transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {item.data.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
