'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react'

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
      
      // Aguardar um pouco para garantir que o estado seja atualizado
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
             <h1 className="text-4xl text-white font-bold font-mono">
                <span className='bg-gradient-to-r from-orange-500 via-pink-500 to-purple-700 text-transparent bg-clip-text'>&lt;</span>lab<span className='bg-gradient-to-r from-orange-500 via-pink-500 to-purple-700 text-transparent bg-clip-text'>code&gt;</span></h1>
          <p className="text-gray-400">
            Crie, edite e compartilhe código JavaScript online
          </p>
        </div>

        {/* Formulários */}
        <Card className="shadow-xl border-gray-700 bg-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl text-white">Bem-vindo</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Entre na sua conta ou crie uma nova para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-700 border-gray-600">
                <TabsTrigger value="login" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300">Entrar</TabsTrigger>
                <TabsTrigger value="cadastro" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300">Cadastrar</TabsTrigger>
              </TabsList>

              {/* Aba de Login */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="seu@email.com"
                        value={emailLogin}
                        onChange={(e) => setEmailLogin(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha-login" className="text-gray-300">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="senha-login"
                        type="password"
                        placeholder="Sua senha"
                        value={senhaLogin}
                        onChange={(e) => setSenhaLogin(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {erroLogin && (
                    <Alert className="border-red-500 bg-red-900/20">
                      <AlertDescription className="text-red-400">
                        {erroLogin}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={carregandoLogin}
                  >
                    {carregandoLogin ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Entrando...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Entrar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Aba de Cadastro */}
              <TabsContent value="cadastro" className="space-y-4">
                <form onSubmit={handleCadastro} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-cadastro" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="email-cadastro"
                        type="email"
                        placeholder="seu@email.com"
                        value={emailCadastro}
                        onChange={(e) => setEmailCadastro(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha-cadastro" className="text-gray-300">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="senha-cadastro"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={senhaCadastro}
                        onChange={(e) => setSenhaCadastro(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar-senha" className="text-gray-300">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="confirmar-senha"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={confirmacaoSenha}
                        onChange={(e) => setConfirmacaoSenha(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {erroCadastro && (
                    <Alert className="border-red-500 bg-red-900/20">
                      <AlertDescription className="text-red-400">
                        {erroCadastro}
                      </AlertDescription>
                    </Alert>
                  )}

                  {sucessoCadastro && (
                    <Alert className="border-green-500 bg-green-900/20">
                      <AlertDescription className="text-green-400">
                        {sucessoCadastro}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={carregandoCadastro}
                  >
                    {carregandoCadastro ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando conta...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Criar Conta
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="text-blue-400 hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-blue-400 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}