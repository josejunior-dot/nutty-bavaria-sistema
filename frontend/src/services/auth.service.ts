import { api } from './api'
import type { LoginResponse, User } from '@/types'

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function meRequest(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}
