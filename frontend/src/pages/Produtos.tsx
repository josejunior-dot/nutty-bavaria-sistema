import { useEffect, useState } from "react"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import * as produtosService from "@/services/produtos.service"
import * as configService from "@/services/configuracoes.service"
import type { Produto, PaginatedResponse, Fornecedor } from "@/types"

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

const emptyForm = {
  nome: "",
  codigo: "",
  unidade: "UN",
  precoVenda: "",
  precoCusto: "",
  estoqueAtual: "",
  estoqueMinimo: "",
  leadTimeDias: "",
  loteMinimo: "",
  coberturaDias: "",
  fornecedorPadraoId: "",
}

export default function Produtos() {
  const [data, setData] = useState<PaginatedResponse<Produto> | null>(null)
  const [busca, setBusca] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])

  useEffect(() => {
    loadProdutos()
  }, [page, busca])

  useEffect(() => {
    configService.listarFornecedores({ limit: 100 }).then(r => setFornecedores(r.data)).catch(() => {})
  }, [])

  async function loadProdutos() {
    setLoading(true)
    try {
      const res = await produtosService.listarProdutos({ page, limit: 20, search: busca || undefined })
      setData(res)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(p: Produto) {
    setEditId(p.id)
    setForm({
      nome: p.nome,
      codigo: p.codigo,
      unidade: p.unidade,
      precoVenda: String(p.precoVenda),
      precoCusto: p.precoCusto != null ? String(p.precoCusto) : "",
      estoqueAtual: String(p.estoqueAtual),
      estoqueMinimo: p.estoqueMinimo != null ? String(p.estoqueMinimo) : "",
      leadTimeDias: p.leadTimeDias != null ? String(p.leadTimeDias) : "",
      loteMinimo: p.loteMinimo != null ? String(p.loteMinimo) : "",
      coberturaDias: p.coberturaDias != null ? String(p.coberturaDias) : "",
      fornecedorPadraoId: p.fornecedorPadraoId ?? "",
    })
    setShowForm(true)
  }

  async function handleSave() {
    const payload: any = {
      nome: form.nome,
      codigo: form.codigo,
      unidade: form.unidade,
      precoVenda: parseFloat(form.precoVenda.replace(",", ".")),
      precoCusto: form.precoCusto ? parseFloat(form.precoCusto.replace(",", ".")) : null,
      estoqueAtual: parseInt(form.estoqueAtual) || 0,
      estoqueMinimo: form.estoqueMinimo ? parseInt(form.estoqueMinimo) : null,
      leadTimeDias: form.leadTimeDias ? parseInt(form.leadTimeDias) : null,
      loteMinimo: form.loteMinimo ? parseInt(form.loteMinimo) : null,
      coberturaDias: form.coberturaDias ? parseInt(form.coberturaDias) : null,
      fornecedorPadraoId: form.fornecedorPadraoId || null,
    }

    if (!payload.nome || !payload.codigo || isNaN(payload.precoVenda)) {
      toast.error("Preencha nome, código e preço de venda")
      return
    }

    try {
      if (editId) {
        await produtosService.atualizarProduto(editId, payload)
        toast.success("Produto atualizado")
      } else {
        await produtosService.criarProduto(payload)
        toast.success("Produto criado")
      }
      setShowForm(false)
      loadProdutos()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar produto")
    }
  }

  async function handleDesativar(id: string) {
    if (!confirm("Desativar este produto?")) return
    try {
      await produtosService.desativarProduto(id)
      toast.success("Produto desativado")
      loadProdutos()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao desativar")
    }
  }

  const produtos = data?.data ?? []

  return (
    <PageWrapper
      title="Produtos"
      subtitle="Catálogo de produtos"
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Novo Produto
        </Button>
      }
    >
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 max-w-sm"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : produtos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                produtos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell>{fmt(p.precoVenda)}</TableCell>
                    <TableCell>
                      <span className={p.estoqueAtual <= (p.estoqueMinimo ?? 0) ? "text-red-600 font-medium" : ""}>
                        {p.estoqueAtual}
                      </span>
                      {p.estoqueMinimo != null && (
                        <span className="text-muted-foreground text-xs"> / mín {p.estoqueMinimo}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.ativo ? "success" : "secondary"}>
                        {p.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {p.ativo && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDesativar(p.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground flex items-center">
            {page} / {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Código</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
            </div>
            <div>
              <Label>Preço Venda (R$)</Label>
              <Input value={form.precoVenda} onChange={(e) => setForm({ ...form, precoVenda: e.target.value })} />
            </div>
            <div>
              <Label>Preço Custo (R$)</Label>
              <Input value={form.precoCusto} onChange={(e) => setForm({ ...form, precoCusto: e.target.value })} placeholder="Opcional" />
            </div>
            <div>
              <Label>Estoque Atual</Label>
              <Input type="number" value={form.estoqueAtual} onChange={(e) => setForm({ ...form, estoqueAtual: e.target.value })} />
            </div>
            <div>
              <Label>Estoque Mínimo</Label>
              <Input type="number" value={form.estoqueMinimo} onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })} placeholder="Opcional" />
            </div>
            <div>
              <Label>Lead Time (dias)</Label>
              <Input type="number" value={form.leadTimeDias} onChange={(e) => setForm({ ...form, leadTimeDias: e.target.value })} placeholder="Ex: 7" />
            </div>
            <div>
              <Label>Lote Mínimo</Label>
              <Input type="number" value={form.loteMinimo} onChange={(e) => setForm({ ...form, loteMinimo: e.target.value })} placeholder="Ex: 10" />
            </div>
            <div>
              <Label>Cobertura (dias)</Label>
              <Input type="number" value={form.coberturaDias} onChange={(e) => setForm({ ...form, coberturaDias: e.target.value })} placeholder="Ex: 30" />
            </div>
            <div>
              <Label>Fornecedor Padrão</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.fornecedorPadraoId}
                onChange={(e) => setForm({ ...form, fornecedorPadraoId: e.target.value })}
              >
                <option value="">Nenhum</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
