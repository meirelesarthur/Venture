import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDataStore } from '@/store/data'
import { Leaf } from 'lucide-react'
import { AddTalhaoForm, TalhaoList } from './TalhaoList'
import { TalhaoDetail } from './TalhaoPanels'
import { BulkEditPanel } from './BulkEditPanel'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

interface TalhoesTabProps {
  fazendaId: string
  anoAgricola: number
}

export function TalhoesTab({ fazendaId, anoAgricola }: TalhoesTabProps) {
  const { talhoes } = useDataStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazendaId)

  const talhaoParam = searchParams.get('talhao')
  const [selectedIds, setSelectedIds] = useState<string[]>(
    talhaoParam && meusTalhoes.some(t => t.id === talhaoParam) ? [talhaoParam] : []
  )
  const [showAdd, setShowAdd] = useState(false)

  const syncUrl = (ids: string[]) => {
    setSearchParams(prev => {
      if (ids.length === 1) prev.set('talhao', ids[0])
      else prev.delete('talhao')
      return prev
    }, { replace: true })
  }

  const handleRowClick = (id: string) => {
    const next = [id]
    setSelectedIds(next)
    syncUrl(next)
  }

  const handleToggleCheck = (id: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      syncUrl(next)
      return next
    })
  }

  const handleSelectAll = () => {
    const next = meusTalhoes.every(t => selectedIds.includes(t.id))
      ? []
      : meusTalhoes.map(t => t.id)
    setSelectedIds(next)
    syncUrl(next)
  }

  const handleRemoveFromBulk = (id: string) => {
    setSelectedIds(prev => {
      const next = prev.filter(x => x !== id)
      syncUrl(next)
      return next
    })
  }

  const selectedTalhao = selectedIds.length === 1
    ? meusTalhoes.find(t => t.id === selectedIds[0])
    : null

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="flex-1 overflow-hidden min-h-0"
    >
      {/* Left panel — talhão list */}
      <ResizablePanel
        defaultSize={30}
        minSize="150px"
        maxSize={65}
        className="flex flex-col overflow-hidden border-r border-border/50"
      >
        {showAdd && (
          <AddTalhaoForm fazendaId={fazendaId} onClose={() => setShowAdd(false)} />
        )}
        <TalhaoList
          talhoes={meusTalhoes}
          selectedIds={selectedIds}
          onToggleCheck={handleToggleCheck}
          onRowClick={handleRowClick}
          onSelectAll={handleSelectAll}
          onAddClick={() => setShowAdd(true)}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right panel — detail / bulk edit */}
      <ResizablePanel defaultSize={70} minSize={40} className="flex flex-col overflow-hidden">
        {selectedIds.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center max-w-xs space-y-2 px-6">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                <Leaf size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">Nenhum talhão selecionado</p>
              <p className="text-xs text-muted leading-relaxed">
                Selecione um talhão para ver os detalhes ou marque múltiplos para edição em lote.
              </p>
            </div>
          </div>
        )}

        {selectedIds.length === 1 && selectedTalhao && (
          <TalhaoDetail
            key={selectedTalhao.id}
            talhao={selectedTalhao}
            fazendaId={fazendaId}
            anoAgricola={anoAgricola}
          />
        )}

        {selectedIds.length >= 2 && (
          <BulkEditPanel
            selectedIds={selectedIds}
            talhoes={meusTalhoes}
            fazendaId={fazendaId}
            anoAgricola={anoAgricola}
            onCancelAll={() => { setSelectedIds([]); syncUrl([]) }}
            onRemove={handleRemoveFromBulk}
          />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
