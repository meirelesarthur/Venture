import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/data'
import { ChevronRight, Leaf, MapPin } from 'lucide-react'



export default function AdminFazendas() {
  const { fazendas, clientes, talhoes } = useDataStore()


  const getCliente = (id: string) => clientes.find(c => c.id === id)
  const getTalhoesCount = (fid: string) => talhoes.filter(t => t.fazendaId === fid)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Fazendas</h1>
          <p className="text-muted">Propriedades cadastradas e seus talhões.</p>
        </div>
      </div>



      {/* Lista */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fazendas.map(f => {
          const cliente = getCliente(f.produtorId)
          const meusTalhoes = getTalhoesCount(f.id)
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
    </div>
  )
}
