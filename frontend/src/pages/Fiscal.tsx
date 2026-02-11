import { useEffect, useState } from "react"
import { FileText, RotateCw, XCircle } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as fiscalService from "@/services/fiscal.service"
import type { NotaFiscal } from "@/types"

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function fmtDate(date: string) {
  return new Date(date).toLocaleString("pt-BR")
}

const statusColor = (s: string) => {
  switch (s) {
    case "EMITIDA": return "success" as const
    case "PENDENTE": return "warning" as const
    case "CANCELADA": return "secondary" as const
    case "REJEITADA": return "destructive" as const
    default: return "secondary" as const
  }
}

export default function Fiscal() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [resumo, setResumo] = useState<{ emitidas: number; pendentes: number; rejeitadas: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadNotas()
    loadResumo()
  }, [page])

  async function loadNotas() {
    setLoading(true)
    try {
      const res = await fiscalService.listarNotas({ page, limit: 20 })
      setNotas(res.data)
      setTotalPages(res.totalPages)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function loadResumo() {
    try {
      const r = await fiscalService.getResumoFiscal()
      setResumo(r)
    } catch {
      // ignore
    }
  }

  async function handleCancelar(id: string) {
    if (!confirm("Cancelar esta nota fiscal?")) return
    try {
      await fiscalService.cancelarNota(id)
      toast.success("Nota cancelada")
      loadNotas()
      loadResumo()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao cancelar nota")
    }
  }

  async function handleReenviar(id: string) {
    try {
      await fiscalService.reenviarNota(id)
      toast.success("Nota reenviada")
      loadNotas()
      loadResumo()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao reenviar nota")
    }
  }

  return (
    <PageWrapper title="Fiscal" subtitle="Notas fiscais eletrônicas">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {resumo ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Emitidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{resumo.emitidas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">{resumo.pendentes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Rejeitadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{resumo.rejeitadas}</div>
              </CardContent>
            </Card>
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : notas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhuma nota fiscal encontrada
                  </TableCell>
                </TableRow>
              ) : (
                notas.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono">{n.numero || "—"}</TableCell>
                    <TableCell>{n.serie || "—"}</TableCell>
                    <TableCell>#{n.venda?.numero}</TableCell>
                    <TableCell>{fmt(n.venda?.total ?? 0)}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(n.status)}>{n.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(n.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {n.status === "REJEITADA" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReenviar(n.id)} title="Reenviar">
                            <RotateCw className="h-3 w-3" />
                          </Button>
                        )}
                        {(n.status === "EMITIDA" || n.status === "PENDENTE") && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleCancelar(n.id)} title="Cancelar">
                            <XCircle className="h-3 w-3" />
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

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground flex items-center">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </PageWrapper>
  )
}
