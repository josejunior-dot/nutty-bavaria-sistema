import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createAuthenticatedUser,
  createTestTerminal,
} from './helpers/auth-helper.js'
import type { FastifyInstance } from 'fastify'

describe('Caixa API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await closeTestApp()
  })

  // ─── Terminais ─────────────────────────────────────────

  describe('GET /api/caixa/terminais', () => {
    it('should list terminals for the authenticated user empresa', async () => {
      const { authHeader, empresa } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/caixa/terminais',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
      expect(body[0].empresaId).toBe(empresa.id)
    })
  })

  // ─── Abrir Caixa ──────────────────────────────────────

  describe('POST /api/caixa/abrir', () => {
    it('should open a new caixa', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 100 },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.status).toBe('ABERTO')
      expect(Number(body.valorAbertura)).toBe(100)
      expect(body.operacoes).toHaveLength(1)
      expect(body.operacoes[0].tipo).toBe('ABERTURA')
    })

    it('should reject opening a second caixa on same terminal', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      // Open first
      await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 100 },
      })

      // Try to open second
      const res = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 50 },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.body)
      expect(body.message).toContain('aberto')
    })

    it('should allow opening caixa on a different terminal', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)

      // Open on first terminal
      await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 100 },
      })

      // Create second terminal and open
      const terminal2 = await createTestTerminal(empresa.id, 'Terminal 2')
      const res = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal2.id, valorAbertura: 200 },
      })

      expect(res.statusCode).toBe(201)
    })

    it('should reject invalid body', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { valorAbertura: -10 },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  // ─── Sangria & Suprimento ─────────────────────────────

  describe('POST /api/caixa/:id/sangria', () => {
    it('should register a sangria operation', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      // Open caixa
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 500 },
      })
      const movimentoId = JSON.parse(openRes.body).id

      // Sangria
      const res = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/sangria`,
        headers: authHeader,
        payload: { valor: 100, observacao: 'Retirada para cofre' },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.tipo).toBe('SANGRIA')
      expect(Number(body.valor)).toBe(100)
    })

    it('should reject sangria on closed caixa', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      // Open and close caixa
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 500 },
      })
      const movimentoId = JSON.parse(openRes.body).id

      await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/fechar`,
        headers: authHeader,
        payload: { valorFechamento: 500 },
      })

      // Try sangria
      const res = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/sangria`,
        headers: authHeader,
        payload: { valor: 100, observacao: 'Tentativa' },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('fechado')
    })
  })

  describe('POST /api/caixa/:id/suprimento', () => {
    it('should register a suprimento operation', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      const openRes = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 200 },
      })
      const movimentoId = JSON.parse(openRes.body).id

      const res = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/suprimento`,
        headers: authHeader,
        payload: { valor: 300, observacao: 'Troco adicional' },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.tipo).toBe('SUPRIMENTO')
      expect(Number(body.valor)).toBe(300)
    })
  })

  // ─── Fechar Caixa ─────────────────────────────────────

  describe('POST /api/caixa/:id/fechar', () => {
    it('should close an open caixa', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      const openRes = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 100 },
      })
      const movimentoId = JSON.parse(openRes.body).id

      const res = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/fechar`,
        headers: authHeader,
        payload: { valorFechamento: 150 },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.status).toBe('FECHADO')
      expect(Number(body.valorFechamento)).toBe(150)
    })

    it('should reject closing an already closed caixa', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      const openRes = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 100 },
      })
      const movimentoId = JSON.parse(openRes.body).id

      // Close first time
      await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/fechar`,
        headers: authHeader,
        payload: { valorFechamento: 100 },
      })

      // Try to close again
      const res = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/fechar`,
        headers: authHeader,
        payload: { valorFechamento: 100 },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('fechado')
    })
  })

  // ─── Resumo ────────────────────────────────────────────

  describe('GET /api/caixa/:id/resumo', () => {
    it('should return resumo with correct saldo calculation', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      // Open caixa with 500
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 500 },
      })
      const movimentoId = JSON.parse(openRes.body).id

      // Sangria: -100
      await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/sangria`,
        headers: authHeader,
        payload: { valor: 100, observacao: 'Sangria' },
      })

      // Suprimento: +200
      await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/suprimento`,
        headers: authHeader,
        payload: { valor: 200, observacao: 'Suprimento' },
      })

      const res = await app.inject({
        method: 'GET',
        url: `/api/caixa/${movimentoId}/resumo`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      // saldo = 500 (abertura) + 0 (vendas) + 200 (suprimento) - 100 (sangria) = 600
      expect(body.saldo).toBe(600)
      expect(body.totalSangrias).toBe(100)
      expect(body.totalSuprimentos).toBe(200)
      expect(body.totalVendas).toBe(0)
    })
  })

  // ─── Lifecycle completo ────────────────────────────────

  describe('Caixa Lifecycle', () => {
    it('should complete full lifecycle: abrir → sangria → suprimento → fechar', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      // 1. Abrir
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 1000 },
      })
      expect(openRes.statusCode).toBe(201)
      const movimentoId = JSON.parse(openRes.body).id

      // 2. Sangria
      const sangriaRes = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/sangria`,
        headers: authHeader,
        payload: { valor: 200, observacao: 'Sangria' },
      })
      expect(sangriaRes.statusCode).toBe(201)

      // 3. Suprimento
      const supRes = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/suprimento`,
        headers: authHeader,
        payload: { valor: 300, observacao: 'Suprimento' },
      })
      expect(supRes.statusCode).toBe(201)

      // 4. Check resumo
      const resumoRes = await app.inject({
        method: 'GET',
        url: `/api/caixa/${movimentoId}/resumo`,
        headers: authHeader,
      })
      const resumo = JSON.parse(resumoRes.body)
      // saldo = 1000 + 0 (vendas) + 300 - 200 = 1100
      expect(resumo.saldo).toBe(1100)

      // 5. Fechar
      const closeRes = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/fechar`,
        headers: authHeader,
        payload: { valorFechamento: 1100 },
      })
      expect(closeRes.statusCode).toBe(200)
      expect(JSON.parse(closeRes.body).status).toBe('FECHADO')

      // 6. Verify can't operate on closed caixa
      const postCloseRes = await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/sangria`,
        headers: authHeader,
        payload: { valor: 50, observacao: 'Post-close' },
      })
      expect(postCloseRes.statusCode).toBe(400)
    })
  })

  // ─── Listagem ──────────────────────────────────────────

  describe('GET /api/caixa', () => {
    it('should list movimentos with pagination', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)

      // Create a caixa
      await app.inject({
        method: 'POST',
        url: '/api/caixa/abrir',
        headers: authHeader,
        payload: { terminalId: terminal.id, valorAbertura: 100 },
      })

      const res = await app.inject({
        method: 'GET',
        url: '/api/caixa?page=1&limit=10',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('page')
      expect(body.data.length).toBeGreaterThanOrEqual(1)
    })
  })
})
