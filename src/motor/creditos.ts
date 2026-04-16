// ─── Cálculo de Créditos Líquidos (§5.7 devGuideV2) ──────────────────────────

export interface ParcelaER {
  componente: string
  deltaBruto: number        // delta antes de conservadorismo
  uncAplicada: number       // fator de incerteza aplicado (0 = sem desconto)
  deltaLiquido: number      // delta × (1 − unc)
}

export interface ResultadoCreditos {
  erTTco2eHa: number      // reduções de emissão (Eq. 37 VM0042)
  crTTco2eHa: number      // remoções de CO2 (Eq. 40 VM0042)
  lkTTco2eHa: number      // leakage (VMD0054)
  uncCo2: number          // incerteza SOC (%)
  uncN2o: number          // incerteza N2O (%)
  errNetTco2eHa: number   // créditos líquidos antes buffer (ERR_net)
  bufferPoolRate: number
  vcusEmitidosHa: number
  vcusEmitidosTotal: number
  // Intermediários — Eq. 37 VM0042 (ER_t)
  parcelasER: ParcelaER[]           // detalhamento por componente
  erTBrutoTco2eHa: number           // soma antes conservadorismo
  // Intermediários — Eq. 40 VM0042 (CR_t)
  deltaCO2SocNet: number            // delta SOC projeto − baseline (tCO2e/ha)
  iSinal: number                    // +1 ou -1 (direção da remoção)
  crTBrutoTco2eHa: number           // antes de aplicar incerteza
  uncCo2AplicadaCR: number          // UNC × I
  // Intermediários — VMD0054 (Leakage)
  fpdsUsado: number                 // fração produção deslocada
  hasPecuariaLeakage: boolean
  lkDetalhado: string               // descrição do cálculo
  // Intermediários — Eq. 74 VM0042 (Dedução de incerteza)
  deducaoUncCO2Tco2eHa: number     // valor descontado por incerteza SOC
  deducaoUncN2OTco2eHa: number     // valor descontado por incerteza N2O
  // Cálculo final step-by-step
  errNetStep: string                // expressão numérica: "CR + ER − LK"
  vcusStep: string                  // expressão numérica: "ERR_net × (1-buffer) × área"
}

interface DeltasEmissao {
  deltaCO2Ff: number
  deltaCO2Lime: number
  deltaCH4Ent: number
  deltaCH4Md: number
  deltaCH4Bb: number
  deltaN2oSoil: number
  deltaN2oBb: number
  // SOC
  deltaCO2SocWp: number
  deltaCO2SocBsl: number
}

// ─── Incerteza simplificada (VMD0053) ────────────────────────────────────────

function calcUncerteza(_deltaSOC: number, hasLaudoSolo: boolean): number {
  return hasLaudoSolo ? 0.065 : 0.150
}

// ─── Leakage (VMD0054) ───────────────────────────────────────────────────────

