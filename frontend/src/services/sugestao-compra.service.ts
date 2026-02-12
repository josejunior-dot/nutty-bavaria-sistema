import { api } from "./api"
import type { SugestaoCompraItem, EventoSazonal } from "@/types"

export async function getSugestoes(): Promise<SugestaoCompraItem[]> {
  const { data } = await api.get<SugestaoCompraItem[]>("/sugestao-compra")
  return data
}

export async function getEventos(): Promise<EventoSazonal[]> {
  const { data } = await api.get<EventoSazonal[]>("/sugestao-compra/eventos")
  return data
}

export async function criarEvento(payload: {
  nome: string
  dataInicio: string
  dataFim: string
  multiplicador: number
  recorrente?: boolean
}): Promise<EventoSazonal> {
  const { data } = await api.post<EventoSazonal>("/sugestao-compra/eventos", payload)
  return data
}

export async function atualizarEvento(
  id: string,
  payload: {
    nome?: string
    dataInicio?: string
    dataFim?: string
    multiplicador?: number
    recorrente?: boolean
  }
): Promise<EventoSazonal> {
  const { data } = await api.put<EventoSazonal>(`/sugestao-compra/eventos/${id}`, payload)
  return data
}

export async function excluirEvento(id: string): Promise<void> {
  await api.delete(`/sugestao-compra/eventos/${id}`)
}
