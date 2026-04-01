import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDataStore } from '@/store/data'
import { useAuthStore } from '@/store/auth'
import { Trophy, Medal, Star } from 'lucide-react'

const ANIMAIS = [
  'Águia', 'Onça', 'Lobo', 'Coruja', 'Tigre', 'Falcão', 'Gavião', 'Leão', 
  'Raposa', 'Urso', 'Pantera', 'Guepardo', 'Touro', 'Puma', 'Tatu', 'Arara',
  'Cervo', 'Bizonte', 'Falcão', 'Gato-do-mato', 'Suçuarana'
]

// Gera 15 parceiros extras mockados com valores estáticos para evitar re-renders com valores diferentes
const mockExtraParceiros = Array.from({ length: 15 }).map((_, i) => ({
  id: `mock-p-${i}`,
  nome: `Parceiro Extra ${i}`,
  email: `mock${i}@example.com`,
  leadsGerados: (i * 7 + 3) % 40 + 1,
  comissaoTotal: (i * 5000) % 80000 + 1000,
  hectaresCarteira: [1200, 3500, 5600, 8900, 12000, 16500, 22000, 28000, 35000, 42000, 48000, 55000, 62000, 71000, 85000][i], // Valores variados distribuídos nos níveis
  status: 'ativo' as const
}))

function getAnimalName(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return `${ANIMAIS[Math.abs(hash) % ANIMAIS.length]} Anônimo(a)`
}

export default function RankingPage() {
  const { parceiros } = useDataStore()
  const { user } = useAuthStore()

  const ranking = useMemo(() => {
    return [...parceiros, ...mockExtraParceiros]
      .filter(p => p.status === 'ativo')
      .sort((a, b) => (b.hectaresCarteira ?? 0) - (a.hectaresCarteira ?? 0))
      .map((p, i) => ({ ...p, pos: i + 1 }))
  }, [parceiros])

  const NIVEIS = [
    { nome: 'Bronze',  min: 0,     max: 5000,  color: 'text-yellow-700', bg: 'bg-yellow-700/10 border-yellow-700/20' },
    { nome: 'Prata',   min: 5000,  max: 15000, color: 'text-gray-400',   bg: 'bg-gray-400/10 border-gray-400/20'   },
    { nome: 'Ouro',    min: 15000, max: 40000, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { nome: 'Platina', min: 40000, max: 99999, color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20'   },
  ]
  const getNivel = (ha: number) => NIVEIS.findLast(n => ha >= n.min) ?? NIVEIS[0]

  // Como no AuthLayout o id do parceiro DEV é 'parceiro-1', e no mock inicial é 'p1', 
  // caso o id não bata diretamente, o ranking apenas não destacará ninguém ou destacará se coincidir.
  // Ajustando para ser compatível com o mock profile:
  const resolvedMyId = user?.id === 'parceiro-1' ? 'p1' : user?.id ?? ''
  
  const myPos = ranking.find(p => p.id === resolvedMyId)?.pos ?? 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ranking de Parceiros</h1>
        <p className="text-muted">Posição relativa anônima por volume de hectares originados.</p>
      </div>

      {/* Minha posição */}
      {myPos > 0 && (
        <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {myPos}º
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Sua posição atual</p>
              <p className="text-sm text-muted">{ranking.find(p => p.id === resolvedMyId)?.hectaresCarteira?.toLocaleString('pt-BR')} ha na carteira</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            {(() => {
              const me = ranking.find(p => p.id === resolvedMyId)
              const nivel = getNivel(me?.hectaresCarteira ?? 0)
              return (
                <Badge variant="outline" className={`text-xs ${nivel.bg} ${nivel.color} border font-semibold`}>
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
              const isMe = p.id === resolvedMyId
              
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
                        <p className={`text-sm font-semibold ${isMe ? 'text-primary' : 'text-foreground'}`}>
                          {isMe ? 'Você' : getAnimalName(p.id)}
                        </p>
                        {isMe && <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20">Você</Badge>}
                      </div>
                      <p className="text-xs text-muted mt-0.5">{p.leadsGerados} leads • {p.hectaresCarteira?.toLocaleString('pt-BR')} ha</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Barra de progresso visual */}
                    <div className="hidden sm:block w-24 bg-secondary rounded-full h-1.5 ml-4">
                      <div
                        className={`h-1.5 rounded-full ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-primary'}`}
                        style={{ width: `${((p.hectaresCarteira ?? 0) / (ranking[0]?.hectaresCarteira ?? 1)) * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${nivel.bg} ${nivel.color} border`}>{nivel.nome}</Badge>
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
                {n.nome !== 'Bronze' && <p className="text-[10px] uppercase font-bold text-foreground/50 mt-1">+20% BÔNUS</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
