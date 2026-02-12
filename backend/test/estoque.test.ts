import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createAuthenticatedUser,
  createTestProduto,
} from './helpers/auth-helper.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import type { FastifyInstance } from 'fastify'

const prisma = new PrismaClient()

describe('Estoque API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await closeTestApp()
  })

  // ─── Entradas ──────────────────────────────────────────

  describe('POST /api/estoque/entradas', () => {
    it('should create an entrada and increment stock', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 50 })

      const res = await app.inject({
        method: 'POST',
        url: '/api/estoque/entradas',
        headers: authHeader,
        payload: {
          numeroNota: 'NF-001',
          itens: [{ produtoId: produto.id, quantidade: 30, precoUnitario: 12.5 }],
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.itens).toHaveLength(1)

      const updated = await prisma.produto.findUnique({ where: { id: produto.id } })
      expect(Number(updated!.estoqueAtual)).toBe(80)
      expect(Number(updated!.precoCusto)).toBe(12.5)
    })

    it('should reject empty itens', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'POST',
        url: '/api/estoque/entradas',
        headers: authHeader,
        payload: { itens: [] },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /api/estoque/entradas', () => {
    it('should list entradas with pagination', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id)

      await app.inject({
        method: 'POST',
        url: '/api/estoque/entradas',
        headers: authHeader,
        payload: {
          itens: [{ produtoId: produto.id, quantidade: 10, precoUnitario: 5 }],
        },
      })

      const res = await app.inject({
        method: 'GET',
        url: '/api/estoque/entradas?page=1&limit=10',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
      expect(body.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── Saídas ────────────────────────────────────────────

  describe('POST /api/estoque/saidas', () => {
    it('should create a saida and decrement stock', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 100 })

      const res = await app.inject({
        method: 'POST',
        url: '/api/estoque/saidas',
        headers: authHeader,
        payload: {
          motivo: 'Avaria',
          observacao: 'Produtos danificados',
          itens: [{ produtoId: produto.id, quantidade: 15 }],
        },
      })

      expect(res.statusCode).toBe(201)
      const updated = await prisma.produto.findUnique({ where: { id: produto.id } })
      expect(Number(updated!.estoqueAtual)).toBe(85)
    })

    it('should reject saida with insufficient stock', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 5 })

      const res = await app.inject({
        method: 'POST',
        url: '/api/estoque/saidas',
        headers: authHeader,
        payload: {
          motivo: 'Transferência',
          itens: [{ produtoId: produto.id, quantidade: 50 }],
        },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('insuficiente')
    })
  })

  describe('GET /api/estoque/saidas', () => {
    it('should list saidas', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/estoque/saidas',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
    })
  })

  // ─── Pedidos de Compra ─────────────────────────────────

  describe('POST /api/estoque/pedidos', () => {
    it('GERENTE should create a pedido de compra', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const produto = await createTestProduto(empresa.id)

      // Create fornecedor
      const fornecedor = await prisma.fornecedor.create({
        data: { nome: 'Fornecedor Teste', empresaId: empresa.id },
      })

      const res = await app.inject({
        method: 'POST',
        url: '/api/estoque/pedidos',
        headers: authHeader,
        payload: {
          fornecedorId: fornecedor.id,
          observacao: 'Pedido de reposição',
          itens: [{ produtoId: produto.id, quantidade: 100, precoUnitario: 10 }],
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.status).toBe('RASCUNHO')
      expect(body.itens).toHaveLength(1)
    })

    it('OPERADORA should be blocked from creating pedidos', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'OPERADORA')

      const res = await app.inject({
        method: 'POST',
        url: '/api/estoque/pedidos',
        headers: authHeader,
        payload: {
          fornecedorId: '00000000-0000-0000-0000-000000000000',
          itens: [{ produtoId: '00000000-0000-0000-0000-000000000000', quantidade: 1, precoUnitario: 1 }],
        },
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/estoque/pedidos', () => {
    it('should list pedidos de compra', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/estoque/pedidos',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toHaveProperty('data')
    })
  })

  describe('POST /api/estoque/pedidos/:id/receber', () => {
    it('should receive a pedido and increment stock', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 20 })
      const fornecedor = await prisma.fornecedor.create({
        data: { nome: 'Forn', empresaId: empresa.id },
      })

      // Create pedido
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/estoque/pedidos',
        headers: authHeader,
        payload: {
          fornecedorId: fornecedor.id,
          itens: [{ produtoId: produto.id, quantidade: 50, precoUnitario: 8 }],
        },
      })
      const pedidoId = JSON.parse(createRes.body).id

      // Receber
      const res = await app.inject({
        method: 'POST',
        url: `/api/estoque/pedidos/${pedidoId}/receber`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(201)

      const updated = await prisma.produto.findUnique({ where: { id: produto.id } })
      expect(Number(updated!.estoqueAtual)).toBe(70)
    })

    it('should reject receiving an already received pedido', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 10 })
      const fornecedor = await prisma.fornecedor.create({
        data: { nome: 'Forn2', empresaId: empresa.id },
      })

      const createRes = await app.inject({
        method: 'POST',
        url: '/api/estoque/pedidos',
        headers: authHeader,
        payload: {
          fornecedorId: fornecedor.id,
          itens: [{ produtoId: produto.id, quantidade: 10, precoUnitario: 5 }],
        },
      })
      const pedidoId = JSON.parse(createRes.body).id

      // Receive first time
      await app.inject({
        method: 'POST',
        url: `/api/estoque/pedidos/${pedidoId}/receber`,
        headers: authHeader,
      })

      // Try again
      const res = await app.inject({
        method: 'POST',
        url: `/api/estoque/pedidos/${pedidoId}/receber`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('recebido')
    })
  })

  // ─── Sugestão de compra ────────────────────────────────

  describe('GET /api/estoque/sugestao-compra', () => {
    it('should return purchase suggestion', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/estoque/sugestao-compra',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(JSON.parse(res.body))).toBe(true)
    })
  })
})
