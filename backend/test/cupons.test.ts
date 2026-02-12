import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createAuthenticatedUser,
  createTestProduto,
} from './helpers/auth-helper.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import type { FastifyInstance } from 'fastify'

const prisma = new PrismaClient()

describe('Cupons API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await closeTestApp()
  })

  async function createShopping(empresaId: string) {
    return prisma.shopping.create({
      data: { nome: 'Shopping Teste', endereco: 'Rua Teste', cidade: 'SP', estado: 'SP', empresaId },
    })
  }

  async function createCampanha(authHeader: Record<string, string>, shoppingId: string) {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const res = await app.inject({
      method: 'POST',
      url: '/api/cupons/campanhas',
      headers: authHeader,
      payload: {
        nome: 'Campanha Teste',
        descricao: 'Descrição',
        dataInicio: now.toISOString(),
        dataFim: future.toISOString(),
        valorMinimo: 50,
        shoppingId,
      },
    })
    return JSON.parse(res.body)
  }

  async function createVenda(authHeader: Record<string, string>, terminalId: string, empresaId: string, total: number) {
    const produto = await createTestProduto(empresaId, { precoVenda: total, estoqueAtual: 100 })

    const openRes = await app.inject({
      method: 'POST',
      url: '/api/caixa/abrir',
      headers: authHeader,
      payload: { terminalId, valorAbertura: 500 },
    })
    const movimentoId = JSON.parse(openRes.body).id

    const vendaRes = await app.inject({
      method: 'POST',
      url: '/api/vendas',
      headers: authHeader,
      payload: {
        movimentoId,
        itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: total }],
        pagamentos: [{ tipo: 'DINHEIRO', valor: total }],
      },
    })
    return JSON.parse(vendaRes.body).id as string
  }

  // ─── Campanhas ─────────────────────────────────────────

  describe('POST /api/cupons/campanhas', () => {
    it('GERENTE should create a campanha', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const shopping = await createShopping(empresa.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/cupons/campanhas',
        headers: authHeader,
        payload: {
          nome: 'Black Friday',
          dataInicio: new Date().toISOString(),
          dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          valorMinimo: 100,
          shoppingId: shopping.id,
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.nome).toBe('Black Friday')
      expect(body.shopping).toBeDefined()
    })

    it('OPERADORA should be blocked from creating campanhas', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'OPERADORA')

      const res = await app.inject({
        method: 'POST',
        url: '/api/cupons/campanhas',
        headers: authHeader,
        payload: {
          nome: 'X',
          dataInicio: new Date().toISOString(),
          dataFim: new Date().toISOString(),
          valorMinimo: 10,
          shoppingId: '00000000-0000-0000-0000-000000000000',
        },
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/cupons/campanhas', () => {
    it('should list campanhas', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const shopping = await createShopping(empresa.id)
      await createCampanha(authHeader, shopping.id)

      const res = await app.inject({
        method: 'GET',
        url: '/api/cupons/campanhas',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/cupons/campanhas/ativas', () => {
    it('should list active campanhas', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)
      const shopping = await createShopping(empresa.id)

      // Create active campanha directly
      await prisma.campanhaShopping.create({
        data: {
          nome: 'Ativa',
          dataInicio: new Date(Date.now() - 86400000),
          dataFim: new Date(Date.now() + 86400000),
          valorMinimo: 50,
          ativo: true,
          shoppingId: shopping.id,
          empresaId: empresa.id,
        },
      })

      const res = await app.inject({
        method: 'GET',
        url: '/api/cupons/campanhas/ativas',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('PUT /api/cupons/campanhas/:id', () => {
    it('GERENTE should update a campanha', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const shopping = await createShopping(empresa.id)
      const campanha = await createCampanha(authHeader, shopping.id)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/cupons/campanhas/${campanha.id}`,
        headers: authHeader,
        payload: { nome: 'Atualizada' },
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).nome).toBe('Atualizada')
    })
  })

  describe('DELETE /api/cupons/campanhas/:id', () => {
    it('GERENTE should deactivate a campanha', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const shopping = await createShopping(empresa.id)
      const campanha = await createCampanha(authHeader, shopping.id)

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/cupons/campanhas/${campanha.id}`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).message).toContain('desativada')
    })
  })

  // ─── Verificar cupons ──────────────────────────────────

  describe('GET /api/cupons/verificar/:vendaId', () => {
    it('should return eligible campanhas for a venda', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const shopping = await createShopping(empresa.id)

      // Create active campanha with valorMinimo = 50
      await prisma.campanhaShopping.create({
        data: {
          nome: 'Campanha Elegível',
          dataInicio: new Date(Date.now() - 86400000),
          dataFim: new Date(Date.now() + 86400000),
          valorMinimo: 50,
          ativo: true,
          shoppingId: shopping.id,
          empresaId: empresa.id,
        },
      })

      // Create venda with total = 100 (>= 50)
      const vendaId = await createVenda(authHeader, terminal.id, empresa.id, 100)

      const res = await app.inject({
        method: 'GET',
        url: `/api/cupons/verificar/${vendaId}`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
      expect(body[0]).toHaveProperty('qtdCupons')
      expect(body[0].qtdCupons).toBe(2) // 100 / 50 = 2
    })
  })

  // ─── Registrar cupons ─────────────────────────────────

  describe('POST /api/cupons/registrar', () => {
    it('should register cupons for a venda', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const shopping = await createShopping(empresa.id)

      const campanha = await prisma.campanhaShopping.create({
        data: {
          nome: 'Registro',
          dataInicio: new Date(Date.now() - 86400000),
          dataFim: new Date(Date.now() + 86400000),
          valorMinimo: 50,
          ativo: true,
          shoppingId: shopping.id,
          empresaId: empresa.id,
        },
      })

      const vendaId = await createVenda(authHeader, terminal.id, empresa.id, 100)

      const res = await app.inject({
        method: 'POST',
        url: '/api/cupons/registrar',
        headers: authHeader,
        payload: {
          vendaId,
          campanhaId: campanha.id,
          codigos: ['CUP-001', 'CUP-002'],
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body).toHaveLength(2)
    })
  })

  // ─── Listar cupons ────────────────────────────────────

  describe('GET /api/cupons', () => {
    it('should list cupons', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/cupons',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
    })
  })
})
