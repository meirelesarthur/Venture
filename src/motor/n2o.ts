// ─── Módulo N2O — QA3 (§5.4 devGuideV2) ──────────────────────────────────────

import { NC_SF, NC_OF, N_CONTENT, FRACAO_C_MS, EF_N2O_MD, EF_N2O_BB, CF_RESIDUOS } from './lookup'
import { calcInputC } from './rothc'
import type { DadosCulturaRothC } from './rothc'
import type { FertilizanteSint, FertilizanteOrg, RegistroPecuaria } from '../store/data'

export interface ResultadoN2O {
  // Totais finais
  n2oFertDirectTco2eHa: number    // direto fertilizantes
  n2oFertIndirectTco2eHa: number  // indireto volat + leach
  n2oEstercoTco2eHa: number       // deposição esterco
  n2oBnfTco2eHa: number           // fixação biológica
  n2oQueimaraTco2eHa: number      // queima de biomassa
  n2oTotalTco2eHa: number         // soma (Eq.16 VM0042)
  // Intermediários — Eq.18-20 VM0042 (Direto)
  totalNKgHaSint: number          // N total de fertilizantes sintéticos
  totalNKgHaOrg: number           // N total de fertilizantes orgânicos
  totalNKgHaFert: number          // N total combinado
  ef1Usado: number                // EF1 selecionado conforme zona/inibidor
  zonaClimaticaUsada: string
  temInibidor: boolean
  // Intermediários — Eq.21-23 VM0042 (Indireto)
  nVolatSint: number              // N volatilizado de sintéticos (kg N/ha)
  nVolatOrg: number               // N volatilizado de orgânicos (kg N/ha)
  nVolatTotal: number             // N volat total (kg N/ha)
  nLeachTotal: number             // N lixiviado total (kg N/ha)
  ef4Usado: number                // EF4 volatilização (0.014)
  ef5Usado: number                // EF5 lixiviação (0.011)
  fracLeachUsado: number          // 0.24 ou 0 (seco sem irrigação)
  fracGasfUsado: number           // 0.11 ou 0.15 (ureia)
  fracGasmUsado: number           // 0.21
  n2oVolatTco2eHa: number         // sub-total volatilização
  n2oLeachTco2eHa: number         // sub-total lixiviação
  // Intermediários — Eq.26-28 VM0042 (Esterco)
  fManureTotalKgNHa: number       // N depositado por animais (kg N/ha)
  efEstercoUsado: number          // EF_N2O_md (0.004)
  // Intermediários — Eq.24-25 VM0042 (BNF)
  bioMassaLeguminosa: number      // biomassa leguminosa (t MS/ha)
  nContentCultura: number | null  // fração N na biomassa
  fCrBnfKgNHa: number            // N fixado (kg N/ha)
  efBnfUsado: number             // 0.01
}

interface ParamsN2O {
  gwp_n2o: number
  ef1_n2o: number          // EF1 conforme zona + inibidor
  frac_gasf: number        // 0.11 padrão ou 0.15 ureia
  frac_gasm: number        // 0.21
  frac_leach: number       // 0.24 úmido/irrigado, 0 seco
  ef4_n2o_volat: number    // 0.014
  ef5_n2o_leach: number    // 0.011
}

// ─── N2O direto fertilizantes (§5.4.2 / Eq.18-20 VM0042) ─────────────────────

function n2oFertDireto(
  fertsInt: FertilizanteSint[],
  fertsOrg: FertilizanteOrg[],
  params: ParamsN2O,
): {
  total: number
  totalNSint: number
  totalNOrg: number
  totalN: number
} {
  let totalNSint = 0
  let totalNOrg = 0

  // Sintéticos
  for (const f of fertsInt) {
    const nc = NC_SF[f.tipo] ?? 0.12
    totalNSint += f.qtdKgHa * nc
  }
  // Orgânicos
  for (const f of fertsOrg) {
    const nc = NC_OF[f.tipo] ?? 0.015
    totalNOrg += f.qtdTHa * 1000 * nc  // t/ha → kg/ha
  }

  const totalN = totalNSint + totalNOrg
  const total = params.gwp_n2o * totalN * params.ef1_n2o * (44 / 28) / 1000
  return { total, totalNSint, totalNOrg, totalN }
}

