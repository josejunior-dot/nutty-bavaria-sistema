import type { ReactNode } from 'react'

interface PageWrapperProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}

export function PageWrapper({ title, subtitle, children, actions }: PageWrapperProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
