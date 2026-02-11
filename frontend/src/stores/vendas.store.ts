import { create } from "zustand"
import type { CarrinhoItem } from "@/types"

interface VendasState {
  carrinho: CarrinhoItem[]
  desconto: number
  addItem: (produto: {
    id: string
    nome: string
    codigo: string
    precoVenda: number
  }) => void
  removeItem: (produtoId: string) => void
  updateQuantidade: (produtoId: string, quantidade: number) => void
  setDesconto: (desconto: number) => void
  getSubtotal: () => number
  getTotal: () => number
  limparCarrinho: () => void
}

export const useVendasStore = create<VendasState>()((set, get) => ({
  carrinho: [],
  desconto: 0,

  addItem: (produto) =>
    set((state) => {
      const existing = state.carrinho.find(
        (item) => item.produtoId === produto.id
      )
      if (existing) {
        return {
          carrinho: state.carrinho.map((item) =>
            item.produtoId === produto.id
              ? {
                  ...item,
                  quantidade: item.quantidade + 1,
                  subtotal: (item.quantidade + 1) * item.precoUnitario,
                }
              : item
          ),
        }
      }
      return {
        carrinho: [
          ...state.carrinho,
          {
            produtoId: produto.id,
            nome: produto.nome,
            codigo: produto.codigo,
            precoUnitario: produto.precoVenda,
            quantidade: 1,
            subtotal: produto.precoVenda,
          },
        ],
      }
    }),

  removeItem: (produtoId) =>
    set((state) => ({
      carrinho: state.carrinho.filter((item) => item.produtoId !== produtoId),
    })),

  updateQuantidade: (produtoId, quantidade) =>
    set((state) => {
      if (quantidade <= 0) {
        return {
          carrinho: state.carrinho.filter(
            (item) => item.produtoId !== produtoId
          ),
        }
      }
      return {
        carrinho: state.carrinho.map((item) =>
          item.produtoId === produtoId
            ? {
                ...item,
                quantidade,
                subtotal: quantidade * item.precoUnitario,
              }
            : item
        ),
      }
    }),

  setDesconto: (desconto) => set({ desconto }),

  getSubtotal: () =>
    get().carrinho.reduce((sum, item) => sum + item.subtotal, 0),

  getTotal: () => {
    const state = get()
    const subtotal = state.carrinho.reduce(
      (sum, item) => sum + item.subtotal,
      0
    )
    return subtotal - state.desconto
  },

  limparCarrinho: () => set({ carrinho: [], desconto: 0 }),
}))
