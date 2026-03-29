import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, CheckCircle2, RefreshCw, FileText, Settings, Leaf, Users, AlertCircle, Tractor, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Formulários Compartilhados (MRV)
import LavouraForm from '@/pages/cliente/mrv/LavouraForm'
import PecuariaForm from '@/pages/cliente/mrv/PecuariaForm'
import FertilizacaoForm from '@/pages/cliente/mrv/FertilizacaoForm'
import OperacionalForm from '@/pages/cliente/mrv/OperacionalForm'
import DocumentosForm from '@/pages/cliente/mrv/DocumentosForm'

export default function AdminMotor() {
  const { fazendaId } = useParams()
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [progress, setProgress] = useState(0)

  const handleRunMotor = () => {
    setStatus('running')
    setProgress(0)
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setStatus('done')
          toast.success('Motor de Cálculos concluído. Relatório técnico gerado.')
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
       <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/admin/clientes"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Motor de Cálculos VMD0053</h1>
          <p className="text-muted">Fazenda ID: {fazendaId || '001'} - Cliente: João da Silva</p>
        </div>
      </div>

      <Tabs defaultValue="lavoura" className="w-full">
        <TabsList className="flex w-full mb-6 overflow-x-auto justify-start border-b border-border/50 bg-background pb-0 rounded-none h-auto gap-4">
          <TabsTrigger value="lavoura" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary pb-3 rounded-none bg-transparent">
            <Leaf size={16} className="mr-2" /> Lavoura
          </TabsTrigger>
          <TabsTrigger value="pecuaria" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary pb-3 rounded-none bg-transparent">
            <Users size={16} className="mr-2" /> Pecuária
          </TabsTrigger>
          <TabsTrigger value="fertilizacao" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary pb-3 rounded-none bg-transparent">
            <AlertCircle size={16} className="mr-2" /> Adubação
          </TabsTrigger>
          <TabsTrigger value="operacional" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary pb-3 rounded-none bg-transparent">
            <Tractor size={16} className="mr-2" /> Máquinas
          </TabsTrigger>
          <TabsTrigger value="documentos" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary pb-3 rounded-none bg-transparent">
            <FileCheck size={16} className="mr-2" /> Evidências
          </TabsTrigger>
          <TabsTrigger value="motor" className="data-[state=active]:bg-success/10 data-[state=active]:text-success data-[state=active]:border-success pb-3 rounded-none bg-transparent text-foreground/50 border-b-2 border-transparent">
            <Settings size={16} className="mr-2" /> Rodar Motor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lavoura"><Card className="p-6 border-border/50"><LavouraForm/></Card></TabsContent>
        <TabsContent value="pecuaria"><Card className="p-6 border-border/50"><PecuariaForm/></Card></TabsContent>
        <TabsContent value="fertilizacao"><Card className="p-6 border-border/50"><FertilizacaoForm/></Card></TabsContent>
        <TabsContent value="operacional"><Card className="p-6 border-border/50"><OperacionalForm/></Card></TabsContent>
        <TabsContent value="documentos"><Card className="p-6 border-border/50"><DocumentosForm/></Card></TabsContent>
        
        <TabsContent value="motor" className="mt-0">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border/50 shadow-sm">
              <CardHeader className="bg-surface/50 border-b pb-4">
                <CardTitle className="text-lg">Status dos Dados Formados (MRV)</CardTitle>
                <CardDescription>Critérios para execução do RothC. Devem estar todos válidos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                  <div>
                    <h4 className="font-medium text-sm">Dados de Solo (Baseline)</h4>
                    <p className="text-xs text-muted">Amostras de laboratório importadas</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                  <div>
                    <h4 className="font-medium text-sm">Práticas de Lavoura & Fertilizantes</h4>
                    <p className="text-xs text-muted">N2O emissions e histórico 3 anos completos</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                  <div>
                    <h4 className="font-medium text-sm">Control Sites Vinculados</h4>
                    <p className="text-xs text-muted">Mínimo de 3 sites proxy atendidos</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm flex flex-col">
              <CardHeader className="bg-surface/50 border-b pb-4">
                <CardTitle className="text-lg">Execução</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex flex-col justify-center gap-6">
                
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-foreground">
                    {status === 'done' ? '1.245' : '---'}
                  </div>
                  <p className="text-sm text-muted">tCO₂e (Projeção Ano 1)</p>
                </div>

                {status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-primary font-medium">
                      <span>Calculando equações diferenciais...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {status === 'idle' && (
                  <Button onClick={handleRunMotor} className="w-full gap-2 text-md h-12 rounded-xl">
                    <Play size={18} /> Rodar Motor (RothC + IPCC)
                  </Button>
                )}

                {status === 'done' && (
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full gap-2 text-success border-success/50 bg-success/5 rounded-xl">
                      <FileText size={16} /> Relatório VCU Emitido
                    </Button>
                    <Button variant="ghost" onClick={handleRunMotor} className="w-full gap-2 text-muted-foreground rounded-xl">
                      <RefreshCw size={14} /> Recalcular Parâmetros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