// ─── N2O indireto — volatilização + lixiviação (§5.4.3 / Eq.21-23 VM0042) ────

function n2oFertIndireto(
  fertsInt: FertilizanteSint[],
  fertsOrg: FertilizanteOrg[],
  params: ParamsN2O,
): {
  total: number
  nVolatSint: number
  nVolatOrg: number
  nVolatTotal: number
  nLeachTotal: number
  n2oVolat: number
  n2oLeach: number
} {
  let nSint = 0
  let nOrg  = 0
  let nVolatSint = 0

  for (const f of fertsInt) {
    const nc = NC_SF[f.tipo] ?? 0.12
    const kgN = f.qtdKgHa * nc
    nSint += kgN
    // Frac_GASF diferente para ureia
    const fgasf = f.tipo === 'ureia' ? 0.15 : params.frac_gasf
    nVolatSint += kgN * fgasf
  }
  for (const f of fertsOrg) {
    const nc = NC_OF[f.tipo] ?? 0.015
    nOrg += f.qtdTHa * 1000 * nc
  }
  const nVolatOrg = nOrg * params.frac_gasm
  const nVolatTotal = nVolatSint + nVolatOrg

  // Volatilização
  const n2oVolat = params.gwp_n2o * nVolatTotal * params.ef4_n2o_volat * (44 / 28) / 1000

  // Lixiviação
  const totalN = nSint + nOrg
  const nLeachTotal = totalN * params.frac_leach
  const n2oLeach = params.gwp_n2o * nLeachTotal * params.ef5_n2o_leach * (44 / 28) / 1000

  return {
    total: n2oVolat + n2oLeach,
    nVolatSint,
    nVolatOrg,
    nVolatTotal,
    nLeachTotal,
    n2oVolat,
    n2oLeach,
  }
}

// ─── N2O por esterco (§5.4.4 / Eq.26-28 VM0042) ────────────────────────────

function n2oEsterco(
  pecuaria: RegistroPecuaria[],
  params: ParamsN2O,
  areaHa: number,
): { total: number; fManureTotal: number } {
  const NEX: Record<string, number> = {
    gado_corte_extensivo: 40, gado_corte_semi: 40, gado_corte_confinamento: 40,
    gado_leite: 70, ovinos: 12, caprinos: 12, equinos: 45,
  }
  let fManureTotal = 0
  for (const p of pecuaria) {
    const nex = NEX[p.tipoAnimal] ?? 40
    const ms  = p.mesesNaArea / 12
    fManureTotal += p.quantidade * nex * 1.0 * ms  // AWMS_pasto = 1
  }
  const total = params.gwp_n2o * fManureTotal * EF_N2O_MD * (44 / 28) / 1000 / areaHa
  return { total, fManureTotal: fManureTotal / areaHa }
}

// ─── N2O por fixação biológica (§5.4.5 / Eq.24-25 VM0042) ───────────────────

function n2oBnf(
  cultura: DadosCulturaRothC,
  params: ParamsN2O,
): { total: number; bioMassa: number; nContent: number | null; fCrKgN: number } {
  const nContent = N_CONTENT[cultura.cultura] ?? null
  if (!nContent) return { total: 0, bioMassa: 0, nContent: null, fCrKgN: 0 }

  const EF_BNF = 0.01
  const inputC = calcInputC(cultura)
  const bioMassa = inputC / FRACAO_C_MS
  const fCrKgN = bioMassa * nContent * 1000  // kg N/ha

  return {
    total: params.gwp_n2o * fCrKgN * EF_BNF * (44 / 28) / 1000,
    bioMassa,
    nContent,
    fCrKgN,
  }
}

// ─── N2O por queima de resíduos ───────────────────────────────────────────────

