import type { FastifyInstance } from 'fastify'
import { loginHandler, refreshHandler, logoutHandler, meHandler } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', loginHandler)
  app.post('/refresh', refreshHandler)
  app.post('/logout', logoutHandler)
  app.get('/me', { preHandler: [authenticate] }, meHandler)
}
