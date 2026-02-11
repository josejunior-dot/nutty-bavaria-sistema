import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Role } from '../generated/prisma/client.js'

export interface JwtPayload {
  sub: string
  email: string
  role: Role
  empresaId: string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({ message: 'Token inválido ou expirado' })
  }
}

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply)
    if (reply.sent) return

    const user = request.user
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ message: 'Sem permissão para acessar este recurso' })
    }
  }
}
