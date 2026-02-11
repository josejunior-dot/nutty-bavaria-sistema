import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { validateCredentials, buildJwtPayload } from '../services/auth.service.js'
import { prisma } from '../lib/prisma.js'
import { getPermissions } from '../middleware/rbac.middleware.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send({ message: 'Dados inválidos', errors: parsed.error.flatten() })
  }

  const { email, password } = parsed.data
  const user = await validateCredentials(email, password)

  if (!user) {
    return reply.status(401).send({ message: 'Email ou senha inválidos' })
  }

  const payload = buildJwtPayload(user)
  const accessToken = request.server.jwt.sign(payload)

  const refreshToken = request.server.jwt.sign(payload, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })

  reply.setCookie('refreshToken', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  return reply.send({
    accessToken,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      empresaId: user.empresaId,
      empresa: {
        id: user.empresa.id,
        nome: user.empresa.nome,
      },
      permissions: getPermissions(user.role),
    },
  })
}

export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies.refreshToken
  if (!token) {
    return reply.status(401).send({ message: 'Refresh token não encontrado' })
  }

  try {
    const decoded = request.server.jwt.verify<{
      sub: string
      email: string
      role: string
      empresaId: string
    }>(token)

    const user = await prisma.usuario.findUnique({
      where: { id: decoded.sub },
      include: { empresa: true },
    })

    if (!user || !user.ativo) {
      return reply.status(401).send({ message: 'Usuário inválido' })
    }

    const payload = buildJwtPayload(user)
    const accessToken = request.server.jwt.sign(payload)

    const refreshToken = request.server.jwt.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    })

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    })

    return reply.send({ accessToken })
  } catch {
    return reply.status(401).send({ message: 'Refresh token inválido' })
  }
}

export async function logoutHandler(_request: FastifyRequest, reply: FastifyReply) {
  reply.clearCookie('refreshToken', { path: '/' })
  return reply.send({ message: 'Logout realizado com sucesso' })
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await prisma.usuario.findUnique({
    where: { id: request.user.sub },
    include: { empresa: true },
  })

  if (!user) {
    return reply.status(404).send({ message: 'Usuário não encontrado' })
  }

  return reply.send({
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    empresaId: user.empresaId,
    empresa: {
      id: user.empresa.id,
      nome: user.empresa.nome,
    },
    permissions: getPermissions(user.role),
  })
}