function calcularLeakage(
  erT: number,
  crT: number,
  hasPecuaria: boolean,
  params: Record<string, number>,
): { lk: number; fpds: number } {
  const fatLeakage = params['fator_leakage'] ?? 0.05
  const fpds = hasPecuaria ? fatLeakage * 1.5 : fatLeakage
  return {
    lk: (erT + crT) * fpds,
    fpds,
  }
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export function calcularCreditos(
  deltas: DeltasEmissao,
  areaHa: number,
  params: Record<string, number>,
  hasLaudoSolo: boolean = true,
  hasPecuaria: boolean = false,
): ResultadoCreditos {
  const bufferPool = params['buffer_pool'] ?? 0.15

  // UNC
  const uncCo2 = calcUncerteza(deltas.deltaCO2SocWp, hasLaudoSolo)
  const uncN2o = 0.15  // 15% padrão IPCC Tier 1 para N2O

  // ─── ER_t (Eq. 37 VM0042) ────────────────────────────────────────────────
  // Conservadorismo: aplicar (1 - UNC) nos componentes incertos
  const parcelas: ParcelaER[] = [
    { componente: 'ΔCO₂ Combustíveis',  deltaBruto: deltas.deltaCO2Ff,   uncAplicada: 0,      deltaLiquido: deltas.deltaCO2Ff },
    { componente: 'ΔCO₂ Calagem',       deltaBruto: deltas.deltaCO2Lime, uncAplicada: 0,      deltaLiquido: deltas.deltaCO2Lime },
    { componente: 'ΔCH₄ Entérico',      deltaBruto: deltas.deltaCH4Ent,  uncAplicada: uncCo2, deltaLiquido: deltas.deltaCH4Ent  * (1 - uncCo2) },
    { componente: 'ΔCH₄ Esterco',       deltaBruto: deltas.deltaCH4Md,   uncAplicada: uncCo2, deltaLiquido: deltas.deltaCH4Md   * (1 - uncCo2) },
    { componente: 'ΔCH₄ Queima',        deltaBruto: deltas.deltaCH4Bb,   uncAplicada: 0,      deltaLiquido: deltas.deltaCH4Bb },
    { componente: 'ΔN₂O Solo',          deltaBruto: deltas.deltaN2oSoil, uncAplicada: uncN2o, deltaLiquido: deltas.deltaN2oSoil * (1 - uncN2o) },
    { componente: 'ΔN₂O Queima',        deltaBruto: deltas.deltaN2oBb,   uncAplicada: 0,      deltaLiquido: deltas.deltaN2oBb },
  ]

  const erT = parcelas.reduce((sum, p) => sum + p.deltaLiquido, 0)
  const erTBruto = parcelas.reduce((sum, p) => sum + p.deltaBruto, 0)

  // ─── CR_t (Eq. 40 VM0042) ────────────────────────────────────────────────
  const deltaCO2SocNet = deltas.deltaCO2SocWp - deltas.deltaCO2SocBsl
  const I = deltaCO2SocNet > 0 ? 1 : -1
  const crTBruto = deltaCO2SocNet
  const uncCo2Aplicada = uncCo2 * I
  const crT = deltaCO2SocNet * (1 - uncCo2Aplicada)

  // ─── LK_t — Leakage (VMD0054) ────────────────────────────────────────────
  const { lk: lkT, fpds } = calcularLeakage(Math.max(erT, 0), Math.max(crT, 0), hasPecuaria, params)

  // Deduções de incerteza em tCO₂e (Eq. 74)
  const deducaoUncCO2 = Math.abs(deltas.deltaCH4Ent * uncCo2) + Math.abs(deltas.deltaCH4Md * uncCo2)
  const deducaoUncN2O = Math.abs(deltas.deltaN2oSoil * uncN2o)

  const errNet = erT + crT - lkT
  const vcusHa    = errNet > 0 ? errNet * (1 - bufferPool) : 0
  const vcusTotal = vcusHa * areaHa

  return {
    erTTco2eHa:       Math.max(erT, 0),
    crTTco2eHa:       Math.max(crT, 0),
    lkTTco2eHa:       lkT,
    uncCo2,
    uncN2o,
    errNetTco2eHa:    errNet,
    bufferPoolRate:   bufferPool,
    vcusEmitidosHa:   Math.max(vcusHa, 0),
    vcusEmitidosTotal: Math.max(vcusTotal, 0),
    // ER_t
    parcelasER:       parcelas,
    erTBrutoTco2eHa:  erTBruto,
    // CR_t
    deltaCO2SocNet,
    iSinal:           I,
    crTBrutoTco2eHa:  crTBruto,
    uncCo2AplicadaCR: uncCo2Aplicada,
    // Leakage
    fpdsUsado:            fpds,
    hasPecuariaLeakage:   hasPecuaria,
    lkDetalhado: `(${Math.max(erT, 0).toFixed(4)} + ${Math.max(crT, 0).toFixed(4)}) × ${fpds.toFixed(3)} = ${lkT.toFixed(4)}`,
    // Eq. 74
    deducaoUncCO2Tco2eHa: deducaoUncCO2,
    deducaoUncN2OTco2eHa: deducaoUncN2O,
    // Step strings
    errNetStep: `${Math.max(crT,0).toFixed(4)} + ${Math.max(erT,0).toFixed(4)} − ${lkT.toFixed(4)} = ${errNet.toFixed(4)}`,
    vcusStep:   `${errNet.toFixed(4)} × (1 − ${bufferPool}) × ${areaHa} = ${vcusTotal.toFixed(2)}`,
  }
}
