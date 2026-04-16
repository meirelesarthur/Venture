// ─── RothC-26.3 Engine ────────────────────────────────────────────────────────
// Implementação das equações §5.3.1 a §5.3.9 do devGuideV2

import { K_ROTHC, FRACAO_C_MS, HI, RAIZ_PA, DPM_RPM } from './lookup'

// ─── Interfaces locais ────────────────────────────────────────────────────────

export interface DadosClimaMes {
  tempC: number       // temperatura média (°C)
  precipMm: number    // precipitação (mm)
  evapMm: number      // evapotranspiração potencial (mm)
}

export interface DadosTalhaoRothC {
  socPercent: number          // % de carbono orgânico no solo
  bdGCm3: number              // densidade aparente (g/cm³)
  argilaPercent: number       // % argila
  profundidadeCm: number      // profundidade amostrada
}

export interface DadosCulturaRothC {
  cultura: string
  produtividade?: number      // sacas/ha ou t/ha
  unidadeProd?: 'sacas_ha' | 't_ha'
  dataPlantio?: string        // ISO date
  dataColheita?: string       // ISO date
  residuosCampo: boolean
}

// ─── Intermediários RothC expostos para transparência ────────────────────────

export interface IntermediarioRothC {
  // §5.3.9 — Inicialização SOC
  socTotalTcHa: number        // SOC estoque total inicial (tC/ha)
  // §5.3.7 — IOM
  iomTcHa: number             // Matéria Orgânica Inerte (tC/ha)
  socAtivoTcHa: number        // SOC ativo = total − IOM
  // §5.3.8 — Input de Carbono (Harvest Index)
  yieldTHa: number            // produtividade convertida em t MS/ha
  hiUsado: number | null      // Harvest Index da cultura
  raizPaUsado: number         // Razão raiz/parte aérea
  bioAereaTHa: number         // biomassa aérea não colhida (t MS/ha)
  bioRaizTHa: number          // biomassa de raízes (t MS/ha)
  inputCTcHaAno: number       // input de C total (tC/ha/ano)
  fracaoC_MS: number          // constante IPCC 0.45
  // §5.3.6 — Razão DPM/RPM
  tipoInput: string           // 'agricola' | 'pastagem_nao_melhora' | 'floresta'
  dpmRpmRatio: number         // DPM/RPM numérico
  fracDPM: number
  fracRPM: number
  // §5.3.5 — Particionamento CO2 vs BIO+HUM
  argilaPercent: number
  xParticionamento: number    // valor de x na equação
  fracCO2: number
  fracBioHum: number
  // §5.3.2 — Fator A (temperatura, mês 1 como referência)
  fatorA_mes1: number
  tempC_mes1: number
  // §5.3.3 — Fator B (umidade, mês 1 como referência)
  fatorB_mes1: number
  maxTSMD: number
  // §5.3.4 — Fator C
  fatorC_mes1: number         // cobertura no mês 1 (0.6 = vegetado, 1.0 = exposto)
  // §5.3.1 — Decomposição mensal (constantes k por compartimento)
  k_DPM: number
  k_RPM: number
  k_BIO: number
  k_HUM: number
  // Compartimentos finais
  compartimentosFinalDPM: number
  compartimentosFinalRPM: number
  compartimentosFinalBIO: number
  compartimentosFinalHUM: number
  compartimentosFinalIOM: number
  // Conversão final
  deltaSocTcHa: number
  co2Tco2eHaCalc: number      // delta_SOC × (44/12)
}

export interface ResultadoRothC {
  socPorAno: number[]         // tC/ha por ano rodado
  deltaSocTcHa: number        // variação final de SOC (tC/ha)
  co2Tco2eHa: number          // delta_SOC convertido em tCO2e/ha
  compartimentosFinal: { DPM: number; RPM: number; BIO: number; HUM: number; IOM: number }
  intermediarios: IntermediarioRothC
}

// ─── Fator A — temperatura (§5.3.2) ─────────────────────────────────────────

export function calcFatorA(tempC: number): number {
  return 47.9 / (1 + Math.exp(106 / (tempC + 18.27)))
}

// ─── Fator B — umidade via TSMD (§5.3.3) ────────────────────────────────────

