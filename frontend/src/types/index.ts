// ─── Auth & RBAC ─────────────────────────────────────────

export type Role = 'OPERADORA' | 'GERENTE' | 'FRANQUEADOR'

export type Module = 'dashboard' | 'vendas' | 'caixa' | 'estoque' | 'fiscal' | 'shopping' | 'configuracoes' | 'relatorios'

export interface User {
  id: string
  nome: string
  email: string
  role: Role
  empresaId: string
  empresa: {
    id: string
    nome: string
  }
  permissions: Module[]
}

export interface MenuItem {
  label: string
  icon: string
  path: string
  module: Module
}

export interface LoginResponse {
  accessToken: string
  user: User
}

// ─── Paginação ───────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

// ─── Dashboard ───────────────────────────────────────────

export interface DashboardKpi {
  vendasHoje: number
  vendasOntem: number
  ticketMedio: number
  ticketMedioOntem: number
  qtdVendas: number
  qtdVendasOntem: number
  produtosBaixoEstoque: number
}

export interface VendasChart {
  data: string
  total: number
}

// ─── Caixa ───────────────────────────────────────────────

export type StatusMovimento = 'ABERTO' | 'FECHADO'
export type TipoOperacao = 'ABERTURA' | 'SANGRIA' | 'SUPRIMENTO' | 'FECHAMENTO'

export interface Movimento {
  id: string
  status: StatusMovimento
  valorAbertura: number
  valorFechamento: number | null
  dataAbertura: string
  dataFechamento: string | null
  observacao: string | null
  empresaId: string
  usuarioId: string
  terminalId: string
  usuario: { id: string; nome: string }
  terminal: { id: string; nome: string; codigo: string }
  operacoes: MovimentoOperacao[]
  _count?: { vendas: number }
}

export interface MovimentoOperacao {
  id: string
  tipo: TipoOperacao
  valor: number
  observacao: string | null
  createdAt: string
}

export interface MovimentoResumo {
  totalVendas: number
  totalSangrias: number
  totalSuprimentos: number
  totalTrocas: number
  saldo: number
}

// ─── Vendas ──────────────────────────────────────────────

export type StatusVenda = 'CONCLUIDA' | 'CANCELADA'
export type TipoPagamento = 'DINHEIRO' | 'CREDITO' | 'DEBITO' | 'PIX' | 'VOUCHER'

