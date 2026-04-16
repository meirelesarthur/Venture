// ─── Módulo CO2 — Combustíveis e Calagem (§5.6 devGuideV2) ───────────────────

import { EF_COMBUSTIVEL } from './lookup'
import type { OperacaoMec, Calcario } from '../store/data'

export interface DetalheCombustivel {
  operacao: string
  combustivel: string
  litros: number
  efUsado: number
  co2TcO2eHa: number  // litros × EF
}

export interface DetalheCal {
  tipo: string
  qtdTHa: number
  efUsado: number        // tC/t
  co2TcO2eHa: number    // qtd × EF × 44/12
}

export interface ResultadoCO2 {
  co2FfTco2eHa: number    // combustíveis fósseis total (Eq.6-7 / Eq.52 VM0042)
  co2LimeTco2eHa: number  // calagem total (Eq.8-9 / Eq.53 VM0042)
  co2TotalTco2eHa: number
  // Intermediários — Eq.52 VM0042 (Combustíveis)
  detalhesCombustiveis: DetalheCombustivel[]
  efDieselUsado: number
  efGasolinaUsado: number
  // Intermediários — Eq.53 VM0042 (Calagem)
  detalhesCalcario: DetalheCal[]
  efCalciticoUsado: number
  efDolomiticoUsado: number
  fatorConversaoCCO2: number  // 44/12 = 3.667
}

// ─── CO2 combustíveis (§5.6.1 / Eq.6-7, Eq.52 VM0042) ───────────────────────

function co2Combustiveis(
  operacoes: OperacaoMec[],
  params: Record<string, number>,
): {
  total: number
  detalhes: DetalheCombustivel[]
  efDiesel: number
  efGasolina: number
} {
  const efDiesel   = params['ef_diesel']   ?? EF_COMBUSTIVEL['diesel']   ?? 0.002886
  const efGasolina = params['ef_gasolina'] ?? EF_COMBUSTIVEL['gasolina'] ?? 0.002310

  let totalCO2 = 0
  const detalhes: DetalheCombustivel[] = []

  for (const op of operacoes) {
    const efParam = params[`ef_${op.combustivel}`]
    const ef = efParam ?? EF_COMBUSTIVEL[op.combustivel] ?? 0
    const co2 = op.litros * ef
    totalCO2 += co2
    detalhes.push({
      operacao:    op.operacao,
      combustivel: op.combustivel,
      litros:      op.litros,
      efUsado:     ef,
      co2TcO2eHa:  co2,
    })
  }

  return { total: totalCO2, detalhes, efDiesel, efGasolina }
}

// ─── CO2 calagem (§5.6.2 / Eq.8-9, Eq.53 VM0042) ─────────────────────────

function co2Calagem(
  calcario: Calcario[],
  params: Record<string, number>,
): {
  total: number
  detalhes: DetalheCal[]
  efCalcitico: number
  efDolomitico: number
} {
  const efCalcitico  = params['ef_limestone'] ?? 0.12
  const efDolomitico = params['ef_dolomite']  ?? 0.13
  const fatorC_CO2 = 44 / 12  // 3.6667

  let co2 = 0
  const detalhes: DetalheCal[] = []

  for (const c of calcario) {
    if (c.tipo === 'calcitico') {
      const emissao = c.qtdTHa * efCalcitico * fatorC_CO2
      co2 += emissao
      detalhes.push({ tipo: 'Calcário Calcítico', qtdTHa: c.qtdTHa, efUsado: efCalcitico, co2TcO2eHa: emissao })
    } else if (c.tipo === 'dolomitico') {
      const emissao = c.qtdTHa * efDolomitico * fatorC_CO2
      co2 += emissao
      detalhes.push({ tipo: 'Dolomita', qtdTHa: c.qtdTHa, efUsado: efDolomitico, co2TcO2eHa: emissao })
    } else {
      // gesso: EF = 0, não gera CO2
      detalhes.push({ tipo: 'Gesso Agrícola', qtdTHa: c.qtdTHa, efUsado: 0, co2TcO2eHa: 0 })
    }
  }
  return { total: co2, detalhes, efCalcitico, efDolomitico }
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export function calcularCO2(
  operacoes: OperacaoMec[],
  calcarios: Calcario[],
  params: Record<string, number>,
): ResultadoCO2 {
  const ffDet   = co2Combustiveis(operacoes, params)
  const limeDet = co2Calagem(calcarios, params)

  return {
    co2FfTco2eHa:    ffDet.total,
    co2LimeTco2eHa:  limeDet.total,
    co2TotalTco2eHa: ffDet.total + limeDet.total,
    // Intermediários FF
    detalhesCombustiveis: ffDet.detalhes,
    efDieselUsado:        ffDet.efDiesel,
    efGasolinaUsado:      ffDet.efGasolina,
    // Intermediários Calagem
    detalhesCalcario:     limeDet.detalhes,
    efCalciticoUsado:     limeDet.efCalcitico,
    efDolomiticoUsado:    limeDet.efDolomitico,
    fatorConversaoCCO2:   44 / 12,
  }
}
