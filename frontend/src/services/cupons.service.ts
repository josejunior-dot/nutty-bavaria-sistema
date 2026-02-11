import { api } from "./api"
import type {
  CampanhaShopping,
  CupomShopping,
  PaginatedResponse,
  PaginationParams,
} from "@/types"

export async function getCampanhasAtivas(): Promise<CampanhaShopping[]> {
  const { data } = await api.get<CampanhaShopping[]>("/cupons/campanhas/ativas")
  return data
}

export async function verificarCupons(
  vendaId: string
): Promise<{ campanhaId: string; campanhaNome: string; qtdCupons: number }[]> {
  const { data } = await api.get<
    { campanhaId: string; campanhaNome: string; qtdCupons: number }[]
  >(`/cupons/verificar/${vendaId}`)
  return data
}

export async function registrarCupons(payload: {
  vendaId: string
  campanhaId: string
  codigos: string[]
}): Promise<CupomShopping[]> {
  const { data } = await api.post<CupomShopping[]>("/cupons/registrar", payload)
  return data
}

export async function listarCupons(
  params?: PaginationParams & { campanhaId?: string }
): Promise<PaginatedResponse<CupomShopping>> {
  const { data } = await api.get<PaginatedResponse<CupomShopping>>("/cupons", {
    params,
  })
  return data
}

export async function listarCampanhas(): Promise<CampanhaShopping[]> {
  const { data } = await api.get<CampanhaShopping[]>("/cupons/campanhas")
  return data
}

export async function criarCampanha(
  payload: Partial<CampanhaShopping>
): Promise<CampanhaShopping> {
  const { data } = await api.post<CampanhaShopping>(
    "/cupons/campanhas",
    payload
  )
  return data
}

export async function atualizarCampanha(
  id: string,
  payload: Partial<CampanhaShopping>
): Promise<CampanhaShopping> {
  const { data } = await api.patch<CampanhaShopping>(
    `/cupons/campanhas/${id}`,
    payload
  )
  return data
}
