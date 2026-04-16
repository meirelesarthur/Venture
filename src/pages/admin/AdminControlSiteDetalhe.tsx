/**
 * AdminControlSiteDetalhe — Visualização de um Control Site
 * Rota: /admin/control-sites/:id
 */
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Zap, MapPin, Cloud, FlaskConical, Leaf,
  Link2, CheckCircle2, XCircle, Clock, Activity, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDataStore } from '@/store/data'
import { rodarMatching } from '@/motor/matchingControlSite'
import { toast } from 'sonner'
import { useState } from 'react'

function ScoreBar({ score }: { score: number }) {
  const color = score === 100 ? 'bg-success' : score >= 78 ? 'bg-warning' : 'bg-danger'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono font-bold">{score}%</span>
    </div>
  )
}

function CritBadge({ pass }: { pass: boolean | 'pendente' }) {
  if (pass === 'pendente') return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] shadow-none">Pendente</Badge>
  if (pass) return <Badge className="bg-success/10 text-success border-success/20 text-[10px] shadow-none"><CheckCircle2 size={10} className="mr-0.5" />PASS</Badge>
  return <Badge className="bg-danger/10 text-danger border-danger/20 text-[10px] shadow-none"><XCircle size={10} className="mr-0.5" />FAIL</Badge>
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs font-medium text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  )
}

