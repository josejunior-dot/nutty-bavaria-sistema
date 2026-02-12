import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createAuthenticatedUser,
  createTestProduto,
} from './helpers/auth-helper.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import type { FastifyInstance } from 'fastify'

const prisma = new PrismaClient()

describe('Vendas API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await closeTestApp()
  })

  /** Helper: open a caixa and return movimentoId */
  async function openCaixa(authHeader: Record<string, string>, terminalId: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/caixa/abrir',
      headers: authHeader,
      payload: { terminalId, valorAbertura: 1000 },
    })
    return JSON.parse(res.body).id as string
  }

  // ─── Criar Venda ──────────────────────────────────────

  describe('POST /api/vendas', () => {
    it('should create a venda successfully', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { precoVenda: 25.9, estoqueAtual: 100 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 2, precoUnitario: 25.9 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 51.8 }],
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.status).toBe('CONCLUIDA')
      expect(Number(body.total)).toBeCloseTo(51.8)
      expect(body.itens).toHaveLength(1)
      expect(body.pagamentos).toHaveLength(1)
    })

    it('should decrement stock after venda', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 50 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 3, precoUnitario: 25.9 }],
          pagamentos: [{ tipo: 'PIX', valor: 77.7 }],
        },
      })

      const updated = await prisma.produto.findUnique({ where: { id: produto.id } })
      expect(Number(updated!.estoqueAtual)).toBe(47)
    })

    it('should support multiple items and payment methods', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const p1 = await createTestProduto(empresa.id, { precoVenda: 10 })
      const p2 = await createTestProduto(empresa.id, { precoVenda: 20 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [
            { produtoId: p1.id, quantidade: 2, precoUnitario: 10 },
            { produtoId: p2.id, quantidade: 1, precoUnitario: 20 },
          ],
          pagamentos: [
            { tipo: 'DINHEIRO', valor: 20 },
            { tipo: 'PIX', valor: 20 },
          ],
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(Number(body.total)).toBe(40)
      expect(body.itens).toHaveLength(2)
      expect(body.pagamentos).toHaveLength(2)
    })

    it('should apply discount correctly', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { precoVenda: 100 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 100 }],
          pagamentos: [{ tipo: 'CREDITO', valor: 90 }],
          desconto: 10,
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(Number(body.subtotal)).toBe(100)
      expect(Number(body.desconto)).toBe(10)
      expect(Number(body.total)).toBe(90)
    })

    it('should reject venda with insufficient payment', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { precoVenda: 50 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 50 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 10 }],
        },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('insuficiente')
    })

    it('should reject venda when caixa is closed', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id)
      const movimentoId = await openCaixa(authHeader, terminal.id)

      // Close the caixa
      await app.inject({
        method: 'POST',
        url: `/api/caixa/${movimentoId}/fechar`,
        headers: authHeader,
        payload: { valorFechamento: 1000 },
      })

      const res = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 25.9 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 25.9 }],
        },
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('aberto')
    })

    it('should reject venda with empty itens', async () => {
      const { authHeader, terminal } = await createAuthenticatedUser(app)
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 10 }],
        },
      })

      expect(res.statusCode).toBe(400)
    })

    it('should auto-increment venda numero within empresa', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { precoVenda: 10 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const res1 = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 10 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 10 }],
        },
      })
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 10 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 10 }],
        },
      })

      const n1 = JSON.parse(res1.body).numero
      const n2 = JSON.parse(res2.body).numero
      expect(n2).toBe(n1 + 1)
    })
  })

  // ─── Cancelar Venda ───────────────────────────────────

  describe('POST /api/vendas/:id/cancelar', () => {
    it('should cancel a venda', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 100 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const createRes = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 5, precoUnitario: 10 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 50 }],
        },
      })
      const vendaId = JSON.parse(createRes.body).id

      const res = await app.inject({
        method: 'POST',
        url: `/api/vendas/${vendaId}/cancelar`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).status).toBe('CANCELADA')
    })

    it('should restore stock after cancellation', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 100 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      // Create venda (decrement 10)
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 10, precoUnitario: 10 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 100 }],
        },
      })
      const vendaId = JSON.parse(createRes.body).id

      // Verify stock decremented
      let updated = await prisma.produto.findUnique({ where: { id: produto.id } })
      expect(Number(updated!.estoqueAtual)).toBe(90)

      // Cancel venda
      await app.inject({
        method: 'POST',
        url: `/api/vendas/${vendaId}/cancelar`,
        headers: authHeader,
      })

      // Verify stock restored
      updated = await prisma.produto.findUnique({ where: { id: produto.id } })
      expect(Number(updated!.estoqueAtual)).toBe(100)
    })

    it('should reject cancelling an already cancelled venda', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id)
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const createRes = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 10 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 10 }],
        },
      })
      const vendaId = JSON.parse(createRes.body).id

      // Cancel first time
      await app.inject({
        method: 'POST',
        url: `/api/vendas/${vendaId}/cancelar`,
        headers: authHeader,
      })

      // Try to cancel again
      const res = await app.inject({
        method: 'POST',
        url: `/api/vendas/${vendaId}/cancelar`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).message).toContain('cancelada')
    })
  })

  // ─── Listar Vendas ────────────────────────────────────

  describe('GET /api/vendas', () => {
    it('should list vendas with pagination', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { precoVenda: 10 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      // Create 2 vendas
      for (let i = 0; i < 2; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/vendas',
          headers: authHeader,
          payload: {
            movimentoId,
            itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 10 }],
            pagamentos: [{ tipo: 'DINHEIRO', valor: 10 }],
          },
        })
      }

      const res = await app.inject({
        method: 'GET',
        url: '/api/vendas?page=1&limit=10',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
    })
  })

  // ─── Get Venda by ID ──────────────────────────────────

  describe('GET /api/vendas/:id', () => {
    it('should return a single venda by id', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { precoVenda: 10 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      const createRes = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 1, precoUnitario: 10 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 10 }],
        },
      })
      const vendaId = JSON.parse(createRes.body).id

      const res = await app.inject({
        method: 'GET',
        url: `/api/vendas/${vendaId}`,
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.id).toBe(vendaId)
      expect(body.itens).toHaveLength(1)
    })

    it('should return 404 for non-existent venda', async () => {
      const { authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/vendas/00000000-0000-0000-0000-000000000000',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ─── Vendas Lifecycle ─────────────────────────────────

  describe('Vendas Lifecycle', () => {
    it('should complete: create venda → decrement stock → cancel → restore stock', async () => {
      const { authHeader, terminal, empresa } = await createAuthenticatedUser(app)
      const produto = await createTestProduto(empresa.id, { estoqueAtual: 200 })
      const movimentoId = await openCaixa(authHeader, terminal.id)

      // 1. Create venda
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/vendas',
        headers: authHeader,
        payload: {
          movimentoId,
          itens: [{ produtoId: produto.id, quantidade: 20, precoUnitario: 10 }],
          pagamentos: [{ tipo: 'DINHEIRO', valor: 200 }],
        },
      })
      expect(createRes.statusCode).toBe(201)
      const vendaId = JSON.parse(createRes.body).id

      // 2. Verify stock decremented
      let prod = await prisma.produto.findUnique({ where: { id: produto.id } })
      expect(Number(prod!.estoqueAtual)).toBe(180)

      // 3. Cancel venda
      const cancelRes = await app.inject({
        method: 'POST',
        url: `/api/vendas/${vendaId}/cancelar`,
        headers: authHeader,
      })
      expect(cancelRes.statusCode).toBe(200)

      // 4. Verify stock restored
      prod = await prisma.produto.findUnique({ where: { id: produto.id } })
      expect(Number(prod!.estoqueAtual)).toBe(200)
    })
  })
})
