import { api } from "./api"
import type {
  User,
  Fornecedor,
  Cliente,
  Terminal,
  ComissaoConfig,
  Shopping,
  PaginatedResponse,
  PaginationParams,
} from "@/types"

// ─── Usuarios ────────────────────────────────────────────
export async function listarUsuarios(
  params?: PaginationParams
): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<PaginatedResponse<User>>(
    "/configuracoes/usuarios",
    { params }
  )
  return data
}

export async function criarUsuario(payload: Partial<User> & { senha?: string }): Promise<User> {
  const { data } = await api.post<User>("/configuracoes/usuarios", payload)
  return data
}

export async function atualizarUsuario(
  id: string,
  payload: Partial<User>
): Promise<User> {
  const { data } = await api.patch<User>(
    `/configuracoes/usuarios/${id}`,
    payload
  )
  return data
}

export async function excluirUsuario(id: string): Promise<void> {
  await api.delete(`/configuracoes/usuarios/${id}`)
}

// ─── Fornecedores ────────────────────────────────────────
export async function listarFornecedores(
  params?: PaginationParams
): Promise<PaginatedResponse<Fornecedor>> {
  const { data } = await api.get<PaginatedResponse<Fornecedor>>(
    "/configuracoes/fornecedores",
    { params }
  )
  return data
}

export async function criarFornecedor(
  payload: Partial<Fornecedor>
): Promise<Fornecedor> {
  const { data } = await api.post<Fornecedor>(
    "/configuracoes/fornecedores",
    payload
  )
  return data
}

export async function atualizarFornecedor(
  id: string,
  payload: Partial<Fornecedor>
): Promise<Fornecedor> {
  const { data } = await api.patch<Fornecedor>(
    `/configuracoes/fornecedores/${id}`,
    payload
  )
  return data
}

export async function excluirFornecedor(id: string): Promise<void> {
  await api.delete(`/configuracoes/fornecedores/${id}`)
}

// ─── Clientes ────────────────────────────────────────────
export async function listarClientes(
  params?: PaginationParams
): Promise<PaginatedResponse<Cliente>> {
  const { data } = await api.get<PaginatedResponse<Cliente>>(
    "/configuracoes/clientes",
    { params }
  )
  return data
}

export async function criarCliente(
  payload: Partial<Cliente>
): Promise<Cliente> {
  const { data } = await api.post<Cliente>(
    "/configuracoes/clientes",
    payload
  )
  return data
}

export async function atualizarCliente(
  id: string,
  payload: Partial<Cliente>
): Promise<Cliente> {
  const { data } = await api.patch<Cliente>(
    `/configuracoes/clientes/${id}`,
    payload
  )
  return data
}

export async function excluirCliente(id: string): Promise<void> {
  await api.delete(`/configuracoes/clientes/${id}`)
}

// ─── Terminais ───────────────────────────────────────────
export async function listarTerminais(
  params?: PaginationParams
): Promise<PaginatedResponse<Terminal>> {
  const { data } = await api.get<PaginatedResponse<Terminal>>(
    "/configuracoes/terminais",
    { params }
  )
  return data
}

export async function criarTerminal(
  payload: Partial<Terminal>
): Promise<Terminal> {
  const { data } = await api.post<Terminal>(
    "/configuracoes/terminais",
    payload
  )
  return data
}

export async function atualizarTerminal(
  id: string,
  payload: Partial<Terminal>
): Promise<Terminal> {
  const { data } = await api.patch<Terminal>(
    `/configuracoes/terminais/${id}`,
    payload
  )
  return data
}

export async function excluirTerminal(id: string): Promise<void> {
  await api.delete(`/configuracoes/terminais/${id}`)
}

// ─── Comissoes ───────────────────────────────────────────
export async function listarComissoes(
  params?: PaginationParams
): Promise<PaginatedResponse<ComissaoConfig>> {
  const { data } = await api.get<PaginatedResponse<ComissaoConfig>>(
    "/configuracoes/comissoes",
    { params }
  )
  return data
}

export async function criarComissao(
  payload: Partial<ComissaoConfig>
): Promise<ComissaoConfig> {
  const { data } = await api.post<ComissaoConfig>(
    "/configuracoes/comissoes",
    payload
  )
  return data
}

export async function atualizarComissao(
  id: string,
  payload: Partial<ComissaoConfig>
): Promise<ComissaoConfig> {
  const { data } = await api.patch<ComissaoConfig>(
    `/configuracoes/comissoes/${id}`,
    payload
  )
  return data
}

export async function excluirComissao(id: string): Promise<void> {
  await api.delete(`/configuracoes/comissoes/${id}`)
}

// ─── Shoppings ───────────────────────────────────────────
export async function listarShoppings(
  params?: PaginationParams
): Promise<PaginatedResponse<Shopping>> {
  const { data } = await api.get<PaginatedResponse<Shopping>>(
    "/configuracoes/shoppings",
    { params }
  )
  return data
}

export async function criarShopping(
  payload: Partial<Shopping>
): Promise<Shopping> {
  const { data } = await api.post<Shopping>(
    "/configuracoes/shoppings",
    payload
  )
  return data
}

export async function atualizarShopping(
  id: string,
  payload: Partial<Shopping>
): Promise<Shopping> {
  const { data } = await api.patch<Shopping>(
    `/configuracoes/shoppings/${id}`,
    payload
  )
  return data
}

export async function excluirShopping(id: string): Promise<void> {
  await api.delete(`/configuracoes/shoppings/${id}`)
}
