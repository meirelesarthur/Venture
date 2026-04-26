import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MapPin, Plus, AlertCircle, BarChart3, Zap, Activity, ChevronRight, Info, Map,
  Loader2, CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { useDataStore } from '@/store/data'
import { rodarMatching } from '@/motor/matchingControlSite'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ScoreBar } from '@/components/ui/score-bar'
import { CritBadge } from '@/components/ui/crit-badge'
import { AlertaCard } from './components/control-site/AlertaCard'

export default function AdminControlSites() {
  const navigate = useNavigate()
  const { controlSites, fazendas, matchResults, addMatchResult } = useDataStore()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lista' | 'matching'>('dashboard')
  const [matchCsId, setMatchCsId] = useState('')
  const [matchFazId, setMatchFazId] = useState('')
  const [lastMatch, setLastMatch] = useState<ReturnType<typeof rodarMatching> | null>(null)
  const [isMatching, setIsMatching] = useState(false)

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const ativos = controlSites.filter(s => s.status_cs === 'Ativo' || !s.status_cs)
  const fazendasCobertas = fazendas.filter(f =>
    matchResults.some(r => r.fazendaId === f.id && r.matchTotal)
  ).length
  const fazendasDescob = fazendas.filter(f =>
    matchResults.length > 0 &&
    matchResults.filter(r => r.fazendaId === f.id).every(r => r.statusCobertura === 'descoberta')
  ).length
  const pctCoberta = fazendas.length > 0 ? Math.round((fazendasCobertas / fazendas.length) * 100) : 0

  // ── Alertas automáticos ───────────────────────────────────────────────────
  const alertas = useMemo(() => {
    const alerts: Array<{ nivel: '🔴' | '🟡' | '🔵'; texto: string }> = []
    if (ativos.length < 3)
      alerts.push({ nivel: '🔴', texto: `Apenas ${ativos.length} control site(s) ativo(s). Mínimo VM0042: 3.` })
    if (ativos.length >= 3 && ativos.length < 10)
      alerts.push({ nivel: '🟡', texto: `${ativos.length} control sites ativos (recomendado ≥ 10).` })
    const fazendasSemMatch = fazendas.filter(f => {
      const mr = matchResults.filter(r => r.fazendaId === f.id)
      return mr.length === 0 || mr.every(r => r.statusCobertura === 'descoberta')
    })
    if (fazendasSemMatch.length > 0)
      alerts.push({ nivel: '🔴', texto: `${fazendasSemMatch.length} fazenda(s) sem cobertura: ${fazendasSemMatch.map(f => f.nome).join(', ')}` })
    const fazParc = fazendas.filter(f => matchResults.some(r => r.fazendaId === f.id && r.statusCobertura === 'parcial'))
    if (fazParc.length > 0)
      alerts.push({ nivel: '🟡', texto: `${fazParc.length} fazenda(s) com cobertura parcial.` })
    ativos.forEach(cs => {
      if (!(cs.fazendasVinculadasIds ?? []).length)
        alerts.push({ nivel: '🔵', texto: `"${cs.nome}" sem vínculo a fazendas. Executar matching.` })
    })
    return alerts
  }, [controlSites, fazendas, matchResults])

  // ── Matching manual ───────────────────────────────────────────────────────
  const handleMatching = useCallback(() => {
    const cs = controlSites.find(s => s.id === matchCsId)
    if (!cs || !matchFazId) { toast.error('Selecione CS e fazenda.'); return }
    setIsMatching(true)
    setTimeout(() => {
      const result = rodarMatching({ cs, fazendaId: matchFazId })
      addMatchResult(result)
      setLastMatch(result)
      toast.success(`Matching calculado: ${result.score}% — ${result.statusCobertura}`)
      setIsMatching(false)
    }, 900)
  }, [controlSites, matchCsId, matchFazId, addMatchResult])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Control Sites</h1>
          <p className="text-muted text-sm">Áreas de baseline VM0042 v2.2 · Mínimo 3 sites ativos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setActiveTab('matching')}>
            <Activity size={15} /> Matching
          </Button>
          <Button className="gap-2 rounded-xl" onClick={() => navigate('/admin/control-sites/novo')}>
            <Plus size={16} /> Novo Site
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-surface/50 p-1 rounded-xl border border-border/50 w-fit">
        {([
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'lista', label: 'Sites', icon: MapPin },
          { id: 'matching', label: 'Matching', icon: Zap },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent/10'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ──────────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: 'Sites Ativos', val: ativos.length, clr: ativos.length >= 3 ? 'text-success' : 'text-danger', icon: CheckCircle2 },
              { label: 'Fazendas Cobertas', val: `${fazendasCobertas}/${fazendas.length}`, clr: 'text-primary', icon: Map },
              { label: '% Área Coberta', val: `${pctCoberta}%`, clr: pctCoberta >= 80 ? 'text-success' : 'text-warning', icon: BarChart3 },
              { label: 'Descobertas', val: fazendasDescob, clr: fazendasDescob > 0 ? 'text-danger' : 'text-success', icon: XCircle },
            ].map(kpi => (
              <Card key={kpi.label} className="p-5 border-border/50 bg-surface shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon size={14} className={kpi.clr} />
                  <p className="text-xs font-medium text-muted">{kpi.label}</p>
                </div>
                <p className={`text-3xl font-bold ${kpi.clr}`}>{kpi.val}</p>
              </Card>
            ))}
          </div>
          {alertas.length > 0 ? (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle size={15} className="text-warning" /> Alertas Automáticos ({alertas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {alertas.map((a, i) => {
                  const isSemSite = a.texto.includes('Mínimo VM0042')
                  const isMatching = a.texto.includes('Executar matching') || a.texto.includes('cobertura parcial') || a.texto.includes('sem cobertura')
                  return (
                    <AlertaCard
                      key={i}
                      nivel={a.nivel}
                      texto={a.texto}
                      ctaLabel={isSemSite ? 'Adicionar site' : isMatching ? 'Ir ao matching' : undefined}
                      onCta={isSemSite ? () => navigate('/admin/control-sites/novo') : isMatching ? () => setActiveTab('matching') : undefined}
                    />
                  )
                })}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-success/20 bg-success/5 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-success" />
                <div>
                  <p className="font-semibold text-success text-sm">Conformidade plena</p>
                  <p className="text-xs text-muted">Todos os critérios metodológicos VM0042 estão atendidos.</p>
                </div>
              </div>
            </Card>
          )}
          {/* Cobertura por fazenda */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2"><Map size={15} className="text-primary" /> Cobertura por Fazenda</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {fazendas.map(faz => {
                const mrs = matchResults.filter(r => r.fazendaId === faz.id)
                const best = mrs.reduce<typeof mrs[0] | null>((acc, r) => !acc || r.score > acc.score ? r : acc, null)
                const status = best?.statusCobertura ?? 'descoberta'
                const score = best?.score ?? 0
                const clsMap = { coberta: 'border-success/20 bg-success/5', parcial: 'border-warning/20 bg-warning/5', descoberta: 'border-danger/20 bg-danger/5' }
                return (
                  <div key={faz.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${clsMap[status]}`}>
                    <div>
                      <p className="text-sm font-semibold">{faz.nome}</p>
                      <p className="text-xs text-muted">{faz.municipio}/{faz.estado} · {mrs.length} matching(s)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {mrs.length > 0 && <div className="w-28"><ScoreBar score={score} /></div>}
                      {status === 'coberta' && <Badge className="bg-success/10 text-success border-success/20 shadow-none text-xs"><CheckCircle2 size={11} className="mr-1" />Coberta 9/9</Badge>}
                      {status === 'parcial' && <Badge className="bg-warning/10 text-warning border-warning/20 shadow-none text-xs"><Clock size={11} className="mr-1" />Parcial</Badge>}
                      {status === 'descoberta' && <Badge className="bg-danger/10 text-danger border-danger/20 shadow-none text-xs"><XCircle size={11} className="mr-1" />Descoberta</Badge>}
                    </div>
                  </div>
                )
              })}
              {fazendas.length === 0 && <p className="text-center text-muted text-sm py-6">Nenhuma fazenda cadastrada.</p>}
            </CardContent>
          </Card>
          <Card className="border-primary/10 bg-primary/3">
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-2">
                <Info size={13} className="text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted">
                  <span className="font-semibold text-foreground">Base normativa:</span>{' '}
                  VM0042 v2.2 §6.4 · VT0014 v1.0 Eq.6-7 · VT0009 v1.0.
                  9 critérios: haversine ≤ 250km, zona IPCC, ecorregião WWF, textura FAO, grupo WRB, declividade/aspecto,
                  precipitação ±100mm, teste-t bilateral α=0.10 (SOC), histórico manejo 5 anos (VMD0053).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── LISTA ──────────────────────────────────────────────────────────── */}
      {activeTab === 'lista' && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> Control Sites ({controlSites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-accent/5">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Área</th>
                    <th className="text-left p-3">Zona IPCC</th>
                    <th className="text-left p-3">Textura FAO</th>
                    <th className="text-left p-3">SOC médio</th>
                    <th className="text-left p-3">n amostras</th>
                    <th className="text-left p-3">Melhor score</th>
                    <th className="text-left p-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {controlSites.map(cs => {
                    const csMatches = matchResults.filter(r => r.controlSiteId === cs.id)
                    const melhor = csMatches.reduce<typeof csMatches[0] | null>((a, r) => !a || r.score > a.score ? r : a, null)
                    const statusCls = (cs.status_cs === 'Ativo' || cs.status === 'Valido')
                      ? 'bg-success/10 text-success border-success/20'
                      : cs.status_cs === 'Em_implantacao'
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-muted/10 text-muted border-border/30'
                    return (
                      <tr
                        key={cs.id}
                        className="hover:bg-accent/5 cursor-pointer transition-colors"
                        onClick={() => navigate(`/admin/control-sites/${cs.id}`)}
                      >
                        <td className="p-3 font-medium text-primary hover:underline">{cs.nome}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-xs shadow-none ${statusCls}`}>
                            {cs.status_cs ?? cs.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted">{cs.area_ha ?? cs.area ?? '—'} ha</td>
                        <td className="p-3 text-xs text-muted">{cs.zona_climatica_ipcc ?? '—'}</td>
                        <td className="p-3 text-xs text-muted">{cs.classe_textural_fao ?? cs.texturaFao ?? '—'}</td>
                        <td className="p-3 font-mono text-xs">{cs.soc_medio_pct?.toFixed(2) ?? '—'} %</td>
                        <td className="p-3 text-center">
                          {cs.n_amostras_soc ? (
                            <Badge className={`text-[10px] shadow-none ${cs.n_amostras_soc >= 5 ? 'bg-success/10 text-success border-success/20' : cs.n_amostras_soc >= 3 ? 'bg-warning/10 text-warning border-warning/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                              {cs.n_amostras_soc}
                            </Badge>
                          ) : <span className="text-muted text-xs">—</span>}
                        </td>
                        <td className="p-3">
                          {melhor ? <ScoreBar score={melhor.score} /> : <span className="text-xs text-muted">—</span>}
                        </td>
                        <td className="p-3" onClick={e => e.stopPropagation()}>
                          <Button
                            size="sm" variant="outline"
                            className="rounded-lg text-xs h-7"
                            onClick={() => navigate(`/admin/control-sites/${cs.id}/editar`)}
                          >
                            Editar
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {controlSites.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-muted">
                        <div className="flex flex-col items-center gap-3">
                          <MapPin size={32} className="text-muted/40" />
                          <p>Nenhum control site cadastrado.</p>
                          <Button className="gap-2 rounded-xl mt-1" onClick={() => navigate('/admin/control-sites/novo')}>
                            <Plus size={14} /> Cadastrar primeiro site
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── MATCHING ───────────────────────────────────────────────────────── */}
      {activeTab === 'matching' && (
        <div className="space-y-5">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b bg-surface/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap size={16} className="text-primary" /> Motor de Matching — 9 Critérios VM0042
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label>Control Site</Label>
                  <Select value={matchCsId} onValueChange={setMatchCsId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>{controlSites.map(cs => <SelectItem key={cs.id} value={cs.id}>{cs.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fazenda</Label>
                  <Select value={matchFazId} onValueChange={setMatchFazId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>{fazendas.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={handleMatching} disabled={isMatching} className="gap-2 rounded-xl h-10">
                  {isMatching ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                  {isMatching ? 'Calculando…' : 'Rodar Matching'}
                </Button>
              </div>
            </CardContent>
          </Card>
          {lastMatch && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="border-b bg-surface/50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Resultado do Matching</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="w-40"><ScoreBar score={lastMatch.score} /></div>
                    {lastMatch.matchTotal
                      ? <Badge className="bg-success/10 text-success border-success/20 shadow-none"><CheckCircle2 size={12} className="mr-1" />Match Completo 9/9</Badge>
                      : lastMatch.statusCobertura === 'parcial'
                        ? <Badge className="bg-warning/10 text-warning border-warning/20 shadow-none"><Clock size={12} className="mr-1" />Cobertura Parcial</Badge>
                        : <Badge className="bg-danger/10 text-danger border-danger/20 shadow-none"><XCircle size={12} className="mr-1" />Descoberta</Badge>
                    }
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-accent/5">
                    <tr>
                      <th className="text-left p-3">#</th>
                      <th className="text-left p-3">Critério</th>
                      <th className="text-left p-3">Resultado</th>
                      <th className="text-left p-3">Detalhe</th>
                      <th className="text-left p-3">Referência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { n: 1, label: 'Distância', pass: lastMatch.criterios.c1_distancia, det: `${lastMatch.criterios.c1_distanciaKm.toFixed(1)} km (máx 250 km)`, ref: 'VM0042 §6.4' },
                      { n: 2, label: 'Zona Climática IPCC', pass: lastMatch.criterios.c2_zonaClimatica, det: 'Comparação direta', ref: 'VM0042 §6.4.2' },
                      { n: 3, label: 'Ecorregião WWF', pass: lastMatch.criterios.c3_ecorregiao, det: 'Comparação direta', ref: 'VM0042 §6.4.3' },
                      { n: 4, label: 'Textura Solo FAO', pass: lastMatch.criterios.c4_texturaFao, det: 'SoilGrids 0–30 cm', ref: 'VM0042 §6.4.4' },
                      { n: 5, label: 'Grupo Solo WRB', pass: lastMatch.criterios.c5_grupoSolo, det: 'SoilGrids WRB', ref: 'VM0042 §6.4.5' },
                      { n: 6, label: 'Declividade', pass: lastMatch.criterios.c6_declividade, det: 'Classe + aspecto se steep', ref: 'VM0042 Tab.10' },
                      { n: 7, label: 'Precipitação', pass: lastMatch.criterios.c7_precipitacao, det: '|Δ| ≤ 100 mm/ano', ref: 'VM0042 §6.4.7' },
                      { n: 8, label: 'SOC (teste-t)', pass: lastMatch.criterios.c8_soc, det: lastMatch.criterios.c8_pvalor !== undefined ? `p = ${lastMatch.criterios.c8_pvalor.toFixed(4)} (α=0.10)` : 'Dados insuficientes', ref: 'VM0042 §8.2' },
                      { n: 9, label: 'Histórico Manejo', pass: lastMatch.criterios.c9_manejo, det: `${lastMatch.criterios.c9_anosMatchados ?? 0}/5 anos coincidentes`, ref: 'VMD0053' },
                    ].map(row => (
                      <tr key={row.n} className="hover:bg-accent/5">
                        <td className="p-3 text-muted font-mono text-xs">C{row.n}</td>
                        <td className="p-3 font-medium text-sm">{row.label}</td>
                        <td className="p-3"><CritBadge pass={row.pass} /></td>
                        <td className="p-3 text-xs text-muted">{row.det}</td>
                        <td className="p-3 text-xs font-mono text-primary/70">{row.ref}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lastMatch.criteriosPendentes.length > 0 && (
                  <div className="px-4 py-3 border-t bg-warning/3">
                    <p className="text-xs font-semibold text-warning mb-1.5">Pendentes / não atendidos:</p>
                    <ul className="space-y-0.5">
                      {lastMatch.criteriosPendentes.map((p, i) => (
                        <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                          <ChevronRight size={11} className="text-warning mt-0.5" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {matchResults.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b"><CardTitle className="text-sm">Histórico de Matchings</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead className="bg-accent/5">
                    <tr>
                      <th className="text-left p-2.5">Control Site</th>
                      <th className="text-left p-2.5">Fazenda</th>
                      <th className="text-left p-2.5">Score</th>
                      <th className="text-left p-2.5">Status</th>
                      <th className="text-left p-2.5">Calculado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {[...matchResults].sort((a, b) => b.calculadoEm.localeCompare(a.calculadoEm)).map(mr => {
                      const cs = controlSites.find(s => s.id === mr.controlSiteId)
                      const faz = fazendas.find(f => f.id === mr.fazendaId)
                      return (
                        <tr key={mr.id} className="hover:bg-accent/5">
                          <td className="p-2.5 font-medium">{cs?.nome ?? mr.controlSiteId}</td>
                          <td className="p-2.5 text-muted">{faz?.nome ?? mr.fazendaId}</td>
                          <td className="p-2.5 w-32"><ScoreBar score={mr.score} /></td>
                          <td className="p-2.5">
                            {mr.statusCobertura === 'coberta' && <Badge className="bg-success/10 text-success border-success/20 text-[10px] shadow-none">Coberta</Badge>}
                            {mr.statusCobertura === 'parcial' && <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] shadow-none">Parcial</Badge>}
                            {mr.statusCobertura === 'descoberta' && <Badge className="bg-danger/10 text-danger border-danger/20 text-[10px] shadow-none">Descoberta</Badge>}
                          </td>
                          <td className="p-2.5 text-muted">{new Date(mr.calculadoEm).toLocaleString('pt-BR')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
