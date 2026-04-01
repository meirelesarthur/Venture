// ─── Módulo N2O — QA3 (§5.4 devGuideV2) ──────────────────────────────────────

import { NC_SF, NC_OF, N_CONTENT, FRACAO_C_MS, EF_N2O_MD, EF_N2O_BB, CF_RESIDUOS } from './lookup'
import { calcInputC } from './rothc'
import type { DadosCulturaRothC } from './rothc'
import type { FertilizanteSint, FertilizanteOrg, RegistroPecuaria } from '../store/data'

export interface ResultadoN2O {
  n2oFertDirectTco2eHa: number    // direto fertilizantes
  n2oFertIndirectTco2eHa: number  // indireto volat + leach
  n2oEstercoTco2eHa: number       // deposição esterco
  n2oBnfTco2eHa: number           // fixação biológica
  n2oQueimaraTco2eHa: number      // queima de biomassa
  n2oTotalTco2eHa: number         // soma
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

// ─── N2O direto fertilizantes (§5.4.2) ────────────────────────────────────────

function n2oFertDireto(
  fertsInt: FertilizanteSint[],
  fertsOrg: FertilizanteOrg[],
  params: ParamsN2O,
): number {
  let totalNKgHa = 0

  // Sintéticos
  for (const f of fertsInt) {
    const nc = NC_SF[f.tipo] ?? 0.12
    totalNKgHa += f.qtdKgHa * nc
  }
  // Orgânicos
  for (const f of fertsOrg) {
    const nc = NC_OF[f.tipo] ?? 0.015
    totalNKgHa += f.qtdTHa * 1000 * nc  // t/ha → kg/ha
  }

  const ghgFert = params.gwp_n2o * totalNKgHa * params.ef1_n2o * (44 / 28) / 1000
  return ghgFert
}

// ─── N2O indireto — volatilização + lixiviação (§5.4.3) ──────────────────────

function n2oFertIndireto(
  fertsInt: FertilizanteSint[],
  fertsOrg: FertilizanteOrg[],
  params: ParamsN2O,
): number {
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

  // Volatilização
  const n2oVolat = params.gwp_n2o * (nVolatSint + nVolatOrg) * params.ef4_n2o_volat * (44 / 28) / 1000

  // Lixiviação
  const totalN = nSint + nOrg
  const n2oLeach = params.gwp_n2o * totalN * params.frac_leach * params.ef5_n2o_leach * (44 / 28) / 1000

  return n2oVolat + n2oLeach
}

// ─── N2O por esterco (§5.4.4) ─────────────────────────────────────────────────

function n2oEsterco(pecuaria: RegistroPecuaria[], params: ParamsN2O, areaHa: number): number {
  const NEX: Record<string, number> = {
    gado_corte_extensivo: 40, gado_corte_semi: 40, gado_corte_confinamento: 40,
    gado_leite: 70, ovinos: 12, caprinos: 12, equinos: 45,
  }
  let total = 0
  for (const p of pecuaria) {
    const nex = NEX[p.tipoAnimal] ?? 40
    const ms  = p.mesesNaArea / 12
    const fManure = p.quantidade * nex * 1.0 * ms  // AWMS_pasto = 1
    total += params.gwp_n2o * fManure * EF_N2O_MD * (44 / 28) / 1000
  }
  return total / areaHa  // tCO2e/ha
}

// ─── N2O por fixação biológica (§5.4.5) ───────────────────────────────────────

function n2oBnf(cultura: DadosCulturaRothC, params: ParamsN2O): number {
  const nContent = N_CONTENT[cultura.cultura]
  if (!nContent) return 0

  const EF_BNF = 0.01
  const inputC = calcInputC(cultura)
  // Biomassa total leguminosa ≈ inputC / FRACAO_C_MS
  const bioMassa = inputC / FRACAO_C_MS
  const fCr = bioMassa * nContent * 1000  // kg N/ha

  return params.gwp_n2o * fCr * EF_BNF * (44 / 28) / 1000  // tCO2e/ha
}

// ─── N2O por queima de resíduos (baseado em biomassa) ────────────────────────

function n2oQueima(cultura: DadosCulturaRothC, params: ParamsN2O): number {
  if (!cultura.residuosCampo && !cultura.residuosCampo) return 0  // não queima
  // Simplificado
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

  const p: ParamsN2O = {
    gwp_n2o:       params['gwp_n2o']       ?? 265,
    ef1_n2o:       ef1,
    frac_gasf:     params['frac_gasf']     ?? 0.11,
    frac_gasm:     params['frac_gasm']     ?? 0.21,
    frac_leach:    fracLeach,
    ef4_n2o_volat: params['ef4_n2o_volat'] ?? 0.014,
    ef5_n2o_leach: params['ef5_n2o_leach'] ?? 0.011,
  }

  const direto   = n2oFertDireto(fertsInt, fertsOrg, p)
  const indireto = n2oFertIndireto(fertsInt, fertsOrg, p)
  const esterco  = n2oEsterco(pecuaria, p, areaHa)
  const bnf      = n2oBnf(cultura, p)
  const queima   = cultura.residuosCampo === false ? n2oQueima(cultura, p) : 0

  const total = direto + indireto + esterco + bnf + queima

  return {
    n2oFertDirectTco2eHa:   direto,
    n2oFertIndirectTco2eHa: indireto,
    n2oEstercoTco2eHa:      esterco,
    n2oBnfTco2eHa:          bnf,
    n2oQueimaraTco2eHa:     queima,
    n2oTotalTco2eHa:        total,
  }
}
