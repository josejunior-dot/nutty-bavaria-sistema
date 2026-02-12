import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import { createAuthenticatedUser } from './helpers/auth-helper.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import type { FastifyInstance } from 'fastify'

const prisma = new PrismaClient()

describe('Configurações API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await closeTestApp()
  })

  // ─── Usuários ──────────────────────────────────────────

  describe('GET /api/configuracoes/usuarios', () => {
    it('GERENTE should list usuarios', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')

      const res = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/usuarios',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
      expect(body.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('POST /api/configuracoes/usuarios', () => {
    it('should create a new usuario', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')
      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      const res = await app.inject({
        method: 'POST',
        url: '/api/configuracoes/usuarios',
        headers: authHeader,
        payload: {
          nome: 'Novo Operador',
          email: `novo-${suffix}@test.com`,
          senha: '123456',
          role: 'OPERADORA',
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.nome).toBe('Novo Operador')
      expect(body.role).toBe('OPERADORA')
      expect(body).not.toHaveProperty('senha')
    })

    it('should reject duplicate email', async () => {
      const { authHeader, usuario } = await createAuthenticatedUser(app, 'GERENTE')

      const res = await app.inject({
        method: 'POST',
        url: '/api/configuracoes/usuarios',
        headers: authHeader,
        payload: {
          nome: 'Dup',
          email: usuario.email,
          senha: '123456',
          role: 'OPERADORA',
        },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('Email')
    })
  })

  describe('PUT /api/configuracoes/usuarios/:id', () => {
    it('should update a usuario', async () => {
      const { authHeader, usuario } = await createAuthenticatedUser(app, 'GERENTE')

      const res = await app.inject({
        method: 'PUT',
        url: `/api/configuracoes/usuarios/${usuario.id}`,
        headers: authHeader,
        payload: { nome: 'Nome Atualizado' },
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).nome).toBe('Nome Atualizado')
    })
  })

  describe('DELETE /api/configuracoes/usuarios/:id', () => {
    it('should deactivate a usuario', async () => {
      const { authHeader, usuario } = await createAuthenticatedUser(app, 'GERENTE')

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/configuracoes/usuarios/${usuario.id}`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).message).toContain('desativado')
    })
  })

  // ─── Fornecedores ─────────────────────────────────────

  describe('Fornecedores CRUD', () => {
    it('should create, list, update, and delete a fornecedor', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')

      // Create
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/configuracoes/fornecedores',
        headers: authHeader,
        payload: { nome: 'Fornecedor X', cnpj: '11.111.111/0001-01', telefone: '(11) 99999-0000' },
      })
      expect(createRes.statusCode).toBe(201)
      const fornecedor = JSON.parse(createRes.body)
      expect(fornecedor.nome).toBe('Fornecedor X')

      // List
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/fornecedores',
        headers: authHeader,
      })
      expect(listRes.statusCode).toBe(200)
      expect(JSON.parse(listRes.body).data.length).toBeGreaterThanOrEqual(1)

      // Update
      const updateRes = await app.inject({
        method: 'PUT',
        url: `/api/configuracoes/fornecedores/${fornecedor.id}`,
        headers: authHeader,
        payload: { nome: 'Fornecedor Atualizado' },
      })
      expect(updateRes.statusCode).toBe(200)
      expect(JSON.parse(updateRes.body).nome).toBe('Fornecedor Atualizado')

      // Delete
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/configuracoes/fornecedores/${fornecedor.id}`,
        headers: authHeader,
      })
      expect(deleteRes.statusCode).toBe(200)
      expect(JSON.parse(deleteRes.body).message).toContain('excluído')
    })
  })

  // ─── Clientes ──────────────────────────────────────────

  describe('Clientes CRUD', () => {
    it('should create, list, update, and delete a cliente', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')

      // Create
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/configuracoes/clientes',
        headers: authHeader,
        payload: { nome: 'Cliente Y', cpf: `${Date.now()}`, telefone: '(11) 88888-0000' },
      })
      expect(createRes.statusCode).toBe(201)
      const cliente = JSON.parse(createRes.body)

      // List
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/clientes',
        headers: authHeader,
      })
      expect(listRes.statusCode).toBe(200)
      expect(JSON.parse(listRes.body).data.length).toBeGreaterThanOrEqual(1)

      // Update
      const updateRes = await app.inject({
        method: 'PUT',
        url: `/api/configuracoes/clientes/${cliente.id}`,
        headers: authHeader,
        payload: { nome: 'Cliente Atualizado' },
      })
      expect(updateRes.statusCode).toBe(200)
      expect(JSON.parse(updateRes.body).nome).toBe('Cliente Atualizado')

      // Delete
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/configuracoes/clientes/${cliente.id}`,
        headers: authHeader,
      })
      expect(deleteRes.statusCode).toBe(200)
      expect(JSON.parse(deleteRes.body).message).toContain('excluído')
    })
  })

  // ─── Terminais ─────────────────────────────────────────

  describe('Terminais', () => {
    it('should create, list, and update a terminal', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')
      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      // Create
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/configuracoes/terminais',
        headers: authHeader,
        payload: { nome: 'Terminal Novo', codigo: `TN-${suffix}` },
      })
      expect(createRes.statusCode).toBe(201)
      const terminal = JSON.parse(createRes.body)

      // List
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/terminais',
        headers: authHeader,
      })
      expect(listRes.statusCode).toBe(200)
      const terminais = JSON.parse(listRes.body)
      expect(Array.isArray(terminais)).toBe(true)
      expect(terminais.length).toBeGreaterThanOrEqual(2) // 1 from createAuthenticatedUser + 1 new

      // Update
      const updateRes = await app.inject({
        method: 'PUT',
        url: `/api/configuracoes/terminais/${terminal.id}`,
        headers: authHeader,
        payload: { nome: 'Terminal Renomeado' },
      })
      expect(updateRes.statusCode).toBe(200)
      expect(JSON.parse(updateRes.body).nome).toBe('Terminal Renomeado')
    })

    it('should reject duplicate terminal codigo', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app, 'GERENTE')

      const res = await app.inject({
        method: 'POST',
        url: '/api/configuracoes/terminais',
        headers: authHeader,
        payload: { nome: 'Dup', codigo: terminal.codigo },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('já existe')
    })
  })

  // ─── Comissões ─────────────────────────────────────────

  describe('Comissões CRUD', () => {
    it('should create, list, update, and delete a comissão', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')

      // Create
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/configuracoes/comissoes',
        headers: authHeader,
        payload: { nome: 'Comissão Padrão', percentual: 5 },
      })
      expect(createRes.statusCode).toBe(201)
      const comissao = JSON.parse(createRes.body)
      expect(Number(comissao.percentual)).toBe(5)

      // List
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/comissoes',
        headers: authHeader,
      })
      expect(listRes.statusCode).toBe(200)
      expect(Array.isArray(JSON.parse(listRes.body))).toBe(true)

      // Update
      const updateRes = await app.inject({
        method: 'PUT',
        url: `/api/configuracoes/comissoes/${comissao.id}`,
        headers: authHeader,
        payload: { percentual: 8 },
      })
      expect(updateRes.statusCode).toBe(200)
      expect(Number(JSON.parse(updateRes.body).percentual)).toBe(8)

      // Delete
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/configuracoes/comissoes/${comissao.id}`,
        headers: authHeader,
      })
      expect(deleteRes.statusCode).toBe(200)
      expect(JSON.parse(deleteRes.body).message).toContain('excluída')
    })
  })

  // ─── Shoppings ─────────────────────────────────────────

  describe('GET /api/configuracoes/shoppings', () => {
    it('should list shoppings', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')

      await prisma.shopping.create({
        data: { nome: 'Shopping X', cidade: 'SP', estado: 'SP', empresaId: empresa.id },
      })

      const res = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/shoppings',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
    })
  })
})
