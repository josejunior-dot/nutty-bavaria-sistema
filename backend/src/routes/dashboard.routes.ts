import type { FastifyInstance } from 'fastify'
import { getKpisHandler, getVendasChartHandler } from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/kpis', { preHandler: [authenticate] }, getKpisHandler)
  app.get('/chart', { preHandler: [authenticate] }, getVendasChartHandler)
}