export function calcFatorB(
  precipMm: number,
  evapMm: number,
  pctArgila: number,
  profCm: number,
  accTSMD: number,    // acumulado TSMD do mês anterior
): { b: number; novAccTSMD: number; maxTSMD: number } {
  // Max TSMD para 23cm
  const maxTSMD_23 = -(20.0 + 1.3 * pctArgila - 0.01 * pctArgila ** 2)
  // Ajuste para profundidade real
  const maxTSMD = (maxTSMD_23 / 23) * profCm

  let newAcc = accTSMD
  if (0.75 * evapMm > precipMm) {
    newAcc = Math.max(newAcc + (precipMm - 0.75 * evapMm), maxTSMD)
  } else {
    newAcc = Math.min(newAcc + (precipMm - 0.75 * evapMm), 0)
  }

  const threshold = 0.444 * maxTSMD
  let b: number
  if (newAcc >= threshold) {
    b = 1.0
  } else {
    b = 0.2 + 0.8 * (maxTSMD - newAcc) / (maxTSMD - threshold)
  }

  return { b: Math.max(0, Math.min(b, 1)), novAccTSMD: newAcc, maxTSMD }
}

// ─── Fator C — cobertura vegetal (§5.3.4) ────────────────────────────────────

export function calcFatorC(mes: number, dataPlantio?: string, dataColheita?: string): number {
  if (!dataPlantio || !dataColheita) return 1.0  // solo exposto default
  const mesPlantio  = new Date(dataPlantio).getMonth()  // 0-based
  const mesColheita = new Date(dataColheita).getMonth()
  // Simplificado: vegetado se mês está entre plantio e colheita
  const mesAjust = mes % 12
  if (mesPlantio <= mesColheita) {
    return (mesAjust >= mesPlantio && mesAjust <= mesColheita) ? 0.6 : 1.0
  } else {
    // safra que cruza ano (ex: out→fev)
    return (mesAjust >= mesPlantio || mesAjust <= mesColheita) ? 0.6 : 1.0
  }
}

// ─── IOM (§5.3.7) ────────────────────────────────────────────────────────────

export function calcIOM(tocTcHa: number): number {
  return 0.049 * Math.pow(tocTcHa, 1.139)
}

// ─── SOC stock → tC/ha (§5.3.9) ─────────────────────────────────────────────

export function calcSOCstock(socPercent: number, bdGCm3: number, profCm: number): number {
  return (socPercent / 100) * bdGCm3 * (profCm / 100) * 10000
}

// ─── Input de carbono vegetal (§5.3.8) ───────────────────────────────────────

export function calcInputC(dados: DadosCulturaRothC): number {
  const { cultura, produtividade, unidadeProd, residuosCampo } = dados
  if (!produtividade) return 0.3  // default mínimo se não informado

  const hi = HI[cultura] ?? HI['outras']!
  const raizPa = RAIZ_PA[cultura] ?? RAIZ_PA['outras']

  // Converter produtividade para t/ha
  const yieldTHa = unidadeProd === 'sacas_ha' ? produtividade * 0.06 : produtividade

  let inputC = 0

  if (hi !== null) {
    // Cultura com índice de colheita definido
    const bioAerea = (yieldTHa / hi) - yieldTHa   // biomassa aérea não colhida (t MS/ha)
    const bioRaiz  = bioAerea * raizPa
    const bioAereaEfetiva = residuosCampo ? bioAerea : 0  // se retira resíduos, sem aporte aéreo
    inputC = (bioAereaEfetiva + bioRaiz) * FRACAO_C_MS
  } else {
    // Pastagem / cobertura sem HI definido
    const bioAerea = 2.5  // 2.5 t MS/ha média pastagem brachiaria
    const bioRaiz  = bioAerea * raizPa
    inputC = (bioAerea + bioRaiz) * FRACAO_C_MS
  }

  return Math.max(inputC, 0.1)  // mínimo 0.1 tC/ha/ano
}

