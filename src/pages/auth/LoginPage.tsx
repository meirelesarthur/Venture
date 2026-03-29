import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    // Mock authentication
    setTimeout(() => {
      // Fake roles based on email
      let role: 'cliente' | 'parceiro' | 'admin' = 'cliente'
      if (data.email.includes('admin')) role = 'admin'
      if (data.email.includes('parceiro')) role = 'parceiro'

      setUser({
        id: '1',
        name: 'Usuário Teste',
        email: data.email,
        role,
      })
      
      setIsLoading(false)
      
      // Redirect based on role
      if (role === 'admin') navigate('/admin')
      else if (role === 'parceiro') navigate('/parceiro')
      else navigate('/dashboard')
    }, 1000)
  }

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center p-4 gap-6">
      <div className="flex flex-wrap gap-2 max-w-md w-full justify-center bg-warning/10 p-4 rounded-xl border border-warning/20">
        <div className="w-full text-center text-xs text-warning mb-2 font-medium">BOTOES DE TESTE RÁPIDO (DEV ONLY)</div>
        <Button variant="outline" size="sm" onClick={() => navigate('/simulador')} className="border-primary/50 hover:bg-primary/10">
          Simulador Público
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSubmit({ email: 'admin@venture.com', password: 'senha' })} className="border-primary/50 hover:bg-primary/10 text-primary">
          Login Admin
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSubmit({ email: 'parceiro@venture.com', password: 'senha' })} className="border-success/50 hover:bg-success/10 text-success">
          Login Parceiro
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSubmit({ email: 'cliente@venture.com', password: 'senha' })} className="border-foreground/50 hover:bg-foreground/5 text-foreground">
          Login Cliente
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Insira seu email e senha para acessar sua conta.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/recuperar-senha"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="text-center text-sm text-muted">
              Não tem uma conta?{' '}
              <Link to="/criar-conta" className="font-medium text-primary hover:underline">
                Criar conta
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
