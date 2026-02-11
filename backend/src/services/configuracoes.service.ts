import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import type { Prisma } from '../generated/prisma/client.js'

// ─── Usuários ────────────────────────────────────────
export async function listarUsuarios(empresaId: string, params: { page?: number; limit?: number; search?: string }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit
  const where: Prisma.UsuarioWhereInput = { empresaId }
  if (params.search) {
    where.OR = [
      { nome: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
      orderBy: { nome: 'asc' },
      skip,
      take: limit,
    }),
    prisma.usuario.count({ where }),
  ])
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function criarUsuario(data: { nome: string; email: string; senha: string; role: string; empresaId: string }) {
  const senha = await bcrypt.hash(data.senha, 10)
  return prisma.usuario.create({
    data: { nome: data.nome, email: data.email, senha, role: data.role as any, empresaId: data.empresaId },
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  })
}

export async function atualizarUsuario(id: string, data: any) {
  const updateData = { ...data }
  delete updateData.id
  delete updateData.empresaId
  delete updateData.senha
  return prisma.usuario.update({
    where: { id },
    data: updateData,
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  })
}

export async function desativarUsuario(id: string) {
  return prisma.usuario.update({ where: { id }, data: { ativo: false } })
}

// ─── Fornecedores ────────────────────────────────────
export async function listarFornecedores(empresaId: string, params: { page?: number; limit?: number; search?: string }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit
  const where: Prisma.FornecedorWhereInput = { empresaId }
  if (params.search) where.nome = { contains: params.search, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.fornecedor.findMany({ where, orderBy: { nome: 'asc' }, skip, take: limit }),
    prisma.fornecedor.count({ where }),
  ])
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function criarFornecedor(data: { nome: string; cnpj?: string; telefone?: string; email?: string; empresaId: string }) {
  return prisma.fornecedor.create({ data })
}

export async function atualizarFornecedor(id: string, data: any) {
  const updateData = { ...data }
  delete updateData.id
  delete updateData.empresaId
  return prisma.fornecedor.update({ where: { id }, data: updateData })
}

export async function excluirFornecedor(id: string) {
  return prisma.fornecedor.delete({ where: { id } })
}

// ─── Clientes ────────────────────────────────────────
export async function listarClientes(empresaId: string, params: { page?: number; limit?: number; search?: string }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit
  const where: Prisma.ClienteWhereInput = { empresaId }
  if (params.search) where.nome = { contains: params.search, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.cliente.findMany({ where, orderBy: { nome: 'asc' }, skip, take: limit }),
    prisma.cliente.count({ where }),
  ])
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function criarCliente(data: { nome: string; cpf?: string; telefone?: string; email?: string; empresaId: string }) {
  return prisma.cliente.create({ data })
}

export async function atualizarCliente(id: string, data: any) {
  const updateData = { ...data }
  delete updateData.id
  delete updateData.empresaId
  return prisma.cliente.update({ where: { id }, data: updateData })
}

export async function excluirCliente(id: string) {
  return prisma.cliente.delete({ where: { id } })
}

// ─── Terminais ───────────────────────────────────────
export async function listarTerminais(empresaId: string) {
  return prisma.terminal.findMany({ where: { empresaId }, orderBy: { nome: 'asc' } })
}

export async function criarTerminal(data: { nome: string; codigo: string; empresaId: string }) {
  return prisma.terminal.create({ data })
}

export async function atualizarTerminal(id: string, data: any) {
  const updateData = { ...data }
  delete updateData.id
  delete updateData.empresaId
  return prisma.terminal.update({ where: { id }, data: updateData })
}

// ─── Comissões ───────────────────────────────────────
export async function listarComissoes(empresaId: string) {
  return prisma.comissaoConfig.findMany({ where: { empresaId }, orderBy: { nome: 'asc' } })
}

export async function criarComissao(data: { nome: string; percentual: number; empresaId: string }) {
  return prisma.comissaoConfig.create({ data })
}

export async function atualizarComissao(id: string, data: any) {
  const updateData = { ...data }
  delete updateData.id
  delete updateData.empresaId
  return prisma.comissaoConfig.update({ where: { id }, data: updateData })
}

export async function excluirComissao(id: string) {
  return prisma.comissaoConfig.delete({ where: { id } })
}

// ─── Shoppings ───────────────────────────────────────
export async function listarShoppings(empresaId: string) {
  return prisma.shopping.findMany({ where: { empresaId }, orderBy: { nome: 'asc' } })
}
