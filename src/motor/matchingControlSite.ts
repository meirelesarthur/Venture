/**
 * Motor de Matching: Control Site ↔ Fazenda/Talhão
 * Base normativa: VM0042 v2.2 | Critérios 1–9
 */

import type {
  ControlSite, Fazenda, MatchResult,
  HistoricoManejoAnual, ClasseDeclividade,
} from '@/store/data'

// ─── Utilitários ─────────────────────────────────────────────────────────────

/** Distância haversine entre dois pontos em km */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Converte direção cardinal em graus */
const ASPECT_DEG: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
}

function aspectDiff(a1?: string, a2?: string): number {
  if (!a1 || !a2) return 0
  const d1 = ASPECT_DEG[a1] ?? 0
  const d2 = ASPECT_DEG[a2] ?? 0
  const diff = Math.abs(d1 - d2)
  return Math.min(diff, 360 - diff)
}

/** t de Student bilateral (graus de liberdade de Welch) */
function welchTTest(
  m1: number, sd1: number, n1: number,
  m2: number, sd2: number, n2: number,
): number {
  // Welch t-statistic
  const se1 = sd1 ** 2 / n1
  const se2 = sd2 ** 2 / n2
  const tStat = Math.abs((m1 - m2) / Math.sqrt(se1 + se2 || 0.0001))
  // Graus de liberdade Welch-Satterthwaite
  const df = se1 + se2 > 0
    ? (se1 + se2) ** 2 / (se1 ** 2 / (n1 - 1) + se2 ** 2 / (n2 - 1))
    : 1
  // p-valor aproximado: distribuição t usando regularized incomplete beta
  return approxPValue(tStat, df)
}

/** Aproximação da distribuição t: p-valor bilateral */
function approxPValue(t: number, df: number): number {
  // Usando aproximação normal para df > 30, caso contrário t-approx simples
  if (df >= 30) {
    const z = t
    return 2 * (1 - normalCdf(z))
  }
  // Para df pequeno: aproximação de Hill (1970)
  const x = df / (df + t * t)
  const p = incompleteBetaRegularized(df / 2, 0.5, x)
  return p
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const t = 1 / (1 + p * x)
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return sign * y
}

/** Regularized incomplete beta (simplificada, usando série de Taylor) */
function incompleteBetaRegularized(a: number, b: number, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  // Log do coeficiente beta usando função gama (Stirling log)
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  // Série de potências (bastante boa para x < (a+1)/(a+b+2))
  let sum = 0, term = 1
  for (let k = 0; k < 200; k++) {
    term *= (k === 0 ? 1 : (x * (k - b) / k))
    sum += term / (a + k)
    if (Math.abs(term) < 1e-10) break
  }
  return Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta) * sum
}

