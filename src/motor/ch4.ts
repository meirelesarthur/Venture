// ─── Módulo CH4 — QA3 (§5.5 devGuideV2) ──────────────────────────────────────

import { ANIMAL_PARAMS, EF_CH4_MD, EF_CH4_BB, CF_RESIDUOS, FRACAO_C_MS } from './lookup'
import { calcInputC } from './rothc'
import type { DadosCulturaRothC } from './rothc'
import type { RegistroPecuaria } from '../store/data'

export interface ResultadoCH4 {
  ch4EntericoTco2eHa: number   // entérico
  ch4EstercoTco2eHa: number    // esterco em pasto
  ch4QueimaraTco2eHa: number   // queima de biomassa
  ch4TotalTco2eHa: number
}

// ─── CH4 entérico (§5.5.1) ───────────────────────────────────────────────────

function ch4Enterico(pecuaria: RegistroPecuaria[], gwpCH4: number, areaHa: number): number {
  let total = 0
  for (const p of pecuaria) {
    const ef = ANIMAL_PARAMS[p.tipoAnimal]?.ef_ent ?? 56  // default gado corte ext
    total += p.quantidade * ef
  }
  return (gwpCH4 * total) / (1000 * areaHa)  // tCO2e/ha
}

// ─── CH4 esterco em pasto (§5.5.2) ───────────────────────────────────────────

function ch4Esterco(pecuaria: RegistroPecuaria[], gwpCH4: number, areaHa: number): number {
  let total = 0
  for (const p of pecuaria) {
    const vsRate = ANIMAL_PARAMS[p.tipoAnimal]?.vs_rate ?? 2.9  // kg VS/cab/dia
    total += p.quantidade * vsRate * 365 * EF_CH4_MD / 1000
  }
  return (gwpCH4 * total) / (1000 * areaHa)  // tCO2e/ha
}

// ─── CH4 queima de biomassa (§5.5.3) ─────────────────────────────────────────

function ch4Queima(cultura: DadosCulturaRothC, gwpCH4: number): number {
  if (cultura.residuosCampo !== false) return 0  // não há queima se mantém resíduos
  const bioAerea = calcInputC(cultura) / FRACAO_C_MS  // t MS/ha
  const mb = bioAerea * CF_RESIDUOS  // massa queimada (t MS/ha)
  // EF_CH4_bb = 2.7 g CH4/kg MS = 2.7e-3 kg/kg = 2.7e-6 t/t
  const ch4Kg = mb * 1000 * EF_CH4_BB / 1000  // kg CH4/ha
  return (gwpCH4 * ch4Kg) / 1000  // tCO2e/ha
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export function calcularCH4(
  pecuaria: RegistroPecuaria[],
  cultura: DadosCulturaRothC,
  params: Record<string, number>,
  areaHa: number,
): ResultadoCH4 {
  const gwpCH4 = params['gwp_ch4'] ?? 28

  const enterico = pecuaria.length > 0 ? ch4Enterico(pecuaria, gwpCH4, areaHa) : 0
  const esterco  = pecuaria.length > 0 ? ch4Esterco(pecuaria, gwpCH4, areaHa)  : 0
  const queima   = ch4Queima(cultura, gwpCH4)

  return {
    ch4EntericoTco2eHa:  enterico,
    ch4EstercoTco2eHa:   esterco,
    ch4QueimaraTco2eHa:  queima,
    ch4TotalTco2eHa:     enterico + esterco + queima,
  }
}
