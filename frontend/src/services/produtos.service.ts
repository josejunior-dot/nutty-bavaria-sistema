import { api } from "./api"
import type { Produto, PaginatedResponse, PaginationParams } from "@/types"

export async function listarProdutos(
  params?: PaginationParams & { ativo?: boolean }
): Promise<PaginatedResponse<Produto>> {
  const { data } = await api.get<PaginatedResponse<Produto>>("/produtos", {
    params,
  })
  return data
}

export async function getProduto(id: string): Promise<Produto> {
  const { data } = await api.get<Produto>(`/produtos/${id}`)
  return data
}

export async function criarProduto(payload: Partial<Produto>): Promise<Produto> {
  const { data } = await api.post<Produto>("/produtos", payload)
  return data
}

export async function atualizarProduto(
  id: string,
  payload: Partial<Produto>
): Promise<Produto> {
  const { data } = await api.patch<Produto>(`/produtos/${id}`, payload)
  return data
}

export async function desativarProduto(id: string): Promise<void> {
  await api.delete(`/produtos/${id}`)
}

export async function getProdutosEstoqueBaixo(): Promise<Produto[]> {
  const { data } = await api.get<Produto[]>("/produtos/estoque-baixo")
  return data
}

export async function getProdutosVenda(): Promise<Produto[]> {
  const { data } = await api.get<Produto[]>("/produtos/venda")
  return data
}
