'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ProjetoService } from '@/lib/projeto-service'
import { RealtimeService } from '@/lib/realtime-service'
import { Projeto } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { JsEditor } from '@/components/JsEditor'
import { 
  Eye, 
  Edit, 
  Share2, 
  Copy, 
  Activity,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface EstadoCompartilhamento {
  projeto: Projeto | null
  carregando: boolean
  erro: string | null
  modoEdicao: boolean
  podeEditar: boolean
  codigoLocal: string
  tituloLocal: string
  salvando: boolean
  realtimeConectado: boolean
  sincronizando: boolean
}

export default function PaginaCompartilhamento() {
  const params = useParams()
  const slug = params.slug as string

  const [estado, setEstado] = useState<EstadoCompartilhamento>({
    projeto: null,
    carregando: true,
    erro: null,
    modoEdicao: false,
    podeEditar: false,
    codigoLocal: '',
    tituloLocal: '',
    salvando: false,
    realtimeConectado: false,
    sincronizando: false
  })

  // Ref para controlar o debounce
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    carregarProjeto()
  }, [slug])

  useEffect(() => {
    if (estado.projeto) {
      // Configura tempo real para o projeto
      const disponivel = RealtimeService.isRealtimeAvailable()
      setEstado(prev => ({ ...prev, realtimeConectado: disponivel }))

      if (disponivel) {
        const unsubscribe = RealtimeService.subscribeToProject(
          estado.projeto.id,
          (update) => {
            if (update.type === 'UPDATE' && update.data) {
              const updateData = update.data as Partial<Projeto>
              setEstado(prev => ({
                ...prev,
                projeto: prev.projeto ? { ...prev.projeto, ...updateData } : null,
                codigoLocal: updateData.code || prev.codigoLocal,
                tituloLocal: updateData.title || prev.tituloLocal
              }))
            }
          }
        )

        return unsubscribe
      }
    }
  }, [estado.projeto])

  const carregarProjeto = async () => {
    try {
      setEstado(prev => ({ ...prev, carregando: true, erro: null }))
      
      const projeto = await ProjetoService.buscarProjetoPorSlug(slug)
      
      if (!projeto) {
        setEstado(prev => ({ 
          ...prev, 
          carregando: false, 
          erro: 'Projeto não encontrado' 
        }))
        return
      }

      // Verifica se o projeto permite edição
      const podeEditar = projeto.allow_edits || false

      setEstado(prev => ({
        ...prev,
        projeto,
        carregando: false,
        podeEditar,
        codigoLocal: projeto.code,
        tituloLocal: projeto.title
      }))
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        carregando: false,
        erro: error instanceof Error ? error.message : 'Erro ao carregar projeto'
      }))
    }
  }

  const alternarModoEdicao = () => {
    if (!estado.podeEditar) return
    
    setEstado(prev => ({
      ...prev,
      modoEdicao: !prev.modoEdicao,
      // Restaura valores originais se cancelar edição
      codigoLocal: prev.modoEdicao ? (prev.projeto?.code || '') : prev.codigoLocal,
      tituloLocal: prev.modoEdicao ? (prev.projeto?.title || '') : prev.tituloLocal
    }))
  }

  const salvarAlteracoes = async () => {
    if (!estado.projeto || !estado.podeEditar) return

    try {
      setEstado(prev => ({ ...prev, salvando: true }))

      await ProjetoService.atualizarProjeto(estado.projeto.id, {
        title: estado.tituloLocal,
        code: estado.codigoLocal
      })

      setEstado(prev => ({
        ...prev,
        salvando: false,
        modoEdicao: false,
        projeto: prev.projeto ? {
          ...prev.projeto,
          title: prev.tituloLocal,
          code: prev.codigoLocal
        } : null
      }))
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        salvando: false,
        erro: error instanceof Error ? error.message : 'Erro ao salvar'
      }))
    }
  }

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // Feedback visual seria implementado aqui
    } catch (error) {
      console.error('Erro ao copiar link:', error)
    }
  }

  // Função para salvar automaticamente com debounce
  const salvarAutomaticamente = async (codigo: string, titulo: string) => {
    if (!estado.projeto || !estado.podeEditar || !estado.modoEdicao) return

    // Indica que está sincronizando
    setEstado(prev => ({ ...prev, sincronizando: true }))

    // Limpa timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Configura novo timeout
    debounceRef.current = setTimeout(async () => {
      try {
        await ProjetoService.atualizarProjeto(estado.projeto!.id, {
          title: titulo,
          code: codigo
        })
      } catch (error) {
        console.error('Erro ao salvar automaticamente:', error)
      } finally {
        setEstado(prev => ({ ...prev, sincronizando: false }))
      }
    }, 1000) // Salva após 1 segundo de inatividade
  }

  if (estado.carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (estado.erro || !estado.projeto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {estado.erro || 'Projeto não encontrado'}
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Voltar ao Editor
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">
                {estado.modoEdicao ? (
                  <Input
                    value={estado.tituloLocal}
                    onChange={(e) => {
                      const novoTitulo = e.target.value
                      setEstado(prev => ({ 
                        ...prev, 
                        tituloLocal: novoTitulo 
                      }))
                      // Salva automaticamente se estiver em modo de edição
                      if (estado.modoEdicao) {
                        salvarAutomaticamente(estado.codigoLocal, novoTitulo)
                      }
                    }}
                    className="text-xl font-semibold bg-transparent border-none p-0 h-auto"
                    disabled={!estado.podeEditar}
                  />
                ) : (
                  estado.projeto.title
                )}
              </h1>
              
              {/* Badges de Status */}
              <div className="flex gap-2">
                <Badge variant={estado.podeEditar ? "default" : "secondary"}>
                  {estado.podeEditar ? (
                    <><Unlock className="w-3 h-3 mr-1" /> Editável</>
                  ) : (
                    <><Lock className="w-3 h-3 mr-1" /> Somente Leitura</>
                  )}
                </Badge>
                
                {estado.realtimeConectado && (
                  <Badge variant="outline" className="text-green-600">
                    <Activity className="w-3 h-3 mr-1" />
                    Tempo Real
                  </Badge>
                )}

                {estado.sincronizando && (
                  <Badge variant="outline" className="text-blue-600">
                    <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    Sincronizando...
                  </Badge>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button
                onClick={copiarLink}
                variant="outline"
                size="sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>

              {estado.podeEditar && (
                <>
                  {estado.modoEdicao ? (
                    <>
                      <Button
                        onClick={salvarAlteracoes}
                        disabled={estado.salvando}
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {estado.salvando ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button
                        onClick={alternarModoEdicao}
                        variant="outline"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={alternarModoEdicao}
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Código Compartilhado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <JsEditor
                value={estado.codigoLocal}
                onChange={(value) => {
                  setEstado(prev => ({ 
                    ...prev, 
                    codigoLocal: value 
                  }))
                  // Salva automaticamente se estiver em modo de edição
                  if (estado.modoEdicao) {
                    salvarAutomaticamente(value, estado.tituloLocal)
                  }
                }}
                readOnly={!estado.modoEdicao}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Projeto */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Visibilidade:</span>{' '}
                <Badge variant="outline" className="ml-1">
                  {estado.projeto.visibility === 'public' ? 'Público' : 
                   estado.projeto.visibility === 'unlisted' ? 'Não Listado' : 'Privado'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Criado em:</span>{' '}
                {new Date(estado.projeto.created_at).toLocaleDateString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Última atualização:</span>{' '}
                {new Date(estado.projeto.updated_at).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status da Conexão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  estado.realtimeConectado ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>
                  {estado.realtimeConectado ? 'Conectado ao tempo real' : 'Tempo real indisponível'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  estado.podeEditar ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <span>
                  {estado.podeEditar ? 'Edição permitida' : 'Somente visualização'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}