// Versão detalhada que também retorna os intermediários
function calcInputCDetalhado(dados: DadosCulturaRothC): {
  inputC: number
  yieldTHa: number
  hiUsado: number | null
  raizPaUsado: number
  bioAereaTHa: number
  bioRaizTHa: number
} {
  const { cultura, produtividade, unidadeProd, residuosCampo } = dados
  if (!produtividade) {
    return { inputC: 0.3, yieldTHa: 0, hiUsado: null, raizPaUsado: 0, bioAereaTHa: 0, bioRaizTHa: 0 }
  }

  const hi = HI[cultura] ?? HI['outras']!
  const raizPa = RAIZ_PA[cultura] ?? RAIZ_PA['outras']
  const yieldTHa = unidadeProd === 'sacas_ha' ? produtividade * 0.06 : produtividade

  let inputC = 0
  let bioAerea = 0
  let bioRaiz = 0

  if (hi !== null) {
    bioAerea = (yieldTHa / hi) - yieldTHa
    bioRaiz  = bioAerea * raizPa
    const bioAereaEfetiva = residuosCampo ? bioAerea : 0
    inputC = (bioAereaEfetiva + bioRaiz) * FRACAO_C_MS
  } else {
    bioAerea = 2.5
    bioRaiz  = bioAerea * raizPa
    inputC = (bioAerea + bioRaiz) * FRACAO_C_MS
  }

  return {
    inputC: Math.max(inputC, 0.1),
    yieldTHa,
    hiUsado: hi,
    raizPaUsado: raizPa,
    bioAereaTHa: bioAerea,
    bioRaizTHa: bioRaiz,
  }
}

// ─── Particionamento CO2 vs BIO+HUM (§5.3.5) ─────────────────────────────────

export function calcParticoes(pctArgila: number): { fracCO2: number; fracBioHum: number; x: number } {
  const x = 1.67 * (1.85 + 1.60 * Math.exp(-0.0786 * pctArgila))
  const fracCO2    = x / (x + 1)
  const fracBioHum = 1 / (x + 1)
  return { fracCO2, fracBioHum, x }
}

// ─── Decomposição mensal de um compartimento (§5.3.1) ────────────────────────

export function decompor(Y: number, a: number, b: number, c: number, k: number): {
  Yfinal: number; decomposto: number
} {
  const expoente = -a * b * c * k * (1 / 12)
  const Yfinal = Y * Math.exp(expoente)
  const decomposto = Y * (1 - Math.exp(expoente))
  return { Yfinal, decomposto }
}

// ─── Motor RothC principal ────────────────────────────────────────────────────

export interface CompartimentosRothC {
  DPM: number; RPM: number; BIO: number; HUM: number; IOM: number
}

