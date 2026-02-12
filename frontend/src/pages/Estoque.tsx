import { useEffect, useState } from "react"
import { Package, ArrowDown, ArrowUp, ClipboardList, BarChart3, Lightbulb, CalendarDays, Pencil, Trash2, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
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
import * as sugestaoService from "@/services/sugestao-compra.service"
import { Progress } from "@/components/ui/progress"
import type { EntradaEstoque, SaidaEstoque, PedidoCompra, Produto, SugestaoCompraItem, EventoSazonal } from "@/types"

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
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  // Sugestão Inteligente
  const [sugestoes, setSugestoes] = useState<SugestaoCompraItem[]>([])
  const [cenarioAtivo, setCenarioAtivo] = useState<'conservador' | 'moderado' | 'agressivo'>('moderado')
  const [loadingSugestao, setLoadingSugestao] = useState(false)

  // Eventos Sazonais
  const [eventos, setEventos] = useState<EventoSazonal[]>([])
  const [showEventos, setShowEventos] = useState(false)
  const [eventoForm, setEventoForm] = useState({ nome: '', dataInicio: '', dataFim: '', multiplicador: '', recorrente: false })
  const [editEventoId, setEditEventoId] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [e, s, p, b, prods] = await Promise.all([
        estoqueService.listarEntradas({ limit: 20 }),
        estoqueService.listarSaidas({ limit: 20 }),
        estoqueService.listarPedidos({ limit: 20 }),
        produtosService.getProdutosEstoqueBaixo(),
        produtosService.listarProdutos({ limit: 100 }),
      ])
      setEntradas(e.data)
      setSaidas(s.data)
      setPedidos(p.data)
      setBaixoEstoque(b)
      setProdutos(prods.data)
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

  async function loadSugestoes() {
    setLoadingSugestao(true)
    try {
      const [s, e] = await Promise.all([
        sugestaoService.getSugestoes(),
        sugestaoService.getEventos(),
      ])
      setSugestoes(s)
      setEventos(e)
    } catch {
      // ignore - user may not have permission
    } finally {
      setLoadingSugestao(false)
    }
  }

  async function handleSaveEvento() {
    const mult = parseFloat(eventoForm.multiplicador.replace(',', '.'))
    if (!eventoForm.nome || !eventoForm.dataInicio || !eventoForm.dataFim || isNaN(mult)) {
      toast.error('Preencha todos os campos do evento')
      return
    }
    try {
      if (editEventoId) {
        await sugestaoService.atualizarEvento(editEventoId, {
          nome: eventoForm.nome,
          dataInicio: eventoForm.dataInicio,
          dataFim: eventoForm.dataFim,
          multiplicador: mult,
          recorrente: eventoForm.recorrente,
        })
        toast.success('Evento atualizado')
      } else {
        await sugestaoService.criarEvento({
          nome: eventoForm.nome,
          dataInicio: eventoForm.dataInicio,
          dataFim: eventoForm.dataFim,
          multiplicador: mult,
          recorrente: eventoForm.recorrente,
        })
        toast.success('Evento criado')
      }
      setEditEventoId(null)
      setEventoForm({ nome: '', dataInicio: '', dataFim: '', multiplicador: '', recorrente: false })
      loadSugestoes()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar evento')
    }
  }

  async function handleExcluirEvento(id: string) {
    if (!confirm('Excluir este evento?')) return
    try {
      await sugestaoService.excluirEvento(id)
      toast.success('Evento excluído')
      loadSugestoes()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir evento')
    }
  }

  function editEvento(e: EventoSazonal) {
    setEditEventoId(e.id)
    setEventoForm({
      nome: e.nome,
      dataInicio: e.dataInicio.slice(0, 10),
      dataFim: e.dataFim.slice(0, 10),
      multiplicador: String(e.multiplicador),
      recorrente: e.recorrente,
    })
  }

  async function handleGerarPedido() {
    const itensParaPedido = sugestoes
      .filter(s => s.cenarios[cenarioAtivo].qtdSugerida > 0)
      .map(s => ({
        produtoId: s.produtoId,
        quantidade: s.cenarios[cenarioAtivo].qtdSugerida,
        precoUnitario: s.cenarios[cenarioAtivo].custoTotal / s.cenarios[cenarioAtivo].qtdSugerida || 0,
      }))

    if (itensParaPedido.length === 0) {
      toast.error('Nenhum item para gerar pedido')
      return
    }

    try {
      await estoqueService.criarPedido({
        fornecedorId: undefined,
        observacao: `Pedido gerado automaticamente - cenário ${cenarioAtivo}`,
        itens: itensParaPedido,
      })
      toast.success('Pedido de compra gerado com sucesso!')
      loadAll()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao gerar pedido')
    }
  }

  // Totais por cenário
  const totalCenarios = {
    conservador: {
      investimento: sugestoes.reduce((acc, s) => acc + s.cenarios.conservador.custoTotal, 0),
      itens: sugestoes.filter(s => s.cenarios.conservador.qtdSugerida > 0).length,
      coberturaMedia: sugestoes.length > 0
        ? sugestoes.reduce((acc, s) => acc + s.cenarios.conservador.coberturaDias, 0) / sugestoes.length
        : 0,
    },
    moderado: {
      investimento: sugestoes.reduce((acc, s) => acc + s.cenarios.moderado.custoTotal, 0),
      itens: sugestoes.filter(s => s.cenarios.moderado.qtdSugerida > 0).length,
      coberturaMedia: sugestoes.length > 0
        ? sugestoes.reduce((acc, s) => acc + s.cenarios.moderado.coberturaDias, 0) / sugestoes.length
        : 0,
    },
    agressivo: {
      investimento: sugestoes.reduce((acc, s) => acc + s.cenarios.agressivo.custoTotal, 0),
      itens: sugestoes.filter(s => s.cenarios.agressivo.qtdSugerida > 0).length,
      coberturaMedia: sugestoes.length > 0
        ? sugestoes.reduce((acc, s) => acc + s.cenarios.agressivo.coberturaDias, 0) / sugestoes.length
        : 0,
    },
  }

  const classeColor = (c: string) => {
    switch (c) {
      case 'A': return 'success' as const
      case 'B': return 'warning' as const
      case 'C': return 'secondary' as const
      default: return 'secondary' as const
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
        <Card className="mb-4 border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
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

      <Tabs defaultValue="posicao">
        <TabsList>
          <TabsTrigger value="posicao">
            <BarChart3 className="h-3 w-3 mr-1" /> Posição
          </TabsTrigger>
          <TabsTrigger value="entradas">
            <ArrowDown className="h-3 w-3 mr-1" /> Entradas
          </TabsTrigger>
          <TabsTrigger value="saidas">
            <ArrowUp className="h-3 w-3 mr-1" /> Saídas
          </TabsTrigger>
          <TabsTrigger value="pedidos">
            <ClipboardList className="h-3 w-3 mr-1" /> Pedidos
          </TabsTrigger>
          <TabsTrigger value="sugestao" onClick={() => { if (sugestoes.length === 0) loadSugestoes() }}>
            <Lightbulb className="h-3 w-3 mr-1" /> Sugestão Inteligente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posicao">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : produtos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum produto cadastrado</TableCell>
                    </TableRow>
                  ) : (
                    produtos.map((p) => {
                      const min = Number(p.estoqueMinimo ?? 0)
                      const atual = Number(p.estoqueAtual)
                      const pct = min > 0 ? Math.min((atual / min) * 100, 100) : 100
                      const isBaixo = min > 0 && atual <= min
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                          <TableCell>{p.nome}</TableCell>
                          <TableCell className={isBaixo ? "text-red-600 font-medium" : ""}>{atual}</TableCell>
                          <TableCell className="text-muted-foreground">{min || "—"}</TableCell>
                          <TableCell className="w-32">
                            {min > 0 && (
                              <Progress value={pct} className={`h-2 ${isBaixo ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`} />
                            )}
                          </TableCell>
                          <TableCell>
                            {isBaixo ? (
                              <Badge variant="destructive">Baixo</Badge>
                            ) : p.ativo ? (
                              <Badge variant="success">OK</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

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
        <TabsContent value="sugestao">
          {loadingSugestao ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">Calculando sugestões...</CardContent>
            </Card>
          ) : sugestoes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Nenhuma sugestão de compra. Cadastre produtos e registre vendas para gerar análises.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Cenário Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {(['conservador', 'moderado', 'agressivo'] as const).map((cenario) => {
                  const info = totalCenarios[cenario]
                  const labels = { conservador: 'Conservador', moderado: 'Moderado', agressivo: 'Agressivo' }
                  const colors = { conservador: 'border-blue-200 bg-blue-50/50', moderado: 'border-emerald-200 bg-emerald-50/50', agressivo: 'border-amber-200 bg-amber-50/50' }
                  const isActive = cenarioAtivo === cenario
                  return (
                    <Card
                      key={cenario}
                      className={`cursor-pointer transition-all ${colors[cenario]} ${isActive ? 'ring-2 ring-primary shadow-md' : 'opacity-70 hover:opacity-100'}`}
                      onClick={() => setCenarioAtivo(cenario)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          {labels[cenario]}
                          {isActive && <Badge variant="default">Ativo</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{fmt(info.investimento)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {info.itens} itens · Cobertura média: {Math.round(info.coberturaMedia)} dias
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => setShowEventos(true)}>
                  <CalendarDays className="h-4 w-4 mr-1" /> Eventos Sazonais ({eventos.length})
                </Button>
                <Button size="sm" onClick={handleGerarPedido}>
                  <ShoppingCart className="h-4 w-4 mr-1" /> Gerar Pedido
                </Button>
                <Button variant="outline" size="sm" onClick={loadSugestoes}>
                  Recalcular
                </Button>
              </div>

              {/* Sugestão Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>ABC</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Demanda/dia</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Safety Stock</TableHead>
                        <TableHead>GMROI</TableHead>
                        <TableHead>Qtd Sugerida</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Cobertura</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sugestoes.map((s) => {
                        const cenario = s.cenarios[cenarioAtivo]
                        return (
                          <TableRow key={s.produtoId}>
                            <TableCell>
                              <div className="font-medium">{s.nome}</div>
                              <div className="text-xs text-muted-foreground">{s.codigo}</div>
                              {s.eventoAtivo && (
                                <Badge variant="info" className="mt-1 text-xs">{s.eventoAtivo}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={classeColor(s.classeABC)}>{s.classeABC}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className={s.estoqueAtual <= s.estoqueMinimo ? 'text-red-600 font-medium' : ''}>
                                {s.estoqueAtual}
                              </span>
                              {s.estoqueMinimo > 0 && (
                                <span className="text-xs text-muted-foreground"> / {s.estoqueMinimo}</span>
                              )}
                            </TableCell>
                            <TableCell>{s.demandaAjustada}</TableCell>
                            <TableCell>{s.leadTimeDias}d</TableCell>
                            <TableCell>{s.safetyStock}</TableCell>
                            <TableCell>
                              <span className={s.gmroi >= 2 ? 'text-emerald-600 font-medium' : s.gmroi >= 1 ? 'text-amber-600' : 'text-red-600'}>
                                {s.gmroi.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{cenario.qtdSugerida}</TableCell>
                            <TableCell>{fmt(cenario.custoTotal)}</TableCell>
                            <TableCell>{cenario.coberturaDias}d</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Eventos Sazonais */}
      <Dialog open={showEventos} onOpenChange={setShowEventos}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Eventos Sazonais</DialogTitle>
          </DialogHeader>

          {/* Lista de eventos */}
          {eventos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Mult.</TableHead>
                  <TableHead>Recorrente</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>{new Date(e.dataInicio).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{new Date(e.dataFim).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{e.multiplicador}x</TableCell>
                    <TableCell>{e.recorrente ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editEvento(e)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleExcluirEvento(e.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Formulário inline */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">{editEventoId ? 'Editar Evento' : 'Novo Evento'}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input value={eventoForm.nome} onChange={(e) => setEventoForm({ ...eventoForm, nome: e.target.value })} placeholder="Ex: Natal, Dia das Mães" />
              </div>
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={eventoForm.dataInicio} onChange={(e) => setEventoForm({ ...eventoForm, dataInicio: e.target.value })} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={eventoForm.dataFim} onChange={(e) => setEventoForm({ ...eventoForm, dataFim: e.target.value })} />
              </div>
              <div>
                <Label>Multiplicador</Label>
                <Input value={eventoForm.multiplicador} onChange={(e) => setEventoForm({ ...eventoForm, multiplicador: e.target.value })} placeholder="Ex: 1.5" />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventoForm.recorrente}
                    onChange={(e) => setEventoForm({ ...eventoForm, recorrente: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Recorrente (anual)
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleSaveEvento}>
                {editEventoId ? 'Salvar' : 'Criar'}
              </Button>
              {editEventoId && (
                <Button size="sm" variant="outline" onClick={() => {
                  setEditEventoId(null)
                  setEventoForm({ nome: '', dataInicio: '', dataFim: '', multiplicador: '', recorrente: false })
                }}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
