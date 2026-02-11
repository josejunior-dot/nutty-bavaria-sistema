import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  const navigate = useNavigate()
  const { token, user } = useAuthStore()

  useEffect(() => {
    if (!token || !user) {
      navigate('/login')
    }
  }, [token, user, navigate])

  if (!token || !user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <Outlet />
      </div>
    </div>
  )
}
