import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createAuthenticatedUser,
  createTestProduto,
} from './helpers/auth-helper.js'
import type { FastifyInstance } from 'fastify'

describe('Dashboard API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await closeTestApp()
  })

  describe('GET /api/dashboard/kpis', () => {
    it('should return KPIs structure', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/dashboard/kpis',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('vendasHoje')
      expect(body).toHaveProperty('vendasOntem')
      expect(body).toHaveProperty('ticketMedio')
      expect(body).toHaveProperty('qtdVendas')
      expect(body).toHaveProperty('produtosBaixoEstoque')
    })

    it('should reflect vendas made today', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { precoVenda: 50, estoqueAtual: 100 })

      // Open caixa and make a venda
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 100 },
      })
      const movimentoId = JSON.parse(openRes.body).id

      await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 2, precoUnitario: 50 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 100 }],
        },
      })

      const res = await app.inject({
        method: 'GET',
        url: '/api/dashboard/kpis',
        headers: authHeader,
      })

      const body = JSON.parse(res.body)
      expect(body.vendasHoje).toBe(100)
      expect(body.qtdVendas).toBe(1)
      expect(body.ticketMedio).toBe(100)
    })

    it('should return 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/dashboard/kpis' })
      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET /api/dashboard/chart', () => {
    it('should return chart data', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/dashboard/chart?dias=7',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
    })

    it('should default to 7 days', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/dashboard/chart',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
    })
  })
})
