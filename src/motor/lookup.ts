// ─── Lookup Tables — Apêndice A do devGuideV2 ────────────────────────────────
// Harvest Index, Razão Raiz:Parte-aérea, NC fertilizantes, Parâmetros animais

export const HI: Record<string, number | null> = {
  soja: 0.42, milho: 0.50, trigo: 0.40, arroz: 0.45,
  sorgo: 0.35, algodao: 0.35, cana: 0.50, cafe: 0.30,
  brachiaria: null, crotalaria: null, pastagem_brachiaria: null,
  pasto: null, outras: 0.40,
}

export const RAIZ_PA: Record<string, number> = {
  soja: 0.20, milho: 0.22, trigo: 0.24, arroz: 0.20,
  sorgo: 0.22, algodao: 0.20, cana: 0.15, cafe: 0.30,
  brachiaria: 1.60, crotalaria: 0.40, pastagem_brachiaria: 1.60,
  pasto: 1.60, outras: 0.20,
}

export const N_CONTENT: Record<string, number> = {
  soja: 0.030, crotalaria: 0.025, feijao: 0.028,
}

// NC_SF — teor de N por tipo de fertilizante sintético
export const NC_SF: Record<string, number> = {
  ureia: 0.46, map: 0.11, dap: 0.18,
  sulfato_amonio: 0.21, kcl: 0.00, nitrato_calcio: 0.155,
  npk_formulado: 0.12,
}

// Frac_GASF — fração de N volatilizado por fertilizante sintético
export const FRAC_GASF: Record<string, number> = {
  ureia: 0.15,
  _default: 0.11,
}

// NC_OF — teor N fertilizantes orgânicos
export const NC_OF: Record<string, number> = {
  esterco_bovino: 0.015, cama_frango: 0.030, composto: 0.020, vinhaca: 0.003,
}

// Parâmetros animais IPCC (EF entérico kg CH4/cab/ano, Nex, VS_rate)
export const ANIMAL_PARAMS: Record<string, { ef_ent: number; nex: number; vs_rate: number }> = {
  gado_corte_extensivo:   { ef_ent: 56, nex: 40, vs_rate: 2.9 },
  gado_corte_semi:        { ef_ent: 63, nex: 40, vs_rate: 2.9 },
  gado_corte_confinamento:{ ef_ent: 68, nex: 40, vs_rate: 2.9 },
  gado_leite:             { ef_ent: 83, nex: 70, vs_rate: 3.5 },
  ovinos:                 { ef_ent:  5, nex: 12, vs_rate: 0.5 },
  caprinos:               { ef_ent:  5, nex: 12, vs_rate: 0.4 },
  equinos:                { ef_ent: 18, nex: 45, vs_rate: 3.5 },
}

// EF CO2 combustíveis (tCO2/litro)
export const EF_COMBUSTIVEL: Record<string, number> = {
  diesel:   0.002886,
  gasolina: 0.002310,
  etanol:   0.0,
}

// Constante: fração C na matéria seca
export const FRACAO_C_MS = 0.45

// Taxa de combustão de resíduos (IPCC Table 2.6)
export const CF_RESIDUOS = 0.80

// EF CH4 queima de biomassa (g/kg MS)
export const EF_CH4_BB = 2.7

// EF N2O queima de biomassa (g/kg MS)
export const EF_N2O_BB = 0.07

// EF N2O esterco em pasto
export const EF_N2O_MD = 0.004  // kg N2O-N / kg N

// EF CH4 esterco em pasto (kg CH4/cab/ano)
export const EF_CH4_MD = 1.0

// Proporções DPM/RPM por tipo de aporte
export const DPM_RPM: Record<string, { dpm: number; rpm: number; hum?: number }> = {
  agricola:              { dpm: 1.44, rpm: 1.0 },
  pastagem_nao_melhora:  { dpm: 0.67, rpm: 1.0 },
  floresta:              { dpm: 0.25, rpm: 1.0 },
  fym:                   { dpm: 0.49, rpm: 0.49, hum: 0.02 },
}

// Taxa de decomposição por compartimento RothC (ano⁻¹)
export const K_ROTHC: Record<string, number> = {
  DPM: 10.0, RPM: 0.3, BIO: 0.66, HUM: 0.02,
}
