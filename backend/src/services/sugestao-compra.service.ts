import { prisma } from '../lib/prisma.js'

interface CenarioResult {
  qtdSugerida: number
  custoTotal: number
  coberturaDias: number
}

interface SugestaoItem {
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

export async function gerarSugestaoCompra(empresaId: string): Promise<SugestaoItem[]> {
  const now = new Date()
  const dias90Atras = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // 1. Buscar produtos ativos com fornecedor padrão
  const produtos = await prisma.produto.findMany({
    where: { empresaId, ativo: true },
    include: {
      fornecedorPadrao: { select: { id: true, nome: true } },
    },
  })

  if (produtos.length === 0) return []

  // 2. Buscar vendas dos últimos 90 dias
  const vendaItens = await prisma.vendaItem.findMany({
    where: {
      venda: {
        empresaId,
        status: 'CONCLUIDA',
        createdAt: { gte: dias90Atras },
      },
    },
    include: {
      venda: { select: { createdAt: true } },
    },
  })

  // 3. Buscar eventos sazonais que cubram o período de projeção
  const eventosRaw = await prisma.eventoSazonal.findMany({
    where: { empresaId },
  })

  // Montar mapa de vendas por produto por dia
  const vendasPorProduto = new Map<string, { data: Date; quantidade: number; subtotal: number }[]>()
  for (const vi of vendaItens) {
    const list = vendasPorProduto.get(vi.produtoId) || []
    list.push({
      data: vi.venda.createdAt,
      quantidade: Number(vi.quantidade),
      subtotal: Number(vi.subtotal),
    })
    vendasPorProduto.set(vi.produtoId, list)
  }

  // 4. Calcular receita total dos 90 dias para classificação ABC
  const receitaPorProduto = new Map<string, number>()
  let receitaTotal = 0
  for (const [produtoId, vendas] of vendasPorProduto) {
    const receita = vendas.reduce((acc, v) => acc + v.subtotal, 0)
    receitaPorProduto.set(produtoId, receita)
    receitaTotal += receita
  }

  // Classificação ABC por receita
  const produtosOrdenados = [...receitaPorProduto.entries()]
    .sort((a, b) => b[1] - a[1])

  const classeABC = new Map<string, 'A' | 'B' | 'C'>()
  let acumulado = 0
  for (const [produtoId, receita] of produtosOrdenados) {
    acumulado += receita
    const pct = receitaTotal > 0 ? (acumulado / receitaTotal) * 100 : 100
    if (pct <= 80) classeABC.set(produtoId, 'A')
    else if (pct <= 95) classeABC.set(produtoId, 'B')
    else classeABC.set(produtoId, 'C')
  }

  // Z-scores por classe
  const zScores: Record<string, number> = { A: 1.65, B: 1.28, C: 1.04 }

  const resultados: SugestaoItem[] = []

  for (const produto of produtos) {
    const vendas = vendasPorProduto.get(produto.id) || []
    const estoqueAtual = Number(produto.estoqueAtual)
    const estoqueMinimo = Number(produto.estoqueMinimo ?? 0)
    const leadTime = produto.leadTimeDias ?? 7
    const loteMinimo = produto.loteMinimo ?? 1
    const cobertura = produto.coberturaDias ?? 30
    const precoCusto = Number(produto.precoCusto ?? 0)
    const precoVenda = Number(produto.precoVenda)

    // 5. Demanda WMA (Weighted Moving Average)
    // 0-30 dias: peso 3 | 31-60 dias: peso 2 | 61-90 dias: peso 1
    let somaVendasPeso = 0
    let somaDiasPeso = 0
    const vendasDiarias: number[] = []

    // Agrupar vendas por dia
    const vendasPorDia = new Map<string, number>()
    for (const v of vendas) {
      const diaKey = v.data.toISOString().slice(0, 10)
      vendasPorDia.set(diaKey, (vendasPorDia.get(diaKey) || 0) + v.quantidade)
    }

    // Calcular demanda diária para cada período com pesos
    const periodos = [
      { inicio: 0, fim: 30, peso: 3 },
      { inicio: 31, fim: 60, peso: 2 },
      { inicio: 61, fim: 90, peso: 1 },
    ]

    for (const periodo of periodos) {
      let vendasPeriodo = 0
      let diasComDados = 0
      for (let d = periodo.inicio; d <= periodo.fim; d++) {
        const dia = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
        const diaKey = dia.toISOString().slice(0, 10)
        const qtd = vendasPorDia.get(diaKey) || 0
        vendasPeriodo += qtd
        if (qtd > 0) diasComDados++
        vendasDiarias.push(qtd)
      }
      if (diasComDados > 0) {
        somaVendasPeso += vendasPeriodo * periodo.peso
        somaDiasPeso += diasComDados * periodo.peso
      }
    }

    const demandaDiaria = somaDiasPeso > 0 ? somaVendasPeso / somaDiasPeso : 0

    // Se não há demanda e estoque está acima do mínimo, pular
    if (demandaDiaria === 0 && estoqueAtual >= estoqueMinimo && estoqueMinimo === 0) continue

    // 6. Ajuste sazonal
    const coberturaFim = new Date(now.getTime() + cobertura * 24 * 60 * 60 * 1000)
    let multiplicadorSazonal = 1
    let eventoAtivoNome: string | null = null

    for (const evento of eventosRaw) {
      let eventoInicio = evento.dataInicio
      let eventoFim = evento.dataFim

      // Se recorrente, ajustar ano para o ano atual
      if (evento.recorrente) {
        const anoAtual = now.getFullYear()
        eventoInicio = new Date(eventoInicio)
        eventoFim = new Date(eventoFim)
        eventoInicio.setFullYear(anoAtual)
        eventoFim.setFullYear(anoAtual)
        // Se já passou, verificar próximo ano
        if (eventoFim < now) {
          eventoInicio.setFullYear(anoAtual + 1)
          eventoFim.setFullYear(anoAtual + 1)
        }
      }

      // Verificar se evento se sobrepõe ao período de cobertura
      if (eventoInicio <= coberturaFim && eventoFim >= now) {
        const mult = Number(evento.multiplicador)
        if (mult > multiplicadorSazonal) {
          multiplicadorSazonal = mult
          eventoAtivoNome = evento.nome
        }
      }
    }

    const demandaAjustada = demandaDiaria * multiplicadorSazonal

    // 7. Classe ABC (produtos sem venda = C)
    const classe = classeABC.get(produto.id) || 'C'
    const z = zScores[classe]

    // 8. Safety Stock = Z × σ × √leadTime
    // σ = desvio padrão da demanda diária
    const mean = vendasDiarias.length > 0
      ? vendasDiarias.reduce((a, b) => a + b, 0) / vendasDiarias.length
      : 0
    const variance = vendasDiarias.length > 0
      ? vendasDiarias.reduce((a, b) => a + (b - mean) ** 2, 0) / vendasDiarias.length
      : 0
    const sigma = Math.sqrt(variance)
    const safetyStockBase = z * sigma * Math.sqrt(leadTime)

    // 9. GMROI = (margem% × receita anualizada) / (custo × estoque médio)
    const receita90 = receitaPorProduto.get(produto.id) || 0
    const receitaAnualizada = receita90 * (365 / 90)
    const margem = precoVenda > 0 && precoCusto > 0
      ? (precoVenda - precoCusto) / precoVenda
      : 0
    const estoqueMedio = Math.max(estoqueAtual, 1)
    const gmroi = precoCusto > 0 && estoqueMedio > 0
      ? (margem * receitaAnualizada) / (precoCusto * estoqueMedio)
      : 0

    // 10. Ponto de Reposição = (demandaAjustada × leadTime) + safetyStock
    const pontoReposicaoBase = (demandaAjustada * leadTime) + safetyStockBase

    // 11. 3 Cenários
    const cenarios = {
      conservador: { safetyMult: 0.8, coberturaMult: 0.8 },
      moderado: { safetyMult: 1.0, coberturaMult: 1.0 },
      agressivo: { safetyMult: 1.3, coberturaMult: 1.2 },
    }

    const resultCenarios: Record<string, CenarioResult> = {}
    for (const [nome, cfg] of Object.entries(cenarios)) {
      const ss = safetyStockBase * cfg.safetyMult
      const cob = cobertura * cfg.coberturaMult
      const pontoRep = (demandaAjustada * leadTime) + ss
      let qtd = Math.max(0, Math.ceil(pontoRep + demandaAjustada * cob - estoqueAtual))
      // Arredondar para lote mínimo
      if (loteMinimo > 1 && qtd > 0) {
        qtd = Math.ceil(qtd / loteMinimo) * loteMinimo
      }
      resultCenarios[nome] = {
        qtdSugerida: qtd,
        custoTotal: Math.round(qtd * precoCusto * 100) / 100,
        coberturaDias: Math.round(cob),
      }
    }

    // Só incluir se pelo menos um cenário sugere compra, ou estoque abaixo do mínimo
    const algumaSugestao = Object.values(resultCenarios).some(c => c.qtdSugerida > 0)
    if (!algumaSugestao && estoqueAtual >= estoqueMinimo) continue

    resultados.push({
      produtoId: produto.id,
      nome: produto.nome,
      codigo: produto.codigo,
      classeABC: classe,
      estoqueAtual,
      estoqueMinimo,
      demandaDiaria: Math.round(demandaDiaria * 100) / 100,
      demandaAjustada: Math.round(demandaAjustada * 100) / 100,
      leadTimeDias: leadTime,
      safetyStock: Math.round(safetyStockBase * 100) / 100,
      pontoReposicao: Math.round(pontoReposicaoBase * 100) / 100,
      gmroi: Math.round(gmroi * 100) / 100,
      cenarios: resultCenarios as any,
      fornecedor: produto.fornecedorPadrao?.nome ?? null,
      eventoAtivo: eventoAtivoNome,
    })
  }

  // Ordenar por GMROI desc (prioridade de investimento)
  resultados.sort((a, b) => b.gmroi - a.gmroi)

  return resultados
}
