'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function PaginaAutenticacao() {
  const router = useRouter()
  const { user, signIn, signUp, loading } = useAuth()
  
  // Estados do formulário de login
  const [emailLogin, setEmailLogin] = useState('')
  const [senhaLogin, setSenhaLogin] = useState('')
  const [carregandoLogin, setCarregandoLogin] = useState(false)
  const [erroLogin, setErroLogin] = useState('')

  // Estados do formulário de cadastro
  const [emailCadastro, setEmailCadastro] = useState('')
  const [senhaCadastro, setSenhaCadastro] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [carregandoCadastro, setCarregandoCadastro] = useState(false)
  const [erroCadastro, setErroCadastro] = useState('')
  const [sucessoCadastro, setSucessoCadastro] = useState('')

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregandoLogin(true)
    setErroLogin('')

    try {
      const { error } = await signIn(emailLogin, senhaLogin)
      
      if (error) {
        setErroLogin(error.message)
        return
      }
      
      setTimeout(() => {
        router.push('/')
      }, 100)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login'
      setErroLogin(errorMessage)
    } finally {
      setCarregandoLogin(false)
    }
  }

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregandoCadastro(true)
    setErroCadastro('')
    setSucessoCadastro('')

    if (senhaCadastro !== confirmacaoSenha) {
      setErroCadastro('As senhas não coincidem')
      setCarregandoCadastro(false)
      return
    }

    if (senhaCadastro.length < 6) {
      setErroCadastro('A senha deve ter pelo menos 6 caracteres')
      setCarregandoCadastro(false)
      return
    }

    try {
      const { error } = await signUp(emailCadastro, senhaCadastro)
      
      if (error) {
        setErroCadastro(error.message)
        return
      }
      
      setSucessoCadastro('Conta criada com sucesso! Verifique seu email para confirmar.')
      setEmailCadastro('')
      setSenhaCadastro('')
      setConfirmacaoSenha('')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta'
      setErroCadastro(errorMessage)
    } finally {
      setCarregandoCadastro(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] flex flex-col items-center gap-10">
          <header className="text-center flex flex-col items-center gap-5 w-full">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </header>
          <Skeleton className="w-full h-[340px] rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[400px] flex flex-col items-center gap-10">
        {/* Cabeçalho: logo + texto de apoio */}
        <header className="text-center flex flex-col items-center gap-5">
          <Image
            src="/labcode.svg"
            alt="lab code"
            width={200}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-[320px]">
            Crie, edite e compartilhe código JavaScript online
          </p>
        </header>

        {/* Caixa de login: frosted glass */}
        <Card className="w-full shadow-2xl border-slate-700/40 rounded-2xl overflow-hidden bg-[#131A2A]/70 backdrop-blur-xl">
          <CardHeader className="pb-5 pt-9 px-8">
            <CardTitle className="text-center text-2xl font-semibold text-white tracking-tight">
              Bem-vindo
            </CardTitle>
            <CardDescription className="text-center text-slate-400 mt-2 text-sm">
              Entre na sua conta ou crie uma nova para começar
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-9">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full flex border-b border-slate-700/60 bg-transparent p-0 mb-7 h-auto rounded-none">
                <TabsTrigger
                  value="login"
                  className="flex-1 rounded-none bg-transparent py-3 text-sm font-medium text-slate-500 hover:text-slate-300 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#5340FF] data-[state=active]:shadow-[0_2px_12px_rgba(83,64,255,0.35)] transition-colors"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="cadastro"
                  className="flex-1 rounded-none bg-transparent py-3 text-sm font-medium text-slate-500 hover:text-slate-300 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#5340FF] data-[state=active]:shadow-[0_2px_12px_rgba(83,64,255,0.35)] transition-colors"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              {/* Aba de Login */}
              <TabsContent value="login" className="space-y-5 mt-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email-login" className="text-sm font-medium text-slate-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="nicholas..."
                        value={emailLogin}
                        onChange={(e) => setEmailLogin(e.target.value)}
                        className="pl-10 h-11 rounded-lg bg-[#1c2836] border-slate-600/50 text-white placeholder:text-slate-400 focus:border-[#5340FF]/60 focus:ring-1 focus:ring-[#5340FF]/40 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha-login" className="text-sm font-medium text-slate-300">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="senha-login"
                        type="password"
                        placeholder="••••••••"
                        value={senhaLogin}
                        onChange={(e) => setSenhaLogin(e.target.value)}
                        className="pl-10 h-11 rounded-lg bg-[#1c2836] border-slate-600/50 text-white placeholder:text-slate-400 focus:border-[#5340FF]/60 focus:ring-1 focus:ring-[#5340FF]/40 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {erroLogin && (
                    <Alert className="border-red-500/50 bg-red-500/10 py-3 rounded-lg">
                      <AlertDescription className="text-red-400 text-sm">
                        {erroLogin}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-lg bg-[#0F766E] hover:bg-[#0D5E56] text-white font-medium transition-colors mt-2"
                    disabled={carregandoLogin}
                  >
                    {carregandoLogin ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Entrando...
                      </div>
                    ) : (
                      <span className="flex items-center justify-center">
                        Entrar <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Aba de Cadastro */}
              <TabsContent value="cadastro" className="space-y-5 mt-0">
                <form onSubmit={handleCadastro} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email-cadastro" className="text-sm font-medium text-slate-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="email-cadastro"
                        type="email"
                        placeholder="nicholas..."
                        value={emailCadastro}
                        onChange={(e) => setEmailCadastro(e.target.value)}
                        className="pl-10 h-11 rounded-lg bg-[#1c2836] border-slate-600/50 text-white placeholder:text-slate-400 focus:border-[#5340FF]/60 focus:ring-1 focus:ring-[#5340FF]/40 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha-cadastro" className="text-sm font-medium text-slate-300">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="senha-cadastro"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={senhaCadastro}
                        onChange={(e) => setSenhaCadastro(e.target.value)}
                        className="pl-10 h-11 rounded-lg bg-[#1c2836] border-slate-600/50 text-white placeholder:text-slate-400 focus:border-[#5340FF]/60 focus:ring-1 focus:ring-[#5340FF]/40 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar-senha" className="text-sm font-medium text-slate-300">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="confirmar-senha"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={confirmacaoSenha}
                        onChange={(e) => setConfirmacaoSenha(e.target.value)}
                        className="pl-10 h-11 rounded-lg bg-[#1c2836] border-slate-600/50 text-white placeholder:text-slate-400 focus:border-[#5340FF]/60 focus:ring-1 focus:ring-[#5340FF]/40 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {erroCadastro && (
                    <Alert className="border-red-500/50 bg-red-500/10 py-3 rounded-lg">
                      <AlertDescription className="text-red-400 text-sm">
                        {erroCadastro}
                      </AlertDescription>
                    </Alert>
                  )}

                  {sucessoCadastro && (
                    <Alert className="border-emerald-500/50 bg-emerald-500/10 py-3 rounded-lg">
                      <AlertDescription className="text-emerald-400 text-sm">
                        {sucessoCadastro}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-lg bg-[#0F766E] hover:bg-[#0D5E56] text-white font-medium transition-colors mt-2"
                    disabled={carregandoCadastro}
                  >
                    {carregandoCadastro ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Criando conta...
                      </div>
                    ) : (
                      <span className="flex items-center justify-center">
                        Criar Conta <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Rodapé legal: cinza-azulado, links purple-blue, sem | ou ponto */}
        <footer className="text-center text-sm text-slate-500">
          <p>
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="text-[#5340FF] hover:text-[#6366f1] transition-colors">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-[#5340FF] hover:text-[#6366f1] transition-colors">
              Política de Privacidade
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
