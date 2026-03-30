import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDataStore } from '@/store/data'
import { Trophy, Medal, Star } from 'lucide-react'

export default function RankingPage() {
  const { parceiros } = useDataStore()

  const ranking = [...parceiros]
    .filter(p => p.status === 'ativo')
    .sort((a, b) => (b.hectaresCarteira ?? 0) - (a.hectaresCarteira ?? 0))
    .map((p, i) => ({ ...p, pos: i + 1 }))

  const NIVEIS = [
    { nome: 'Bronze',  min: 0,     max: 5000,  color: 'text-yellow-700', bg: 'bg-yellow-700/10 border-yellow-700/20' },
    { nome: 'Prata',   min: 5000,  max: 15000, color: 'text-gray-400',   bg: 'bg-gray-400/10 border-gray-400/20'   },
    { nome: 'Ouro',    min: 15000, max: 40000, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { nome: 'Platina', min: 40000, max: 99999, color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20'   },
  ]
  const getNivel = (ha: number) => NIVEIS.findLast(n => ha >= n.min) ?? NIVEIS[0]

  const myParceiroId = 'p1'
  const myPos = ranking.find(p => p.id === myParceiroId)?.pos ?? 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ranking de Parceiros</h1>
        <p className="text-muted">Posição relativa anônima por volume de hectares originados.</p>
      </div>

      {/* Minha posição */}
      {myPos > 0 && (
        <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {myPos}º
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Sua posição atual</p>
            <p className="text-sm text-muted">{ranking.find(p => p.id === myParceiroId)?.hectaresCarteira?.toLocaleString('pt-BR')} ha na carteira</p>
          </div>
          <div className="ml-auto flex flex-col items-end">
            {(() => {
              const me = ranking.find(p => p.id === myParceiroId)
              const nivel = getNivel(me?.hectaresCarteira ?? 0)
              return (
                <Badge variant="outline" className={`${nivel.bg} ${nivel.color} border font-semibold`}>
                  <Star size={12} className="mr-1" /> {nivel.nome}
                </Badge>
              )
            })()}
          </div>
        </div>
      )}

      {/* Tabela ranking anônima */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-surface/50 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2"><Trophy size={18} className="text-primary" /> Classificação Geral</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {ranking.map((p, idx) => {
              const nivel = getNivel(p.hectaresCarteira ?? 0)
              const isMe = p.id === myParceiroId
              return (
                <div key={p.id} className={`flex items-center justify-between px-5 py-4 ${isMe ? 'bg-primary/5' : 'hover:bg-accent/5'} transition-colors`}>
                  <div className="flex items-center gap-4">
                    {/* Posição com medalha */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      idx === 0 ? 'bg-yellow-500/10 text-yellow-500' :
                      idx === 1 ? 'bg-gray-400/10 text-gray-400' :
                      idx === 2 ? 'bg-yellow-700/10 text-yellow-700' :
                      'bg-accent/20 text-muted-foreground text-sm'
                    }`}>
                      {idx === 0 ? <Trophy size={20} /> : idx === 1 ? <Medal size={20} /> : idx === 2 ? <Medal size={20} /> : `${idx + 1}º`}
                    </div>
                    {/* Anonimizado */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {isMe ? 'Você' : `Parceiro #${idx + 1}`}
                        </p>
                        {isMe && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Você</Badge>}
                      </div>
                      <p className="text-xs text-muted">{p.leadsGerados} leads • {p.hectaresCarteira?.toLocaleString('pt-BR')} ha</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Barra de progresso visual */}
                    <div className="hidden sm:block w-24 bg-secondary rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-primary'}`}
                        style={{ width: `${((p.hectaresCarteira ?? 0) / (ranking[0]?.hectaresCarteira ?? 1)) * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline" className={`text-xs ${nivel.bg} ${nivel.color} border`}>{nivel.nome}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legenda de níveis */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tabela de Níveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-3">
            {NIVEIS.map(n => (
              <div key={n.nome} className={`p-3 rounded-xl border ${n.bg} text-center`}>
                <p className={`font-bold ${n.color}`}>{n.nome}</p>
                <p className="text-xs text-muted mt-1">{n.min.toLocaleString('pt-BR')} – {n.max.toLocaleString('pt-BR')} ha</p>
                {n.nome !== 'Bronze' && <p className="text-xs text-foreground/70 mt-0.5 font-medium">+20% bônus</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
