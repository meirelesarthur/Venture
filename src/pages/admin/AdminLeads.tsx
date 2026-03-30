import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Search, XCircle, Clock, UserCheck, MessageCircle, Users } from 'lucide-react'
import { useDataStore } from '@/store/data'
import type { LeadStatus } from '@/store/data'
import { toast } from 'sonner'

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg: Record<LeadStatus, { label: string; cls: string; Icon: any }> = {
    novo:       { label: 'Novo',      cls: 'bg-muted/20 text-muted-foreground border-border/50', Icon: null },
    em_analise: { label: 'Em Análise',cls: 'bg-warning/10 text-warning border-warning/20',     Icon: Clock },
    aprovado:   { label: 'Aprovado',  cls: 'bg-primary/10 text-primary border-primary/20',     Icon: CheckCircle2 },
    contratado: { label: 'Contratado',cls: 'bg-success/10 text-success border-success/20',     Icon: CheckCircle2 },
    efetivado:  { label: 'Cliente',   cls: 'bg-success/10 text-success border-success/20',     Icon: UserCheck },
    recusado:   { label: 'Recusado',  cls: 'bg-danger/10 text-danger border-danger/20',        Icon: XCircle },
  }
  const c = cfg[status]
  return (
    <Badge variant="outline" className={`shadow-none ${c.cls} flex items-center gap-1`}>
      {c.Icon && <c.Icon size={11} />} {c.label}
    </Badge>
  )
}

export default function AdminLeads() {
  const { leads, updateLeadStatus, convertLeadToCliente, parceiros } = useDataStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [showMotivo, setShowMotivo] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.nome.toLowerCase().includes(q) || l.fazenda.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const getParceiro = (id?: string) => parceiros.find(p => p.id === id)?.nome ?? '—'

  const handleRecusar = (id: string) => {
    if (!motivo.trim()) { toast.error('Informe o motivo da recusa.'); return }
    updateLeadStatus(id, 'recusado', motivo)
    toast.success('Lead recusado.')
    setShowMotivo(null); setMotivo('')
  }

  const STATUS_FILTROS: { id: string; label: string }[] = [
    { id: 'todos', label: 'Todos' }, { id: 'novo', label: 'Novos' },
    { id: 'em_analise', label: 'Em Análise' }, { id: 'aprovado', label: 'Aprovados' },
    { id: 'contratado', label: 'Contratados' }, { id: 'recusado', label: 'Recusados' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão de Leads</h1>
        <p className="text-muted-foreground">Todos os potenciais clientes prospectados.</p>
      </div>

      {/* Totais por status */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {STATUS_FILTROS.slice(1).map(s => (
          <button key={s.id} onClick={() => setFilterStatus(s.id)}
            className={`p-3 rounded-xl border text-center transition-colors ${filterStatus === s.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-surface hover:bg-accent/5'}`}
          >
            <p className="text-xl font-bold text-foreground">{leads.filter(l => l.status === s.id).length}</p>
            <p className="text-xs text-muted capitalize">{s.label}</p>
          </button>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-surface/50 border-b flex-row items-center justify-between pb-4 gap-4">
          <CardTitle className="text-lg">Fila de Prospecções</CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {STATUS_FILTROS.map(f => (
                <button key={f.id} onClick={() => setFilterStatus(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterStatus === f.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted hover:bg-accent/5'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 h-9 w-64 rounded-xl" placeholder="Buscar produtor..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/5">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead>Propriedade</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Parceiro</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="text-muted-foreground text-sm">{lead.data}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{lead.nome}</p>
                      {lead.email && <p className="text-xs text-muted">{lead.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{lead.fazenda}</p>
                      {lead.municipio && <p className="text-xs text-muted">{lead.municipio}/{lead.estado}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{lead.area.toLocaleString('pt-BR')} ha</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Users size={12} className="text-muted" />
                      {getParceiro(lead.parceiroId)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={lead.status} />
                    {lead.motivoRecusa && (
                      <p className="text-xs text-danger mt-1 truncate max-w-xs" title={lead.motivoRecusa}>{lead.motivoRecusa}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {lead.status === 'em_analise' || lead.status === 'novo' ? (
                      <div className="flex items-center justify-end gap-2">
                        {showMotivo === lead.id ? (
                          <div className="flex items-center gap-2">
                            <Input placeholder="Motivo..." value={motivo} onChange={e => setMotivo(e.target.value)} className="h-8 w-40 rounded-lg text-xs" />
                            <Button variant="destructive" size="sm" className="h-8 text-xs rounded-lg" onClick={() => handleRecusar(lead.id)}>Confirmar</Button>
                            <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg" onClick={() => { setShowMotivo(null); setMotivo('') }}>✕</Button>
                          </div>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="text-danger hover:bg-danger/10 h-8 w-8" onClick={() => setShowMotivo(lead.id)} title="Recusar">
                              <XCircle size={16} />
                            </Button>
                            <Button variant="outline" size="sm" className="text-primary border-primary/30 hover:bg-primary/5 h-8 text-xs rounded-lg" onClick={() => { updateLeadStatus(lead.id, 'aprovado'); toast.success('Lead aprovado!') }}>
                              Aprovar
                            </Button>
                            <Button size="sm" className="bg-success hover:bg-success/90 text-white h-8 text-xs rounded-lg" onClick={() => { convertLeadToCliente(lead.id); toast.success('Lead convertido em cliente!') }}>
                              <CheckCircle2 size={13} className="mr-1" /> Efetivar
                            </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Encerrado</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Nenhum lead encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
