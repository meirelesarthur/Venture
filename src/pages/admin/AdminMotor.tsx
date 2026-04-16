import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Play, CheckCircle2, RefreshCw, ChevronDown, ChevronRight, Download, FlaskConical } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useDataStore } from '@/store/data'
import { rodarMotorCompleto } from '@/motor'
import type { ResultadoMotor } from '@/store/data'

interface LogEntry { step: string; percent: number }

// ─── Componentes de equação ────────────────────────────────────────────────────

interface ValorIntermediario {
  label: string
  val: string
  destaque?: boolean
}

interface SubEquacaoProps {
  ref?: string       // referência metodológica (ex: Eq.18 VM0042)
  titulo: string
  formula: string
  valores: ValorIntermediario[]
  resultado: string
  calculo?: string
  corResultado?: string
}

function SubEquacao({ ref: refMetod, titulo, formula, valores, resultado, calculo, corResultado = 'text-primary' }: SubEquacaoProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border/30 rounded-lg overflow-hidden bg-background/40">
      <button
        className="flex items-center justify-between w-full px-3 py-2 hover:bg-accent/5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={12} className="text-muted shrink-0" /> : <ChevronRight size={12} className="text-muted shrink-0" />}
          <span className="text-xs font-medium text-foreground/90">{titulo}</span>
          {refMetod && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono">{refMetod}</span>
          )}
        </div>
        <span className={`text-xs font-bold ${corResultado} shrink-0 ml-2`}>{resultado}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/20 pt-2 animate-in fade-in duration-150">
          <div className="bg-primary/5 border border-primary/10 rounded px-2 py-1.5">
            <p className="text-[10px] text-primary/60 mb-0.5">Equação</p>
            <p className="font-mono text-xs font-semibold text-primary">{formula}</p>
          </div>
          {valores.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {valores.map((v) => (
                <div key={v.label} className={`rounded p-2 border ${v.destaque ? 'border-primary/30 bg-primary/5' : 'border-border/20 bg-surface/50'}`}>
                  <p className="text-[10px] text-muted leading-tight">{v.label}</p>
                  <p className={`text-xs font-semibold ${v.destaque ? 'text-primary' : 'text-foreground'}`}>{v.val}</p>
                </div>
              ))}
            </div>
          )}
          {calculo && (
            <div className="bg-secondary/30 rounded px-2 py-1.5">
              <p className="text-[10px] text-muted mb-0.5">Cálculo numérico</p>
              <p className="font-mono text-[11px] text-foreground/80 break-all">{calculo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ModuloCardProps {
  titulo: string
  subtitulo?: string
  resultado: string
  corResultado?: string
  filhos: React.ReactNode
  defaultOpen?: boolean
}

function ModuloCard({ titulo, subtitulo, resultado, corResultado = 'text-success', filhos, defaultOpen = false }: ModuloCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full px-4 py-3 bg-surface/40 hover:bg-accent/5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <div>
            <p className="text-sm font-semibold text-foreground">{titulo}</p>
            {subtitulo && <p className="text-[10px] text-muted">{subtitulo}</p>}
          </div>
        </div>
        <span className={`text-sm font-bold ${corResultado}`}>{resultado}</span>
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-border/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 bg-background/30">
          {filhos}
        </div>
      )}
    </div>
  )
}

// ─── Seção RothC ──────────────────────────────────────────────────────────────