function logGamma(x: number): number {
  // Lanczos approximation
  const g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  x--
  let a = c[0]
  const t = x + g + 0.5
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

// ─── Critério 8 — Teste-t SOC ─────────────────────────────────────────────────

interface SocParams { media: number; icLower: number; icUpper: number; n: number }
interface SocFazenda { media: number; sd: number; n: number }

/**
 * Teste-t bilateral de Welch: verifica se SOC do CS e da fazenda são
 * estatisticamente indistinguíveis (α=0.10, IC 90% — VM0042 §8.2)
 */
export function testeSocTBilateral(
  cs: SocParams,
  farm: SocFazenda,
  alpha = 0.10,
): { pass: boolean; pvalor: number } {
  // Deriving SD do CS a partir do IC 90% (t_0.05, df≈n-1)
  // Para IC 90% bilateral: half-width = t(α/2, df) × SE
  // Aproximação: se n >= 5 usa z=1.645; caso contrário t-tabela simplificada
  const tCrit = cs.n >= 30 ? 1.645 : cs.n >= 10 ? 1.812 : cs.n >= 5 ? 2.132 : 2.776
  const seCs = (cs.icUpper - cs.icLower) / (2 * tCrit)
  const sdCs = seCs * Math.sqrt(cs.n)

  const pvalor = welchTTest(cs.media, sdCs, cs.n, farm.media, farm.sd, farm.n)
  return { pass: pvalor > alpha, pvalor }
}

// ─── Critério 9 — Histórico de Manejo ────────────────────────────────────────

export function matchHistoricoManejo(
  csHist: HistoricoManejoAnual[],
  farmHist: HistoricoManejoAnual[],
): { pass: boolean; anosMatchados: number } {
  if (!csHist.length || !farmHist.length) return { pass: false, anosMatchados: 0 }

  // Avaliar os 5 anos mais recentes em comum
  const anos = csHist.map(h => h.ano)
  const anosComuns = farmHist.map(h => h.ano).filter(a => anos.includes(a))
  const anosParaTestar = anosComuns.sort((a, b) => b - a).slice(0, 5)

  if (anosParaTestar.length === 0) return { pass: false, anosMatchados: 0 }

  let anosMatchados = 0
  for (const ano of anosParaTestar) {
    const hCs = csHist.find(h => h.ano === ano)!
    const hFarm = farmHist.find(h => h.ano === ano)!
    const match =
      hCs.preparo_solo === hFarm.preparo_solo &&
      hCs.grupo_funcional === hFarm.grupo_funcional &&
      hCs.remocao_residuos === hFarm.remocao_residuos &&
      hCs.esterco === hFarm.esterco &&
      hCs.composto === hFarm.composto &&
      hCs.irrigacao === hFarm.irrigacao
    if (match) anosMatchados++
  }

  return { pass: anosMatchados === anosParaTestar.length, anosMatchados }
}

// ─── Declividade — tiers VM0042 TabX ─────────────────────────────────────────

const DECLIVIDADE_STEEP: ClasseDeclividade[] = ['moderately_steep', 'steep', 'very_steep']

// ─── Motor principal: 9 critérios ─────────────────────────────────────────────

export interface MatchInput {
  cs: ControlSite
  fazendaId: string
  fazendaLat?: number
  fazendaLng?: number
  fazendaZonaClimatica?: string
  fazendaEcorregiao?: string
  fazendaTexturaFao?: string
  fazendaGrupoSolo?: string
  fazendaDeclividade?: ClasseDeclividade
  fazendaAspecto?: string
  fazendaPreciplMm?: number
  fazendaSocMedia?: number
  fazendaSocSd?: number
  fazendaSocN?: number
  fazendaHistoricoManejo?: HistoricoManejoAnual[]
}

export function rodarMatching(input: MatchInput): Omit<MatchResult, 'id'> {
  const { cs } = input
  const pendentes: string[] = []

  // ── Critério 1: Distância ≤ 250 km ───────────────────────────────────────
  let c1 = false, c1Km = 0
  if (cs.centroide_lat && cs.centroide_lng && input.fazendaLat && input.fazendaLng) {
    c1Km = haversine(cs.centroide_lat, cs.centroide_lng, input.fazendaLat, input.fazendaLng)
    c1 = c1Km <= 250
  } else {
    pendentes.push('C1: Coordenadas ausentes — assumido PASS (rever)')
    c1 = true; c1Km = 0
  }
  if (!c1) pendentes.push(`C1: Distância ${c1Km.toFixed(0)} km > 250 km`)

  // ── Critério 2: Zona Climática IPCC ──────────────────────────────────────
  const c2 = !cs.zona_climatica_ipcc || !input.fazendaZonaClimatica
    ? true // dados ausentes = pendente, não reprovar automaticamente
    : cs.zona_climatica_ipcc === input.fazendaZonaClimatica
  if (!c2) pendentes.push('C2: Zona climática IPCC diferente')

  // ── Critério 3: Ecorregião WWF ────────────────────────────────────────────
  const c3 = !cs.ecorregiao_wwf || !input.fazendaEcorregiao
    ? true
    : cs.ecorregiao_wwf === input.fazendaEcorregiao
  if (!c3) pendentes.push('C3: Ecorregião WWF diferente')

  // ── Critério 4: Textura FAO ───────────────────────────────────────────────
  const c4 = !cs.classe_textural_fao || !input.fazendaTexturaFao
    ? true
    : cs.classe_textural_fao === input.fazendaTexturaFao
  if (!c4) pendentes.push('C4: Classe textural FAO diferente')

  // ── Critério 5: Grupo Solo WRB ────────────────────────────────────────────
  const c5 = !cs.grupo_solo_wrb || !input.fazendaGrupoSolo
    ? true
    : cs.grupo_solo_wrb === input.fazendaGrupoSolo
  if (!c5) pendentes.push('C5: Grupo solo WRB diferente')

  // ── Critério 6: Declividade (+ aspecto se steep) ─────────────────────────
  let c6 = true
  if (cs.classe_declividade && input.fazendaDeclividade) {
    c6 = cs.classe_declividade === input.fazendaDeclividade
    if (c6 && DECLIVIDADE_STEEP.includes(cs.classe_declividade)) {
      c6 = aspectDiff(cs.aspecto_cardinal, input.fazendaAspecto) <= 30
    }
  }
  if (!c6) pendentes.push('C6: Declividade ou aspecto incompatível')

  // ── Critério 7: Precipitação |Δ| ≤ 100 mm ────────────────────────────────
  let c7 = true
  if (cs.precip_media_anual_mm && input.fazendaPreciplMm) {
    c7 = Math.abs(cs.precip_media_anual_mm - input.fazendaPreciplMm) <= 100
  }
  if (!c7) pendentes.push(`C7: Precipitação Δ = ${Math.abs((cs.precip_media_anual_mm ?? 0) - (input.fazendaPreciplMm ?? 0)).toFixed(0)} mm > 100 mm`)

  // ── Critério 8: SOC (teste-t bilateral α=0.10) ────────────────────────────
  let c8: boolean | 'pendente' = 'pendente'
  let c8Pvalor: number | undefined
  const hasCs8 = cs.soc_medio_pct !== undefined && cs.soc_ic_lower !== undefined &&
    cs.soc_ic_upper !== undefined && cs.n_amostras_soc !== undefined
  const hasFarm8 = input.fazendaSocMedia !== undefined && input.fazendaSocN !== undefined

  if (hasCs8 && hasFarm8) {
    const sdFarm = input.fazendaSocSd ?? (input.fazendaSocMedia! * 0.15) // fallback: 15% da média
    const res = testeSocTBilateral(
      { media: cs.soc_medio_pct!, icLower: cs.soc_ic_lower!, icUpper: cs.soc_ic_upper!, n: cs.n_amostras_soc! },
      { media: input.fazendaSocMedia!, sd: sdFarm, n: input.fazendaSocN! }
    )
    c8 = res.pass; c8Pvalor = res.pvalor
    if (!c8) pendentes.push(`C8: SOC significativamente diferente (p=${res.pvalor.toFixed(3)} ≤ 0.10)`)
  } else {
    pendentes.push('C8: Dados de SOC incompletos — critério pendente')
  }

  // ── Critério 9: Histórico de manejo (5 anos) ─────────────────────────────
  let c9 = false, c9Anos = 0
  if (cs.historico_manejo?.length && input.fazendaHistoricoManejo?.length) {
    const res = matchHistoricoManejo(cs.historico_manejo, input.fazendaHistoricoManejo)
    c9 = res.pass; c9Anos = res.anosMatchados
    if (!c9) pendentes.push(`C9: Histórico de manejo incompatível (${c9Anos}/5 anos OK)`)
  } else {
    c9 = true // sem histórico → não reprovar automaticamente no MVP
    pendentes.push('C9: Histórico de manejo ausente — assumido PASS (inserir dados)')
  }

  // ── Score e classificação ─────────────────────────────────────────────────
  const crits = [c1, c2, c3, c4, c5, c6, c7, c8 === true, c9]
  const passCount = crits.filter(Boolean).length
  const score = Math.round((passCount / 9) * 100)
  const matchTotal = crits.every(Boolean)

  // Cobertura parcial: critérios geofísicos 1–7 OK, mas 8 ou 9 pendentes/falhando
  const geofisicoOk = [c1, c2, c3, c4, c5, c6, c7].every(Boolean)
  let statusCobertura: 'coberta' | 'parcial' | 'descoberta'
  if (matchTotal) {
    statusCobertura = 'coberta'
  } else if (geofisicoOk) {
    statusCobertura = 'parcial'
  } else {
    statusCobertura = 'descoberta'
  }

  return {
    controlSiteId: cs.id,
    fazendaId: input.fazendaId,
    calculadoEm: new Date().toISOString(),
    criterios: {
      c1_distancia: c1, c1_distanciaKm: c1Km,
      c2_zonaClimatica: c2,
      c3_ecorregiao: c3,
      c4_texturaFao: c4,
      c5_grupoSolo: c5,
      c6_declividade: c6,
      c7_precipitacao: c7,
      c8_soc: c8, c8_pvalor: c8Pvalor,
      c9_manejo: c9, c9_anosMatchados: c9Anos,
    },
    score,
    matchTotal,
    statusCobertura,
    criteriosPendentes: pendentes,
  }
}

/** Batch: todos os CSs ativos vs. todas as fazendas */
export function rodarMatchingBatch(
  controlSites: ControlSite[],
  fazendas: Fazenda[],
): Omit<MatchResult, 'id'>[] {
  const results: Omit<MatchResult, 'id'>[] = []
  const ativos = controlSites.filter(cs => cs.status_cs !== 'Inativo')
  for (const cs of ativos) {
    for (const fazenda of fazendas) {
      results.push(rodarMatching({ cs, fazendaId: fazenda.id }))
    }
  }
  return results
}
