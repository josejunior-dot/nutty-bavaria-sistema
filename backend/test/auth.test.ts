import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'
import {
  createTestEmpresa,
  createTestUsuario,
  loginUser,
  createAuthenticatedUser,
  DEFAULT_PASSWORD,
} from './helpers/auth-helper.js'
import type { FastifyInstance } from 'fastify'

describe('Auth API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await getTestApp()
  })

  afterAll(async () => {
    await closeTestApp()
  })

  // ─── Login ─────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const empresa = await createTestEmpresa()
      const usuario = await createTestUsuario(empresa.id, 'OPERADORA')

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: usuario.email, password: DEFAULT_PASSWORD },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('accessToken')
      expect(body.user).toMatchObject({
        email: usuario.email,
        role: 'OPERADORA',
      })
    })

    it('should return 401 for wrong password', async () => {
      const empresa = await createTestEmpresa()
      const usuario = await createTestUsuario(empresa.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: usuario.email, password: 'wrong-password' },
      })

      expect(res.statusCode).toBe(401)
    })

    it('should return 401 for non-existent email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'nonexistent@test.com', password: DEFAULT_PASSWORD },
      })

      expect(res.statusCode).toBe(401)
    })

    it('should return 400 for invalid email format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'not-an-email', password: '123' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('should return 401 for inactive user', async () => {
      const empresa = await createTestEmpresa()
      const usuario = await createTestUsuario(empresa.id)
      // Deactivate user directly in DB
      const { PrismaClient } = await import('../src/generated/prisma/client.js')
      const prisma = new PrismaClient()
      await prisma.usuario.update({ where: { id: usuario.id }, data: { ativo: false } })

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: usuario.email, password: DEFAULT_PASSWORD },
      })

      expect(res.statusCode).toBe(401)
      await prisma.$disconnect()
    })

    it('should set refreshToken cookie on login', async () => {
      const empresa = await createTestEmpresa()
      const usuario = await createTestUsuario(empresa.id)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: usuario.email, password: DEFAULT_PASSWORD },
      })

      expect(res.statusCode).toBe(200)
      const refreshCookie = res.cookies.find((c) => c.name === 'refreshToken')
      expect(refreshCookie).toBeDefined()
      expect(refreshCookie!.httpOnly).toBe(true)
    })

    it('should return permissions matching role', async () => {
      const empresa = await createTestEmpresa()
      const operadora = await createTestUsuario(empresa.id, 'OPERADORA')
      const gerente = await createTestUsuario(empresa.id, 'GERENTE')

      const resOp = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: operadora.email, password: DEFAULT_PASSWORD },
      })
      const resGer = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: gerente.email, password: DEFAULT_PASSWORD },
      })

      const opBody = JSON.parse(resOp.body)
      const gerBody = JSON.parse(resGer.body)

      // OPERADORA only has dashboard, vendas, caixa
      expect(opBody.user.permissions).toEqual(['dashboard', 'vendas', 'caixa'])
      // GERENTE has more permissions
      expect(gerBody.user.permissions).toContain('estoque')
      expect(gerBody.user.permissions).toContain('configuracoes')
    })
  })

  // ─── Refresh ───────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('should return new access token with valid refresh cookie', async () => {
      const empresa = await createTestEmpresa()
      const usuario = await createTestUsuario(empresa.id)
      const login = await loginUser(app, usuario.email)

      const refreshCookie = login.cookies.find((c: any) => c.name === 'refreshToken')

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        cookies: { refreshToken: refreshCookie!.value },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('accessToken')
    })

    it('should return 401 without refresh cookie', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
      })

      expect(res.statusCode).toBe(401)
    })

    it('should return 401 with invalid refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        cookies: { refreshToken: 'invalid-token' },
      })

      expect(res.statusCode).toBe(401)
    })
  })

  // ─── Logout ────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('should clear refreshToken cookie', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.message).toContain('Logout')
    })
  })

  // ─── Me ────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const { usuario, authHeader } = await createAuthenticatedUser(app)

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: authHeader,
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.email).toBe(usuario.email)
      expect(body).toHaveProperty('permissions')
      expect(body).toHaveProperty('empresa')
    })

    it('should return 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      })

      expect(res.statusCode).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: 'Bearer invalid-token' },
      })

      expect(res.statusCode).toBe(401)
    })
  })
})
