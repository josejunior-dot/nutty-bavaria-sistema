import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('123456', 10)

  // ─── Empresas ────────────────────────────────────────
  const morumbi = await prisma.empresa.create({
    data: {
      nome: 'Nutty Bavaria - Shopping Morumbi',
      cnpj: '12.345.678/0001-01',
      telefone: '(11) 99999-0001',
      email: 'morumbi@nuttybavaria.com.br',
    },
  })

  const eldorado = await prisma.empresa.create({
    data: {
      nome: 'Nutty Bavaria - Shopping Eldorado',
      cnpj: '12.345.678/0002-02',
      telefone: '(11) 99999-0002',
      email: 'eldorado@nuttybavaria.com.br',
    },
  })

  // ─── Usuarios ────────────────────────────────────────
  await prisma.usuario.createMany({
    data: [
      // Franqueador (acessa ambas empresas — vinculado à Morumbi como principal)
      {
        nome: 'Carlos Franqueador',
        email: 'franqueador@nutty.com',
        senha: passwordHash,
        role: 'FRANQUEADOR',
        empresaId: morumbi.id,
      },
      // Gerente Morumbi
      {
        nome: 'Ana Gerente',
        email: 'gerente.morumbi@nutty.com',
        senha: passwordHash,
        role: 'GERENTE',
        empresaId: morumbi.id,
      },
      // Operadora Morumbi
      {
        nome: 'Julia Operadora',
        email: 'operadora.morumbi@nutty.com',
        senha: passwordHash,
        role: 'OPERADORA',
        empresaId: morumbi.id,
      },
      // Gerente Eldorado
      {
        nome: 'Bruno Gerente',
        email: 'gerente.eldorado@nutty.com',
        senha: passwordHash,
        role: 'GERENTE',
        empresaId: eldorado.id,
      },
      // Operadora Eldorado
      {
        nome: 'Maria Operadora',
        email: 'operadora.eldorado@nutty.com',
        senha: passwordHash,
        role: 'OPERADORA',
        empresaId: eldorado.id,
      },
    ],
  })

  // ─── Terminais ───────────────────────────────────────
  await prisma.terminal.createMany({
    data: [
      { nome: 'Terminal 1 - Morumbi', codigo: 'T1-MOR', empresaId: morumbi.id },
      { nome: 'Terminal 1 - Eldorado', codigo: 'T1-ELD', empresaId: eldorado.id },
    ],
  })

  // ─── Shoppings ───────────────────────────────────────
  await prisma.shopping.createMany({
    data: [
      {
        nome: 'Shopping Morumbi',
        endereco: 'Av. Roque Petroni Júnior, 1089',
        cidade: 'São Paulo',
        estado: 'SP',
        empresaId: morumbi.id,
      },
      {
        nome: 'Shopping Eldorado',
        endereco: 'Av. Rebouças, 3970',
        cidade: 'São Paulo',
        estado: 'SP',
        empresaId: eldorado.id,
      },
    ],
  })

  // ─── Produtos (Morumbi) ──────────────────────────────
  await prisma.produto.createMany({
    data: [
      {
        nome: 'Castanha de Caju',
        codigo: 'CAJU-100',
        unidade: 'G',
        precoVenda: 25.9,
        precoCusto: 12.5,
        estoqueAtual: 5000,
        estoqueMinimo: 1000,
        empresaId: morumbi.id,
      },
      {
        nome: 'Amendoim Crocante',
        codigo: 'AMEND-100',
        unidade: 'G',
        precoVenda: 15.9,
        precoCusto: 6.0,
        estoqueAtual: 8000,
        estoqueMinimo: 2000,
        empresaId: morumbi.id,
      },
      {
        nome: 'Mix de Nuts Premium',
        codigo: 'MIX-150',
        unidade: 'G',
        precoVenda: 35.9,
        precoCusto: 18.0,
        estoqueAtual: 3000,
        estoqueMinimo: 500,
        empresaId: morumbi.id,
      },
      {
        nome: 'Macadâmia Torrada',
        codigo: 'MACAD-100',
        unidade: 'G',
        precoVenda: 45.9,
        precoCusto: 28.0,
        estoqueAtual: 2000,
        estoqueMinimo: 300,
        empresaId: morumbi.id,
      },
      {
        nome: 'Pistache Salgado',
        codigo: 'PIST-100',
        unidade: 'G',
        precoVenda: 55.9,
        precoCusto: 35.0,
        estoqueAtual: 1500,
        estoqueMinimo: 300,
        empresaId: morumbi.id,
      },
      {
        nome: 'Nozes Pecã Caramelizadas',
        codigo: 'PECAN-100',
        unidade: 'G',
        precoVenda: 39.9,
        precoCusto: 22.0,
        estoqueAtual: 2500,
        estoqueMinimo: 400,
        empresaId: morumbi.id,
      },
    ],
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
