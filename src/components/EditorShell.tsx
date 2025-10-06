'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { JsEditor } from './JsEditor'
import { ConsolePanel } from './ConsolePanel'
import { RealtimeDemo } from '@/components/RealtimeDemo'
import { GerenciadorProjetos } from '@/components/GerenciadorProjetos'
import { useSandboxRunner, LogEntry } from './SandboxRunner'
import { ArmazenamentoLocal, ProjetoLocal } from '@/lib/storage'
import { ProjetoService } from '@/lib/projeto-service'
import { Projeto } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play, Square, Save, Plus, Share2, Wifi, WifiOff, FolderOpen, Activity, LogIn, PanelRight, PanelBottom } from 'lucide-react'
import { ModalPermissoes, ConfiguracaoCompartilhamento } from '@/components/ModalPermissoes'
import { UserMenu } from '@/components/UserMenu'
import { toast } from 'sonner'
import { RealtimeService } from '@/lib/realtime-service'

export function EditorShell() {
  // Estados principais
  const [codigo, setCodigo] = useState('console.log("Olá, mundo!");')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | undefined>(undefined)
  const [isOnline, setIsOnline] = useState(true) // Inicializar como true para evitar hidratação
  
  // Estados de projeto
  const [nomeProjeto, setNomeProjeto] = useState('Meu Projeto')
  const [projetoAtual, setProjetoAtual] = useState<ProjetoLocal | null>(null)
  const [projetoSupabase, setProjetoSupabase] = useState<Projeto | null>(null)
  
  // Estados de UI
  const [mostrarGerenciador, setMostrarGerenciador] = useState(false)
  const [mostrarRealtime, setMostrarRealtime] = useState(false)
  const [mostrarModalPermissoes, setMostrarModalPermissoes] = useState(false)
  
  // Estados de autenticação
  const { user, loading: authLoading } = useAuth()
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false)
  
  // Layout e resize do editor/console
  const [layoutMode, setLayoutMode] = useState<'right' | 'bottom'>('right')
  const [consoleSize, setConsoleSize] = useState<number>(500) // px padrão quando lateral
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartPos = useRef<number>(0)
  const resizeStartSize = useRef<number>(500)
  const splitRef = useRef<HTMLDivElement | null>(null)
  const [consoleCollapsed, setConsoleCollapsed] = useState(false)

  const startResize = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    resizeStartPos.current = layoutMode === 'right' ? e.clientX : e.clientY
    resizeStartSize.current = consoleSize
    // Prevenir seleção de texto durante o drag
    document.body.style.cursor = layoutMode === 'right' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [layoutMode, consoleSize])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const currentPos = layoutMode === 'right' ? e.clientX : e.clientY
    const delta = currentPos - resizeStartPos.current
    // Para layout lateral (right), aumentar ao arrastar para a esquerda (delta negativo)
    const newSize = layoutMode === 'right'
      ? Math.max(500, Math.min(800, resizeStartSize.current - delta))
      : Math.max(160, Math.min(600, resizeStartSize.current - delta))
    setConsoleSize(newSize)
  }, [isResizing, layoutMode])

  const stopResize = useCallback(() => {
    if (!isResizing) return
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [isResizing])

  useEffect(() => {
    if (!isResizing) return
    const handleMove = (e: MouseEvent) => onMouseMove(e)
    const handleUp = () => stopResize()
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isResizing, onMouseMove, stopResize])

  const reopenConsoleWithDefault = useCallback((mode: 'right' | 'bottom') => {
    const defaultSize = mode === 'right' ? 500 : 240
    setConsoleSize(defaultSize)
    resizeStartSize.current = defaultSize
    setConsoleCollapsed(false)
    try {
      const key = mode === 'right' ? 'labcode.consoleSize.right' : 'labcode.consoleSize.bottom'
      localStorage.setItem(key, String(defaultSize))
    } catch {}
  }, [])

  // Inicializar preferências do layout/size do localStorage
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('labcode.layoutMode')
      if (savedLayout === 'right' || savedLayout === 'bottom') {
        setLayoutMode(savedLayout as 'right' | 'bottom')
      }
      const key = savedLayout === 'bottom' ? 'labcode.consoleSize.bottom' : 'labcode.consoleSize.right'
      const savedSizeStr = localStorage.getItem(key)
      if (savedSizeStr) {
        const savedSize = parseInt(savedSizeStr)
        if (!Number.isNaN(savedSize)) {
          const adjusted = (savedLayout === 'bottom')
            ? Math.max(160, Math.min(600, savedSize))
            : Math.max(500, Math.min(800, savedSize))
          setConsoleSize(adjusted)
          resizeStartSize.current = adjusted
        }
      } else {
        // Default quando lateral
        if (!savedLayout || savedLayout === 'right') {
          setConsoleSize(500)
          resizeStartSize.current = 500
        }
      }
    } catch {}
  }, [])

  // Persistir layout
  useEffect(() => {
    try {
      localStorage.setItem('labcode.layoutMode', layoutMode)
    } catch {}
  }, [layoutMode])

  // Ao mudar layout, ajustar tamanho e carregar último usado
  useEffect(() => {
    try {
      if (layoutMode === 'right') {
        const rightStr = localStorage.getItem('labcode.consoleSize.right')
        const size = rightStr ? parseInt(rightStr) : consoleSize
        const adjusted = Math.max(500, Math.min(800, Number.isNaN(size) ? 500 : size))
        setConsoleSize(adjusted)
        resizeStartSize.current = adjusted
      } else {
        const bottomStr = localStorage.getItem('labcode.consoleSize.bottom')
        const size = bottomStr ? parseInt(bottomStr) : consoleSize
        const adjusted = Math.max(160, Math.min(600, Number.isNaN(size) ? 240 : size))
        setConsoleSize(adjusted)
        resizeStartSize.current = adjusted
      }
    } catch {}
  }, [layoutMode])

  // Persistir tamanho conforme o layout atual
  useEffect(() => {
    try {
      const key = layoutMode === 'right' ? 'labcode.consoleSize.right' : 'labcode.consoleSize.bottom'
      localStorage.setItem(key, String(consoleSize))
    } catch {}
  }, [consoleSize, layoutMode])
  
  // Referência para controle de sincronização em tempo real
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Atualizar status online após hidratação
  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Função para iniciar sincronização em tempo real
  const iniciarSincronizacaoRealtime = useCallback((projetoId: string) => {
    // Cancela sincronização anterior se existir
    if (realtimeUnsubscribeRef.current) {
      realtimeUnsubscribeRef.current()
      realtimeUnsubscribeRef.current = null
    }

    try {
      // Inscreve-se nas atualizações do projeto
      const unsubscribe = RealtimeService.subscribeToProject(projetoId, (update) => {
        if (update.type === 'UPDATE' && update.data) {
          const dadosAtualizados = update.data as Partial<Projeto>
          
          // Atualiza o código se foi alterado por outro usuário
          if (dadosAtualizados.code && dadosAtualizados.code !== codigo) {
            setCodigo(dadosAtualizados.code)
          }
          
          // Atualiza o título se foi alterado
          if (dadosAtualizados.title && dadosAtualizados.title !== nomeProjeto) {
            setNomeProjeto(dadosAtualizados.title)
          }
          
          // Atualiza o estado do projeto
          if (projetoSupabase) {
            setProjetoSupabase(prev => prev ? { ...prev, ...dadosAtualizados } : prev)
          }
        }
      })
      
      realtimeUnsubscribeRef.current = unsubscribe
      console.log('Sincronização em tempo real iniciada para projeto:', projetoId)
    } catch (error) {
      console.error('Erro ao iniciar sincronização em tempo real:', error)
    }
  }, [codigo, nomeProjeto, projetoSupabase])

  // Função para parar sincronização em tempo real
  const pararSincronizacaoRealtime = useCallback(() => {
    if (realtimeUnsubscribeRef.current) {
      realtimeUnsubscribeRef.current()
      realtimeUnsubscribeRef.current = null
      console.log('Sincronização em tempo real parada')
    }
  }, [])

  // Função para sincronizar automaticamente mudanças (com debounce)
  const sincronizarAutomaticamente = useCallback(async (novoCode: string, novoTitulo: string) => {
    if (!projetoSupabase) return

    // Cancela sincronização anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Agenda nova sincronização
    debounceRef.current = setTimeout(async () => {
      try {
        await ProjetoService.atualizarProjeto(projetoSupabase.id, {
          code: novoCode,
          title: novoTitulo
        })
        console.log('Projeto sincronizado automaticamente')
      } catch (error) {
        console.error('Erro na sincronização automática:', error)
      }
    }, 1000) // 1 segundo de debounce
  }, [projetoSupabase])

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      pararSincronizacaoRealtime()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [pararSincronizacaoRealtime])

  // Callbacks para o SandboxRunner
  const onLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [...prev, entry])
  }, [])

  const onExecutionStart = useCallback(() => {
    setIsExecuting(true)
    setExecutionTime(undefined)
  }, [])

  const onExecutionEnd = useCallback((duration: number) => {
    setIsExecuting(false)
    setExecutionTime(duration)
  }, [])

  const onError = useCallback((error: string, stack?: string) => {
    const errorEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'error',
      args: [error],
      stack
    }
    setLogs(prev => [...prev, errorEntry])
  }, [])

  // Usar o hook do SandboxRunner
  const sandbox = useSandboxRunner({
    onLog,
    onExecutionStart,
    onExecutionEnd,
    onError
  })

  const executarCodigo = useCallback(() => {
    if (isExecuting) {
      sandbox.pararExecucao()
    } else {
      sandbox.executarCodigo(codigo)
    }
  }, [codigo, isExecuting, sandbox])

  const limparConsole = useCallback(() => {
    setLogs([])
  }, [])

  const salvarProjetoAtual = useCallback(async () => {
    if (!nomeProjeto.trim()) {
      alert('Por favor, digite um nome para o projeto')
      return
    }

    try {
      if (projetoSupabase) {
        // Atualizar projeto existente no Supabase
        const projetoAtualizado = await ProjetoService.atualizarProjeto(projetoSupabase.id, {
          title: nomeProjeto,
          code: codigo
        })
        setProjetoSupabase(projetoAtualizado)
        console.log('Projeto atualizado no Supabase:', projetoAtualizado)
      } else {
        // Criar novo projeto no Supabase
        const novoProjeto = await ProjetoService.criarProjeto({
          title: nomeProjeto,
          code: codigo,
          visibility: 'unlisted',
          allow_edits: true
        })
        setProjetoSupabase(novoProjeto)
        // Converter Projeto para ProjetoLocal para compatibilidade
        const projetoLocal: ProjetoLocal = {
          ...novoProjeto,
          isLocal: false
        }
        setProjetoAtual(projetoLocal)
        console.log('Novo projeto criado no Supabase:', novoProjeto)
      }
    } catch (error) {
      console.error('Erro ao salvar no Supabase, salvando localmente:', error)
      
      // Fallback para armazenamento local
      try {
        const projeto: ProjetoLocal = {
          id: crypto.randomUUID(),
          user_id: null,
          slug: nomeProjeto.toLowerCase().replace(/\s+/g, '-'),
          title: nomeProjeto,
          code: codigo,
          visibility: 'private',
          allow_edits: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isLocal: true
        }
        
        await ArmazenamentoLocal.salvarProjeto(projeto)
        setProjetoAtual(projeto)
        console.log('Projeto salvo localmente:', projeto)
      } catch (localError) {
        console.error('Erro ao salvar localmente:', localError)
        alert('Erro ao salvar projeto')
      }
    }
  }, [nomeProjeto, codigo, projetoSupabase])

  // Função para lidar com mudanças no código
  const handleCodigoChange = useCallback((novoCode: string) => {
    setCodigo(novoCode)
    
    // Se há um projeto compartilhado, sincronizar automaticamente
    if (projetoSupabase) {
      sincronizarAutomaticamente(novoCode, nomeProjeto)
    }
  }, [projetoSupabase, nomeProjeto, sincronizarAutomaticamente])

  const criarNovoProjeto = useCallback(() => {
    setCodigo('// Novo projeto\nconsole.log("Olá, mundo!");')
    setLogs([])
    setProjetoAtual(null)
    setProjetoSupabase(null)
    setNomeProjeto('')
    setExecutionTime(undefined)
  }, [])

  const selecionarProjeto = useCallback((projeto: Projeto) => {
    setCodigo(projeto.code)
    setNomeProjeto(projeto.title)
    setProjetoSupabase(projeto)
    // Converter Projeto para ProjetoLocal para compatibilidade
    const projetoLocal: ProjetoLocal = {
      ...projeto,
      isLocal: false
    }
    setProjetoAtual(projetoLocal)
    setLogs([])
    setExecutionTime(undefined)
    setMostrarGerenciador(false)
    
    // Se o projeto é público ou permite edições, iniciar sincronização em tempo real
    if (projeto.visibility === 'public' || projeto.allow_edits) {
      iniciarSincronizacaoRealtime(projeto.id)
    }
  }, [iniciarSincronizacaoRealtime])

  // Função para compartilhar projeto
  const compartilharProjeto = useCallback(() => {
    setMostrarModalPermissoes(true)
  }, [])

  // Função para processar compartilhamento com configurações
  const processarCompartilhamento = useCallback(async (configuracao: ConfiguracaoCompartilhamento) => {
    try {
      // Salvar ou atualizar o projeto primeiro
      let projetoParaCompartilhar = projetoSupabase
      
      if (!projetoParaCompartilhar) {
        // Criar novo projeto
         projetoParaCompartilhar = await ProjetoService.criarProjeto({
           title: configuracao.titulo,
           code: codigo,
           user_id: user?.id || null, // Usar ID do usuário se autenticado
           visibility: configuracao.visibility,
           allow_edits: configuracao.allow_edits
         })
      } else if (projetoSupabase) {
        // Tentar atualizar projeto existente
        try {
          projetoParaCompartilhar = await ProjetoService.atualizarProjeto(projetoSupabase.id, {
            title: configuracao.titulo,
            code: codigo,
            visibility: configuracao.visibility,
            allow_edits: configuracao.allow_edits
          })
        } catch (error) {
          console.warn('Projeto não encontrado, criando novo:', error)
          // Se o projeto não existe mais, criar um novo
          projetoParaCompartilhar = await ProjetoService.criarProjeto({
            title: configuracao.titulo,
            code: codigo,
            user_id: user?.id || null,
            visibility: configuracao.visibility,
            allow_edits: configuracao.allow_edits
          })
          // Limpar referência ao projeto antigo
          setProjetoSupabase(null)
        }
      }

      // Gerar link de compartilhamento
      const linkCompartilhamento = `${window.location.origin}/compartilhar/${projetoParaCompartilhar.slug}`
      
      // Copiar para clipboard
      await navigator.clipboard.writeText(linkCompartilhamento)

      // Atualizar estado local
      setProjetoSupabase(projetoParaCompartilhar)
      setNomeProjeto(configuracao.titulo)
      
      // Iniciar sincronização em tempo real automaticamente
      iniciarSincronizacaoRealtime(projetoParaCompartilhar.id)
      
      // Fechar modal
      setMostrarModalPermissoes(false)
      
      // Feedback para o usuário com toast de sucesso
      toast.success('Projeto compartilhado com sucesso!', {
        description: 'Link copiado para a área de transferência. Sincronização em tempo real ativada.',
        duration: 3000,
      })
    } catch (error) {
      console.error('Erro ao compartilhar projeto:', error)
      toast.error('Erro ao compartilhar projeto', {
        description: 'Tente novamente em alguns instantes',
        duration: 4000,
      })
    }
  }, [codigo, projetoSupabase, user])

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo e Nome do Projeto */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                
                <h1 className="text-lg text-white font-bold font-mono">
                  <span className='bg-gradient-to-r from-orange-500 via-pink-500 to-purple-700 text-transparent bg-clip-text'>&lt;</span>lab<span className='bg-gradient-to-r from-orange-500 via-pink-500 to-purple-700 text-transparent bg-clip-text'>code&gt;</span></h1>
              </div>
              
              <div className="h-6 w-px bg-gray-600" />
              
              <Input
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                className="text-base font-medium shadow-none focus-visible:ring-0 bg-transparent border border-gray-700 hover:bg-gray-700 focus:bg-gray-700 rounded-md px-2 py-1 transition-colors text-gray-200 placeholder:text-gray-400"
                placeholder="Nome do projeto"
              />
            </div>
            
            {/* Ações e Usuário */}
            <div className="flex items-center space-x-3">
              {/* Botões de ação */}
              <div className="flex items-center space-x-2">
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMostrarGerenciador(true)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Projetos
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarRealtime(true)}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Tempo Real
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={compartilharProjeto}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              <div className="h-6 w-px bg-gray-600" />

              {/* Autenticação */}
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
              ) : user ? (
                <UserMenu />
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setMostrarAuthModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex-1 flex overflow-hidden ${layoutMode === 'right' ? 'flex-row' : 'flex-col'}`} ref={splitRef}>
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="border-b p-2 bg-muted/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={executarCodigo}
                  variant={isExecuting ? "destructive" : "default"}
                  size="sm"
                  className={isExecuting 
                    ? "bg-destructive hover:bg-destructive/90" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }
                >
                  {isExecuting ? (
                    <>
                      <Square className="w-4 h-4 mr-1" />
                      Parar
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Executar
                    </>
                  )}
                </Button>
                <Button onClick={limparConsole} variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground transition-colors">
                  Limpar Console
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Alternar posição do console */}
                <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
                  <Button
                    variant={layoutMode === 'right' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-7 px-2 ${layoutMode === 'right' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => {
                      setLayoutMode('right')
                      if (consoleCollapsed) {
                        reopenConsoleWithDefault('right')
                      }
                    }}
                    title="Mostrar console na lateral"
                  >
                    <PanelRight className="w-3 h-3 mr-1" />
                    Lateral
                  </Button>
                  <Button
                    variant={layoutMode === 'bottom' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-7 px-2 ${layoutMode === 'bottom' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => {
                      setLayoutMode('bottom')
                      if (consoleCollapsed) {
                        reopenConsoleWithDefault('bottom')
                      }
                    }}
                    title="Mostrar console embaixo"
                  >
                    <PanelBottom className="w-3 h-3 mr-1" />
                    Embaixo
                  </Button>
                </div>

                {/* Mostrar/Ocultar Console */}
                {consoleCollapsed ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => reopenConsoleWithDefault(layoutMode)}
                    title="Mostrar Console"
                  >
                    Mostrar Console
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setConsoleCollapsed(true)}
                    title="Ocultar Console"
                  >
                    Ocultar Console
                  </Button>
                )}

                {executionTime !== undefined && (
                  <div className="px-3 py-1 bg-success/20 text-success border border-success/30 rounded-md text-xs font-medium">
                    ✓ Executado em {executionTime}ms
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <JsEditor
              value={codigo}
              onChange={handleCodigoChange}
              onRun={executarCodigo}
              onSave={salvarProjetoAtual}
              onClearConsole={limparConsole}
            />
          </div>
        </div>
        
        {/* Divisor para resize */}
        {!consoleCollapsed && (
          <div
            className={layoutMode === 'right' ? 'w-1 cursor-col-resize bg-gray-700 hover:bg-gray-600' : 'h-1 w-full cursor-row-resize bg-gray-700 hover:bg-gray-600'}
            onMouseDown={startResize}
            role="separator"
            aria-orientation={layoutMode === 'right' ? 'vertical' : 'horizontal'}
          />
        )}

        {/* Console */}
        {!consoleCollapsed && (
          <div
            className={layoutMode === 'right' ? 'border-l flex-shrink-0' : 'border-t flex-shrink-0'}
            style={layoutMode === 'right' ? { width: consoleSize, minWidth: 500 } : { height: consoleSize, minHeight: 160 }}
          >
            <ConsolePanel
              logs={logs}
              onClear={limparConsole}
              isExecuting={isExecuting}
              executionTime={executionTime}
              compact={layoutMode === 'right' && consoleSize <= 560}
            />
          </div>
        )}
      </div>

      {/* Gerenciador de Projetos */}
      {mostrarGerenciador && (
        <GerenciadorProjetos
          onClose={() => setMostrarGerenciador(false)}
          onSelecionarProjeto={selecionarProjeto}
        />
      )}

      {/* Demo de Tempo Real */}
      {mostrarRealtime && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col relative">
            <div className="border-b p-4 bg-surface/50 backdrop-blur-sm flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Demonstração de Tempo Real
              </h2>
              <Button
                onClick={() => setMostrarRealtime(false)}
                variant="ghost"
                size="sm"
                className="hover:bg-muted"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <RealtimeDemo />
            </div>
          </div>
        </div>
      )}
      {/* Modal de Permissões */}
      <ModalPermissoes
        isOpen={mostrarModalPermissoes}
        onClose={() => setMostrarModalPermissoes(false)}
        onCompartilhar={processarCompartilhamento}
        nomeProjeto={nomeProjeto || 'Projeto sem nome'}
        projetoExistente={!!projetoAtual || !!projetoSupabase}
      />
    </div>
  )
}