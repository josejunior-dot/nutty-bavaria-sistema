import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { healthRoutes } from './routes/health.routes.js'
import { authRoutes } from './routes/auth.routes.js'
import { dashboardRoutes } from './routes/dashboard.routes.js'
import { caixaRoutes } from './routes/caixa.routes.js'
import { vendasRoutes } from './routes/vendas.routes.js'
import { cuponsRoutes } from './routes/cupons.routes.js'
import { produtosRoutes } from './routes/produtos.routes.js'
import { estoqueRoutes } from './routes/estoque.routes.js'
import { fiscalRoutes } from './routes/fiscal.routes.js'
import { configuracoesRoutes } from './routes/configuracoes.routes.js'
import { relatoriosRoutes } from './routes/relatorios.routes.js'
import { sugestaoCompraRoutes } from './routes/sugestao-compra.routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  })

  // Plugins
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003']

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  })

  await app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'cookie-secret',
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    },
  })

  // Routes
  await app.register(healthRoutes, { prefix: '/api' })
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' })
  await app.register(caixaRoutes, { prefix: '/api/caixa' })
  await app.register(vendasRoutes, { prefix: '/api/vendas' })
  await app.register(cuponsRoutes, { prefix: '/api/cupons' })
  await app.register(produtosRoutes, { prefix: '/api/produtos' })
  await app.register(estoqueRoutes, { prefix: '/api/estoque' })
  await app.register(fiscalRoutes, { prefix: '/api/fiscal' })
  await app.register(configuracoesRoutes, { prefix: '/api/configuracoes' })
  await app.register(relatoriosRoutes, { prefix: '/api/relatorios' })
  await app.register(sugestaoCompraRoutes, { prefix: '/api/sugestao-compra' })

  return app
}