export interface Produto {
  id: string
  nome: string
  codigo: string
  unidade: string
  precoVenda: number
  precoCusto: number | null
  estoqueAtual: number
  estoqueMinimo: number | null
  leadTimeDias: number | null
  loteMinimo: number | null
  coberturaDias: number | null
  fornecedorPadraoId: string | null
  ativo: boolean
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface Venda {
  id: string
  numero: number
  status: StatusVenda
  subtotal: number
  desconto: number
  total: number
  empresaId: string
  usuarioId: string
  terminalId: string
  movimentoId: string
  clienteId: string | null
  createdAt: string
  usuario: { id: string; nome: string }
  itens: VendaItem[]
  pagamentos: VendaPagamento[]
  cupons?: CupomShopping[]
}

export interface VendaItem {
  id: string
  produtoId: string
  quantidade: number
  precoUnitario: number
  subtotal: number
  produto: { id: string; nome: string; codigo: string }
}

export interface VendaPagamento {
  id: string
  tipo: TipoPagamento
  valor: number
}

// ─── Carrinho (local, não persiste no backend) ───────────

export interface CarrinhoItem {
  produtoId: string
  nome: string
  codigo: string
  precoUnitario: number
  quantidade: number
  subtotal: number
}

// ─── Estoque ─────────────────────────────────────────────

export interface EntradaEstoque {
  id: string
  numeroNota: string | null
  observacao: string | null
  empresaId: string
  fornecedorId: string | null
  createdAt: string
  fornecedor: { id: string; nome: string } | null
  itens: EntradaItem[]
}

export interface EntradaItem {
  id: string
  quantidade: number
  precoUnitario: number
  produtoId: string
  produto: { id: string; nome: string; codigo: string }
}

export interface SaidaEstoque {
  id: string
  motivo: string
  observacao: string | null
  empresaId: string
  createdAt: string
  itens: SaidaItem[]
}

export interface SaidaItem {
  id: string
  quantidade: number
  produtoId: string
  produto: { id: string; nome: string; codigo: string }
}

export interface PedidoCompra {
  id: string
  status: 'RASCUNHO' | 'ENVIADO' | 'RECEBIDO' | 'CANCELADO'
  observacao: string | null
  empresaId: string
  fornecedorId: string
  createdAt: string
  fornecedor: { id: string; nome: string }
  itens: PedidoCompraItem[]
}

export interface PedidoCompraItem {
  id: string
  quantidade: number
  precoUnitario: number
  produtoId: string
  produto: { id: string; nome: string; codigo: string }
}

// ─── Fiscal ──────────────────────────────────────────────

export type StatusNota = 'PENDENTE' | 'EMITIDA' | 'CANCELADA' | 'REJEITADA'

export interface NotaFiscal {
  id: string
  numero: string | null
  serie: string | null
  chave: string | null
  status: StatusNota
  empresaId: string
  vendaId: string
  createdAt: string
  venda: { id: string; numero: number; total: number }
}

// ─── Shopping & Cupons ───────────────────────────────────

export interface Shopping {
  id: string
  nome: string
  endereco: string | null
  cidade: string | null
  estado: string | null
  empresaId: string
}

export interface CampanhaShopping {
  id: string
  nome: string
  descricao: string | null
  dataInicio: string
  dataFim: string
  valorMinimo: number
  ativo: boolean
  empresaId: string
  shoppingId: string
  shopping: { id: string; nome: string }
  _count?: { cupons: number }
}

export interface CupomShopping {
  id: string
  codigo: string
  campanhaId: string
  vendaId: string
  createdAt: string
  campanha?: { id: string; nome: string }
}

// ─── Auxiliares ──────────────────────────────────────────

export interface Fornecedor {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  empresaId: string
}

export interface Cliente {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  empresaId: string
}

export interface Terminal {
  id: string
  nome: string
  codigo: string
  ativo: boolean
  empresaId: string
}

export interface ComissaoConfig {
  id: string
  nome: string
  percentual: number
  ativo: boolean
  empresaId: string
}

// ─── Sugestão de Compra ─────────────────────────────

export interface CenarioResult {
  qtdSugerida: number
  custoTotal: number
  coberturaDias: number
}

export interface SugestaoCompraItem {
  produtoId: string
  nome: string
  codigo: string
  classeABC: 'A' | 'B' | 'C'
  estoqueAtual: number
  estoqueMinimo: number
  demandaDiaria: number
  demandaAjustada: number
  leadTimeDias: number
  safetyStock: number
  pontoReposicao: number
  gmroi: number
  cenarios: {
    conservador: CenarioResult
    moderado: CenarioResult
    agressivo: CenarioResult
  }
  fornecedor: string | null
  eventoAtivo: string | null
}

export interface EventoSazonal {
  id: string
  nome: string
  dataInicio: string
  dataFim: string
  multiplicador: number
  recorrente: boolean
  empresaId: string
  createdAt: string
  updatedAt: string
}

// ─── Relatórios ──────────────────────────────────────────

export interface CurvaABCItem {
  produtoId: string
  nome: string
  totalVendido: number
  percentual: number
  percentualAcumulado: number
  classificacao: 'A' | 'B' | 'C'
}

export interface VendasPeriodoItem {
  data: string
  total: number
  quantidade: number
}

export interface RankingVendedor {
  usuarioId: string
  nome: string
  totalVendas: number
  qtdVendas: number
}

export interface ComparativoQuiosque {
  empresaId: string
  nome: string
  totalVendas: number
  ticketMedio: number
  qtdVendas: number
}
