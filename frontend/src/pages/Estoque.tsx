import { useEffect, useState } from "react"
import { Package, ArrowDown, ArrowUp, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import * as estoqueService from "@/services/estoque.service"
import * as produtosService from "@/services/produtos.service"
import type { EntradaEstoque, SaidaEstoque, PedidoCompra, Produto } from "@/types"

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function fmtDate(date: string) {
  return new Date(date).toLocaleString("pt-BR")
}

export default function Estoque() {
  const [entradas, setEntradas] = useState<EntradaEstoque[]>([])
  const [saidas, setSaidas] = useState<SaidaEstoque[]>([])
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([])
  const [baixoEstoque, setBaixoEstoque] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [e, s, p, b] = await Promise.all([
        estoqueService.listarEntradas({ limit: 20 }),
        estoqueService.listarSaidas({ limit: 20 }),
        estoqueService.listarPedidos({ limit: 20 }),
        produtosService.getProdutosEstoqueBaixo(),
      ])
      setEntradas(e.data)
      setSaidas(s.data)
      setPedidos(p.data)
      setBaixoEstoque(b)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleReceberPedido(id: string) {
    try {
      await estoqueService.receberPedido(id)
      toast.success("Pedido recebido e estoque atualizado")
      loadAll()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao receber pedido")
    }
  }

  const statusPedidoColor = (s: string) => {
    switch (s) {
      case "RECEBIDO": return "success" as const
      case "ENVIADO": return "info" as const
      case "CANCELADO": return "destructive" as const
      default: return "secondary" as const
    }
  }

  return (
    <PageWrapper title="Estoque" subtitle="Movimentações de estoque">
      {/* Low stock alert */}
      {baixoEstoque.length > 0 && (
        <Card className="mb-4 border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-500 flex items-center gap-2">
              <Package className="h-4 w-4" /> {baixoEstoque.length} produto(s) com estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {baixoEstoque.map((p) => (
                <Badge key={p.id} variant="warning">
                  {p.nome}: {p.estoqueAtual} un
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="entradas">
        <TabsList>
          <TabsTrigger value="entradas">
            <ArrowDown className="h-3 w-3 mr-1" /> Entradas
          </TabsTrigger>
          <TabsTrigger value="saidas">
            <ArrowUp className="h-3 w-3 mr-1" /> Saídas
          </TabsTrigger>
          <TabsTrigger value="pedidos">
            <ClipboardList className="h-3 w-3 mr-1" /> Pedidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entradas">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : entradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma entrada</TableCell>
                    </TableRow>
                  ) : (
                    entradas.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-muted-foreground">{fmtDate(e.createdAt)}</TableCell>
                        <TableCell>{e.fornecedor?.nome || "—"}</TableCell>
                        <TableCell>{e.numeroNota || "—"}</TableCell>
                        <TableCell>
                          {e.itens.map((i) => (
                            <div key={i.id} className="text-xs">
                              {i.produto.nome} x{i.quantidade} @ {fmt(i.precoUnitario)}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{e.observacao || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saidas">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : saidas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma saída</TableCell>
                    </TableRow>
                  ) : (
                    saidas.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground">{fmtDate(s.createdAt)}</TableCell>
                        <TableCell>{s.motivo}</TableCell>
                        <TableCell>
                          {s.itens.map((i) => (
                            <div key={i.id} className="text-xs">
                              {i.produto.nome} x{i.quantidade}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.observacao || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : pedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum pedido</TableCell>
                    </TableRow>
                  ) : (
                    pedidos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground">{fmtDate(p.createdAt)}</TableCell>
                        <TableCell>{p.fornecedor?.nome}</TableCell>
                        <TableCell>
                          <Badge variant={statusPedidoColor(p.status)}>{p.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {p.itens.map((i) => (
                            <div key={i.id} className="text-xs">
                              {i.produto.nome} x{i.quantidade}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          {p.status === "ENVIADO" && (
                            <Button size="sm" variant="outline" onClick={() => handleReceberPedido(p.id)}>
                              Receber
                            </Button>
                          )}
                        </TableCell>
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
