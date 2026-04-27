import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useDataStore } from '@/store/data'
import { ArrowLeft, Map, Factory, ExternalLink, MessageCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { MrvStatusBadge } from '@/components/ui/mrv-status-badge'

export default function AdminClienteDetalhe() {
  const { id } = useParams()
  const { clientes, fazendas, talhoes, manejo, approveManejo, requestCorrection } = useDataStore()
  const [correcaoTexto, setCorrecaoTexto] = useState<Record<string, string>>({})

  const cliente = clientes.find(c => c.id === id) ?? clientes[0]
  const fazenda = fazendas.find(f => f.produtorId === cliente?.id)
  const meusTalhoes = fazenda ? talhoes.filter(t => t.fazendaId === fazenda.id) : []
  const manejoCliente = manejo.filter(m => meusTalhoes.some(t => t.id === m.talhaoId))

  const handleAprovar = (mId: string) => {
    approveManejo(mId)
    toast.success('Dados MRV aprovados com sucesso!')
  }

  const handleCorrecao = (mId: string) => {
    const t = correcaoTexto[mId]
    if (!t?.trim()) { toast.error('Informe o motivo da correção.'); return }
    requestCorrection(mId, t)
    toast.success('Solicitação de correção enviada.')
    setCorrecaoTexto(prev => ({ ...prev, [mId]: '' }))
  }

  if (!cliente) return <div className="text-center py-20 text-muted">Cliente não encontrado.</div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/admin/clientes"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{cliente.nome}</h1>
          <p className="text-sm text-muted">{cliente.email}</p>
        </div>
      </div>

      {/* Resumo fazenda */}
      {fazenda && (
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Map size={18} className="text-primary" /> Propriedade: {fazenda.nome}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted mb-1">Município</p>
                <p className="font-medium">{fazenda.municipio}/{fazenda.estado}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Área Total</p>
                <p className="font-medium">{fazenda.areaTotalHa.toLocaleString('pt-BR')} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Zona Climática</p>
                <p className="font-medium capitalize">{fazenda.zonaClimatica.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Status MRV</p>
                <p className="font-medium">{cliente.statusMRV}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Talhões */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4 flex-row items-center justify-between">
          <CardTitle className="text-lg">Talhões</CardTitle>
          <Button size="sm" variant="outline" asChild className="rounded-xl gap-2 h-8 text-xs">
            <Link to={`/admin/fazendas/${fazenda?.id}`}><ExternalLink size={12} /> Ver Fazenda Completa</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {meusTalhoes.map(t => {
              const ultimoManejo = manejo.filter(m => m.talhaoId === t.id).sort((a,b) => b.anoAgricola - a.anoAgricola)[0]
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{t.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${t.tipo === 'projeto' ? 'bg-success/10 text-success border-success/20' : t.tipo === 'control_site' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/20 text-muted-foreground border-border/50'}`}>
                        {t.tipo === 'projeto' ? 'Projeto' : t.tipo === 'control_site' ? 'Controle' : 'Excluído'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {t.areaHa} ha
                      {t.socPercent ? ` | SOC: ${t.socPercent}%` : ' | Solo: não cadastrado'}
                      {t.bdGCm3 ? ` | BD: ${t.bdGCm3} g/cm³` : ''}
                      {t.argilaPercent ? ` | Argila: ${t.argilaPercent}%` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.dadosValidados && <CheckCircle2 size={14} className="text-success" />}
                    {ultimoManejo && <MrvStatusBadge status={ultimoManejo.status} />}
                  </div>
                </div>
              )
            })}
            {meusTalhoes.length === 0 && (
              <div className="text-center py-10 text-muted text-sm">Nenhum talhão cadastrado.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validação MRV Inline — centralizada no cliente */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 size={18} className="text-primary" /> Validação MRV</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {manejoCliente.length === 0 && (
            <p className="text-sm text-muted text-center py-6">Nenhum dado MRV encontrado para este cliente.</p>
          )}
          {manejoCliente
            .sort((a, b) => b.anoAgricola - a.anoAgricola)
            .map(m => {
              const talhao = meusTalhoes.find(t => t.id === m.talhaoId)
              return (
                <div key={m.id} className={`p-4 rounded-xl border ${m.status === 'pendente' ? 'border-warning/30 bg-warning/5' : m.status === 'correcao' ? 'border-danger/30 bg-danger/5' : 'border-border/50'}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{talhao?.nome ?? 'Talhão'}</p>
                        <span className="text-xs text-muted">Safra {m.anoAgricola}/{m.anoAgricola + 1}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {m.cultura ? `Cultura: ${m.cultura}` : '—'}
                        {m.produtividade ? ` | Prod: ${m.produtividade} ${m.unidadeProd ?? ''}` : ''}
                        {m.submetidoEm && ` | Submetido: ${new Date(m.submetidoEm).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MrvStatusBadge status={m.status} />
                      {m.status === 'pendente' && (
                        <Button
                          size="sm"
                          className="h-7 text-xs rounded-lg bg-success hover:bg-success/90 text-white"
                          onClick={() => handleAprovar(m.id)}
                        >
                          <CheckCircle2 size={12} className="mr-1" /> Aprovar
                        </Button>
                      )}
                    </div>
                  </div>

                  {m.comentarioCorrecao && (
                    <div className="mt-3 p-2.5 bg-danger/5 border border-danger/20 rounded-lg text-xs text-danger">
                      <strong>Correção enviada:</strong> {m.comentarioCorrecao}
                    </div>
                  )}

                  {m.status === 'pendente' && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-border/50">
                      <Textarea
                        placeholder="Descreva o que precisa ser corrigido..."
                        value={correcaoTexto[m.id] ?? ''}
                        onChange={e => setCorrecaoTexto(prev => ({ ...prev, [m.id]: e.target.value }))}
                        rows={2}
                        className="rounded-xl resize-none text-sm"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs rounded-lg gap-1"
                          onClick={() => handleCorrecao(m.id)}
                        >
                          <MessageCircle size={11} /> Solicitar Correção
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </CardContent>
      </Card>

      {/* Motor */}
      {fazenda && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Factory size={18} className="text-primary" /> Motor de Cálculos</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Status do Motor</p>
              <p className="font-semibold text-foreground">{cliente.motor}</p>
            </div>
            <Button asChild variant="outline" className="rounded-xl gap-2">
              <Link to={`/admin/motor/${fazenda.id}`}>Abrir Motor <ExternalLink size={14} /></Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
