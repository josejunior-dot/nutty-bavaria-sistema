import { useEffect, useState } from "react"
import { BarChart3, TrendingUp, Users, Building2, Percent } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as relatoriosService from "@/services/relatorios.service"
import type { CurvaABCItem, VendasPeriodoItem, RankingVendedor, ComparativoQuiosque } from "@/types"

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
function weekAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState(weekAgo())
  const [dataFim, setDataFim] = useState(today())
  const [loading, setLoading] = useState(false)

  const [curvaABC, setCurvaABC] = useState<CurvaABCItem[]>([])
  const [vendasPeriodo, setVendasPeriodo] = useState<VendasPeriodoItem[]>([])
  const [ranking, setRanking] = useState<RankingVendedor[]>([])
  const [comparativo, setComparativo] = useState<ComparativoQuiosque[]>([])
  const [comissoes, setComissoes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("curva-abc")

  useEffect(() => {
    loadReport("curva-abc")
  }, [])

  async function loadReport(tab: string) {
    setActiveTab(tab)
    setLoading(true)
    try {
      const params = {
        dataInicio: `${dataInicio}T00:00:00.000Z`,
        dataFim: `${dataFim}T23:59:59.999Z`,
      }
      switch (tab) {
        case "curva-abc":
          setCurvaABC(await relatoriosService.getCurvaABC(params))
          break
        case "vendas-periodo":
          setVendasPeriodo(await relatoriosService.getVendasPeriodo({ ...params, agrupamento: "dia" }))
          break
        case "ranking":
          setRanking(await relatoriosService.getRankingVendedores(params))
          break
        case "comparativo":
          setComparativo(await relatoriosService.getComparativoQuiosques(params))
          break
        case "comissoes":
          setComissoes(await relatoriosService.getRelatorioComissoes(params))
          break
      }
    } catch {
      toast.error("Erro ao carregar relatório")
    } finally {
      setLoading(false)
    }
  }

  const classColor = (c: string) => {
    switch (c) {
      case "A": return "success" as const
      case "B": return "warning" as const
      default: return "destructive" as const
    }
  }

  return (
    <PageWrapper title="Relatórios" subtitle="Análises e indicadores">
      {/* Date filter */}
      <div className="flex items-end gap-3 mb-6">
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" className="w-40" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" className="w-40" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => loadReport(activeTab)}>
          Buscar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => loadReport(v)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="curva-abc">
            <BarChart3 className="h-3 w-3 mr-1" /> Curva ABC
          </TabsTrigger>
          <TabsTrigger value="vendas-periodo">
            <TrendingUp className="h-3 w-3 mr-1" /> Vendas/Período
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <Users className="h-3 w-3 mr-1" /> Ranking
          </TabsTrigger>
          <TabsTrigger value="comparativo">
            <Building2 className="h-3 w-3 mr-1" /> Comparativo
          </TabsTrigger>
          <TabsTrigger value="comissoes">
            <Percent className="h-3 w-3 mr-1" /> Comissões
          </TabsTrigger>
        </TabsList>

        {/* Curva ABC */}
        <TabsContent value="curva-abc">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Total Vendido</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>% Acumulado</TableHead>
                    <TableHead>Classe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : curvaABC.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sem dados para o período</TableCell>
                    </TableRow>
                  ) : (
                    curvaABC.map((item) => (
                      <TableRow key={item.produtoId}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{fmt(item.totalVendido)}</TableCell>
                        <TableCell>{item.percentual}%</TableCell>
                        <TableCell>{item.percentualAcumulado}%</TableCell>
                        <TableCell>
                          <Badge variant={classColor(item.classificacao)}>{item.classificacao}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendas por Período */}
        <TabsContent value="vendas-periodo">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : vendasPeriodo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Sem dados para o período</TableCell>
                    </TableRow>
                  ) : (
                    vendasPeriodo.map((item) => (
                      <TableRow key={item.data}>
                        <TableCell>{item.data}</TableCell>
                        <TableCell>{fmt(item.total)}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Vendedores */}
        <TabsContent value="ranking">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Total Vendas</TableHead>
                    <TableHead>Qtd. Vendas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : ranking.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem dados</TableCell>
                    </TableRow>
                  ) : (
                    ranking.map((item, i) => (
                      <TableRow key={item.usuarioId}>
                        <TableCell className="font-bold">{i + 1}</TableCell>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{fmt(item.totalVendas)}</TableCell>
                        <TableCell>{item.qtdVendas}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparativo Quiosques */}
        <TabsContent value="comparativo">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiosque</TableHead>
                    <TableHead>Total Vendas</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>Qtd. Vendas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : comparativo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem dados</TableCell>
                    </TableRow>
                  ) : (
                    comparativo.map((item) => (
                      <TableRow key={item.empresaId}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{fmt(item.totalVendas)}</TableCell>
                        <TableCell>{fmt(item.ticketMedio)}</TableCell>
                        <TableCell>{item.qtdVendas}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comissões */}
        <TabsContent value="comissoes">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Total Vendas</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>% Comissão</TableHead>
                    <TableHead>Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : comissoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sem dados</TableCell>
                    </TableRow>
                  ) : (
                    comissoes.map((item: any) => (
                      <TableRow key={item.usuarioId}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{fmt(item.totalVendas)}</TableCell>
                        <TableCell>{item.qtdVendas}</TableCell>
                        <TableCell>{item.percentual}%</TableCell>
                        <TableCell className="font-medium">{fmt(item.comissao)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
