# Nutty Bavaria - Sistema de Gestão de Franquias

Sistema completo de gestão para quiosques da franquia Nutty Bavaria, com PDV (Ponto de Venda), controle de estoque, gestão fiscal, relatórios e gerenciamento multi-quiosque.

## Stack

**Backend:** Fastify 5 + Prisma ORM + PostgreSQL + JWT Auth + Zod
**Frontend:** React 18 + TypeScript + TailwindCSS + shadcn/ui + Zustand
**Infra:** Docker (PostgreSQL) + pnpm workspaces

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | KPIs em tempo real, gráfico de vendas dos últimos 7 dias |
| **Vendas (PDV)** | Ponto de venda com busca de produtos, carrinho e múltiplas formas de pagamento |
| **Caixa** | Abertura/fechamento de caixa, sangrias e suprimentos |
| **Produtos** | Cadastro de produtos com controle de preço e estoque mínimo |
| **Estoque** | Entradas, saídas, pedidos de compra e alertas de estoque baixo |
| **Fiscal** | Emissão e gestão de notas fiscais eletrônicas |
| **Shopping** | Campanhas de cupons de shopping com controle de validade |
| **Relatórios** | Curva ABC, vendas por período, ranking de vendedores, comparativo entre quiosques, comissões |
| **Configurações** | Gestão de usuários, fornecedores, clientes, terminais e comissões |

## Controle de Acesso (RBAC)

| Perfil | Permissões |
|--------|-----------|
| **OPERADORA** | Vendas, caixa, dashboard |
| **GERENTE** | Tudo da operadora + estoque, produtos, fiscal, configurações, relatórios |
| **FRANQUEADOR** | Acesso total + comparativo entre quiosques |

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 8+
- [Docker](https://www.docker.com/) (para PostgreSQL)

## Setup

```bash
# 1. Clone o repositório
git clone https://github.com/josejunior-dot/nutty-bavaria-sistema.git
cd nutty-bavaria-sistema

# 2. Instale as dependências
pnpm install

# 3. Suba o banco de dados
docker compose up -d

# 4. Configure as variáveis de ambiente
cp .env.example backend/.env

# 5. Execute as migrations e gere o Prisma Client
pnpm db:migrate
pnpm db:generate

# 6. Popule o banco com dados de exemplo
pnpm db:seed
```

## Rodando o projeto

```bash
# Backend + Frontend simultâneos
pnpm dev

# Ou separadamente
pnpm dev:backend   # http://localhost:3333
pnpm dev:frontend  # http://localhost:5173
```

## Usuários de teste

Todos com senha: `123456`

| Email | Perfil | Quiosque |
|-------|--------|----------|
| `franqueador@nutty.com` | Franqueador | Morumbi (acesso total) |
| `gerente.morumbi@nutty.com` | Gerente | Morumbi |
| `operadora.morumbi@nutty.com` | Operadora | Morumbi |
| `gerente.eldorado@nutty.com` | Gerente | Eldorado |
| `operadora.eldorado@nutty.com` | Operadora | Eldorado |

## Scripts úteis

```bash
pnpm build          # Build de produção (backend + frontend)
pnpm db:studio      # Abre o Prisma Studio (GUI do banco)
pnpm db:migrate     # Executa migrations pendentes
pnpm db:seed        # Popula o banco com dados de exemplo
```

## Estrutura do projeto

```
nutty-bavaria-sistema/
├── backend/
│   ├── prisma/              # Schema e migrations
│   ├── src/
│   │   ├── controllers/     # Handlers das rotas
│   │   ├── services/        # Lógica de negócio
│   │   ├── routes/          # Definição de rotas Fastify
│   │   ├── middleware/      # Auth e RBAC
│   │   └── lib/             # Prisma client
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── components/      # UI components (shadcn/ui)
│   │   ├── services/        # API clients (axios)
│   │   ├── stores/          # Estado global (Zustand)
│   │   └── types/           # TypeScript interfaces
│   └── vite.config.ts
├── docker-compose.yml
└── pnpm-workspace.yaml
```
