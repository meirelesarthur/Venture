// ─── Módulo CO2 — Combustíveis e Calagem (§5.6 devGuideV2) ───────────────────

import { EF_COMBUSTIVEL } from './lookup'
import type { OperacaoMec, Calcario } from '../store/data'

export interface ResultadoCO2 {
  co2FfTco2eHa: number    // combustíveis fósseis
  co2LimeTco2eHa: number  // calagem (calcário + dolomita)
  co2TotalTco2eHa: number
}

// ─── CO2 combustíveis (§5.6.1) ────────────────────────────────────────────────

function co2Combustiveis(operacoes: OperacaoMec[], params: Record<string, number>): number {
  let totalCO2 = 0
  for (const op of operacoes) {
    const efParam = params[`ef_${op.combustivel}`]
    const ef = efParam ?? EF_COMBUSTIVEL[op.combustivel] ?? 0
    totalCO2 += op.litros * ef  // tCO2/ha (litros já em litros/ha)
  }
  return totalCO2
}

// ─── CO2 calagem (§5.6.2) ────────────────────────────────────────────────────

function co2Calagem(calcario: Calcario[], params: Record<string, number>): number {
  let co2 = 0
  for (const c of calcario) {
    if (c.tipo === 'calcitico') {
      const ef = params['ef_limestone'] ?? 0.12
      co2 += c.qtdTHa * ef * (44 / 12)  // tCO2/ha
    } else if (c.tipo === 'dolomitico') {
      const ef = params['ef_dolomite'] ?? 0.13
      co2 += c.qtdTHa * ef * (44 / 12)
    }
    // gesso: EF = 0, não gera CO2
  }
  return co2
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export function calcularCO2(
  operacoes: OperacaoMec[],
  calcarios: Calcario[],
  params: Record<string, number>,
): ResultadoCO2 {
  const co2Ff   = co2Combustiveis(operacoes, params)
  const co2Lime = co2Calagem(calcarios, params)
  return {
    co2FfTco2eHa:    co2Ff,
    co2LimeTco2eHa:  co2Lime,
    co2TotalTco2eHa: co2Ff + co2Lime,
  }
}
