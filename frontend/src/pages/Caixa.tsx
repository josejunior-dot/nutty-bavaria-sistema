import { useEffect, useState } from "react"
import { DollarSign, ArrowDownCircle, ArrowUpCircle, Lock, Unlock } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useCaixaStore } from "@/stores/caixa.store"
import * as caixaService from "@/services/caixa.service"
import type { Movimento } from "@/types"

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function fmtDate(date: string) {
  return new Date(date).toLocaleString("pt-BR")
}

export default function Caixa() {
  const { movimentoAtual, resumo, loading, setMovimentoAtual, setResumo, setLoading } =
    useCaixaStore()

  const [historico, setHistorico] = useState<Movimento[]>([])
  const [showAbrir, setShowAbrir] = useState(false)
  const [showFechar, setShowFechar] = useState(false)
  const [showOperacao, setShowOperacao] = useState<"sangria" | "suprimento" | null>(null)

  const [valorAbertura, setValorAbertura] = useState("")
  const [valorFechamento, setValorFechamento] = useState("")
  const [valorOperacao, setValorOperacao] = useState("")
  const [obsOperacao, setObsOperacao] = useState("")

  useEffect(() => {
    loadCaixa()
    loadHistorico()
  }, [])

  async function loadCaixa() {
    setLoading(true)
    try {
      const mov = await caixaService.getMovimentoAberto()
      setMovimentoAtual(mov)
      if (mov) {
        const res = await caixaService.getResumo(mov.id)
        setResumo(res)
      }
    } catch {
      // no open register
    } finally {
      setLoading(false)
    }
  }

  async function loadHistorico() {
    try {
      const { data } = await caixaService.listarMovimentos({ limit: 10 })
      setHistorico(data)
    } catch {
      // ignore
    }
  }

  async function handleAbrir() {
    const valor = parseFloat(valorAbertura.replace(",", "."))
    if (isNaN(valor) || valor < 0) {
      toast.error("Valor inválido")
      return
    }
    try {
      const mov = await caixaService.abrirCaixa({ terminalId: "default", valorAbertura: valor })
      setMovimentoAtual(mov)
      setShowAbrir(false)
      setValorAbertura("")
      toast.success("Caixa aberto com sucesso")
      loadCaixa()
      loadHistorico()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao abrir caixa")
    }
  }

  async function handleFechar() {
    if (!movimentoAtual) return
    const valor = parseFloat(valorFechamento.replace(",", "."))
    if (isNaN(valor) || valor < 0) {
      toast.error("Valor inválido")
      return
    }
    try {
      await caixaService.fecharCaixa(movimentoAtual.id, valor)
      setMovimentoAtual(null)
      setResumo(null)
      setShowFechar(false)
      setValorFechamento("")
      toast.success("Caixa fechado com sucesso")
      loadHistorico()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao fechar caixa")
    }
  }

  async function handleOperacao() {
    if (!movimentoAtual || !showOperacao) return
    const valor = parseFloat(valorOperacao.replace(",", "."))
    if (isNaN(valor) || valor <= 0) {
      toast.error("Valor inválido")
      return
    }
    try {
      if (showOperacao === "sangria") {
        await caixaService.registrarSangria(movimentoAtual.id, valor, obsOperacao)
      } else {
        await caixaService.registrarSuprimento(movimentoAtual.id, valor, obsOperacao)
      }
      toast.success(showOperacao === "sangria" ? "Sangria registrada" : "Suprimento registrado")
      setShowOperacao(null)
      setValorOperacao("")
      setObsOperacao("")
      loadCaixa()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro na operação")
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Caixa" subtitle="Gerenciamento do caixa">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Caixa"
      subtitle="Gerenciamento do caixa"
      actions={
        movimentoAtual ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowOperacao("sangria")}>
              <ArrowDownCircle className="h-4 w-4 mr-1" /> Sangria
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowOperacao("suprimento")}>
              <ArrowUpCircle className="h-4 w-4 mr-1" /> Suprimento
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowFechar(true)}>
              <Lock className="h-4 w-4 mr-1" /> Fechar Caixa
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowAbrir(true)}>
            <Unlock className="h-4 w-4 mr-1" /> Abrir Caixa
          </Button>
        )
      }
    >
      {/* Status cards */}
      {movimentoAtual && resumo ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Valor Abertura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{fmt(movimentoAtual.valorAbertura)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-500">{fmt(resumo.totalVendas)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sangrias / Suprimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <span className="text-red-500">-{fmt(resumo.totalSangrias)}</span>
                {" / "}
                <span className="text-emerald-500">+{fmt(resumo.totalSuprimentos)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Saldo Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{fmt(resumo.saldo)}</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum caixa aberto. Abra o caixa para começar.</p>
          </CardContent>
        </Card>
      )}

      {/* Operations history */}
      {movimentoAtual?.operacoes && movimentoAtual.operacoes.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Operações do Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentoAtual.operacoes.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell>
                      <Badge
                        variant={
                          op.tipo === "SANGRIA"
                            ? "destructive"
                            : op.tipo === "SUPRIMENTO"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {op.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmt(op.valor)}</TableCell>
                    <TableCell className="text-muted-foreground">{op.observacao || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(op.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent movements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Movimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhum movimento encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Fechamento</TableHead>
                  <TableHead>Vendas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      <Badge variant={mov.status === "ABERTO" ? "success" : "secondary"}>
                        {mov.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{mov.terminal?.nome || "—"}</TableCell>
                    <TableCell>{mov.usuario?.nome || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(mov.dataAbertura)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {mov.dataFechamento ? fmtDate(mov.dataFechamento) : "—"}
                    </TableCell>
                    <TableCell>{mov._count?.vendas ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Abrir Caixa */}
      <Dialog open={showAbrir} onOpenChange={setShowAbrir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Valor de Abertura (R$)</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={valorAbertura}
                onChange={(e) => setValorAbertura(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAbrir}>Abrir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Fechar Caixa */}
      <Dialog open={showFechar} onOpenChange={setShowFechar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {resumo && (
              <div className="text-sm space-y-1">
                <p>Saldo esperado: <strong>{fmt(resumo.saldo)}</strong></p>
              </div>
            )}
            <div>
              <Label>Valor em Caixa (R$)</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={valorFechamento}
                onChange={(e) => setValorFechamento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleFechar}>Fechar Caixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Sangria / Suprimento */}
      <Dialog open={!!showOperacao} onOpenChange={() => setShowOperacao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showOperacao === "sangria" ? "Registrar Sangria" : "Registrar Suprimento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={valorOperacao}
                onChange={(e) => setValorOperacao(e.target.value)}
              />
            </div>
            <div>
              <Label>Observação</Label>
              <Input
                value={obsOperacao}
                onChange={(e) => setObsOperacao(e.target.value)}
                placeholder="Motivo da operação"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleOperacao}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
