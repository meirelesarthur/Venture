// ─── Cálculo de Créditos Líquidos (§5.7 devGuideV2) ──────────────────────────

export interface ResultadoCreditos {
  erTTco2eHa: number      // reduções de emissão
  crTTco2eHa: number      // remoções de CO2 (SOC)
  lkTTco2eHa: number      // leakage (VMD0054 simplificado)
  uncCo2: number          // incerteza SOC
  uncN2o: number          // incerteza N2O
  errNetTco2eHa: number   // créditos líquidos antes buffer
  bufferPoolRate: number
  vcusEmitidosHa: number
  vcusEmitidosTotal: number
}

interface DeltasEmissao {
  // positivo = reduziu emissão (projeto < baseline)
  deltaCO2Ff: number
  deltaCO2Lime: number
  deltaCH4Ent: number
  deltaCH4Md: number
  deltaCH4Bb: number
  deltaN2oSoil: number
  deltaN2oBb: number
  // SOC
  deltaCO2SocWp: number   // variação SOC projeto (tCO2e/ha)
  deltaCO2SocBsl: number  // variação SOC baseline (tCO2e/ha)
}

// ─── Incerteza simplificada (VMD0053) ────────────────────────────────────────
// UNC = (sqrt(s²) / delta_medio) * 100 * t_0.667
// Para MVP local: usamos estimativas fixas baseadas na qualidade dos dados

function calcUncerteza(_deltaSOC: number, hasLaudoSolo: boolean): number {
  // Se tem laudo de solo: ~6.5% (dados de qualidade)
  // Se sem laudo: ~15%
  return hasLaudoSolo ? 0.065 : 0.150
}

// ─── Leakage (VMD0054) — Deslocamento de atividade ───────────────────────────
// LK_t = FPDS × ER_t × fator_leakage
// FPDS: Fração de Produção Deslocada para fora da área do projeto
// Para propriedades com pecuária ou culturas anuais com alta exportação:
//   assume FPDS = 0.08 (8% conservador se há pecuária) ou 0.05 (só lavoura)
// Referência: VMD0054 §4.1, Tabela 1

function calcularLeakage(
  erT: number,
  crT: number,
  hasPecuaria: boolean,
  params: Record<string, number>,
): number {
  const fatLeakage = params['fator_leakage'] ?? 0.05
  // Fator maior se há pecuária (maior risco de deslocamento do rebanho)
  const fpds = hasPecuaria ? fatLeakage * 1.5 : fatLeakage
  // LK descontado sobre os créditos combinados (ER + CR)
  return (erT + crT) * fpds
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

  // ER_t (Eq. 37 VM0042) — reduções de emissão
  // Conservadorismo VM0042 §8.6.3: aplicar (1 - UNC) nos fatores incertos
  const erT =
    deltas.deltaCO2Ff +
    deltas.deltaCO2Lime +
    deltas.deltaCH4Ent  * (1 - uncCo2) +
    deltas.deltaCH4Md   * (1 - uncCo2) +
    deltas.deltaCH4Bb   +
    deltas.deltaN2oSoil * (1 - uncN2o) +
    deltas.deltaN2oBb

  // CR_t (Eq. 40 VM0042) — remoções de carbono do solo
  // Se projeto acumula mais SOC que baseline: remoção positiva
  const deltaCO2SocNet = deltas.deltaCO2SocWp - deltas.deltaCO2SocBsl
  const I = deltaCO2SocNet > 0 ? 1 : -1
  const crT = deltaCO2SocNet * (1 - uncCo2 * I)

  // LK_t — leakage real (VMD0054 simplificado)
  const lkT = calcularLeakage(Math.max(erT, 0), Math.max(crT, 0), hasPecuaria, params)

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
  }
}
