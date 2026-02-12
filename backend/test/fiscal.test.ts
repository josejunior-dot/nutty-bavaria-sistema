import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createAuthenticatedUser,
  createTestProduto,
} from './helpers/auth-helper.js'
import type { FastifyInstance } from 'fastify'

describe('Fiscal API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await closeTestApp()
  })

  /** Helper: create a venda and return its id */
  async function createVenda(authHeader: Record<string, string>, terminalId: string, empresaId: string) {
    const produto = await createTestProduto(empresaId, { precoVenda: 50, estoqueAtual: 100 })

    // Open caixa
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
        itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 50 }],
        pagamentos: [{ tipo: 'DINHEIRO', valor: 50 }],
      },
    })
    return JSON.parse(vendaRes.body).id as string
  }

  // ─── Emitir nota ───────────────────────────────────────

  describe('POST /api/fiscal', () => {
    it('GERENTE should emit a nota fiscal', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const vendaId = await createVenda(authHeader, terminal.id, empresa.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/fiscal',
        headers: authHeader,
        payload: { vendaId },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.status).toBe('EMITIDA')
      expect(body).toHaveProperty('numero')
      expect(body).toHaveProperty('chave')
      expect(body.chave).toHaveLength(44)
    })

    it('should reject duplicate nota for same venda', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const vendaId = await createVenda(authHeader, terminal.id, empresa.id)

      // Emit first
      await app.inject({
        method: 'POST',
        url: '/api/fiscal',
        headers: authHeader,
        payload: { vendaId },
      })

      // Try again
      const res = await app.inject({
        method: 'POST',
        url: '/api/fiscal',
        headers: authHeader,
        payload: { vendaId },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('Já existe')
    })

    it('OPERADORA should be blocked from fiscal endpoints', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'OPERADORA')

      const res = await app.inject({
        method: 'POST',
        url: '/api/fiscal',
        headers: authHeader,
        payload: { vendaId: '00000000-0000-0000-0000-000000000000' },
      })

      expect(res.statusCode).toBe(403)
    })
  })

  // ─── Listar notas ─────────────────────────────────────

  describe('GET /api/fiscal', () => {
    it('should list notas fiscais', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const vendaId = await createVenda(authHeader, terminal.id, empresa.id)

      await app.inject({
        method: 'POST',
        url: '/api/fiscal',
        headers: authHeader,
        payload: { vendaId },
      })

      const res = await app.inject({
        method: 'GET',
        url: '/api/fiscal?page=1&limit=10',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('data')
      expect(body.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── Get nota by ID ───────────────────────────────────

  describe('GET /api/fiscal/:id', () => {
    it('should return a single nota', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const vendaId = await createVenda(authHeader, terminal.id, empresa.id)

      const emitRes = await app.inject({
        method: 'POST',
        url: '/api/fiscal',
        headers: authHeader,
        payload: { vendaId },
      })
      const notaId = JSON.parse(emitRes.body).id

      const res = await app.inject({
        method: 'GET',
        url: `/api/fiscal/${notaId}`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).id).toBe(notaId)
    })

    it('should return 404 for non-existent nota', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')

      const res = await app.inject({
        method: 'GET',
        url: '/api/fiscal/00000000-0000-0000-0000-000000000000',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ─── Cancelar nota ────────────────────────────────────

  describe('POST /api/fiscal/:id/cancelar', () => {
    it('should cancel an emitted nota', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app, 'GERENTE')
      const vendaId = await createVenda(authHeader, terminal.id, empresa.id)

      const emitRes = await app.inject({
        method: 'POST',
        url: '/api/fiscal',
        headers: authHeader,
        payload: { vendaId },
      })
      const notaId = JSON.parse(emitRes.body).id

      const res = await app.inject({
        method: 'POST',
        url: `/api/fiscal/${notaId}/cancelar`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).status).toBe('CANCELADA')
    })
  })

  // ─── Resumo fiscal ────────────────────────────────────

  describe('GET /api/fiscal/resumo', () => {
    it('should return fiscal summary', async () => {
      const { authHeader } = await createAuthenticatedUser(app, 'GERENTE')

      const res = await app.inject({
        method: 'GET',
        url: '/api/fiscal/resumo',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('emitidas')
      expect(body).toHaveProperty('pendentes')
      expect(body).toHaveProperty('rejeitadas')
    })
  })
})
