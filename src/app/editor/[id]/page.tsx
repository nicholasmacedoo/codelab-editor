'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProjetoService } from '@/lib/projeto-service'
import { Project, ProjectType } from '@/types/project'
import { JavaScriptEditor } from '@/components/editor/javascript-editor'
import { WebCompleteEditor } from '@/components/editor/web-complete-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserMenu } from '@/components/UserMenu'
import { 
  Save, 
  Share2, 
  ArrowLeft, 
  Loader2,
  Code2,
  Globe,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { ModalPermissoes, ConfiguracaoCompartilhamento } from '@/components/ModalPermissoes'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const projectId = params.id as string
  const shouldOpenShare = searchParams.get('share') === 'true'

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [showShareModal, setShowShareModal] = useState(false)

  // Estados para JavaScript
  const [jsCode, setJsCode] = useState('')

  // Estados para Web Completo
  const [htmlCode, setHtmlCode] = useState('')
  const [cssCode, setCssCode] = useState('')
  const [jsWebCode, setJsWebCode] = useState('')

  // Nome do projeto editável
  const [projectName, setProjectName] = useState('')

  // Debounce para auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastSavedRef = useRef<string>('')

  // Carregar projeto
  useEffect(() => {
    loadProject()
  }, [projectId])

  // Abrir modal de compartilhamento se necessário
  useEffect(() => {
    if (shouldOpenShare && project) {
      setShowShareModal(true)
    }
  }, [shouldOpenShare, project])

  const loadProject = async () => {
    setLoading(true)
    try {
      const projectData = await ProjetoService.buscarProjetoPorId(projectId)
      
      if (!projectData) {
        toast.error('Projeto não encontrado')
        router.push('/dashboard')
        return
      }

      setProject(projectData)
      setProjectName(projectData.name)

      if (projectData.type === ProjectType.JAVASCRIPT) {
        setJsCode(projectData.js_code || '')
        lastSavedRef.current = projectData.js_code || ''
      } else {
        setHtmlCode(projectData.html_code || '')
        setCssCode(projectData.css_code || '')
        setJsWebCode(projectData.js_web_code || '')
        lastSavedRef.current = JSON.stringify({
          html: projectData.html_code,
          css: projectData.css_code,
          js: projectData.js_web_code
        })
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error)
      toast.error('Erro ao carregar projeto')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const saveProject = useCallback(async (showToast = true) => {
    if (!project) return

    setSaveStatus('saving')
    
    try {
      const updateData: Record<string, string> = {
        name: projectName
      }

      if (project.type === ProjectType.JAVASCRIPT) {
        updateData.js_code = jsCode
      } else {
        updateData.html_code = htmlCode
        updateData.css_code = cssCode
        updateData.js_web_code = jsWebCode
      }

      const updated = await ProjetoService.atualizarProjeto(project.id, updateData)
      setProject(updated)
      setSaveStatus('saved')
      
      if (showToast) {
        toast.success('Projeto salvo com sucesso!')
      }

      // Atualizar referência do último salvamento
      if (project.type === ProjectType.JAVASCRIPT) {
        lastSavedRef.current = jsCode
      } else {
        lastSavedRef.current = JSON.stringify({
          html: htmlCode,
          css: cssCode,
          js: jsWebCode
        })
      }

      // Resetar status após 2s
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      setSaveStatus('error')
      
      if (showToast) {
        toast.error('Erro ao salvar projeto')
      }

      // Resetar status de erro após 3s
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    }
  }, [project, projectName, jsCode, htmlCode, cssCode, jsWebCode])

  // Auto-save com debounce de 2 segundos
  useEffect(() => {
    if (!project) return

    // Verificar se houve mudanças
    let hasChanges = false
    if (project.type === ProjectType.JAVASCRIPT) {
      hasChanges = jsCode !== lastSavedRef.current
    } else {
      const current = JSON.stringify({ html: htmlCode, css: cssCode, js: jsWebCode })
      hasChanges = current !== lastSavedRef.current
    }

    if (!hasChanges) return

    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Agendar salvamento
    saveTimeoutRef.current = setTimeout(() => {
      saveProject(false)
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [jsCode, htmlCode, cssCode, jsWebCode, projectName, project, saveProject])

  const handleShare = async (config: ConfiguracaoCompartilhamento) => {
    if (!project) return

    try {
      // Salvar projeto antes de compartilhar
      await saveProject(false)

      // Atualizar configurações de compartilhamento
      const updated = await ProjetoService.atualizarProjeto(project.id, {
        is_public: config.visibility === 'public',
        allow_edits: config.allow_edits
      })

      setProject(updated)

      // Copiar link
      const link = `${window.location.origin}/compartilhar/${updated.slug}`
      await navigator.clipboard.writeText(link)

      toast.success('Link copiado para a área de transferência!')
      setShowShareModal(false)
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      toast.error('Erro ao compartilhar projeto')
    }
  }

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'saved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />
      default:
        return null
    }
  }

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Salvando...'
      case 'saved':
        return 'Salvo'
      case 'error':
        return 'Erro ao salvar'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const isJavaScript = project.type === ProjectType.JAVASCRIPT

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Voltar e Nome do Projeto */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              <div className="h-6 w-px bg-gray-600" />

              <Badge variant="secondary" className={
                isJavaScript 
                  ? 'bg-yellow-500/10 text-yellow-600' 
                  : 'bg-blue-500/10 text-blue-600'
              }>
                {isJavaScript ? (
                  <>
                    <Code2 className="w-3 h-3 mr-1" />
                    JavaScript
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 mr-1" />
                    Web Completo
                  </>
                )}
              </Badge>

              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="max-w-md text-base font-medium shadow-none focus-visible:ring-0 bg-transparent border border-gray-700 hover:bg-gray-700 focus:bg-gray-700 rounded-md px-2 py-1 transition-colors text-gray-200"
                placeholder="Nome do projeto"
              />

              {/* Status de salvamento */}
              {saveStatus !== 'idle' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getSaveStatusIcon()}
                  <span>{getSaveStatusText()}</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveProject(true)}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
                disabled={saveStatus === 'saving'}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareModal(true)}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>

              <div className="h-6 w-px bg-gray-600" />

              {user && <UserMenu />}
            </div>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {isJavaScript ? (
          <JavaScriptEditor
            code={jsCode}
            onChange={setJsCode}
            onSave={() => saveProject(true)}
          />
        ) : (
          <WebCompleteEditor
            html={htmlCode}
            css={cssCode}
            js={jsWebCode}
            onHtmlChange={setHtmlCode}
            onCssChange={setCssCode}
            onJsChange={setJsWebCode}
            onSave={() => saveProject(true)}
          />
        )}
      </div>

      {/* Modal de Compartilhamento */}
      <ModalPermissoes
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCompartilhar={handleShare}
        nomeProjeto={projectName}
        projetoExistente={true}
      />
    </div>
  )
}

