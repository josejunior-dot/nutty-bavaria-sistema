import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Users, Truck, UserCircle, Monitor, Percent } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import * as configService from "@/services/configuracoes.service"
import type { User, Fornecedor, Cliente, Terminal, ComissaoConfig, Role } from "@/types"

// ─── Generic CRUD helper ──────────────────────────────────

function CrudTable<T extends { id: string }>({
  items,
  loading,
  columns,
  onEdit,
  onDelete,
}: {
  items: T[]
  loading: boolean
  columns: { header: string; render: (item: T) => React.ReactNode }[]
  onEdit: (item: T) => void
  onDelete?: (item: T) => void
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.header}>{c.header}</TableHead>
              ))}
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  Nenhum registro
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((c) => (
                    <TableCell key={c.header}>{c.render(item)}</TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {onDelete && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item)}>
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
  )
}

// ─── Main Component ────────────────────────────────────────

export default function Configuracoes() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [terminais, setTerminais] = useState<Terminal[]>([])
  const [comissoes, setComissoes] = useState<ComissaoConfig[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<"usuario" | "fornecedor" | "cliente" | "terminal" | "comissao">("usuario")
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [u, f, c, t, co] = await Promise.all([
        configService.listarUsuarios({ limit: 100 }),
        configService.listarFornecedores({ limit: 100 }),
        configService.listarClientes({ limit: 100 }),
        configService.listarTerminais({ limit: 100 }),
        configService.listarComissoes({ limit: 100 }),
      ])
      setUsuarios(u.data)
      setFornecedores(f.data)
      setClientes(c.data)
      setTerminais(t.data)
      setComissoes(co.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function openForm(type: typeof formType, item?: any) {
    setFormType(type)
    setEditId(item?.id || null)
    switch (type) {
      case "usuario":
        setForm({ nome: item?.nome || "", email: item?.email || "", role: item?.role || "OPERADORA", senha: "" })
        break
      case "fornecedor":
        setForm({ nome: item?.nome || "", cnpj: item?.cnpj || "", telefone: item?.telefone || "", email: item?.email || "" })
        break
      case "cliente":
        setForm({ nome: item?.nome || "", cpf: item?.cpf || "", telefone: item?.telefone || "", email: item?.email || "" })
        break
      case "terminal":
        setForm({ nome: item?.nome || "", codigo: item?.codigo || "" })
        break
      case "comissao":
        setForm({ nome: item?.nome || "", percentual: item?.percentual != null ? String(item.percentual) : "" })
        break
    }
    setShowForm(true)
  }

  async function handleSave() {
    try {
      switch (formType) {
        case "usuario": {
          const payload: any = { nome: form.nome, email: form.email, role: form.role }
          if (form.senha) payload.senha = form.senha
          editId ? await configService.atualizarUsuario(editId, payload) : await configService.criarUsuario(payload)
          break
        }
        case "fornecedor": {
          const payload = { nome: form.nome, cnpj: form.cnpj || null, telefone: form.telefone || null, email: form.email || null }
          editId ? await configService.atualizarFornecedor(editId, payload) : await configService.criarFornecedor(payload)
          break
        }
        case "cliente": {
          const payload = { nome: form.nome, cpf: form.cpf || null, telefone: form.telefone || null, email: form.email || null }
          editId ? await configService.atualizarCliente(editId, payload) : await configService.criarCliente(payload)
          break
        }
        case "terminal": {
          const payload = { nome: form.nome, codigo: form.codigo }
          editId ? await configService.atualizarTerminal(editId, payload) : await configService.criarTerminal(payload)
          break
        }
        case "comissao": {
          const payload = { nome: form.nome, percentual: parseFloat(form.percentual.replace(",", ".")) || 0 }
          editId ? await configService.atualizarComissao(editId, payload) : await configService.criarComissao(payload)
          break
        }
      }
      toast.success(editId ? "Atualizado com sucesso" : "Criado com sucesso")
      setShowForm(false)
      loadAll()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar")
    }
  }

  async function handleDelete(type: string, id: string) {
    if (!confirm("Remover este registro?")) return
    try {
      switch (type) {
        case "usuario": await configService.excluirUsuario(id); break
        case "fornecedor": await configService.excluirFornecedor(id); break
        case "cliente": await configService.excluirCliente(id); break
        case "comissao": await configService.excluirComissao(id); break
      }
      toast.success("Removido")
      loadAll()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao remover")
    }
  }

  const formTitles = {
    usuario: "Usuário",
    fornecedor: "Fornecedor",
    cliente: "Cliente",
    terminal: "Terminal",
    comissao: "Comissão",
  }

  return (
    <PageWrapper title="Configurações" subtitle="Gerenciamento do sistema">
      <Tabs defaultValue="usuarios">
        <TabsList className="flex-wrap">
          <TabsTrigger value="usuarios"><Users className="h-3 w-3 mr-1" /> Usuários</TabsTrigger>
          <TabsTrigger value="fornecedores"><Truck className="h-3 w-3 mr-1" /> Fornecedores</TabsTrigger>
          <TabsTrigger value="clientes"><UserCircle className="h-3 w-3 mr-1" /> Clientes</TabsTrigger>
          <TabsTrigger value="terminais"><Monitor className="h-3 w-3 mr-1" /> Terminais</TabsTrigger>
          <TabsTrigger value="comissoes"><Percent className="h-3 w-3 mr-1" /> Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => openForm("usuario")}>
              <Plus className="h-4 w-4 mr-1" /> Novo Usuário
            </Button>
          </div>
          <CrudTable
            items={usuarios}
            loading={loading}
            columns={[
              { header: "Nome", render: (u) => u.nome },
              { header: "Email", render: (u) => u.email },
              { header: "Perfil", render: (u) => <Badge variant="outline">{u.role}</Badge> },
            ]}
            onEdit={(u) => openForm("usuario", u)}
            onDelete={(u) => handleDelete("usuario", u.id)}
          />
        </TabsContent>

        <TabsContent value="fornecedores">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => openForm("fornecedor")}>
              <Plus className="h-4 w-4 mr-1" /> Novo Fornecedor
            </Button>
          </div>
          <CrudTable
            items={fornecedores}
            loading={loading}
            columns={[
              { header: "Nome", render: (f) => f.nome },
              { header: "CNPJ", render: (f) => f.cnpj || "—" },
              { header: "Telefone", render: (f) => f.telefone || "—" },
              { header: "Email", render: (f) => f.email || "—" },
            ]}
            onEdit={(f) => openForm("fornecedor", f)}
            onDelete={(f) => handleDelete("fornecedor", f.id)}
          />
        </TabsContent>

        <TabsContent value="clientes">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => openForm("cliente")}>
              <Plus className="h-4 w-4 mr-1" /> Novo Cliente
            </Button>
          </div>
          <CrudTable
            items={clientes}
            loading={loading}
            columns={[
              { header: "Nome", render: (c) => c.nome },
              { header: "CPF", render: (c) => c.cpf || "—" },
              { header: "Telefone", render: (c) => c.telefone || "—" },
              { header: "Email", render: (c) => c.email || "—" },
            ]}
            onEdit={(c) => openForm("cliente", c)}
            onDelete={(c) => handleDelete("cliente", c.id)}
          />
        </TabsContent>

        <TabsContent value="terminais">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => openForm("terminal")}>
              <Plus className="h-4 w-4 mr-1" /> Novo Terminal
            </Button>
          </div>
          <CrudTable
            items={terminais}
            loading={loading}
            columns={[
              { header: "Nome", render: (t) => t.nome },
              { header: "Código", render: (t) => <span className="font-mono">{t.codigo}</span> },
              { header: "Status", render: (t) => <Badge variant={t.ativo ? "success" : "secondary"}>{t.ativo ? "Ativo" : "Inativo"}</Badge> },
            ]}
            onEdit={(t) => openForm("terminal", t)}
          />
        </TabsContent>

        <TabsContent value="comissoes">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => openForm("comissao")}>
              <Plus className="h-4 w-4 mr-1" /> Nova Comissão
            </Button>
          </div>
          <CrudTable
            items={comissoes}
            loading={loading}
            columns={[
              { header: "Nome", render: (c) => c.nome },
              { header: "Percentual", render: (c) => `${c.percentual}%` },
              { header: "Status", render: (c) => <Badge variant={c.ativo ? "success" : "secondary"}>{c.ativo ? "Ativo" : "Inativo"}</Badge> },
            ]}
            onEdit={(c) => openForm("comissao", c)}
            onDelete={(c) => handleDelete("comissao", c.id)}
          />
        </TabsContent>
      </Tabs>

      {/* Dynamic Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar" : "Novo"} {formTitles[formType]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formType === "usuario" && (
              <>
                <div>
                  <Label>Nome</Label>
                  <Input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Perfil</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={form.role || "OPERADORA"}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  >
                    <option value="OPERADORA">Operadora</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="FRANQUEADOR">Franqueador</option>
                  </select>
                </div>
                <div>
                  <Label>{editId ? "Nova Senha (deixe vazio para manter)" : "Senha"}</Label>
                  <Input type="password" value={form.senha || ""} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
                </div>
              </>
            )}

            {formType === "fornecedor" && (
              <>
                <div>
                  <Label>Nome</Label>
                  <Input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input value={form.cnpj || ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="Opcional" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone || ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="Opcional" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Opcional" />
                </div>
              </>
            )}

            {formType === "cliente" && (
              <>
                <div>
                  <Label>Nome</Label>
                  <Input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input value={form.cpf || ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="Opcional" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone || ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="Opcional" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Opcional" />
                </div>
              </>
            )}

            {formType === "terminal" && (
              <>
                <div>
                  <Label>Nome</Label>
                  <Input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div>
                  <Label>Código</Label>
                  <Input value={form.codigo || ""} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </div>
              </>
            )}

            {formType === "comissao" && (
              <>
                <div>
                  <Label>Nome</Label>
                  <Input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div>
                  <Label>Percentual (%)</Label>
                  <Input value={form.percentual || ""} onChange={(e) => setForm({ ...form, percentual: e.target.value })} />
                </div>
              </>
            )}
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