export function rodarRothC(
  talhao: DadosTalhaoRothC,
  cultura: DadosCulturaRothC,
  clima: DadosClimaMes[],  // array de 12 meses (repetido por N anos)
  nAnos: number = 5,
): ResultadoRothC {
  const { socPercent, bdGCm3, argilaPercent, profundidadeCm } = talhao

  // §5.3.9 — Estoque inicial total SOC (tC/ha)
  const socTotal = calcSOCstock(socPercent, bdGCm3, profundidadeCm)
  // §5.3.7 — IOM
  const IOM = calcIOM(socTotal)
  const socAtivo = socTotal - IOM   // SOC ativo inicial

  // Distribuição inicial proporcional ao equilíbrio teórico
  const compartimentos: CompartimentosRothC = {
    DPM: socAtivo * 0.01,
    RPM: socAtivo * 0.08,
    BIO: socAtivo * 0.02,
    HUM: socAtivo * 0.89,
    IOM,
  }

  // §5.3.5 — Particionamento
  const { fracBioHum, fracCO2, x: xParticionamento } = calcParticoes(argilaPercent)

  // §5.3.8 — Input de carbono detalhado
  const inputDetalhado = calcInputCDetalhado(cultura)
  const inputC = inputDetalhado.inputC

  // §5.3.6 — Razão DPM/RPM
  const tipoInput = ['brachiaria','pastagem_brachiaria','pasto'].includes(cultura.cultura)
    ? 'pastagem_nao_melhora'
    : 'agricola'
  const dpmRpm = DPM_RPM[tipoInput]
  const totalRatioPC = dpmRpm.dpm + dpmRpm.rpm
  const fracDPM = dpmRpm.dpm / totalRatioPC
  const fracRPM = dpmRpm.rpm / totalRatioPC

  // §5.3.2 — Fator A (mês 1, referência)
  const cl0 = clima[0]
  const fatorA_mes1 = calcFatorA(cl0.tempC)

  // §5.3.3 — Fator B (mês 1, referência)
  const fatorBResult_mes1 = calcFatorB(cl0.precipMm, cl0.evapMm, argilaPercent, profundidadeCm, 0)

  // §5.3.4 — Fator C (mês 1, referência)
  const fatorC_mes1 = calcFatorC(0, cultura.dataPlantio, cultura.dataColheita)

  const socPorAno: number[] = []
  let accTSMD = 0

  for (let ano = 0; ano < nAnos; ano++) {
    for (let mes = 0; mes < 12; mes++) {
      const cl = clima[mes % clima.length]
      const a  = calcFatorA(cl.tempC)
      const { b, novAccTSMD } = calcFatorB(cl.precipMm, cl.evapMm, argilaPercent, profundidadeCm, accTSMD)
      accTSMD = novAccTSMD
      const c  = calcFatorC(mes, cultura.dataPlantio, cultura.dataColheita)

      // Input mensal de C (dividido pelos 12 meses do ano)
      const inputMensal = inputC / 12
      compartimentos.DPM += inputMensal * fracDPM
      compartimentos.RPM += inputMensal * fracRPM

      // Decompor cada compartimento ativo
      let totalBioHumFormado = 0
      for (const compNome of ['DPM', 'RPM', 'BIO', 'HUM'] as const) {
        const k = K_ROTHC[compNome]
        const { Yfinal, decomposto } = decompor(compartimentos[compNome], a, b, c, k)
        compartimentos[compNome] = Yfinal
        // Do decomposto: fracCO2 vai para CO2, fracBioHum vai para BIO+HUM
        totalBioHumFormado += decomposto * fracBioHum
      }
      // BIO recebe 46%, HUM recebe 54% do material BIO+HUM formado
      compartimentos.BIO += totalBioHumFormado * 0.46
      compartimentos.HUM += totalBioHumFormado * 0.54
    }

    // SOC total ao final do ano
    const socFinal = compartimentos.DPM + compartimentos.RPM + compartimentos.BIO + compartimentos.HUM + compartimentos.IOM
    socPorAno.push(socFinal)
  }

  const socInicial   = socTotal
  const socFinalCalc = socPorAno[socPorAno.length - 1]
  const deltaSocTcHa  = socFinalCalc - socInicial
  const co2Tco2eHa    = deltaSocTcHa * (44 / 12)

  const intermediarios: IntermediarioRothC = {
    // §5.3.9 Inicialização
    socTotalTcHa: socTotal,
    iomTcHa: IOM,
    socAtivoTcHa: socAtivo,
    // §5.3.8 Harvest Index
    yieldTHa: inputDetalhado.yieldTHa,
    hiUsado: inputDetalhado.hiUsado,
    raizPaUsado: inputDetalhado.raizPaUsado,
    bioAereaTHa: inputDetalhado.bioAereaTHa,
    bioRaizTHa: inputDetalhado.bioRaizTHa,
    inputCTcHaAno: inputC,
    fracaoC_MS: FRACAO_C_MS,
    // §5.3.6 DPM/RPM
    tipoInput,
    dpmRpmRatio: dpmRpm.dpm / dpmRpm.rpm,
    fracDPM,
    fracRPM,
    // §5.3.5 Particionamento
    argilaPercent,
    xParticionamento,
    fracCO2,
    fracBioHum,
    // §5.3.2 Fator A
    fatorA_mes1,
    tempC_mes1: cl0.tempC,
    // §5.3.3 Fator B
    fatorB_mes1: fatorBResult_mes1.b,
    maxTSMD: fatorBResult_mes1.maxTSMD,
    // §5.3.4 Fator C
    fatorC_mes1,
    // §5.3.1 Constantes k
    k_DPM: K_ROTHC['DPM'],
    k_RPM: K_ROTHC['RPM'],
    k_BIO: K_ROTHC['BIO'],
    k_HUM: K_ROTHC['HUM'],
    // Compartimentos finais
    compartimentosFinalDPM: compartimentos.DPM,
    compartimentosFinalRPM: compartimentos.RPM,
    compartimentosFinalBIO: compartimentos.BIO,
    compartimentosFinalHUM: compartimentos.HUM,
    compartimentosFinalIOM: compartimentos.IOM,
    // Conversão final
    deltaSocTcHa,
    co2Tco2eHaCalc: co2Tco2eHa,
  }

  return {
    socPorAno,
    deltaSocTcHa,
    co2Tco2eHa,
    compartimentosFinal: { ...compartimentos },
    intermediarios,
  }
}
