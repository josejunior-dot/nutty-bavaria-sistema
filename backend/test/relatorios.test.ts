import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createAuthenticatedUser,
  createTestProduto,
} from './helpers/auth-helper.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import type { FastifyInstance } from 'fastify'

const prisma = new PrismaClient()

describe('Relatórios API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await closeTestApp()
  })

  /** Helper: create a venda to populate reports */
  async function createVendaForReport(authHeader: Record<string, string>, terminalId: string, empresaId: string) {
    const produto = await createTestProduto(empresaId, { precoVenda: 50, estoqueAtual: 500 })

    const openRes = await app.inject({
      method: 'POST',
      url: '/api/caixa/abrir',
      headers: authHeader,
      payload: { terminalId, valorAbertura: 100 },
    })
    const movimentoId = JSON.parse(openRes.body).id

    await app.inject({
      method: 'POST',
      url: '/api/vendas',
      headers: authHeader,
      payload: {
        movimentoId,
        itens: [{ produtoId: produto.id, quantidade: 3, precoUnitario: 50 }],
        pagamentos: [{ tipo: 'DINHEIRO', valor: 150 }],
      },
    })
  }

  // ─── Curva ABC ─────────────────────────────────────────

  describe('GET /api/relatorios/curva-abc', () => {
    it('should return curva ABC data', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      await createVendaForReport(authHeader, terminal.id, empresa.id)

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/curva-abc',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
      expect(body[0]).toHaveProperty('produtoId')
      expect(body[0]).toHaveProperty('totalVendido')
      expect(body[0]).toHaveProperty('classificacao')
    })

    it('should return empty array when no vendas', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/curva-abc',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual([])
    })
  })

  // ─── Vendas por período ────────────────────────────────

  describe('GET /api/relatorios/vendas-periodo', () => {
    it('should return vendas grouped by day', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      await createVendaForReport(authHeader, terminal.id, empresa.id)

      const inicio = new Date()
      inicio.setHours(0, 0, 0, 0)
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)

      const res = await app.inject({
        method: 'GET',
        url: `/api/relatorios/vendas-periodo?dataInicio=${inicio.toISOString()}&dataFim=${fim.toISOString()}&agrupamento=dia`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
    })

    it('should return 400 without date params', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/vendas-periodo',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(400)
    })
  })

  // ─── Ranking vendedores ────────────────────────────────

  describe('GET /api/relatorios/ranking-vendedores', () => {
    it('should return ranking of vendedores', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      await createVendaForReport(authHeader, terminal.id, empresa.id)

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/ranking-vendedores',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
      expect(body[0]).toHaveProperty('usuarioId')
      expect(body[0]).toHaveProperty('totalVendas')
    })
  })

  // ─── Comparativo quiosques (FRANQUEADOR only) ──────────

  describe('GET /api/relatorios/comparativo-quiosques', () => {
    it('FRANQUEADOR should access comparativo', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'FRANQUEADOR')

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/comparativo-quiosques',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
    })
  })

  // ─── Comissões ─────────────────────────────────────────

  describe('GET /api/relatorios/comissoes', () => {
    it('should return commission report', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/comissoes',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
    })
  })

  // ─── Cupons report ────────────────────────────────────

  describe('GET /api/relatorios/cupons', () => {
    it('should return cupons report', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/cupons',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
    })
  })
})
