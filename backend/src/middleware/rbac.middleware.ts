import type { Role } from '../generated/prisma/client.js'

type Module = 'dashboard' | 'vendas' | 'caixa' | 'estoque' | 'fiscal' | 'shopping' | 'configuracoes' | 'relatorios'

const permissionMatrix: Record<Role, Module[]> = {
  OPERADORA: ['dashboard', 'vendas', 'caixa'],
  GERENTE: ['dashboard', 'vendas', 'caixa', 'estoque', 'relatorios', 'configuracoes'],
  FRANQUEADOR: ['dashboard', 'vendas', 'caixa', 'estoque', 'fiscal', 'shopping', 'configuracoes', 'relatorios'],
}

export function hasPermission(role: Role, module: Module): boolean {
  return permissionMatrix[role]?.includes(module) ?? false
}

export function getPermissions(role: Role): Module[] {
  return permissionMatrix[role] ?? []
}
