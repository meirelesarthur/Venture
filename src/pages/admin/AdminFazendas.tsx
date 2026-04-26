import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useDataStore } from '@/store/data'
import {
  ChevronRight, ChevronLeft, Leaf, MapPin,
  LayoutGrid, List, Search, SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE_GRID  = 9
const PAGE_SIZE_TABLE = 12

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminFazendas() {
  const { fazendas, clientes, talhoes } = useDataStore()

  // ── State ──────────────────────────────────────────────────────────────────
  const [view,       setView]       = useState<'grid' | 'table'>('grid')
  const [search,     setSearch]     = useState('')
  const [filterZona, setFilterZona] = useState<string>('all')
  const [filterUF,   setFilterUF]   = useState<string>('all')
  const [page,       setPage]       = useState(1)

  // ── Derived ────────────────────────────────────────────────────────────────
  const getCliente    = (id: string) => clientes.find(c => c.id === id)
  const getMeusTalhoes = (fid: string) => talhoes.filter(t => t.fazendaId === fid)

  const ufsDisponiveis = useMemo(() =>
    [...new Set(fazendas.map(f => f.estado))].sort(),
  [fazendas])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return fazendas.filter(f => {
      if (q && !f.nome.toLowerCase().includes(q) && !f.municipio.toLowerCase().includes(q)) return false
      if (filterZona !== 'all' && f.zonaClimatica !== filterZona) return false
      if (filterUF   !== 'all' && f.estado        !== filterUF)   return false
      return true
    })
  }, [fazendas, search, filterZona, filterUF])

  const pageSize   = view === 'grid' ? PAGE_SIZE_GRID : PAGE_SIZE_TABLE
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const resetPage = () => setPage(1)

  const hasFilters = search || filterZona !== 'all' || filterUF !== 'all'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Fazendas</h1>
          <p className="text-muted">Propriedades cadastradas e seus talhões.</p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto text-muted-foreground text-xs px-3 py-1.5 rounded-xl">
          {filtered.length} / {fazendas.length} fazendas
        </Badge>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar fazenda ou município…"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage() }}
            className="pl-9 rounded-xl h-9 text-sm"
          />
        </div>

        {/* Zona climática */}
        <Select value={filterZona} onValueChange={v => { setFilterZona(v); resetPage() }}>
          <SelectTrigger className="w-[160px] h-9 rounded-xl text-sm gap-1.5">
            <SlidersHorizontal size={13} className="text-muted-foreground" />
            <SelectValue placeholder="Zona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as zonas</SelectItem>
            <SelectItem value="tropical_umido">Tropical Úmido</SelectItem>
            <SelectItem value="tropical_seco">Tropical Seco</SelectItem>
          </SelectContent>
        </Select>

        {/* UF */}
        <Select value={filterUF} onValueChange={v => { setFilterUF(v); resetPage() }}>
          <SelectTrigger className="w-[130px] h-9 rounded-xl text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os UFs</SelectItem>
            {ufsDisponiveis.map(uf => (
              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl text-muted-foreground hover:text-foreground text-xs"
            onClick={() => { setSearch(''); setFilterZona('all'); setFilterUF('all'); resetPage() }}
          >
            Limpar
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-border/50 rounded-xl p-1 bg-surface">
          <button
            onClick={() => { setView('grid'); resetPage() }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              view === 'grid'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid size={13} /> Grade
          </button>
          <button
            onClick={() => { setView('table'); resetPage() }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              view === 'table'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List size={13} /> Tabela
          </button>
        </div>
      </div>

      {/* Empty state */}
      {paginated.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Leaf size={32} className="text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-foreground">Nenhuma fazenda encontrada</p>
          <p className="text-xs text-muted">Tente ajustar os filtros de busca.</p>
        </div>
      )}

      {/* ── Grid view ─────────────────────────────────────────────────────── */}
      {view === 'grid' && paginated.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(f => {
            const cliente    = getCliente(f.produtorId)
            const meusTalhoes = getMeusTalhoes(f.id)
            const projetoCount = meusTalhoes.filter(t => t.tipo === 'projeto').length
            const controlCount = meusTalhoes.filter(t => t.tipo === 'control_site').length

            return (
              <Card key={f.id} className="border-border/50 shadow-sm hover:border-primary/30 transition-colors bg-surface">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{f.nome}</CardTitle>
                      <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                        <MapPin size={11} />
                        <span>{f.municipio}/{f.estado}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${f.zonaClimatica === 'tropical_umido' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                      {f.zonaClimatica === 'tropical_umido' ? 'Úmido' : 'Seco'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-background rounded-xl">
                      <p className="text-lg font-bold text-foreground">{f.areaTotalHa.toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-muted">ha total</p>
                    </div>
                    <div className="p-2 bg-success/5 rounded-xl">
                      <p className="text-lg font-bold text-success">{projetoCount}</p>
                      <p className="text-xs text-success/70">projeto</p>
                    </div>
                    <div className="p-2 bg-primary/5 rounded-xl">
                      <p className="text-lg font-bold text-primary">{controlCount}</p>
                      <p className="text-xs text-primary/70">controle</p>
                    </div>
                  </div>
                  {cliente && (
                    <div className="flex items-center gap-2 p-2 bg-background rounded-xl text-xs">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                        {cliente.nome.charAt(0)}
                      </div>
                      <span className="text-muted-foreground truncate">{cliente.nome}</span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild className="w-full rounded-xl gap-2">
                    <Link to={`/admin/fazendas/${f.id}`}><Leaf size={13} /> Gerenciar MRV <ChevronRight size={13} /></Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Table view ────────────────────────────────────────────────────── */}
      {view === 'table' && paginated.length > 0 && (
        <Card className="border-border/50 shadow-sm bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-accent/5 text-left">
                  <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Fazenda</th>
                  <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Zona</th>
                  <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-right">Área (ha)</th>
                  <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center">Projeto</th>
                  <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center">Controle</th>
                  <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Produtor</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginated.map(f => {
                  const cliente     = getCliente(f.produtorId)
                  const meusTalhoes = getMeusTalhoes(f.id)
                  const projetoCount = meusTalhoes.filter(t => t.tipo === 'projeto').length
                  const controlCount = meusTalhoes.filter(t => t.tipo === 'control_site').length

                  return (
                    <tr key={f.id} className="hover:bg-accent/5 transition-colors group">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-foreground">{f.nome}</p>
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />{f.municipio}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-foreground bg-accent/10 px-2 py-0.5 rounded-md">{f.estado}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={`text-xs shadow-none ${f.zonaClimatica === 'tropical_umido' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                          {f.zonaClimatica === 'tropical_umido' ? 'Úmido' : 'Seco'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                        {f.areaTotalHa.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-success">{projetoCount}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-primary">{controlCount}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {cliente ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">
                              {cliente.nome.charAt(0)}
                            </div>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{cliente.nome}</span>
                          </div>
                        ) : <span className="text-xs text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button variant="outline" size="sm" asChild className="rounded-xl gap-1.5 h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/admin/fazendas/${f.id}`}><Leaf size={11} /> MRV</Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted">
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} de {filtered.length} fazendas
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl"
              disabled={safePage === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={p === safePage ? 'default' : 'outline'}
                size="icon"
                className={cn('h-8 w-8 rounded-xl text-xs', p === safePage && 'shadow-sm')}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl"
              disabled={safePage === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
