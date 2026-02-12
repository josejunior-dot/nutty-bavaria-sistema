import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createAuthenticatedUser,
  createTestProduto,
} from './helpers/auth-helper.js'
import type { FastifyInstance } from 'fastify'

describe('Produtos API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await closeTestApp()
  })

  // ─── Listar ────────────────────────────────────────────

  describe('GET /api/produtos', () => {
    it('should list produtos with pagination', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      await createTestProduto(empresa.id, { nome: 'Castanha' })
      await createTestProduto(empresa.id, { nome: 'Amendoim' })

      const res = await app.inject({
        method: 'GET',
        url: '/api/produtos?page=1&limit=10',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
    })

    it('should search by name', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      await createTestProduto(empresa.id, { nome: 'Castanha Premium' })
      await createTestProduto(empresa.id, { nome: 'Amendoim Crocante' })

      const res = await app.inject({
        method: 'GET',
        url: '/api/produtos?search=castanha',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].nome).toBe('Castanha Premium')
    })
  })

  // ─── Get by ID ─────────────────────────────────────────

  describe('GET /api/produtos/:id', () => {
    it('should return a single produto', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id)

      const res = await app.inject({
        method: 'GET',
        url: `/api/produtos/${produto.id}`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).id).toBe(produto.id)
    })

    it('should return 404 for non-existent produto', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/produtos/00000000-0000-0000-0000-000000000000',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ─── Criar ─────────────────────────────────────────────

  describe('POST /api/produtos', () => {
    it('GERENTE should create a produto', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')
      const suffix = Date.now()

      const res = await app.inject({
        method: 'POST',
        url: '/api/produtos',
        headers: authHeader,
        payload: {
          nome: 'Novo Produto',
          codigo: `NP-${suffix}`,
          precoVenda: 29.9,
          precoCusto: 15,
          estoqueMinimo: 10,
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.nome).toBe('Novo Produto')
      expect(Number(body.estoqueAtual)).toBe(0)
    })

    it('OPERADORA should be blocked from creating produtos', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'OPERADORA')

      const res = await app.inject({
        method: 'POST',
        url: '/api/produtos',
        headers: authHeader,
        payload: { nome: 'X', codigo: 'X', precoVenda: 10 },
      })

      expect(res.statusCode).toBe(403)
    })

    it('should reject duplicate codigo', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const existing = await createTestProduto(empresa.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/produtos',
        headers: authHeader,
        payload: { nome: 'Dup', codigo: existing.codigo, precoVenda: 10 },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('já existe')
    })
  })

  // ─── Atualizar ─────────────────────────────────────────

  describe('PUT /api/produtos/:id', () => {
    it('GERENTE should update a produto', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const produto = await createTestProduto(empresa.id)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/produtos/${produto.id}`,
        headers: authHeader,
        payload: { nome: 'Nome Atualizado' },
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).nome).toBe('Nome Atualizado')
    })
  })

  // ─── Desativar ─────────────────────────────────────────

  describe('DELETE /api/produtos/:id', () => {
    it('GERENTE should deactivate a produto', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const produto = await createTestProduto(empresa.id)

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/produtos/${produto.id}`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).message).toContain('desativado')
    })
  })

  // ─── Produtos para venda ───────────────────────────────

  describe('GET /api/produtos/venda', () => {
    it('should return active produtos for sale', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      await createTestProduto(empresa.id, { nome: 'Ativo' })

      const res = await app.inject({
        method: 'GET',
        url: '/api/produtos/venda',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
      expect(body[0]).toHaveProperty('precoVenda')
    })
  })

  // ─── Estoque baixo ────────────────────────────────────

  describe('GET /api/produtos/estoque-baixo', () => {
    it('should return produtos with stock below minimum', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/produtos/estoque-baixo',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(JSON.parse(res.body))).toBe(true)
    })
  })
})
