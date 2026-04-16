// ─── Módulo CH4 — QA3 (§5.5 devGuideV2) ──────────────────────────────────────

import { ANIMAL_PARAMS, EF_CH4_MD, EF_CH4_BB, CF_RESIDUOS, FRACAO_C_MS } from './lookup'
import { calcInputC } from './rothc'
import type { DadosCulturaRothC } from './rothc'
import type { RegistroPecuaria } from '../store/data'

export interface ResultadoCH4 {
  // Totais finais
  ch4EntericoTco2eHa: number   // entérico (Eq.11 VM0042)
  ch4EstercoTco2eHa: number    // esterco em pasto (Eq.12-13 VM0042)
  ch4QueimaraTco2eHa: number   // queima de biomassa (Eq.14 VM0042)
  ch4TotalTco2eHa: number
  // Intermediários — Eq.11 VM0042 (Fermentação Entérica)
  popTotalAnimais: number       // total de cabeças (todas as espécies)
  ch4EntKgCabAno: number        // EF entérico médio ponderado (kg CH4/cab/ano)
  ch4EntKgHaTotal: number       // CH4 entérico bruto antes divisão por área (kg CH4)
  gwpCH4Usado: number
  // Intermediários — Eq.12-13 VM0042 (Esterco)
  vsRateMedioKgDia: number      // VS rate médio (kg VS/cab/dia)
  ch4EstercoKgHaTotal: number   // CH4 esterco bruto (kg CH4/ha/ano)
  efCH4MdUsado: number          // EF_CH4_md (pasto direto)
  // Intermediários — Eq.14 VM0042 (Queima de Biomassa)
  bioAereaTHa: number           // biomassa aérea de resíduos (t MS/ha)
  mbQueimadoTHa: number         // massa queimada = bio × CF (t MS/ha)
  cfUsado: number               // 0.80 (fração combustão)
  efCH4BbUsado: number          // 2.7 g CH4/kg MS
  ch4QueimaKgHa: number         // CH4 por queima (kg CH4/ha)
}

// ─── CH4 entérico (§5.5.1 / Eq.11 VM0042) ─────────────────────────────────

function ch4EntericoDetalhado(
  pecuaria: RegistroPecuaria[],
  gwpCH4: number,
  areaHa: number,
): {
  total: number
  popTotal: number
  ch4EntKgTotal: number
  efMedioPonderado: number
} {
  let ch4Total = 0
  let popTotal = 0
  let efSomaPonderada = 0

  for (const p of pecuaria) {
    const ef = ANIMAL_PARAMS[p.tipoAnimal]?.ef_ent ?? 56  // default gado corte ext
    ch4Total += p.quantidade * ef
    popTotal += p.quantidade
    efSomaPonderada += p.quantidade * ef
  }

  const efMedioPonderado = popTotal > 0 ? efSomaPonderada / popTotal : 0
  return {
    total: (gwpCH4 * ch4Total) / (1000 * areaHa),
    popTotal,
    ch4EntKgTotal: ch4Total,
    efMedioPonderado,
  }
}

// ─── CH4 esterco em pasto (§5.5.2 / Eq.12-13 VM0042) ──────────────────────

function ch4EstercoDetalhado(
  pecuaria: RegistroPecuaria[],
  gwpCH4: number,
  areaHa: number,
): {
  total: number
  vsRateMedio: number
  ch4EstercoKgHa: number
} {
  let ch4Total = 0
  let vsSomaPonderada = 0
  let popTotal = 0

  for (const p of pecuaria) {
    const vsRate = ANIMAL_PARAMS[p.tipoAnimal]?.vs_rate ?? 2.9  // kg VS/cab/dia
    const ch4Animal = p.quantidade * vsRate * 365 * EF_CH4_MD / 1000
    ch4Total += ch4Animal
    vsSomaPonderada += p.quantidade * vsRate
    popTotal += p.quantidade
  }

  const vsRateMedio = popTotal > 0 ? vsSomaPonderada / popTotal : 0
  const ch4EstercoKgHa = (ch4Total) / areaHa * 1000  // conversão para kg/ha

  return {
    total: (gwpCH4 * ch4Total) / (1000 * areaHa),
    vsRateMedio,
    ch4EstercoKgHa,
  }
}

// ─── CH4 queima de biomassa (§5.5.3 / Eq.14 VM0042) ─────────────────────

function ch4QueimaDetalhado(
  cultura: DadosCulturaRothC,
  gwpCH4: number,
): {
  total: number
  bioAereaTHa: number
  mbQueimado: number
  ch4KgHa: number
} {
  if (cultura.residuosCampo !== false) return { total: 0, bioAereaTHa: 0, mbQueimado: 0, ch4KgHa: 0 }
  const bioAerea = calcInputC(cultura) / FRACAO_C_MS  // t MS/ha
  const mb = bioAerea * CF_RESIDUOS  // massa queimada (t MS/ha)
  // EF_CH4_bb = 2.7 g CH4/kg MS
  const ch4Kg = mb * 1000 * EF_CH4_BB / 1000  // kg CH4/ha
  return {
    total: (gwpCH4 * ch4Kg) / 1000,
    bioAereaTHa: bioAerea,
    mbQueimado: mb,
    ch4KgHa: ch4Kg,
  }
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export function calcularCH4(
  pecuaria: RegistroPecuaria[],
  cultura: DadosCulturaRothC,
  params: Record<string, number>,
  areaHa: number,
): ResultadoCH4 {
  const gwpCH4 = params['gwp_ch4'] ?? 28

  const entDet    = pecuaria.length > 0 ? ch4EntericoDetalhado(pecuaria, gwpCH4, areaHa) : { total: 0, popTotal: 0, ch4EntKgTotal: 0, efMedioPonderado: 0 }
  const estercoDet = pecuaria.length > 0 ? ch4EstercoDetalhado(pecuaria, gwpCH4, areaHa) : { total: 0, vsRateMedio: 0, ch4EstercoKgHa: 0 }
  const queimaDet  = ch4QueimaDetalhado(cultura, gwpCH4)

  return {
    ch4EntericoTco2eHa:  entDet.total,
    ch4EstercoTco2eHa:   estercoDet.total,
    ch4QueimaraTco2eHa:  queimaDet.total,
    ch4TotalTco2eHa:     entDet.total + estercoDet.total + queimaDet.total,
    // Intermediários entérico
    popTotalAnimais:    entDet.popTotal,
    ch4EntKgCabAno:     entDet.efMedioPonderado,
    ch4EntKgHaTotal:    entDet.ch4EntKgTotal,
    gwpCH4Usado:        gwpCH4,
    // Intermediários esterco
    vsRateMedioKgDia:   estercoDet.vsRateMedio,
    ch4EstercoKgHaTotal: estercoDet.ch4EstercoKgHa,
    efCH4MdUsado:       EF_CH4_MD,
    // Intermediários queima
    bioAereaTHa:        queimaDet.bioAereaTHa,
    mbQueimadoTHa:      queimaDet.mbQueimado,
    cfUsado:            CF_RESIDUOS,
    efCH4BbUsado:       EF_CH4_BB,
    ch4QueimaKgHa:      queimaDet.ch4KgHa,
  }
}
