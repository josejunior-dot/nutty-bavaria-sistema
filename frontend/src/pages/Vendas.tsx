import { useEffect, useState } from "react"
import { Search, Plus, Minus, Trash2, CreditCard, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { useVendasStore } from "@/stores/vendas.store"
import { useCaixaStore } from "@/stores/caixa.store"
import * as vendasService from "@/services/vendas.service"
import * as produtosService from "@/services/produtos.service"
import * as caixaService from "@/services/caixa.service"
import type { Produto, TipoPagamento, Venda } from "@/types"

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

const TIPOS_PAGAMENTO: { tipo: TipoPagamento; label: string }[] = [
  { tipo: "DINHEIRO", label: "Dinheiro" },
  { tipo: "CREDITO", label: "Crédito" },
  { tipo: "DEBITO", label: "Débito" },
  { tipo: "PIX", label: "PIX" },
  { tipo: "VOUCHER", label: "Voucher" },
]

export default function Vendas() {
  const { carrinho, desconto, addItem, removeItem, updateQuantidade, setDesconto, getSubtotal, getTotal, limparCarrinho } =
    useVendasStore()
  const { movimentoAtual, setMovimentoAtual } = useCaixaStore()

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [busca, setBusca] = useState("")
  const [showPagamento, setShowPagamento] = useState(false)
  const [showHistorico, setShowHistorico] = useState(false)
  const [pagamentos, setPagamentos] = useState<{ tipo: TipoPagamento; valor: number }[]>([])
  const [pagTipo, setPagTipo] = useState<TipoPagamento>("DINHEIRO")
  const [pagValor, setPagValor] = useState("")
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loadingVenda, setLoadingVenda] = useState(false)

  useEffect(() => {
    loadProdutos()
    if (!movimentoAtual) {
      caixaService.getMovimentoAberto().then((mov) => {
        if (mov) setMovimentoAtual(mov)
      }).catch(() => {})
    }
  }, [])

  async function loadProdutos() {
    try {
      const data = await produtosService.getProdutosVenda()
      setProdutos(data)
    } catch {
      // ignore
    }
  }

  async function loadHistorico() {
    try {
      const res = await vendasService.listarVendas({ limit: 20 })
      setVendas(res.data)
    } catch {
      // ignore
    }
  }

  const produtosFiltrados = busca
    ? produtos.filter(
        (p) =>
          p.nome.toLowerCase().includes(busca.toLowerCase()) ||
          p.codigo.toLowerCase().includes(busca.toLowerCase())
      )
    : produtos

  const totalPagamentos = pagamentos.reduce((s, p) => s + p.valor, 0)
  const totalVenda = getTotal()
  const restante = totalVenda - totalPagamentos

  function addPagamento() {
    const raw = pagValor.trim() === "" ? restante : parseFloat(pagValor.replace(",", "."))
    if (isNaN(raw) || raw <= 0) {
      toast.error("Valor inválido")
      return
    }
    setPagamentos([...pagamentos, { tipo: pagTipo, valor: raw }])
    setPagValor("")
  }

  async function finalizarVenda() {
    if (!movimentoAtual) {
      toast.error("Abra o caixa antes de vender")
      return
    }
    if (carrinho.length === 0) {
      toast.error("Carrinho vazio")
      return
    }
    if (restante > 0.01) {
      toast.error("Pagamento insuficiente")
      return
    }
    setLoadingVenda(true)
    try {
      await vendasService.criarVenda({
        movimentoId: movimentoAtual.id,
        itens: carrinho.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
        pagamentos,
        desconto: desconto > 0 ? desconto : undefined,
      })
      toast.success("Venda concluída!")
      limparCarrinho()
      setPagamentos([])
      setShowPagamento(false)
      loadProdutos()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao finalizar venda")
    } finally {
      setLoadingVenda(false)
    }
  }

  return (
    <PageWrapper
      title="Vendas"
      subtitle="Ponto de venda"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadHistorico()
            setShowHistorico(true)
          }}
        >
          Histórico
        </Button>
      }
    >
      {!movimentoAtual && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 text-amber-500 text-sm">
          Caixa fechado. Abra o caixa na aba Caixa antes de registrar vendas.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product search */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar produto por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto">
            {produtosFiltrados.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addItem(p)}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.codigo}</p>
                  <p className="text-sm font-bold mt-1">{fmt(p.precoVenda)}</p>
                  {p.estoqueAtual <= (p.estoqueMinimo ?? 0) && (
                    <Badge variant="warning" className="mt-1 text-[10px]">
                      Estoque baixo
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
            {produtosFiltrados.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8 text-sm">
                Nenhum produto encontrado
              </p>
            )}
          </div>
        </div>

        {/* Cart */}
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Carrinho ({carrinho.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {carrinho.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Adicione produtos ao carrinho
              </p>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {carrinho.map((item) => (
                    <div key={item.produtoId} className="flex items-center gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.nome}</p>
                        <p className="text-muted-foreground text-xs">{fmt(item.precoUnitario)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantidade(item.produtoId, item.quantidade - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantidade}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantidade(item.produtoId, item.quantidade + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="w-16 text-right font-medium">{fmt(item.subtotal)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeItem(item.produtoId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(getSubtotal())}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Desconto</span>
                    <Input
                      type="text"
                      className="w-20 h-7 text-right text-sm"
                      value={desconto > 0 ? String(desconto) : ""}
                      placeholder="0"
                      onChange={(e) => {
                        const v = parseFloat(e.target.value.replace(",", "."))
                        setDesconto(isNaN(v) ? 0 : v)
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{fmt(totalVenda)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={limparCarrinho}>
                    Limpar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setPagamentos([])
                      setShowPagamento(true)
                    }}
                    disabled={carrinho.length === 0}
                  >
                    <CreditCard className="h-4 w-4 mr-1" /> Pagamento
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Pagamento */}
      <Dialog open={showPagamento} onOpenChange={setShowPagamento}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento — {fmt(totalVenda)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <select
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={pagTipo}
                onChange={(e) => setPagTipo(e.target.value as TipoPagamento)}
              >
                {TIPOS_PAGAMENTO.map((t) => (
                  <option key={t.tipo} value={t.tipo}>
                    {t.label}
                  </option>
                ))}
              </select>
              <Input
                className="w-24"
                placeholder={restante > 0 ? restante.toFixed(2) : "Valor"}
                value={pagValor}
                onChange={(e) => setPagValor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPagamento()}
              />
              <Button size="sm" onClick={addPagamento}>
                Add
              </Button>
            </div>
            {pagamentos.length === 0 && restante > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPagamentos([{ tipo: pagTipo, valor: totalVenda }])
                  setPagValor("")
                }}
              >
                Pagar total em {TIPOS_PAGAMENTO.find((t) => t.tipo === pagTipo)?.label} — {fmt(totalVenda)}
              </Button>
            )}

            {pagamentos.length > 0 && (
              <div className="space-y-1 text-sm">
                {pagamentos.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{TIPOS_PAGAMENTO.find((t) => t.tipo === p.tipo)?.label}</span>
                    <span>{fmt(p.valor)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Pago</span>
                  <span>{fmt(totalPagamentos)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Restante</span>
                  <span className={restante > 0.01 ? "text-red-500" : "text-emerald-500"}>
                    {fmt(Math.max(restante, 0))}
                  </span>
                </div>
                {totalPagamentos > totalVenda + 0.01 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Troco</span>
                    <span>{fmt(totalPagamentos - totalVenda)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={finalizarVenda} disabled={restante > 0.01 || loadingVenda}>
              {loadingVenda ? "Processando..." : "Finalizar Venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Histórico */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Vendas</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.numero}</TableCell>
                    <TableCell>
                      <Badge variant={v.status === "CONCLUIDA" ? "success" : "destructive"}>
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{v.itens?.length ?? 0}</TableCell>
                    <TableCell>{fmt(v.total)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(v.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
                {vendas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
