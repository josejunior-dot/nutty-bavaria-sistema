import { api } from "./api"
import type {
  NotaFiscal,
  PaginatedResponse,
  PaginationParams,
} from "@/types"

export async function emitirNota(vendaId: string): Promise<NotaFiscal> {
  const { data } = await api.post<NotaFiscal>("/fiscal/notas", { vendaId })
  return data
}

export async function listarNotas(
  params?: PaginationParams & { status?: string }
): Promise<PaginatedResponse<NotaFiscal>> {
  const { data } = await api.get<PaginatedResponse<NotaFiscal>>(
    "/fiscal/notas",
    { params }
  )
  return data
}

export async function getNota(id: string): Promise<NotaFiscal> {
  const { data } = await api.get<NotaFiscal>(`/fiscal/notas/${id}`)
  return data
}

export async function cancelarNota(id: string): Promise<NotaFiscal> {
  const { data } = await api.post<NotaFiscal>(`/fiscal/notas/${id}/cancelar`)
  return data
}

export async function getResumoFiscal(): Promise<{
  emitidas: number
  recebidas: number
  pendentes: number
  rejeitadas: number
}> {
  const { data } = await api.get("/fiscal/resumo")
  return data
}

export async function reenviarNota(id: string): Promise<NotaFiscal> {
  const { data } = await api.post<NotaFiscal>(`/fiscal/notas/${id}/reenviar`)
  return data
}
