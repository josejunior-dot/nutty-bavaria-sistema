import { useNavigate } from 'react-router-dom'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { logoutRequest } from '@/services/auth.service'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const roleLabels: Record<string, string> = {
  OPERADORA: 'Operadora',
  GERENTE: 'Gerente',
  FRANQUEADOR: 'Franqueador',
}

export function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const initials = user?.nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? ''

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch {
      // ignore
    }
    logout()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
      <div>
        <h2 className="text-sm font-medium text-foreground">
          {user?.empresa.nome}
        </h2>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 outline-none cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.nome}</p>
            <p className="text-xs text-muted-foreground">{roleLabels[user?.role ?? '']}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">{user?.nome}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
