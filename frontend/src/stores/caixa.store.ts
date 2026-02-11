import { create } from "zustand"
import type { Movimento, MovimentoResumo } from "@/types"

interface CaixaState {
  movimentoAtual: Movimento | null
  resumo: MovimentoResumo | null
  loading: boolean
  setMovimentoAtual: (m: Movimento | null) => void
  setResumo: (r: MovimentoResumo | null) => void
  setLoading: (l: boolean) => void
  reset: () => void
}

export const useCaixaStore = create<CaixaState>()((set) => ({
  movimentoAtual: null,
  resumo: null,
  loading: false,
  setMovimentoAtual: (movimentoAtual) => set({ movimentoAtual }),
  setResumo: (resumo) => set({ resumo }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ movimentoAtual: null, resumo: null, loading: false }),
}))
