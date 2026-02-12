import bcrypt from 'bcryptjs'
import { PrismaClient, type Role } from '../../src/generated/prisma/client.js'
import type { FastifyInstance } from 'fastify'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Test@123'

let passwordHash: string | null = null

async function getPasswordHash(): Promise<string> {
  if (!passwordHash) {
    passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 4) // Low rounds for speed
  }
  return passwordHash
}

export async function createTestEmpresa(nome = 'Empresa Teste') {
  return prisma.empresa.create({
    data: {
      nome,
      cnpj: `${Date.now()}.000/0001-00`,
      telefone: '(11) 99999-9999',
      email: `teste-${Date.now()}@test.com`,
    },
  })
}

export async function createTestUsuario(
  empresaId: string,
  role: Role = 'OPERADORA',
  overrides: Partial<{ nome: string; email: string }> = {}
) {
  const hash = await getPasswordHash()
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return prisma.usuario.create({
    data: {
      nome: overrides.nome ?? `Teste ${role}`,
      email: overrides.email ?? `test-${role.toLowerCase()}-${suffix}@test.com`,
      senha: hash,
      role,
      empresaId,
    },
  })
}

export async function createTestTerminal(empresaId: string, nome = 'Terminal Teste') {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return prisma.terminal.create({
    data: {
      nome,
      codigo: `T-${suffix}`,
      empresaId,
    },
  })
}

export async function createTestProduto(
  empresaId: string,
  overrides: Partial<{ nome: string; codigo: string; precoVenda: number; estoqueAtual: number }> = {}
) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return prisma.produto.create({
    data: {
      nome: overrides.nome ?? 'Produto Teste',
      codigo: overrides.codigo ?? `PROD-${suffix}`,
      precoVenda: overrides.precoVenda ?? 25.9,
      estoqueAtual: overrides.estoqueAtual ?? 100,
      estoqueMinimo: 10,
      unidade: 'UN',
      empresaId,
    },
  })
}

/**
 * Login and return the access token
 */
export async function loginUser(app: FastifyInstance, email: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password: DEFAULT_PASSWORD },
  })
  const body = JSON.parse(res.body)
  return {
    accessToken: body.accessToken as string,
    user: body.user,
    cookies: res.cookies,
    statusCode: res.statusCode,
  }
}

/**
 * Create a full authenticated context: empresa + user + terminal + login
 */
export async function createAuthenticatedUser(
  app: FastifyInstance,
  role: Role = 'OPERADORA'
) {
  const empresa = await createTestEmpresa()
  const usuario = await createTestUsuario(empresa.id, role)
  const terminal = await createTestTerminal(empresa.id)
  const login = await loginUser(app, usuario.email)

  return {
    empresa,
    usuario,
    terminal,
    accessToken: login.accessToken,
    cookies: login.cookies,
    authHeader: { authorization: `Bearer ${login.accessToken}` },
  }
}

export { DEFAULT_PASSWORD }
