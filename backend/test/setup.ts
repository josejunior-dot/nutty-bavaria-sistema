import 'dotenv/config'
import { beforeEach } from 'vitest'
import { PrismaClient } from '../src/generated/prisma/client.js'

// Override DATABASE_URL for test
process.env.DATABASE_URL =
  'postgresql://nutty:nutty123@localhost:5432/nutty_bavaria_test?schema=public'
process.env.JWT_SECRET = 'test-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.NODE_ENV = 'test'

const prisma = new PrismaClient()

// Truncate all tables before each test (respecting FK order)
beforeEach(async () => {
  await prisma.$transaction([
    prisma.cupomShopping.deleteMany(),
    prisma.campanhaShopping.deleteMany(),
    prisma.shopping.deleteMany(),
    prisma.notaFiscal.deleteMany(),
    prisma.vendaPagamento.deleteMany(),
    prisma.vendaItem.deleteMany(),
    prisma.venda.deleteMany(),
    prisma.movimentoOperacao.deleteMany(),
    prisma.movimento.deleteMany(),
    prisma.tabelaPrecoItem.deleteMany(),
    prisma.tabelaPreco.deleteMany(),
    prisma.pedidoCompraItem.deleteMany(),
    prisma.pedidoCompra.deleteMany(),
    prisma.saidaItem.deleteMany(),
    prisma.saidaEstoque.deleteMany(),
    prisma.entradaItem.deleteMany(),
    prisma.entradaEstoque.deleteMany(),
    prisma.produto.deleteMany(),
    prisma.comissaoConfig.deleteMany(),
    prisma.cliente.deleteMany(),
    prisma.fornecedor.deleteMany(),
    prisma.terminal.deleteMany(),
    prisma.usuario.deleteMany(),
    prisma.empresa.deleteMany(),
  ])
})
