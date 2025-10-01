'use client'

import { useState, useEffect } from 'react'
import { RealtimeService } from '@/lib/realtime-service'
import { ProjetoService } from '@/lib/projeto-service'
import { Projeto } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Users
} from 'lucide-react'

export function RealtimeDemo() {
  const [conectado, setConectado] = useState(false)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [atualizacoes, setAtualizacoes] = useState<string[]>([])
  const [canaisAtivos, setCanaisAtivos] = useState<string[]>([])
  const [novoProjeto, setNovoProjeto] = useState({
    title: '',
    code: '// Código de exemplo\nconsole.log("Olá, tempo real!");'
  })

  useEffect(() => {
    // Verifica se o realtime está disponível
    const disponivel = RealtimeService.isRealtimeAvailable()
    setConectado(disponivel)

    if (disponivel) {
      // Carrega projetos iniciais
      carregarProjetos()

      // Inscreve-se em atualizações de projetos públicos
      const unsubscribe = RealtimeService.subscribeToPublicProjects((update) => {
        const timestamp = new Date().toLocaleTimeString()
        const mensagem = `[${timestamp}] ${update.type}: Projeto ${update.project_id}`
        
        setAtualizacoes(prev => [mensagem, ...prev.slice(0, 9)]) // Mantém apenas 10 atualizações
        
        // Atualiza lista de projetos baseado no tipo de atualização
        setProjetos(prev => {
          switch (update.type) {
            case 'INSERT':
              if (update.data && !prev.some(p => p.id === update.project_id)) {
                return [update.data as unknown as Projeto, ...prev]
              }
              return prev
            case 'UPDATE':
              return prev.map(p => 
                p.id === update.project_id && update.data
                  ? { ...p, ...(update.data as Partial<Projeto>) }
                  : p
              )
            case 'DELETE':
              return prev.filter(p => p.id !== update.project_id)
            default:
              return prev
          }
        })
      })

      // Atualiza canais ativos periodicamente
      const interval = setInterval(() => {
        setCanaisAtivos(RealtimeService.getActiveChannels())
      }, 1000)

      return () => {
        unsubscribe()
        clearInterval(interval)
      }
    }
  }, [])

  const carregarProjetos = async () => {
    try {
      const resultado = await ProjetoService.listarProjetosPublicos(0, 5)
      setProjetos(resultado.projetos)
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    }
  }

  const criarProjetoTeste = async () => {
    if (!novoProjeto.title.trim()) return

    try {
      await ProjetoService.criarProjeto({
        title: novoProjeto.title,
        code: novoProjeto.code,
        visibility: 'public',
        allow_edits: true,
        user_id: null // Projeto de teste sem usuário específico
      })
      
      setNovoProjeto({
        title: '',
        code: '// Código de exemplo\nconsole.log("Olá, tempo real!");'
      })
      
      // Recarrega a lista após criar
      await carregarProjetos()
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      // Adiciona feedback visual do erro
      setAtualizacoes(prev => [...prev, `ERRO: ${error instanceof Error ? error.message : 'Erro desconhecido'} - ${new Date().toLocaleTimeString()}`])
    }
  }

  const atualizarProjetoTeste = async (projeto: Projeto) => {
    try {
      await ProjetoService.atualizarProjeto(projeto.id, {
        title: `${projeto.title} (Atualizado ${new Date().toLocaleTimeString()})`
      })
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
    }
  }

  const deletarProjetoTeste = async (projetoId: string) => {
    try {
      await ProjetoService.deletarProjeto(projetoId)
    } catch (error) {
      console.error('Erro ao deletar projeto:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {conectado ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            Status do Tempo Real
          </CardTitle>
          <CardDescription>
            Monitoramento das funcionalidades de tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={conectado ? "default" : "destructive"}>
              {conectado ? "Conectado" : "Desconectado"}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Canais ativos: {canaisAtivos.length}
            </div>
            {canaisAtivos.length > 0 && (
              <div className="text-xs text-muted-foreground">
                ({canaisAtivos.join(', ')})
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Criar Projeto de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Criar Projeto de Teste
          </CardTitle>
          <CardDescription>
            Crie um projeto para testar as atualizações em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nome do projeto"
            value={novoProjeto.title}
            onChange={(e) => setNovoProjeto(prev => ({ ...prev, title: e.target.value }))}
          />
          <Textarea
            placeholder="Código do projeto"
            value={novoProjeto.code}
            onChange={(e) => setNovoProjeto(prev => ({ ...prev, code: e.target.value }))}
            rows={4}
          />
          <Button 
            onClick={criarProjetoTeste}
            disabled={!novoProjeto.title.trim() || !conectado}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Projeto
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Projetos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Projetos Públicos (Tempo Real)
          </CardTitle>
          <CardDescription>
            Lista atualizada automaticamente via Supabase Realtime
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projetos.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhum projeto público encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {projetos.map((projeto) => (
                <div 
                  key={projeto.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{projeto.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Atualizado: {new Date(projeto.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {projeto.visibility}
                    </Badge>
                    {projeto.allow_edits && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Colaborativo
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => atualizarProjetoTeste(projeto)}
                      disabled={!conectado}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deletarProjetoTeste(projeto.id)}
                      disabled={!conectado}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log de Atualizações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Log de Atualizações em Tempo Real
          </CardTitle>
          <CardDescription>
            Histórico das últimas atualizações recebidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {atualizacoes.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              Nenhuma atualização recebida ainda
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {atualizacoes.map((atualizacao, index) => (
                <div 
                  key={index}
                  className="text-sm font-mono bg-muted p-2 rounded border-l-2 border-primary"
                >
                  {atualizacao}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}