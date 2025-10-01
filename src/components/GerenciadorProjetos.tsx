'use client'

import { useState, useEffect } from 'react'
import { ProjetoService } from '@/lib/projeto-service'
import { Projeto } from '@/lib/supabase'
import { useRealtimeProjetos } from '@/hooks/useRealtimeProjetos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Plus, 
  Code, 
  Calendar, 
  Eye, 
  EyeOff, 
  Globe, 
  Lock, 
  Edit3,
  Trash2,
  Share2,
  Copy,
  Check,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GerenciadorProjetosProps {
  onSelecionarProjeto?: (projeto: Projeto) => void
  onNovoProjeto?: () => void
  onClose?: () => void
}

export function GerenciadorProjetos({ onSelecionarProjeto, onNovoProjeto, onClose }: GerenciadorProjetosProps) {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [dialogNovoAberto, setDialogNovoAberto] = useState(false)
  const [novoProjetoForm, setNovoProjetoForm] = useState({
    title: '',
    code: '// Seu código JavaScript aqui\nconsole.log("Olá, mundo!");',
    visibility: 'public' as 'public' | 'unlisted' | 'private',
    allow_edits: false
  })

  useEffect(() => {
    carregarProjetos()
  }, [])

  // Hook para atualizações em tempo real
  const { realtimeDisponivel } = useRealtimeProjetos({
    projetos,
    setProjetos,
    monitorarPublicos: true
  })

  const carregarProjetos = async () => {
    try {
      setCarregando(true)
      setErro(null)
      const resultado = await ProjetoService.listarProjetosPublicos()
      setProjetos(resultado.projetos)
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
      setErro('Erro ao carregar projetos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const pesquisarProjetos = async (termo: string) => {
    if (!termo.trim()) {
      carregarProjetos()
      return
    }

    try {
      setCarregando(true)
      setErro(null)
      const resultados = await ProjetoService.pesquisarProjetos(termo)
      setProjetos(resultados)
    } catch (error) {
      console.error('Erro ao pesquisar projetos:', error)
      setErro('Erro ao pesquisar projetos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const criarNovoProjeto = async () => {
    try {
      const novoProjeto = await ProjetoService.criarProjeto(novoProjetoForm)
      setProjetos(prev => [novoProjeto, ...prev])
      setDialogNovoAberto(false)
      setNovoProjetoForm({
        title: '',
        code: '// Seu código JavaScript aqui\nconsole.log("Olá, mundo!");',
        visibility: 'public',
        allow_edits: false
      })
      
      if (onNovoProjeto) {
        onNovoProjeto()
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      setErro('Erro ao criar projeto. Tente novamente.')
    }
  }

  const selecionarProjeto = (projeto: Projeto) => {
    if (onSelecionarProjeto) {
      onSelecionarProjeto(projeto)
    }
  }

  const obterCorVisibilidade = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-success/20 text-success border-success/30'
      case 'unlisted':
        return 'bg-secondary/20 text-secondary border-secondary/30'
      case 'private':
        return 'bg-destructive/20 text-destructive border-destructive/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col relative">
        {/* Botão de fechar */}
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Header */}
        <div className="border-b p-4 bg-surface/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Meus Projetos
              {realtimeDisponivel && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Tempo Real
                </Badge>
              )}
            </h2>
            
            <Dialog open={dialogNovoAberto} onOpenChange={setDialogNovoAberto}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Projeto</DialogTitle>
                  <DialogDescription>
                    Crie um novo projeto JavaScript para compartilhar com a comunidade
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titulo">Título do Projeto</Label>
                    <Input
                      id="titulo"
                      value={novoProjetoForm.title}
                      onChange={(e) => setNovoProjetoForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Calculadora Interativa"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="codigo">Código JavaScript</Label>
                    <Textarea
                      id="codigo"
                      value={novoProjetoForm.code}
                      onChange={(e) => setNovoProjetoForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Digite seu código JavaScript aqui..."
                      className="mt-1 font-mono text-sm min-h-[200px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="visibilidade">Visibilidade</Label>
                    <Select
                      value={novoProjetoForm.visibility}
                      onValueChange={(value: 'public' | 'unlisted' | 'private') => 
                        setNovoProjetoForm(prev => ({ ...prev, visibility: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Público
                          </div>
                        </SelectItem>
                        <SelectItem value="unlisted">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4" />
                            Não listado
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Privado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="permitir-edicoes"
                      checked={novoProjetoForm.allow_edits}
                      onChange={(e) => setNovoProjetoForm(prev => ({ ...prev, allow_edits: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <Label htmlFor="permitir-edicoes" className="text-sm">
                      Permitir que outros usuários editem este projeto
                    </Label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setDialogNovoAberto(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={criarNovoProjeto}
                    disabled={!novoProjetoForm.title.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Criar Projeto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Barra de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              value={termoPesquisa}
              onChange={(e) => {
                setTermoPesquisa(e.target.value)
                pesquisarProjetos(e.target.value)
              }}
              placeholder="Pesquisar projetos..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de projetos */}
        <div className="flex-1 overflow-auto p-4">
          {erro && (
            <div className="bg-destructive/20 text-destructive border border-destructive/30 rounded-lg p-4 mb-4">
              {erro}
            </div>
          )}

          {carregando ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Carregando projetos...</div>
            </div>
          ) : projetos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Code className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {termoPesquisa ? 'Nenhum projeto encontrado' : 'Nenhum projeto disponível'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projetos.map((projeto) => (
                <Card 
                  key={projeto.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-muted hover:border-primary/50"
                  onClick={() => selecionarProjeto(projeto)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">{projeto.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${obterCorVisibilidade(projeto.visibility)}`}
                      >
                        {projeto.visibility === 'public' && <Globe className="w-3 h-3 mr-1" />}
                        {projeto.visibility === 'unlisted' && <EyeOff className="w-3 h-3 mr-1" />}
                        {projeto.visibility === 'private' && <Lock className="w-3 h-3 mr-1" />}
                        {projeto.visibility === 'public' ? 'Público' : 
                         projeto.visibility === 'unlisted' ? 'Não listado' : 'Privado'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(projeto.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 rounded-md p-3 font-mono text-xs overflow-hidden">
                      <pre className="whitespace-pre-wrap line-clamp-3">
                        {projeto.code.slice(0, 150)}
                        {projeto.code.length > 150 && '...'}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}