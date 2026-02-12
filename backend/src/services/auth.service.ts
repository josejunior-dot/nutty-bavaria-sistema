import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import type { Role } from '../generated/prisma/client.js'

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.usuario.findUnique({
    where: { email },
    include: { empresa: true },
  })

  if (!user || !user.ativo) {
    return null
  }

  const validPassword = await bcrypt.compare(password, user.senha)
  if (!validPassword) {
    return null
  }

  return user
}

export function buildJwtPayload(user: { id: string; email: string; role: Role; empresaId: string }) {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    empresaId: user.empresaId,
  }
}
