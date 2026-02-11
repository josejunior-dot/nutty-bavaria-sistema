import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Vendas from '@/pages/Vendas'
import Caixa from '@/pages/Caixa'
import Produtos from '@/pages/Produtos'
import Estoque from '@/pages/Estoque'
import Fiscal from '@/pages/Fiscal'
import Shopping from '@/pages/Shopping'
import Configuracoes from '@/pages/Configuracoes'
import Relatorios from '@/pages/Relatorios'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/caixa" element={<Caixa />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/fiscal" element={<Fiscal />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
