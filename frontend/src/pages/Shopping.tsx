import { useEffect, useState } from "react"
import { Ticket, Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import * as cuponsService from "@/services/cupons.service"
import type { CampanhaShopping } from "@/types"

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR")
}

const emptyForm = {
  nome: "",
  descricao: "",
  dataInicio: "",
  dataFim: "",
  valorMinimo: "",
  ativo: true,
  shoppingId: "",
}

export default function Shopping() {
  const [campanhas, setCampanhas] = useState<CampanhaShopping[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadCampanhas()
  }, [])

  async function loadCampanhas() {
    setLoading(true)
    try {
      const data = await cuponsService.listarCampanhas()
      setCampanhas(data)
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

  function openEdit(c: CampanhaShopping) {
    setEditId(c.id)
    setForm({
      nome: c.nome,
      descricao: c.descricao || "",
      dataInicio: c.dataInicio.slice(0, 10),
      dataFim: c.dataFim.slice(0, 10),
      valorMinimo: String(c.valorMinimo),
      ativo: c.ativo,
      shoppingId: c.shoppingId,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nome || !form.dataInicio || !form.dataFim) {
      toast.error("Preencha nome e datas")
      return
    }
    const payload: any = {
      nome: form.nome,
      descricao: form.descricao || null,
      dataInicio: form.dataInicio,
      dataFim: form.dataFim,
      valorMinimo: parseFloat(form.valorMinimo.replace(",", ".")) || 0,
      ativo: form.ativo,
    }
    if (form.shoppingId) payload.shoppingId = form.shoppingId

    try {
      if (editId) {
        await cuponsService.atualizarCampanha(editId, payload)
        toast.success("Campanha atualizada")
      } else {
        await cuponsService.criarCampanha(payload)
        toast.success("Campanha criada")
      }
      setShowForm(false)
      loadCampanhas()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar campanha")
    }
  }

  return (
    <PageWrapper
      title="Shopping"
      subtitle="Campanhas e cupons de shopping"
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nova Campanha
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Shopping</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor Mín.</TableHead>
                <TableHead>Cupons</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : campanhas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhuma campanha cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                campanhas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{c.nome}</p>
                        {c.descricao && <p className="text-xs text-muted-foreground">{c.descricao}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{c.shopping?.nome || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {fmtDate(c.dataInicio)} — {fmtDate(c.dataFim)}
                    </TableCell>
                    <TableCell>{fmt(c.valorMinimo)}</TableCell>
                    <TableCell>{c._count?.cupons ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={c.ativo ? "success" : "secondary"}>
                        {c.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Opcional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Valor Mínimo (R$)</Label>
              <Input value={form.valorMinimo} onChange={(e) => setForm({ ...form, valorMinimo: e.target.value })} placeholder="0" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label>Campanha ativa</Label>
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
