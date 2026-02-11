import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Package,
  Tag,
  FileText,
  Building2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useSidebarStore } from '@/stores/sidebar.store'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import type { Module } from '@/types'

const menuItems: { label: string; icon: React.ReactNode; path: string; module: Module }[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
  { label: 'Vendas', icon: <ShoppingCart size={20} />, path: '/vendas', module: 'vendas' },
  { label: 'Caixa', icon: <Wallet size={20} />, path: '/caixa', module: 'caixa' },
  { label: 'Produtos', icon: <Tag size={20} />, path: '/produtos', module: 'estoque' },
  { label: 'Estoque', icon: <Package size={20} />, path: '/estoque', module: 'estoque' },
  { label: 'Fiscal', icon: <FileText size={20} />, path: '/fiscal', module: 'fiscal' },
  { label: 'Shopping', icon: <Building2 size={20} />, path: '/shopping', module: 'shopping' },
  { label: 'Relatórios', icon: <BarChart3 size={20} />, path: '/relatorios', module: 'relatorios' },
]

export function Sidebar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { collapsed, toggle } = useSidebarStore()

  const filteredItems = menuItems.filter(
    (item) => user?.permissions.includes(item.module)
  )

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
            NB
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm text-foreground truncate">
              Nutty Bavaria
            </span>
          )}
        </div>

        <Separator />

        {/* Menu */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path
            const link = (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return link
          })}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-2 space-y-1">
          {user?.permissions.includes('configuracoes') && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/configuracoes"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === '/configuracoes'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Settings size={20} className="shrink-0" />
                  {!collapsed && <span>Configurações</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Configurações</TooltipContent>}
            </Tooltip>
          )}

          {/* Collapse toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
