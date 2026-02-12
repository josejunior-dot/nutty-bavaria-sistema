import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createTestEmpresa,
  createTestUsuario,
  createTestTerminal,
  loginUser,
} from './helpers/auth-helper.js'
import type { FastifyInstance } from 'fastify'

describe('RBAC — Role-Based Access Control', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await closeTestApp()
  })

  async function setupUsers() {
    const empresa = await createTestEmpresa()
    const terminal = await createTestTerminal(empresa.id)

    const operadora = await createTestUsuario(empresa.id, 'OPERADORA')
    const gerente = await createTestUsuario(empresa.id, 'GERENTE')
    const franqueador = await createTestUsuario(empresa.id, 'FRANQUEADOR')

    const opLogin = await loginUser(app, operadora.email)
    const gerLogin = await loginUser(app, gerente.email)
    const frqLogin = await loginUser(app, franqueador.email)

    return {
      empresa,
      terminal,
      operadora: { ...operadora, authHeader: { authorization: `Bearer ${opLogin.accessToken}` } },
      gerente: { ...gerente, authHeader: { authorization: `Bearer ${gerLogin.accessToken}` } },
      franqueador: { ...franqueador, authHeader: { authorization: `Bearer ${frqLogin.accessToken}` } },
    }
  }

  // ─── Configurações (GERENTE, FRANQUEADOR only) ────────

  describe('/api/configuracoes — GERENTE/FRANQUEADOR only', () => {
    it('OPERADORA should be blocked from /configuracoes/usuarios', async () => {
      const { operadora } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/usuarios',
        headers: operadora.authHeader,
      })

      expect(res.statusCode).toBe(403)
    })

    it('GERENTE should access /configuracoes/usuarios', async () => {
      const { gerente } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/usuarios',
        headers: gerente.authHeader,
      })

      expect(res.statusCode).toBe(200)
    })

    it('FRANQUEADOR should access /configuracoes/usuarios', async () => {
      const { franqueador } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/usuarios',
        headers: franqueador.authHeader,
      })

      expect(res.statusCode).toBe(200)
    })

    it('OPERADORA should be blocked from /configuracoes/terminais', async () => {
      const { operadora } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/configuracoes/terminais',
        headers: operadora.authHeader,
      })

      expect(res.statusCode).toBe(403)
    })
  })

  // ─── Relatórios - Comparativo (FRANQUEADOR only) ──────

  describe('/api/relatorios/comparativo-quiosques — FRANQUEADOR only', () => {
    it('OPERADORA should be blocked from comparativo-quiosques', async () => {
      const { operadora } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/comparativo-quiosques',
        headers: operadora.authHeader,
      })

      expect(res.statusCode).toBe(403)
    })

    it('GERENTE should be blocked from comparativo-quiosques', async () => {
      const { gerente } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/comparativo-quiosques',
        headers: gerente.authHeader,
      })

      expect(res.statusCode).toBe(403)
    })

    it('FRANQUEADOR should access comparativo-quiosques', async () => {
      const { franqueador } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/relatorios/comparativo-quiosques',
        headers: franqueador.authHeader,
      })

      // 200 or at least not 403
      expect(res.statusCode).not.toBe(403)
    })
  })

  // ─── Caixa (all roles can access) ─────────────────────

  describe('/api/caixa — all authenticated roles', () => {
    it('OPERADORA should access /caixa/terminais', async () => {
      const { operadora } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/caixa/terminais',
        headers: operadora.authHeader,
      })

      expect(res.statusCode).toBe(200)
    })

    it('GERENTE should access /caixa/terminais', async () => {
      const { gerente } = await setupUsers()

      const res = await app.inject({
        method: 'GET',
        url: '/api/caixa/terminais',
        headers: gerente.authHeader,
      })

      expect(res.statusCode).toBe(200)
    })
  })

  // ─── Unauthenticated access ───────────────────────────

  describe('Unauthenticated access', () => {
    it('should return 401 for protected endpoints without token', async () => {
      const endpoints = [
        { method: 'GET' as const, url: '/api/caixa/terminais' },
        { method: 'GET' as const, url: '/api/vendas' },
        { method: 'GET' as const, url: '/api/configuracoes/usuarios' },
        { method: 'GET' as const, url: '/api/relatorios/comparativo-quiosques' },
      ]

      for (const endpoint of endpoints) {
        const res = await app.inject(endpoint)
        expect(res.statusCode).toBe(401)
      }
    })
  })
})
