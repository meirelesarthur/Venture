import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

import LavouraForm from './mrv/LavouraForm'
import PecuariaForm from './mrv/PecuariaForm'
import FertilizacaoForm from './mrv/FertilizacaoForm'
import OperacionalForm from './mrv/OperacionalForm'
import DocumentosForm from './mrv/DocumentosForm'
import { Leaf, Users, AlertCircle, Tractor, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const mrvSteps = [
  { id: 'lavoura', name: 'Lavoura', path: 'lavoura', icon: <Leaf size={18} />, status: 'pending' },
  { id: 'pecuaria', name: 'Pecuária', path: 'pecuaria', icon: <Users size={18} />, status: 'complete' },
  { id: 'fertilizacao', name: 'Fertilização', path: 'fertilizacao', icon: <AlertCircle size={18} />, status: 'current' },
  { id: 'operacional', name: 'Operacional', path: 'operacional', icon: <Tractor size={18} />, status: 'pending' },
  { id: 'documentos', name: 'Documentos', path: 'documentos', icon: <FileText size={18} />, status: 'complete' },
]

function MrvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">MRV Digital</h1>
        <p className="text-muted">Submissão de dados para validação e auditoria (Safra 2025/2026).</p>
      </div>

      {/* Navegação Topo */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto whitespace-nowrap">
            <div className="flex w-max space-x-2 p-4">
              {mrvSteps.map((step) => (
                <NavLink
                  key={step.id}
                  to={`/dashboard/mrv/${step.path}`}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-surface text-muted hover:bg-accent hover:text-foreground border-border/60"
                  )}
                >
                  {step.status === 'complete' ? <CheckCircle2 size={18} className="text-success" /> : step.icon}
                  {step.name}
                </NavLink>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário/Conteúdo Ativo */}
      <Card className="border-border/50 shadow-sm min-h-[500px]">
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

export default function MrvPage() {
  return (
    <MrvLayout>
      <Routes>
        <Route path="lavoura" element={<LavouraForm />} />
        <Route path="pecuaria" element={<PecuariaForm />} />
        <Route path="fertilizacao" element={<FertilizacaoForm />} />
        <Route path="operacional" element={<OperacionalForm />} />
        <Route path="documentos" element={<DocumentosForm />} />
        
        {/* Redirect root of MRV to the first step */}
        <Route path="/" element={<Navigate to="lavoura" replace />} />
      </Routes>
    </MrvLayout>
  )
}
