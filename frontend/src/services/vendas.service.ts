import { api } from "./api"
import type {
  Venda,
  TipoPagamento,
  PaginatedResponse,
  PaginationParams,
} from "@/types"

export async function criarVenda(payload: {
  movimentoId: string
  itens: { produtoId: string; quantidade: number; precoUnitario: number }[]
  pagamentos: { tipo: TipoPagamento; valor: number }[]
  desconto?: number
  clienteId?: string
}): Promise<Venda> {
  const { data } = await api.post<Venda>("/vendas", payload)
  return data
}

export async function listarVendas(
  params?: PaginationParams & {
    status?: string
    dataInicio?: string
    dataFim?: string
  }
): Promise<PaginatedResponse<Venda>> {
  const { data } = await api.get<PaginatedResponse<Venda>>("/vendas", {
    params,
  })
  return data
}

export async function getVenda(id: string): Promise<Venda> {
  const { data } = await api.get<Venda>(`/vendas/${id}`)
  return data
}

export async function cancelarVenda(id: string): Promise<Venda> {
  const { data } = await api.post<Venda>(`/vendas/${id}/cancelar`)
  return data
}
