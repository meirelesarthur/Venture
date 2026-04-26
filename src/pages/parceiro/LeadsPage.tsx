import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/data'
import { LeadStatusBadge } from '@/components/ui/lead-status-badge'

export default function LeadsPage() {
  const { leads } = useDataStore()
  const [filter, setFilter] = useState<string>('todos')

  const FILTROS = [
    { id: 'todos', label: 'Todos', count: leads.length },
    { id: 'novo', label: 'Novos', count: leads.filter(l => l.status === 'novo').length },
    { id: 'em_analise', label: 'Em Análise', count: leads.filter(l => l.status === 'em_analise').length },
    { id: 'aprovado', label: 'Aprovados', count: leads.filter(l => l.status === 'aprovado').length },
    { id: 'contratado', label: 'Contratados', count: leads.filter(l => l.status === 'contratado').length },
    { id: 'recusado', label: 'Recusados', count: leads.filter(l => l.status === 'recusado').length },
  ]

  const filtered = filter === 'todos' ? leads : leads.filter(l => l.status === filter)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meus Leads</h1>
          <p className="text-muted">Acompanhe o funil de conversão dos seus indicados.</p>
        </div>
        <Button asChild className="rounded-xl gap-2">
          <Link to="/parceiro/leads/novo">+ Indicar Produtor</Link>
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {['novo','em_analise','aprovado','contratado','recusado'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`p-3 rounded-xl border text-center transition-colors ${filter === s ? 'border-primary bg-primary/5' : 'border-border/50 bg-surface hover:bg-accent/5'}`}
          >
            <p className="text-xl font-bold text-foreground">{leads.filter(l => l.status === s).length}</p>
            <p className="text-xs text-muted capitalize">{s.replace('_',' ')}</p>
          </button>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-surface/50 border-b pb-4 flex-row items-center justify-between">
          <CardTitle className="text-lg">Lista de Indicações</CardTitle>
          <div className="flex gap-1 flex-wrap">
            {FILTROS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${filter === f.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted hover:bg-accent/5'}`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold ${filter === f.id ? 'bg-white/20 text-white' : 'bg-muted/20 text-muted-foreground'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted">Nenhum lead encontrado com esse filtro.</div>
            )}
            {filtered.map(lead => (
              <div key={lead.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/5 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-semibold text-foreground">{lead.nome}</h4>
                    <LeadStatusBadge status={lead.status} motivo={lead.motivoRecusa} />
                  </div>
                  <p className="text-sm text-muted">{lead.fazenda} — {lead.municipio}/{lead.estado}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{lead.area.toLocaleString('pt-BR')} ha</span>
                    {lead.culturas && <span>• {lead.culturas.join(', ')}</span>}
                    {lead.receitaEstimada && <span className="text-success font-medium">• Receita est.: R$ {(lead.receitaEstimada/1000).toFixed(0)}k</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                  <span>Indicado em {lead.data}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
