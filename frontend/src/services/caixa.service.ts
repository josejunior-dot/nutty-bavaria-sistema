import { api } from "./api"
import type {
  Movimento,
  MovimentoOperacao,
  MovimentoResumo,
  PaginatedResponse,
  PaginationParams,
} from "@/types"

export async function getMovimentoAberto(terminalId?: string): Promise<Movimento | null> {
  const { data } = await api.get<Movimento | null>("/caixa/aberto", {
    params: { terminalId },
  })
  return data
}

export async function abrirCaixa(payload: {
  terminalId: string
  valorAbertura: number
}): Promise<Movimento> {
  const { data } = await api.post<Movimento>("/caixa/abrir", payload)
  return data
}

export async function fecharCaixa(
  id: string,
  valorFechamento: number
): Promise<Movimento> {
  const { data } = await api.post<Movimento>(`/caixa/${id}/fechar`, {
    valorFechamento,
  })
  return data
}

export async function registrarSangria(
  id: string,
  valor: number,
  observacao: string
): Promise<MovimentoOperacao> {
  const { data } = await api.post<MovimentoOperacao>(
    `/caixa/${id}/sangria`,
    { valor, observacao }
  )
  return data
}

export async function registrarSuprimento(
  id: string,
  valor: number,
  observacao: string
): Promise<MovimentoOperacao> {
  const { data } = await api.post<MovimentoOperacao>(
    `/caixa/${id}/suprimento`,
    { valor, observacao }
  )
  return data
}

export async function getMovimento(id: string): Promise<Movimento> {
  const { data } = await api.get<Movimento>(`/caixa/${id}`)
  return data
}

export async function listarMovimentos(
  params?: PaginationParams
): Promise<PaginatedResponse<Movimento>> {
  const { data } = await api.get<PaginatedResponse<Movimento>>("/caixa", {
    params,
  })
  return data
}

export async function getResumo(id: string): Promise<MovimentoResumo> {
  const { data } = await api.get<MovimentoResumo>(`/caixa/${id}/resumo`)
  return data
}
