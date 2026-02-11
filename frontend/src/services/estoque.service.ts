import { api } from "./api"
import type {
  EntradaEstoque,
  SaidaEstoque,
  PedidoCompra,
  PaginatedResponse,
  PaginationParams,
} from "@/types"

export async function criarEntrada(payload: {
  fornecedorId?: string
  numeroNota?: string
  observacao?: string
  itens: { produtoId: string; quantidade: number; precoUnitario: number }[]
}): Promise<EntradaEstoque> {
  const { data } = await api.post<EntradaEstoque>("/estoque/entradas", payload)
  return data
}

export async function listarEntradas(
  params?: PaginationParams
): Promise<PaginatedResponse<EntradaEstoque>> {
  const { data } = await api.get<PaginatedResponse<EntradaEstoque>>(
    "/estoque/entradas",
    { params }
  )
  return data
}

export async function criarSaida(payload: {
  motivo: string
  observacao?: string
  itens: { produtoId: string; quantidade: number }[]
}): Promise<SaidaEstoque> {
  const { data } = await api.post<SaidaEstoque>("/estoque/saidas", payload)
  return data
}

export async function listarSaidas(
  params?: PaginationParams
): Promise<PaginatedResponse<SaidaEstoque>> {
  const { data } = await api.get<PaginatedResponse<SaidaEstoque>>(
    "/estoque/saidas",
    { params }
  )
  return data
}

export async function listarPedidos(
  params?: PaginationParams & { status?: string }
): Promise<PaginatedResponse<PedidoCompra>> {
  const { data } = await api.get<PaginatedResponse<PedidoCompra>>(
    "/estoque/pedidos",
    { params }
  )
  return data
}

export async function criarPedido(payload: any): Promise<PedidoCompra> {
  const { data } = await api.post<PedidoCompra>("/estoque/pedidos", payload)
  return data
}

export async function receberPedido(id: string): Promise<PedidoCompra> {
  const { data } = await api.post<PedidoCompra>(
    `/estoque/pedidos/${id}/receber`
  )
  return data
}

export async function getSugestaoCompra(): Promise<any[]> {
  const { data } = await api.get<any[]>("/estoque/sugestao-compra")
  return data
}