function SecaoRothC({ r, talhaoArea }: { r: ResultadoMotor; talhaoArea: number }) {
  const d = r.detalhesCalculo as any
  if (!d) return null
  const base = d.rothcBase
  const proj = d.rothcProj

  const sn = (v: unknown, dec = 4) => typeof v === 'number' ? v.toFixed(dec) : '—'

  return (
    <ModuloCard
      titulo="Módulo RothC-26.3 — Estoque de Carbono Orgânico (SOC)"
      subtitulo="VM0042 Quantification Approach 1 · §5.3.1–5.3.9"
      resultado={`CR_t = ${r.crTTco2eHa.toFixed(3)} tCO₂e/ha`}
      corResultado="text-success"
      defaultOpen
      filhos={
        <>
          {/* 1. SOC Stock */}
          <SubEquacao
            ref="§5.3.9"
            titulo="1. Inicialização: Estoque de SOC (tC/ha)"
            formula="SOC_stock = (SOC% / 100) × BD × (prof / 100) × 10.000"
            valores={[
              { label: 'SOC% (laudo)', val: `${sn((proj?.socTotal / (1.35 * 30/100 * 10000) * 100), 2)}%`, destaque: false },
              { label: 'BD (g/cm³)', val: '1.35 g/cm³' },
              { label: 'Profundidade', val: '30 cm' },
              { label: 'SOC Total (proj)', val: `${sn(proj?.socTotal)} tC/ha`, destaque: true },
              { label: 'SOC Total (base)', val: `${sn(base?.socTotal)} tC/ha` },
            ]}
            resultado={`${sn(proj?.socTotal)} tC/ha`}
            calculo={`(SOC%/100) × 1.35 × 0.30 × 10000 = ${sn(proj?.socTotal)}`}
          />

          {/* 2. IOM */}
          <SubEquacao
            ref="§5.3.7"
            titulo="2. IOM — Matéria Orgânica Inerte (Falloon et al. 1998)"
            formula="IOM = 0.049 × TOC^1.139"
            valores={[
              { label: 'TOC (proj)', val: `${sn(proj?.socTotal)} tC/ha` },
              { label: 'IOM (proj)', val: `${sn(proj?.iom)} tC/ha`, destaque: true },
              { label: 'SOC Ativo (proj)', val: `${sn(proj?.socAtivo)} tC/ha` },
              { label: 'IOM (base)', val: `${sn(base?.iom)} tC/ha` },
            ]}
            resultado={`IOM = ${sn(proj?.iom)} tC/ha`}
            calculo={`0.049 × ${sn(proj?.socTotal)}^1.139 = ${sn(proj?.iom)}`}
          />

          {/* 3. Input C via Harvest Index */}
          <SubEquacao
            ref="§5.3.8"
            titulo="3. Input de Carbono Vegetal — Harvest Index"
            formula="Input_C = (bio_aérea_ef + bio_raiz) × f_C_MS"
            valores={[
              { label: 'Produtividade (proj)', val: `${sn(proj?.yieldTHa, 2)} t/ha` },
              { label: 'HI utilizado', val: proj?.hiUsado !== null ? String(proj?.hiUsado) : 'N/A (pastagem)' },
              { label: 'Razão raiz/PA', val: sn(proj?.raizPa, 2) },
              { label: 'Bio. aérea (proj)', val: `${sn(proj?.bioAerea, 3)} t MS/ha` },
              { label: 'Bio. raízes (proj)', val: `${sn(proj?.bioRaiz, 3)} t MS/ha` },
              { label: 'f_C_MS (IPCC)', val: '0.45' },
              { label: 'Input C (proj/ano)', val: `${sn(proj?.inputC, 4)} tC/ha/ano`, destaque: true },
              { label: 'Input C (base/ano)', val: `${sn(base?.inputC, 4)} tC/ha/ano` },
            ]}
            resultado={`Input C = ${sn(proj?.inputC, 4)} tC/ha/ano`}
            calculo={`(${sn(proj?.bioAerea, 3)} + ${sn(proj?.bioRaiz, 3)}) × 0.45 = ${sn(proj?.inputC, 4)}`}
          />

          {/* 4. Razão DPM/RPM */}
          <SubEquacao
            ref="§5.3.6"
            titulo="4. Razão DPM/RPM por Tipo de Input Vegetal"
            formula="DPM_RPM = {agricola: 1.44, pastagem_nao_melhora: 0.67, floresta: 0.25}"
            valores={[
              { label: 'Tipo de input', val: String(proj?.tipoInput ?? '—') },
              { label: 'Razão DPM/RPM', val: sn(proj?.dpmRpmRatio, 2), destaque: true },
              { label: 'frac_DPM', val: sn(proj?.fracDPM, 4) },
              { label: 'frac_RPM', val: sn(proj?.fracRPM, 4) },
            ]}
            resultado={`DPM/RPM = ${sn(proj?.dpmRpmRatio, 2)}`}
            calculo={`frac_DPM = ${sn(proj?.fracDPM, 4)} | frac_RPM = ${sn(proj?.fracRPM, 4)}`}
          />

          {/* 5. Fator A */}
          <SubEquacao
            ref="§5.3.2"
            titulo="5. Fator de Temperatura a (mês 1, referência)"
            formula="a = 47.9 / (1 + exp(106 / (T + 18.27)))"
            valores={[
              { label: 'T mês 1 (°C)', val: `${sn(proj?.tempC_mes1, 1)}°C` },
              { label: 'Fator a', val: sn(proj?.fatorA_mes1, 4), destaque: true },
            ]}
            resultado={`a = ${sn(proj?.fatorA_mes1, 4)}`}
            calculo={`47.9 / (1 + exp(106 / (${sn(proj?.tempC_mes1, 1)} + 18.27))) = ${sn(proj?.fatorA_mes1, 4)}`}
          />

          {/* 6. Fator B */}
          <SubEquacao
            ref="§5.3.3"
            titulo="6. Fator de Umidade b — TSMD (mês 1, referência)"
            formula="b = 0.2 + 0.8 × (maxTSMD − acc_TSMD) / (maxTSMD − 0.444×maxTSMD)"
            valores={[
              { label: 'maxTSMD (mm)', val: sn(proj?.maxTSMD, 2) },
              { label: 'Fator b', val: sn(proj?.fatorB_mes1, 4), destaque: true },
            ]}
            resultado={`b = ${sn(proj?.fatorB_mes1, 4)}`}
          />

          {/* 7. Fator C */}
          <SubEquacao
            ref="§5.3.4"
            titulo="7. Fator de Cobertura do Solo c"
            formula="c = 0.6 (solo vegetado entre plantio-colheita) | c = 1.0 (solo exposto)"
            valores={[
              { label: 'Fator c mês 1', val: proj?.fatorC_mes1 === 0.6 ? '0.6 (vegetado)' : '1.0 (exposto)', destaque: true },
            ]}
            resultado={`c = ${sn(proj?.fatorC_mes1, 1)}`}
          />

          {/* 8. Decomposição mensal */}
          <SubEquacao
            ref="§5.3.1"
            titulo="8. Decomposição Mensal por Compartimento (constantes k)"
            formula="Y_final = Y × exp(−a×b×c×k×t) | decomposto = Y×(1−exp(−a×b×c×k×t))"
            valores={[
              { label: 'k_DPM', val: sn(proj?.k_DPM, 1), destaque: true },
              { label: 'k_RPM', val: sn(proj?.k_RPM, 2) },
              { label: 'k_BIO', val: sn(proj?.k_BIO, 2) },
              { label: 'k_HUM', val: sn(proj?.k_HUM, 4) },
              { label: 'DPM final (proj)', val: `${sn(proj?.compFinalDPM, 4)} tC/ha` },
              { label: 'RPM final (proj)', val: `${sn(proj?.compFinalRPM, 4)} tC/ha` },
              { label: 'BIO final (proj)', val: `${sn(proj?.compFinalBIO, 4)} tC/ha` },
              { label: 'HUM final (proj)', val: `${sn(proj?.compFinalHUM, 4)} tC/ha` },
              { label: 'IOM final (proj)', val: `${sn(proj?.compFinalIOM, 4)} tC/ha` },
            ]}
            resultado={`t = 1/12 ano por passo`}
          />

          {/* 9. Particionamento */}
          <SubEquacao
            ref="§5.3.5"
            titulo="9. Particionamento CO₂ vs BIO+HUM por % Argila"
            formula="x = 1.67×(1.85 + 1.60×exp(−0.0786×argila)); frac_CO₂=x/(x+1); frac_BioHum=1/(x+1)"
            valores={[
              { label: '% Argila', val: `${sn(proj?.argilaPercent ?? d?.rothcProj?.argilaPercent, 1)}%` },
              { label: 'x (calc)', val: sn(proj?.xParticao, 4) },
              { label: 'frac_CO₂', val: sn(proj?.fracCO2, 4) },
              { label: 'frac_BioHum', val: sn(proj?.fracBioHum, 4), destaque: true },
              { label: 'BIO (46%)', val: '46% do BioHum formado' },
              { label: 'HUM (54%)', val: '54% do BioHum formado' },
            ]}
            resultado={`frac_BioHum = ${sn(proj?.fracBioHum, 4)}`}
            calculo={`x = 1.67×(1.85+1.60×exp(-0.0786×argila)) = ${sn(proj?.xParticao, 4)}`}
          />

          {/* 10. Conversão SOC → CO₂ */}
          <SubEquacao
            ref="§5.3.9"
            titulo="10. Conversão SOC → CO₂e (Equação Final)"
            formula="CR_t = (ΔC_proj − ΔC_baseline) × (44/12)"
            valores={[
              { label: 'ΔSOC Projeto', val: `${sn(proj?.deltaSoc, 4)} tC/ha` },
              { label: 'ΔSOC Baseline', val: `${sn(base?.deltaSoc, 4)} tC/ha` },
              { label: 'ΔSOC Líquido', val: `${sn((proj?.deltaSoc ?? 0) - (base?.deltaSoc ?? 0), 4)} tC/ha` },
              { label: 'Fator 44/12', val: '3.6667' },
              { label: 'CR_t', val: `${r.crTTco2eHa.toFixed(4)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`CR_t = ${r.crTTco2eHa.toFixed(4)} tCO₂e/ha`}
            corResultado="text-success"
            calculo={`(${sn(proj?.deltaSoc, 4)} − ${sn(base?.deltaSoc, 4)}) × 3.667 = ${r.crTTco2eHa.toFixed(4)}`}
          />
        </>
      }
    />
  )
}

// ─── Seção N₂O ───────────────────────────────────────────────────────────────

function SecaoN2O({ r }: { r: ResultadoMotor }) {
  const d = r.detalhesCalculo as any
  if (!d) return null
  const proj = d.n2oProj
  const base = d.n2oBase
  const sn = (v: unknown, dec = 4) => typeof v === 'number' ? v.toFixed(dec) : '—'

  return (
    <ModuloCard
      titulo="Módulo N₂O — Emissão de Óxido Nitroso"
      subtitulo="VM0042 §8.4 · Equações 16–28"
      resultado={`ΔN₂O = ${r.deltaN2oTco2eHa.toFixed(4)} tCO₂e/ha`}
      corResultado={r.deltaN2oTco2eHa > 0 ? 'text-success' : 'text-warning'}
      filhos={
        <>
          {/* Eq.16 Total */}
          <SubEquacao
            ref="Eq.16 VM0042"
            titulo="1. N₂O Total do Solo"
            formula="N₂O_soil = N₂O_fert_dir + N₂O_fert_ind + N₂O_esterco + N₂O_BNF"
            valores={[
              { label: 'Zona climática', val: String(proj?.zonaClimatica) },
              { label: 'Tem inibidor?', val: proj?.temInibidor ? 'Sim' : 'Não' },
              { label: 'EF1 selecionado', val: sn(proj?.ef1Usado), destaque: true },
              { label: 'N₂O direto (proj)', val: `${sn(proj?.n2oDireto)} tCO₂e/ha` },
              { label: 'N₂O indir. (proj)', val: `${sn(proj?.n2oIndireto ?? ((proj?.n2oVolat ?? 0) + (proj?.n2oLeach ?? 0)))} tCO₂e/ha` },
              { label: 'N₂O esterco (proj)', val: `${sn(proj?.n2oEsterco)} tCO₂e/ha` },
              { label: 'N₂O BNF (proj)', val: `${sn(proj?.n2oBnf)} tCO₂e/ha` },
              { label: 'N₂O Total (proj)', val: `${sn(proj?.n2oTotal)} tCO₂e/ha`, destaque: true },
              { label: 'N₂O Total (base)', val: `${sn(base?.n2oTotal)} tCO₂e/ha` },
            ]}
            resultado={`${sn(proj?.n2oTotal)} tCO₂e/ha`}
            calculo={`${sn(proj?.n2oDireto)} + ${sn(proj?.n2oVolat)} + ${sn(proj?.n2oLeach)} + ${sn(proj?.n2oEsterco)} + ${sn(proj?.n2oBnf)} = ${sn(proj?.n2oTotal)}`}
          />

          {/* Eq.18-20 Direto */}
          <SubEquacao
            ref="Eq.18-20 VM0042"
            titulo="2. Emissão Direta por Fertilizantes"
            formula="N₂O_dir = GWP_N₂O × Σ(F_N × EF1) × (44/28) / 1000"
            valores={[
              { label: 'N total sint. (kg N/ha)', val: sn(proj?.totalNSint, 2) },
              { label: 'N total org. (kg N/ha)', val: sn(proj?.totalNOrg, 2) },
              { label: 'N total fert. (kg N/ha)', val: sn(proj?.totalNFert, 2), destaque: true },
              { label: 'EF1 selecionado', val: sn(proj?.ef1Usado) },
              { label: 'GWP N₂O', val: '265' },
              { label: 'Fator (44/28)', val: '1.5714' },
              { label: 'N₂O direto', val: `${sn(proj?.n2oDireto)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn(proj?.n2oDireto)} tCO₂e/ha`}
            calculo={`265 × ${sn(proj?.totalNFert, 2)} × ${sn(proj?.ef1Usado)} × 1.5714 / 1000 = ${sn(proj?.n2oDireto)}`}
          />

          {/* Eq.21-23 Indireto */}
          <SubEquacao
            ref="Eq.21-23 VM0042"
            titulo="3. Emissão Indireta — Volatilização + Lixiviação"
            formula="N₂O_vol = GWP×(N_sint×Frac_GASF + N_org×Frac_GASM)×EF4×(44/28)/1000 | N₂O_leach = GWP×N_total×Frac_LEACH×EF5×(44/28)/1000"
            valores={[
              { label: 'N volat. sint.', val: `${sn(proj?.nVolatSint, 2)} kg N/ha` },
              { label: 'N volat. org.', val: `${sn(proj?.nVolatOrg, 2)} kg N/ha` },
              { label: 'N volat. total', val: `${sn(proj?.nVolatTotal, 2)} kg N/ha`, destaque: true },
              { label: 'Frac_GASF usado', val: sn(proj?.fracGasfUsado) },
              { label: 'Frac_GASM', val: sn(proj?.fracGasmUsado) },
              { label: 'EF4 (volatil.)', val: sn(proj?.ef4Usado) },
              { label: 'N₂O volatilização', val: `${sn(proj?.n2oVolat)} tCO₂e/ha` },
              { label: 'N lixiviado', val: `${sn(proj?.nLeachTotal, 2)} kg N/ha` },
              { label: 'Frac_LEACH', val: sn(proj?.fracLeach) },
              { label: 'EF5 (lixiviação)', val: sn(proj?.ef5Usado) },
              { label: 'N₂O lixiviação', val: `${sn(proj?.n2oLeach)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn((proj?.n2oVolat ?? 0) + (proj?.n2oLeach ?? 0))} tCO₂e/ha`}
          />

          {/* Eq.26-28 Esterco */}
          <SubEquacao
            ref="Eq.26-28 VM0042"
            titulo="4. N₂O por Deposição de Esterco"
            formula="F_manure = Pop × Nex × AWMS_pasto × (meses/12) | N₂O_md = GWP × F_manure × EF_N₂O_md × (44/28)"
            valores={[
              { label: 'F_manure (kg N/ha)', val: sn(proj?.fManure, 2) },
              { label: 'AWMS pasto', val: '1.0 (deposição direta)' },
              { label: 'EF_N₂O_md', val: sn(proj?.efEsterco) },
              { label: 'N₂O esterco', val: `${sn(proj?.n2oEsterco)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn(proj?.n2oEsterco)} tCO₂e/ha`}
          />

          {/* Eq.24-25 BNF */}
          <SubEquacao
            ref="Eq.24-25 VM0042"
            titulo="5. N₂O por Fixação Biológica de Nitrogênio (BNF)"
            formula="F_CR = bio_leg × N_content × 1000 | N₂O_BNF = GWP × F_CR × EF_BNF × (44/28) / 1000"
            valores={[
              { label: 'Biomassa leguminosa', val: `${sn(proj?.bioMassaLeg, 3)} t MS/ha` },
              { label: 'N_content cultura', val: proj?.nContent !== null ? sn(proj?.nContent) : 'N/A (não leguminosa)' },
              { label: 'F_CR (kg N/ha)', val: sn(proj?.fCrBnf, 2) },
              { label: 'EF_BNF', val: sn(proj?.efBnf) },
              { label: 'N₂O BNF', val: `${sn(proj?.n2oBnf)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn(proj?.n2oBnf)} tCO₂e/ha`}
          />
        </>
      }
    />
  )
}

// ─── Seção CH₄ ────────────────────────────────────────────────────────────────

function SecaoCH4({ r }: { r: ResultadoMotor }) {
  const d = r.detalhesCalculo as any
  if (!d) return null
  const proj = d.ch4Proj
  const sn = (v: unknown, dec = 4) => typeof v === 'number' ? v.toFixed(dec) : '—'

  return (
    <ModuloCard
      titulo="Módulo CH₄ — Metano Entérico + Manejo"
      subtitulo="VM0042 §8.4 · Equações 11–14"
      resultado={`ΔCH₄ = ${r.deltaCh4Tco2eHa.toFixed(4)} tCO₂e/ha`}
      corResultado={r.deltaCh4Tco2eHa > 0 ? 'text-success' : 'text-warning'}
      filhos={
        <>
          {/* Eq.11 Entérico */}
          <SubEquacao
            ref="Eq.11 VM0042"
            titulo="1. CH₄ por Fermentação Entérica"
            formula="CH₄_ent = (GWP_CH₄ × Σ(Pop × EF_ent)) / (1000 × área)"
            valores={[
              { label: 'GWP CH₄', val: sn(proj?.gwpCH4, 0) },
              { label: 'Pop. total animais', val: sn(proj?.popAnimais, 0) },
              { label: 'EF médio pond. (kg/cab/ano)', val: sn(proj?.efEntMedioKgCab, 1) },
              { label: 'CH₄ ent. total (kg CH₄)', val: sn(proj?.ch4EntKgTotal, 2) },
              { label: 'CH₄ entérico', val: `${sn(proj?.ch4Enterico)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn(proj?.ch4Enterico)} tCO₂e/ha`}
          />

          {/* Eq.12-13 Esterco */}
          <SubEquacao
            ref="Eq.12-13 VM0042"
            titulo="2. CH₄ por Deposição de Esterco"
            formula="CH₄_md = (GWP_CH₄ × Σ(Pop × VS_rate × 365 × EF_CH4_md / 1000)) / (1000 × área)"
            valores={[
              { label: 'VS rate médio (kg/dia)', val: sn(proj?.vsRateMedio, 2) },
              { label: 'EF_CH₄_md (pasto)', val: sn(proj?.efCH4md) },
              { label: 'CH₄ esterco (kg CH₄/ha)', val: sn(proj?.ch4EstercoKgHa, 3) },
              { label: 'CH₄ esterco', val: `${sn(proj?.ch4Esterco)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn(proj?.ch4Esterco)} tCO₂e/ha`}
          />

          {/* Eq.14 Queima */}
          <SubEquacao
            ref="Eq.14 VM0042"
            titulo="3. CH₄ por Queima de Biomassa"
            formula="MB = bio_aérea × CF | CH₄_bb = (GWP_CH₄ × MB × 1000 × EF_CH₄_bb / 1000) / 1000"
            valores={[
              { label: 'Bio. aérea resíduos (t MS/ha)', val: sn(proj?.bioAeraeResd, 3) },
              { label: 'CF (frac. combustão)', val: sn(proj?.cf, 2) },
              { label: 'MB queimado (t MS/ha)', val: sn(proj?.mbQueimado, 4) },
              { label: 'EF_CH₄_bb (g/kg MS)', val: sn(proj?.efCH4bb, 1) },
              { label: 'CH₄ queima (kg/ha)', val: sn(proj?.ch4QueimaKgHa, 4) },
              { label: 'CH₄ queima', val: `${sn(proj?.ch4Queima)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn(proj?.ch4Queima)} tCO₂e/ha`}
          />
        </>
      }
    />
  )
}

// ─── Seção CO₂ ───────────────────────────────────────────────────────────────

function SecaoCO2({ r }: { r: ResultadoMotor }) {
  const d = r.detalhesCalculo as any
  if (!d) return null
  const proj = d.co2Proj
  const sn = (v: unknown, dec = 4) => typeof v === 'number' ? v.toFixed(dec) : '—'

  return (
    <ModuloCard
      titulo="Módulo CO₂ — Combustíveis Fósseis e Calagem"
      subtitulo="VM0042 Eq.6-9 / Eq.52-53"
      resultado={`CO₂ total = ${(r.co2FfTco2eHa + r.co2LimeTco2eHa).toFixed(4)} tCO₂e/ha`}
      corResultado="text-warning"
      filhos={
        <>
          {/* Eq.52 Combustíveis */}
          <SubEquacao
            ref="Eq.6-7 / Eq.52 VM0042"
            titulo="1. CO₂ por Combustíveis Fósseis"
            formula="CO₂_ff = Σ (litros_operação × EF_combustível) / área_ha"
            valores={[
              { label: 'EF Diesel', val: `${sn(proj?.efDiesel)} tCO₂/L` },
              { label: 'EF Gasolina', val: `${sn(proj?.efGasolina)} tCO₂/L` },
              ...(proj?.detalhesCombust ?? []).map((op: any) => ({
                label: `${op.operacao} (${op.combustivel})`, val: `${sn(op.litros, 1)}L × ${sn(op.efUsado)} = ${sn(op.co2TcO2eHa)} tCO₂/ha`, destaque: false
              })),
              { label: 'CO₂_ff total', val: `${sn(r.co2FfTco2eHa)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn(r.co2FfTco2eHa)} tCO₂e/ha`}
            corResultado="text-warning"
          />

          {/* Eq.53 Calagem */}
          <SubEquacao
            ref="Eq.8-9 / Eq.53 VM0042"
            titulo="2. CO₂ por Calagem"
            formula="CO₂_lime = (M_calc × EF_calc + M_dol × EF_dol) × (44/12)"
            valores={[
              { label: 'EF Calcítico', val: `${sn(proj?.efCalcitico, 2)} tC/t` },
              { label: 'EF Dolomítico', val: `${sn(proj?.efDolomitico, 2)} tC/t` },
              { label: 'Fator C→CO₂', val: sn(proj?.fatorCCO2, 4) },
              ...(proj?.detalhesCalc ?? []).map((c: any) => ({
                label: c.tipo, val: `${sn(c.qtdTHa, 2)} t/ha × ${sn(c.efUsado, 2)} × 3.667 = ${sn(c.co2TcO2eHa)} tCO₂/ha`, destaque: false
              })),
              { label: 'CO₂_lime total', val: `${sn(r.co2LimeTco2eHa)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`${sn(r.co2LimeTco2eHa)} tCO₂e/ha`}
            corResultado="text-warning"
          />
        </>
      }
    />
  )
}

// ─── Seção Remoções Líquidas ──────────────────────────────────────────────────

function SecaoCreditos({ r, talhaoArea }: { r: ResultadoMotor; talhaoArea: number }) {
  const d = r.detalhesCalculo as any
  if (!d) return null
  const cred = d.creditos
  const sn = (v: unknown, dec = 4) => typeof v === 'number' ? v.toFixed(dec) : '—'

  return (
    <ModuloCard
      titulo="Remoções Líquidas + VCUs — Cálculo Final"
      subtitulo="VM0042 Eq.37, 40, 74 · VMD0053 · VMD0054"
      resultado={`VCUs = ${r.vcusEmitidosTotal.toFixed(1)} tCO₂e`}
      corResultado="text-success text-base font-bold"
      filhos={
        <>
          {/* Eq.37 ER_t */}
          <SubEquacao
            ref="Eq.37 VM0042"
            titulo="1. Reduções de Emissão — ER_t"
            formula="ER_t = Σ (Δemissão_i × (1 − UNC_i))"
            valores={[
              ...(cred?.parcelasER ?? []).map((p: any) => ({
                label: p.componente,
                val: `Δ=${sn(p.deltaBruto)} × (1-${sn(p.uncAplicada)}) = ${sn(p.deltaLiquido)}`,
                destaque: false,
              })),
              { label: 'UNC CH₄ / SOC', val: `${((r.uncCo2 ?? 0)*100).toFixed(1)}%` },
              { label: 'UNC N₂O', val: `${((r.uncN2o ?? 0)*100).toFixed(1)}%` },
              { label: 'ER_t bruto', val: `${sn(cred?.erTBruto)} tCO₂e/ha` },
              { label: 'ER_t líquido', val: `${r.erTTco2eHa.toFixed(4)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`ER_t = ${r.erTTco2eHa.toFixed(4)} tCO₂e/ha`}
            corResultado="text-primary"
          />

          {/* Eq.40 CR_t */}
          <SubEquacao
            ref="Eq.40 VM0042"
            titulo="2. Remoções de CO₂ — CR_t"
            formula="CR_t = (ΔC_SOC_proj − ΔC_SOC_base) × (44/12) × (1 − UNC_CO₂ × I)"
            valores={[
              { label: 'ΔSOC líquido (tCO₂e/ha)', val: sn(cred?.deltaCO2SocNet) },
              { label: 'I (sinal direção)', val: cred?.iSinal === 1 ? '+1 (remoção)' : '-1 (emissão)', destaque: false },
              { label: 'UNC_CO₂ × I', val: sn(cred?.uncCo2AplicadaCR) },
              { label: 'CR_t bruto', val: `${sn(cred?.crTBruto)} tCO₂e/ha` },
              { label: 'CR_t', val: `${r.crTTco2eHa.toFixed(4)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`CR_t = ${r.crTTco2eHa.toFixed(4)} tCO₂e/ha`}
            corResultado="text-success"
            calculo={`${sn(cred?.deltaCO2SocNet)} × (1 − ${sn(cred?.uncCo2AplicadaCR)}) = ${r.crTTco2eHa.toFixed(4)}`}
          />

          {/* VMD0054 Leakage */}
          <SubEquacao
            ref="VMD0054"
            titulo="3. Leakage — Deslocamento de Atividade"
            formula="LK_t = (ER_t + CR_t) × FPDS"
            valores={[
              { label: 'Tem pecuária?', val: cred?.hasPecuariaLeakage ? 'Sim (+50% FPDS)' : 'Não' },
              { label: 'FPDS usado', val: sn(cred?.fpdsUsado) },
              { label: 'LK_t', val: `${r.lkTTco2eHa.toFixed(4)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`LK_t = ${r.lkTTco2eHa.toFixed(4)} tCO₂e/ha`}
            corResultado="text-warning"
            calculo={cred?.lkDetalhado ?? '—'}
          />

          {/* Eq.74 Dedução Incerteza */}
          <SubEquacao
            ref="Eq.74 VM0042"
            titulo="4. Dedução de Incerteza por Componente"
            formula="Deducao_UNC = |Δcomponente × UNC| em tCO₂e/ha"
            valores={[
              { label: 'Dedução UNC SOC/CH₄', val: `${sn(cred?.deducaoUncCO2)} tCO₂e/ha` },
              { label: 'Dedução UNC N₂O', val: `${sn(cred?.deducaoUncN2O)} tCO₂e/ha` },
              { label: 'Total dedução', val: `${sn((cred?.deducaoUncCO2 ?? 0) + (cred?.deducaoUncN2O ?? 0))} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`UNC total = ${sn((cred?.deducaoUncCO2 ?? 0) + (cred?.deducaoUncN2O ?? 0))} tCO₂e/ha`}
            corResultado="text-muted"
          />

          {/* ERR_net */}
          <SubEquacao
            titulo="5. ERR_net — Créditos Líquidos Antes do Buffer"
            formula="ERR_net = CR_t + ER_t − LK_t"
            valores={[
              { label: 'CR_t', val: `${r.crTTco2eHa.toFixed(4)} tCO₂e/ha` },
              { label: 'ER_t', val: `${r.erTTco2eHa.toFixed(4)} tCO₂e/ha` },
              { label: 'LK_t', val: `${r.lkTTco2eHa.toFixed(4)} tCO₂e/ha` },
              { label: 'ERR_net', val: `${r.errNetTco2eHa.toFixed(4)} tCO₂e/ha`, destaque: true },
            ]}
            resultado={`ERR_net = ${r.errNetTco2eHa.toFixed(4)} tCO₂e/ha`}
            corResultado="text-primary font-bold"
            calculo={cred?.errNetStep ?? '—'}
          />

          {/* VCUs */}
          <SubEquacao
            titulo="6. VCUs Emitidos — Resultado Final"
            formula="VCUs = ERR_net × (1 − buffer_pool) × área_ha"
            valores={[
              { label: 'ERR_net', val: `${r.errNetTco2eHa.toFixed(4)} tCO₂e/ha` },
              { label: 'Buffer pool', val: `${(r.bufferPoolRate * 100).toFixed(0)}%` },
              { label: 'Área', val: `${talhaoArea} ha` },
              { label: 'VCUs/ha', val: `${r.vcusEmitidosHa.toFixed(4)} tCO₂e/ha`, destaque: true },
              { label: 'VCUs totais', val: `${r.vcusEmitidosTotal.toFixed(2)} tCO₂e`, destaque: true },
            ]}
            resultado={`VCUs = ${r.vcusEmitidosTotal.toFixed(1)} tCO₂e`}
            corResultado="text-success font-bold"
            calculo={cred?.vcusStep ?? '—'}
          />
        </>
      }
    />
  )
}

// ─── Exportação CSV ───────────────────────────────────────────────────────────

function exportarCSV(r: ResultadoMotor, talhaoNome: string, areaHa: number) {
  const d = r.detalhesCalculo as any
  if (!d) { toast.error('Sem dados intermediários para exportar.'); return }

  const linhas: string[] = [
    '# Venture Carbon — Exportação de Cálculos Detalhados',
    `# Talhão: ${talhaoNome} | Área: ${areaHa} ha | Motor: v${r.versaoMotor} | Rodado em: ${new Date(r.rodadoEm).toLocaleString('pt-BR')}`,
    '',
    'MODULO,EQUACAO,PARAMETRO,BASELINE,PROJETO,UNIDADE',
  ]

  const row = (mod: string, eq: string, param: string, base: unknown, proj: unknown, unit: string) =>
    `"${mod}","${eq}","${param}","${String(base)}","${String(proj)}","${unit}"`

  const sn = (v: unknown, dec = 6) => typeof v === 'number' ? v.toFixed(dec) : String(v ?? '—')

  // RothC
  linhas.push(row('RothC', '§5.3.9', 'SOC_stock (tC/ha)', sn(d.rothcBase?.socTotal), sn(d.rothcProj?.socTotal), 'tC/ha'))
  linhas.push(row('RothC', '§5.3.7', 'IOM (tC/ha)', sn(d.rothcBase?.iom), sn(d.rothcProj?.iom), 'tC/ha'))
  linhas.push(row('RothC', '§5.3.7', 'SOC_ativo (tC/ha)', sn(d.rothcBase?.socAtivo), sn(d.rothcProj?.socAtivo), 'tC/ha'))
  linhas.push(row('RothC', '§5.3.8', 'Input_C (tC/ha/ano)', sn(d.rothcBase?.inputC), sn(d.rothcProj?.inputC), 'tC/ha/ano'))
  linhas.push(row('RothC', '§5.3.8', 'Harvest_Index', String(d.rothcBase?.hiUsado ?? 'N/A'), String(d.rothcProj?.hiUsado ?? 'N/A'), '—'))
  linhas.push(row('RothC', '§5.3.8', 'Razao_raiz/PA', sn(d.rothcBase?.raizPa), sn(d.rothcProj?.raizPa), '—'))
  linhas.push(row('RothC', '§5.3.8', 'Bio_aerea (t MS/ha)', sn(d.rothcBase?.bioAerea), sn(d.rothcProj?.bioAerea), 't MS/ha'))
  linhas.push(row('RothC', '§5.3.8', 'Bio_raiz (t MS/ha)', sn(d.rothcBase?.bioRaiz), sn(d.rothcProj?.bioRaiz), 't MS/ha'))
  linhas.push(row('RothC', '§5.3.6', 'frac_DPM', sn(d.rothcBase?.fracDPM), sn(d.rothcProj?.fracDPM), '—'))
  linhas.push(row('RothC', '§5.3.6', 'frac_RPM', sn(d.rothcBase?.fracRPM), sn(d.rothcProj?.fracRPM), '—'))
  linhas.push(row('RothC', '§5.3.5', 'x_particionamento', sn(d.rothcBase?.xParticao), sn(d.rothcProj?.xParticao), '—'))
  linhas.push(row('RothC', '§5.3.5', 'frac_CO2', sn(d.rothcBase?.fracCO2), sn(d.rothcProj?.fracCO2), '—'))
  linhas.push(row('RothC', '§5.3.5', 'frac_BioHum', sn(d.rothcBase?.fracBioHum), sn(d.rothcProj?.fracBioHum), '—'))
  linhas.push(row('RothC', '§5.3.2', 'fator_a_mes1', sn(d.rothcBase?.fatorA_mes1), sn(d.rothcProj?.fatorA_mes1), '—'))
  linhas.push(row('RothC', '§5.3.3', 'fator_b_mes1', sn(d.rothcBase?.fatorB_mes1), sn(d.rothcProj?.fatorB_mes1), '—'))
  linhas.push(row('RothC', '§5.3.4', 'fator_c_mes1', sn(d.rothcBase?.fatorC_mes1), sn(d.rothcProj?.fatorC_mes1), '—'))
  linhas.push(row('RothC', '§5.3.9', 'delta_SOC (tC/ha)', sn(d.rothcBase?.deltaSoc), sn(d.rothcProj?.deltaSoc), 'tC/ha'))
  linhas.push(row('RothC', 'Eq.40', 'CR_t (tCO2e/ha)', '—', sn(r.crTTco2eHa), 'tCO2e/ha'))

  // N2O
  linhas.push(row('N2O', 'Eq.16', 'N2O_total (tCO2e/ha)', sn(d.n2oBase?.n2oTotal), sn(d.n2oProj?.n2oTotal), 'tCO2e/ha'))
  linhas.push(row('N2O', 'Eq.18-20', 'N_total_fertilizantes (kgN/ha)', sn(d.n2oBase?.totalNFert), sn(d.n2oProj?.totalNFert), 'kgN/ha'))
  linhas.push(row('N2O', 'Eq.18-20', 'EF1_usado', sn(d.n2oBase?.ef1Usado), sn(d.n2oProj?.ef1Usado), 'kgN2O/kgN'))
  linhas.push(row('N2O', 'Eq.18-20', 'N2O_direto (tCO2e/ha)', sn(d.n2oBase?.n2oDireto), sn(d.n2oProj?.n2oDireto), 'tCO2e/ha'))
  linhas.push(row('N2O', 'Eq.21-23', 'N_volat_total (kgN/ha)', '—', sn(d.n2oProj?.nVolatTotal), 'kgN/ha'))
  linhas.push(row('N2O', 'Eq.21-23', 'N2O_volatilizacao (tCO2e/ha)', sn(d.n2oBase?.n2oIndireto), sn(d.n2oProj?.n2oVolat), 'tCO2e/ha'))
  linhas.push(row('N2O', 'Eq.21-23', 'N_lixiviado (kgN/ha)', '—', sn(d.n2oProj?.nLeachTotal), 'kgN/ha'))
  linhas.push(row('N2O', 'Eq.21-23', 'N2O_lixiviacao (tCO2e/ha)', '—', sn(d.n2oProj?.n2oLeach), 'tCO2e/ha'))
  linhas.push(row('N2O', 'Eq.26-28', 'F_manure (kgN/ha)', '—', sn(d.n2oProj?.fManure), 'kgN/ha'))
  linhas.push(row('N2O', 'Eq.26-28', 'N2O_esterco (tCO2e/ha)', sn(d.n2oBase?.n2oEsterco), sn(d.n2oProj?.n2oEsterco), 'tCO2e/ha'))
  linhas.push(row('N2O', 'Eq.24-25', 'N2O_BNF (tCO2e/ha)', sn(d.n2oBase?.n2oBnf), sn(d.n2oProj?.n2oBnf), 'tCO2e/ha'))

  // CH4
  linhas.push(row('CH4', 'Eq.11', 'Pop_animais', sn(d.ch4Base?.popAnimais, 0), sn(d.ch4Proj?.popAnimais, 0), 'cabeças'))
  linhas.push(row('CH4', 'Eq.11', 'CH4_enterico (tCO2e/ha)', sn(d.ch4Base?.ch4Enterico), sn(d.ch4Proj?.ch4Enterico), 'tCO2e/ha'))
  linhas.push(row('CH4', 'Eq.12-13', 'VS_rate_medio (kgVS/dia)', sn(d.ch4Base?.vsRateMedio ?? 0), sn(d.ch4Proj?.vsRateMedio), 'kgVS/cab/dia'))
  linhas.push(row('CH4', 'Eq.12-13', 'CH4_esterco (tCO2e/ha)', sn(d.ch4Base?.ch4Esterco), sn(d.ch4Proj?.ch4Esterco), 'tCO2e/ha'))
  linhas.push(row('CH4', 'Eq.14', 'MB_queimado (t MS/ha)', '—', sn(d.ch4Proj?.mbQueimado), 't MS/ha'))
  linhas.push(row('CH4', 'Eq.14', 'CH4_queima (tCO2e/ha)', sn(d.ch4Base?.ch4Queima), sn(d.ch4Proj?.ch4Queima), 'tCO2e/ha'))

  // CO2
  linhas.push(row('CO2', 'Eq.52', 'CO2_combustiveis (tCO2e/ha)', sn(d.co2Base?.co2Ff), sn(d.co2Proj?.co2Ff), 'tCO2e/ha'))
  linhas.push(row('CO2', 'Eq.53', 'CO2_calagem (tCO2e/ha)', sn(d.co2Base?.co2Lime), sn(d.co2Proj?.co2Lime), 'tCO2e/ha'))

  // Créditos finais
  linhas.push(row('Creditos', 'Eq.37', 'ER_t (tCO2e/ha)', '—', sn(r.erTTco2eHa), 'tCO2e/ha'))
  linhas.push(row('Creditos', 'Eq.40', 'CR_t (tCO2e/ha)', '—', sn(r.crTTco2eHa), 'tCO2e/ha'))
  linhas.push(row('Creditos', 'VMD0054', 'LK_t (tCO2e/ha)', '—', sn(r.lkTTco2eHa), 'tCO2e/ha'))
  linhas.push(row('Creditos', 'Eq.74', 'UNC_CO2 (%)', '—', sn((r.uncCo2 ?? 0) * 100, 2), '%'))
  linhas.push(row('Creditos', 'Eq.74', 'UNC_N2O (%)', '—', sn((r.uncN2o ?? 0) * 100, 2), '%'))
  linhas.push(row('Creditos', 'ERR_net', 'ERR_net (tCO2e/ha)', '—', sn(r.errNetTco2eHa), 'tCO2e/ha'))
  linhas.push(row('Creditos', 'VCUs', 'buffer_pool (%)', '—', sn((r.bufferPoolRate ?? 0) * 100, 2), '%'))
  linhas.push(row('Creditos', 'VCUs', 'VCUs_ha (tCO2e/ha)', '—', sn(r.vcusEmitidosHa), 'tCO2e/ha'))
  linhas.push(row('Creditos', 'VCUs', 'VCUs_total (tCO2e)', '—', sn(r.vcusEmitidosTotal, 2), 'tCO2e'))

  const conteudo = linhas.join('\n')
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `calculo_motor_${talhaoNome.replace(/\s/g, '_')}_${r.anoAgricola}_v${r.versaoMotor}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exportado com sucesso!')
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminMotor() {
  const { fazendaId } = useParams()
  const { fazendas, talhoes, manejo, dadosClimaticos, parametros, resultadosMotor, addResultadoMotor, clearResultadosTalhao, addNotificacao } = useDataStore()

  const [selFazendaId, setSelFazendaId] = useState(fazendaId || fazendas[0]?.id || '')
  const fazenda = fazendas.find(f => f.id === selFazendaId) ?? fazendas[0]

  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id && t.tipo === 'projeto')

  const [talhaoId, setTalhaoId] = useState(meusTalhoes[0]?.id ?? '')

  useEffect(() => {
    const ts = talhoes.filter(t => t.fazendaId === selFazendaId && t.tipo === 'projeto')
    if (ts.length > 0 && !ts.find(t => t.id === talhaoId)) {
      setTalhaoId(ts[0].id)
    } else if (ts.length === 0) {
      setTalhaoId('')
    }
  }, [selFazendaId, talhoes, talhaoId])

  const [anoAgricola, setAnoAgricola] = useState('2025')
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progresso, setProgresso] = useState(0)
  const [log, setLog] = useState<LogEntry[]>([])
  const [expandedResult, setExpandedResult] = useState<string | null>(null)

  const talhaoSel  = talhoes.find(t => t.id === talhaoId)
  const resultados = resultadosMotor.filter(r => r.talhaoId === talhaoId && r.anoAgricola === Number(anoAgricola))

  const anos = [2024, 2025, 2026]

  const handleRodar = async () => {
    if (!talhaoSel) { toast.error('Selecione um talhão.'); return }

    const anoNum   = Number(anoAgricola)
    const manejoProj = manejo.find(m => m.talhaoId === talhaoId && m.anoAgricola === anoNum && m.cenario === 'projeto')

    if (!manejoProj) {
      toast.error(`Não há dados MRV (projeto) para ${talhaoSel.nome} — Safra ${anoNum}.`)
      return
    }

    const manejoBase = manejo.find(m => m.talhaoId === talhaoId && m.cenario === 'baseline') ?? null
    const clima      = dadosClimaticos.find(d => d.talhaoId === talhaoId) ?? null

    setStatus('running')
    setProgresso(0)
    setLog([])
    clearResultadosTalhao(talhaoId, anoNum)

    try {
      const resultado = await rodarMotorCompleto(
        talhaoSel,
        manejoProj,
        manejoBase,
        clima,
        parametros,
        (step, percent) => {
          setLog(prev => [...prev, { step, percent }])
          setProgresso(percent)
        },
      )

      addResultadoMotor(resultado)
      addNotificacao({
        para: 'cliente',
        texto: `Motor executado: ${talhaoSel.nome} — ${resultado.vcusEmitidosTotal.toFixed(0)} VCUs calculados para safra ${anoNum}.`,
        link: '/dashboard/resultados',
      })
      setStatus('done')
      setExpandedResult(null)
      toast.success(`Motor concluído! ${resultado.vcusEmitidosTotal.toFixed(1)} VCUs emitidos.`)
    } catch (err) {
      setStatus('error')
      toast.error('Erro ao executar o motor de cálculos.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/admin/fazendas"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Motor de Cálculos — RothC + IPCC</h1>
          <p className="text-muted">{fazenda?.nome} · VM0042 v2.2 · VMD0053 v2.1</p>
        </div>
      </div>

      {/* Seletores */}
      <Card className="border-border/50 shadow-sm bg-surface">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-base">Configuração da Execução</CardTitle>
          <CardDescription>Selecione fazenda, talhão e ano antes de rodar.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Fazenda</Label>
            <Select value={selFazendaId} onValueChange={setSelFazendaId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar fazenda..." /></SelectTrigger>
              <SelectContent>
                {fazendas.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Talhão de Projeto</Label>
            <Select value={talhaoId} onValueChange={setTalhaoId} disabled={meusTalhoes.length === 0}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={meusTalhoes.length ? "Selecionar talhão..." : "Nenhum talhão"} /></SelectTrigger>
              <SelectContent>
                {meusTalhoes.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} ({t.areaHa} ha){t.dadosValidados ? ' ✓' : ' ⚠'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ano Agrícola</Label>
            <Select value={anoAgricola} onValueChange={setAnoAgricola}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {anos.map(a => <SelectItem key={a} value={String(a)}>{a}/{a+1}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Log de execução */}
        <Card className="md:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-base">Log de Execução</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {status === 'idle' && log.length === 0 && (
              <div className="text-center py-8 text-muted text-sm">
                Configure os parâmetros e clique em "Rodar Motor".
              </div>
            )}
            <div className="space-y-1 font-mono text-xs max-h-72 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className={`flex items-center gap-3 py-1 ${entry.percent === 100 ? 'text-success font-bold' : 'text-foreground/80'}`}>
                  <span className="text-muted w-10 shrink-0">[{String(entry.percent).padStart(3)}%]</span>
                  <span>{entry.step}</span>
                </div>
              ))}
            </div>
            {status === 'running' && (
              <div className="mt-4 space-y-2">
                <Progress value={progresso} className="h-2" />
                <p className="text-xs text-center text-primary animate-pulse">Calculando...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Painel de execução */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-base">Execução</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-center gap-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-foreground">
                {status === 'done' && resultados.length > 0
                  ? resultados[resultados.length-1].vcusEmitidosTotal.toFixed(1)
                  : '---'}
              </div>
              <p className="text-sm text-muted">VCUs emitidos (total)</p>
              {status === 'done' && resultados.length > 0 && (
                <p className="text-xs text-success">
                  {resultados[resultados.length-1].vcusEmitidosHa.toFixed(2)} tCO₂e/ha
                </p>
              )}
            </div>

            {status === 'idle' && (
              <Button onClick={handleRodar} className="w-full gap-2 h-12 rounded-xl">
                <Play size={18} /> Rodar Motor (RothC + IPCC)
              </Button>
            )}
            {status === 'running' && (
              <Button disabled className="w-full gap-2 h-12 rounded-xl opacity-70">
                <RefreshCw size={16} className="animate-spin" /> Calculando...
              </Button>
            )}
            {(status === 'done' || status === 'error') && (
              <div className="space-y-3">
                {status === 'done' && (
                  <div className="flex items-center gap-2 justify-center text-xs text-success">
                    <CheckCircle2 size={14} /> Cálculo concluído com sucesso
                  </div>
                )}
                <Button onClick={handleRodar} variant="outline" className="w-full gap-2 rounded-xl">
                  <RefreshCw size={14} /> Recalcular
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resultados detalhados */}
      {resultados.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical size={16} className="text-primary" />
                  Cadeia Completa de Equações — {talhaoSel?.nome} · Safra {anoAgricola}/{Number(anoAgricola)+1}
                </CardTitle>
                <CardDescription className="mt-1">
                  Cada módulo pode ser expandido para ver as equações intermediárias passo a passo com valores reais calculados.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {resultados.map(r => (
              <div key={r.id} className="border border-border/50 rounded-xl overflow-hidden">
                {/* Header do resultado */}
                <button
                  className="flex items-center justify-between w-full p-4 bg-surface/30 hover:bg-accent/5 text-left"
                  onClick={() => setExpandedResult(expandedResult === r.id ? null : r.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedResult === r.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div>
                      <p className="text-sm font-semibold">Motor v{r.versaoMotor} · {new Date(r.rodadoEm).toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-muted">Buffer: {(r.bufferPoolRate*100).toFixed(0)}% · UNC SOC: ±{(r.uncCo2*100).toFixed(1)}% · UNC N₂O: ±{(r.uncN2o*100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-success">{r.vcusEmitidosTotal.toFixed(1)}</p>
                    <p className="text-xs text-muted">VCUs totais</p>
                  </div>
                </button>

                {expandedResult === r.id && (
                  <div className="p-4 space-y-3 border-t border-border/50">
                    {/* Botão exportar CSV */}
                    {r.detalhesCalculo && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-lg text-xs"
                          onClick={() => exportarCSV(r, talhaoSel?.nome ?? 'talhao', talhaoSel?.areaHa ?? 0)}
                        >
                          <Download size={13} />
                          Exportar Planilha CSV (Análise Técnica)
                        </Button>
                      </div>
                    )}

                    {r.detalhesCalculo ? (
                      <div className="space-y-3">
                        <SecaoRothC r={r} talhaoArea={talhaoSel?.areaHa ?? 0} />
                        <SecaoN2O r={r} />
                        <SecaoCH4 r={r} />
                        <SecaoCO2 r={r} />
                        <SecaoCreditos r={r} talhaoArea={talhaoSel?.areaHa ?? 0} />
                      </div>
                    ) : (
                      /* Fallback para resultados antigos sem detalhesCalculo */
                      <div className="space-y-3">
                        <p className="text-xs text-muted italic text-center py-2">
                          Este resultado foi calculado sem dados intermediários. Recalcule para ver a cadeia completa de equações.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