export default function AdminControlSiteDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { controlSites, fazendas, matchResults, addMatchResult } = useDataStore()
  const [matchingFazId, setMatchingFazId] = useState<string>('')
  const [runningMatch, setRunningMatch] = useState(false)

  const cs = controlSites.find(s => s.id === id)
  if (!cs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <MapPin size={48} className="text-muted/30" />
        <p className="text-muted">Control Site não encontrado.</p>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate('/admin/control-sites')}>
          <ArrowLeft size={14} /> Voltar para lista
        </Button>
      </div>
    )
  }

  const csMatches = matchResults.filter(r => r.controlSiteId === cs.id)
  const statusCls =
    cs.status_cs === 'Ativo' ? 'bg-success/10 text-success border-success/20' :
    cs.status_cs === 'Em_implantacao' ? 'bg-warning/10 text-warning border-warning/20' :
    'bg-muted/10 text-muted border-border/30'

  const handleRunMatch = async () => {
    if (!matchingFazId) { toast.error('Selecione uma fazenda.'); return }
    setRunningMatch(true)
    await new Promise(r => setTimeout(r, 400))
    const result = rodarMatching({ cs, fazendaId: matchingFazId })
    addMatchResult(result)
    setRunningMatch(false)
    toast.success(`Matching calculado: ${result.score}% — ${result.statusCobertura}`)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Header — padrão do sistema */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/admin/control-sites')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{cs.nome}</h1>
              <Badge variant="outline" className={`text-xs shadow-none ${statusCls}`}>{cs.status_cs ?? 'Ativo'}</Badge>
            </div>
            <p className="text-sm text-muted">
              {cs.centroide_lat && cs.centroide_lng
                ? `${cs.centroide_lat.toFixed(4)}, ${cs.centroide_lng.toFixed(4)}`
                : 'Coordenadas não informadas'
              }
              {cs.area_ha && ` · ${cs.area_ha} ha`}
            </p>
          </div>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => navigate(`/admin/control-sites/${cs.id}/editar`)}>
          <Edit2 size={14} /> Editar site
        </Button>
      </div>

      {/* Grid de cartões de dados */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Identificação */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b bg-surface/50">
            <CardTitle className="text-sm flex items-center gap-2"><Info size={14} className="text-primary" />Identificação</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <InfoRow label="Responsável" value={cs.gestor_nome} />
            <InfoRow label="Tipo de gestor" value={cs.gestor_tipo} />
            <InfoRow label="Status operacional" value={cs.status_cs} />
            <InfoRow label="Área" value={cs.area_ha ? `${cs.area_ha} ha` : undefined} />
          </CardContent>
        </Card>

        {/* Geofísico */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b bg-surface/50">
            <CardTitle className="text-sm flex items-center gap-2"><MapPin size={14} className="text-primary" />Atributos Geofísicos</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <InfoRow label="Zona climática IPCC" value={cs.zona_climatica_ipcc} />
            <InfoRow label="Ecorregião WWF" value={cs.ecorregiao_wwf} />
            <InfoRow label="Textura FAO (0–30 cm)" value={cs.classe_textural_fao} />
            <InfoRow label="Grupo solo WRB" value={cs.grupo_solo_wrb} />
            <InfoRow label="Classe de declividade" value={cs.classe_declividade} />
            <InfoRow label="Aspecto cardinal" value={cs.aspecto_cardinal} />
          </CardContent>
        </Card>

        {/* Clima */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b bg-surface/50">
            <CardTitle className="text-sm flex items-center gap-2"><Cloud size={14} className="text-primary" />Clima</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <InfoRow label="Precipitação média anual" value={cs.precip_media_anual_mm ? `${cs.precip_media_anual_mm} mm/ano` : undefined} />
            <InfoRow label="Fonte dos dados" value={cs.fonte_precip} />
            <InfoRow label="Distância à estação meteo" value={cs.dist_estacao_meteo_km ? `${cs.dist_estacao_meteo_km} km` : undefined} />
          </CardContent>
        </Card>

        {/* SOC */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b bg-surface/50">
            <CardTitle className="text-sm flex items-center gap-2"><FlaskConical size={14} className="text-primary" />SOC — Critério 8</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <InfoRow label="SOC médio" value={cs.soc_medio_pct !== undefined ? `${cs.soc_medio_pct.toFixed(3)}%` : undefined} />
            <InfoRow label="IC 90% inferior" value={cs.soc_ic_lower !== undefined ? `${cs.soc_ic_lower.toFixed(3)}%` : undefined} />
            <InfoRow label="IC 90% superior" value={cs.soc_ic_upper !== undefined ? `${cs.soc_ic_upper.toFixed(3)}%` : undefined} />
            <InfoRow label="n amostras" value={cs.n_amostras_soc} />
            <InfoRow label="Primeira coleta" value={cs.data_primeira_coleta} />
            {cs.n_amostras_soc !== undefined && (
              <div className="mt-3">
                <Badge className={`text-xs shadow-none ${cs.n_amostras_soc >= 5 ? 'bg-success/10 text-success border-success/20' : cs.n_amostras_soc >= 3 ? 'bg-warning/10 text-warning border-warning/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                  {cs.n_amostras_soc >= 5 ? `✓ ${cs.n_amostras_soc} amostras (adequado)` : cs.n_amostras_soc >= 3 ? `⚠ ${cs.n_amostras_soc} amostras (mínimo)` : `✗ ${cs.n_amostras_soc} amostras (insuficiente, mín. 3)`}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Manejo */}
      {(cs.historico_manejo?.length ?? 0) > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b bg-surface/50">
            <CardTitle className="text-sm flex items-center gap-2"><Leaf size={14} className="text-primary" />Histórico de Manejo — Critério 9</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-accent/5">
                  <tr>
                    <th className="text-left p-3">Ano</th>
                    <th className="text-left p-3">Preparo</th>
                    <th className="text-left p-3">Grupo Funcional</th>
                    <th className="text-left p-3">Cultura</th>
                    <th className="text-center p-3">Resíduos</th>
                    <th className="text-center p-3">Esterco</th>
                    <th className="text-center p-3">Composto</th>
                    <th className="text-center p-3">Irrigação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {cs.historico_manejo!.map((h, i) => (
                    <tr key={i} className="hover:bg-accent/5">
                      <td className="p-3 font-mono font-semibold">{h.ano}</td>
                      <td className="p-3">{h.preparo_solo.replace('_', ' ')}</td>
                      <td className="p-3">{h.grupo_funcional.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-muted">{h.tipo_cultura || '—'}</td>
                      {(['remocao_residuos', 'esterco', 'composto', 'irrigacao'] as const).map(f => (
                        <td key={f} className="p-3 text-center">
                          {(h[f] as boolean)
                            ? <CheckCircle2 size={13} className="text-success mx-auto" />
                            : <XCircle size={13} className="text-muted/40 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fazendas vinculadas */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 border-b bg-surface/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Link2 size={14} className="text-primary" />Fazendas Vinculadas</CardTitle>
            <Badge variant="outline" className="text-xs">{(cs.fazendasVinculadasIds ?? []).length} fazenda(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {(cs.fazendasVinculadasIds ?? []).length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Nenhuma fazenda vinculada. <button className="text-primary underline" onClick={() => navigate(`/admin/control-sites/${cs.id}/editar`)}>Editar para vincular.</button></p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {cs.fazendasVinculadasIds!.map(fazId => {
                const faz = fazendas.find(f => f.id === fazId)
                const matchFaz = csMatches.find(m => m.fazendaId === fazId)
                return (
                  <div key={fazId} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/5">
                    <div>
                      <p className="text-sm font-medium">{faz?.nome ?? fazId}</p>
                      <p className="text-xs text-muted">{faz?.municipio}/{faz?.estado}</p>
                    </div>
                    {matchFaz ? (
                      <div className="flex items-center gap-2 w-32">
                        <ScoreBar score={matchFaz.score} />
                      </div>
                    ) : (
                      <Badge className="bg-muted/10 text-muted border-border/30 text-[10px] shadow-none">Sem matching</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matchings registrados */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 border-b bg-surface/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Activity size={14} className="text-primary" />Matchings Executados</CardTitle>
            <Badge variant="outline" className="text-xs">{csMatches.length} resultado(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Roda matching rápido nesta tela */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted font-medium">Executar matching com:</label>
              <select
                className="w-full border border-border/50 rounded-xl px-3 py-2 text-sm bg-surface"
                value={matchingFazId}
                onChange={e => setMatchingFazId(e.target.value)}
              >
                <option value="">Selecione uma fazenda…</option>
                {fazendas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <Button className="gap-2 rounded-xl" onClick={handleRunMatch} disabled={runningMatch || !matchingFazId}>
              <Zap size={13} /> Rodar
            </Button>
          </div>

          {csMatches.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Nenhum matching executado para este site.</p>
          ) : (
            <div className="space-y-2">
              {[...csMatches].sort((a, b) => b.calculadoEm.localeCompare(a.calculadoEm)).map(mr => {
                const faz = fazendas.find(f => f.id === mr.fazendaId)
                return (
                  <div key={mr.id} className="p-3.5 rounded-xl border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{faz?.nome ?? mr.fazendaId}</p>
                        <p className="text-xs text-muted">{new Date(mr.calculadoEm).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-28"><ScoreBar score={mr.score} /></div>
                        {mr.statusCobertura === 'coberta' && <Badge className="bg-success/10 text-success border-success/20 text-[10px] shadow-none"><CheckCircle2 size={10} className="mr-1" />Coberta</Badge>}
                        {mr.statusCobertura === 'parcial' && <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] shadow-none"><Clock size={10} className="mr-1" />Parcial</Badge>}
                        {mr.statusCobertura === 'descoberta' && <Badge className="bg-danger/10 text-danger border-danger/20 text-[10px] shadow-none"><XCircle size={10} className="mr-1" />Descoberta</Badge>}
                      </div>
                    </div>
                    {/* Critérios resumidos */}
                    <div className="grid grid-cols-9 gap-1">
                      {[
                        mr.criterios.c1_distancia,
                        mr.criterios.c2_zonaClimatica,
                        mr.criterios.c3_ecorregiao,
                        mr.criterios.c4_texturaFao,
                        mr.criterios.c5_grupoSolo,
                        mr.criterios.c6_declividade,
                        mr.criterios.c7_precipitacao,
                        mr.criterios.c8_soc,
                        mr.criterios.c9_manejo,
                      ].map((pass, idx) => (
                        <div key={idx} className={`flex flex-col items-center gap-0.5`}>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold ${pass === true ? 'bg-success/15 text-success' : pass === 'pendente' ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'}`}>
                            C{idx + 1}
                          </div>
                          {pass === true ? <CheckCircle2 size={9} className="text-success" /> : pass === 'pendente' ? <Clock size={9} className="text-warning" /> : <XCircle size={9} className="text-danger" />}
                        </div>
                      ))}
                    </div>
                    {mr.criteriosPendentes.length > 0 && (
                      <details className="mt-1">
                        <summary className="text-xs text-muted cursor-pointer">Ver pendências ({mr.criteriosPendentes.length})</summary>
                        <ul className="mt-1 space-y-0.5 pl-2">
                          {mr.criteriosPendentes.map((p, i) => <li key={i} className="text-[11px] text-muted">• {p}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