function n2oQueima(cultura: DadosCulturaRothC, params: ParamsN2O): number {
  if (!cultura.residuosCampo && !cultura.residuosCampo) return 0  // não queima
  const bioResiduo = calcInputC(cultura) / FRACAO_C_MS  // t MS/ha
  const n2oGg = bioResiduo * CF_RESIDUOS * EF_N2O_BB / 1e6  // Gg N2O
  return params.gwp_n2o * n2oGg * 1000  // tCO2e/ha (muito pequeno)
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export function calcularN2O(
  fertsInt: FertilizanteSint[],
  fertsOrg: FertilizanteOrg[],
  pecuaria: RegistroPecuaria[],
  cultura: DadosCulturaRothC,
  zonaClimatica: 'tropical_umido' | 'tropical_seco',
  usaIrrigacao: boolean,
  params: Record<string, number>,
  areaHa: number,
): ResultadoN2O {
  // Seleciona EF1 conforme zona + inibidor
  const temInibidor = fertsInt.some(f => f.usaInibidor)
  let ef1 = params['ef1_n2o_default'] ?? 0.01
  if (temInibidor) ef1 = params['ef1_n2o_inibidor'] ?? 0.005
  else if (zonaClimatica === 'tropical_umido') ef1 = params['ef1_n2o_umido'] ?? 0.016
  else if (zonaClimatica === 'tropical_seco')  ef1 = params['ef1_n2o_seco']  ?? 0.005

  // Frac_LEACH — 0 se clima seco sem irrigação
  const fracLeach = (zonaClimatica === 'tropical_umido' || usaIrrigacao)
    ? (params['frac_leach'] ?? 0.24)
    : 0

  const fracGasf = params['frac_gasf'] ?? 0.11
  const fracGasm = params['frac_gasm'] ?? 0.21
  const ef4 = params['ef4_n2o_volat'] ?? 0.014
  const ef5 = params['ef5_n2o_leach'] ?? 0.011

  const p: ParamsN2O = {
    gwp_n2o:       params['gwp_n2o']       ?? 265,
    ef1_n2o:       ef1,
    frac_gasf:     fracGasf,
    frac_gasm:     fracGasm,
    frac_leach:    fracLeach,
    ef4_n2o_volat: ef4,
    ef5_n2o_leach: ef5,
  }

  const diretoDet   = n2oFertDireto(fertsInt, fertsOrg, p)
  const indiretoDet = n2oFertIndireto(fertsInt, fertsOrg, p)
  const estercoDet  = n2oEsterco(pecuaria, p, areaHa)
  const bnfDet      = n2oBnf(cultura, p)
  const queima      = cultura.residuosCampo === false ? n2oQueima(cultura, p) : 0

  const total = diretoDet.total + indiretoDet.total + estercoDet.total + bnfDet.total + queima

  return {
    // Totais
    n2oFertDirectTco2eHa:   diretoDet.total,
    n2oFertIndirectTco2eHa: indiretoDet.total,
    n2oEstercoTco2eHa:      estercoDet.total,
    n2oBnfTco2eHa:          bnfDet.total,
    n2oQueimaraTco2eHa:     queima,
    n2oTotalTco2eHa:        total,
    // Direto — Eq.18-20
    totalNKgHaSint: diretoDet.totalNSint,
    totalNKgHaOrg:  diretoDet.totalNOrg,
    totalNKgHaFert: diretoDet.totalN,
    ef1Usado: ef1,
    zonaClimaticaUsada: zonaClimatica,
    temInibidor,
    // Indireto — Eq.21-23
    nVolatSint:       indiretoDet.nVolatSint,
    nVolatOrg:        indiretoDet.nVolatOrg,
    nVolatTotal:      indiretoDet.nVolatTotal,
    nLeachTotal:      indiretoDet.nLeachTotal,
    ef4Usado:         ef4,
    ef5Usado:         ef5,
    fracLeachUsado:   fracLeach,
    fracGasfUsado:    fracGasf,
    fracGasmUsado:    fracGasm,
    n2oVolatTco2eHa:  indiretoDet.n2oVolat,
    n2oLeachTco2eHa:  indiretoDet.n2oLeach,
    // Esterco — Eq.26-28
    fManureTotalKgNHa: estercoDet.fManureTotal,
    efEstercoUsado: EF_N2O_MD,
    // BNF — Eq.24-25
    bioMassaLeguminosa: bnfDet.bioMassa,
    nContentCultura:    bnfDet.nContent,
    fCrBnfKgNHa:        bnfDet.fCrKgN,
    efBnfUsado:         0.01,
  }
}
