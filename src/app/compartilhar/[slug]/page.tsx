'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProjetoService } from '@/lib/projeto-service'
import { Project, ProjectType } from '@/types/project'
import { JavaScriptEditor } from '@/components/editor/javascript-editor'
import { WebCompleteEditor } from '@/components/editor/web-complete-editor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Copy, 
  ExternalLink, 
  Loader2,
  Code2,
  Globe,
  Download,
  User,
  Save,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CompartilharPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estado local do código (para quando allow_edits = true)
  const [localCode, setLocalCode] = useState({
    js: '',
    html: '',
    css: '',
    jsWeb: ''
  })

  useEffect(() => {
    loadProject()
  }, [slug])

  useEffect(() => {
    if (project) {
      setLocalCode({
        js: project.js_code || '',
        html: project.html_code || '',
        css: project.css_code || '',
        jsWeb: project.js_web_code || ''
      })
    }
  }, [project])

  const loadProject = async () => {
    setLoading(true)
    try {
      const projectData = await ProjetoService.buscarProjetoPorSlug(slug)
      
      if (!projectData) {
        toast.error('Projeto não encontrado')
        router.push('/dashboard')
        return
      }

      if (!projectData.is_public) {
        toast.error('Este projeto não é público')
        router.push('/dashboard')
        return
      }

      setProject(projectData)
      
      // Debug: verificar tipo do projeto
      console.log('Projeto carregado:', {
        name: projectData.name,
        type: projectData.type,
        isJavaScript: projectData.type === ProjectType.JAVASCRIPT,
        isWebComplete: projectData.type === ProjectType.WEB_COMPLETE,
        hasHtmlCode: !!projectData.html_code,
        hasJsCode: !!projectData.js_code
      })
    } catch (error) {
      console.error('Erro ao carregar projeto:', error)
      toast.error('Erro ao carregar projeto')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar link:', error)
      toast.error('Erro ao copiar link')
    }
  }

  const handleCreateCopy = async () => {
    if (!project) return

    try {
      const duplicate = await ProjetoService.duplicarProjeto(project.id)
      toast.success('Cópia criada com sucesso!')
      router.push(`/editor/${duplicate.id}`)
    } catch (error) {
      console.error('Erro ao criar cópia:', error)
      toast.error('Erro ao criar cópia. Faça login para continuar.')
      router.push('/auth')
    }
  }

  const handleSave = async () => {
    if (!project || !project.allow_edits) {
      toast.error('Este projeto não permite edições')
      return
    }

    setSaving(true)
    try {
      const updateData: Record<string, string> = {}
      
      if (project.type === ProjectType.JAVASCRIPT) {
        updateData.js_code = localCode.js
      } else {
        updateData.html_code = localCode.html
        updateData.css_code = localCode.css
        updateData.js_web_code = localCode.jsWeb
      }

      await ProjetoService.atualizarProjeto(project.id, updateData)
      toast.success('Alterações salvas com sucesso!')
      
      // Recarregar projeto para pegar a versão atualizada
      await loadProject()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (!project) return

    const isJavaScript = project.type === ProjectType.JAVASCRIPT

    if (isJavaScript) {
      // Download como .js
      const blob = new Blob([localCode.js || ''], { type: 'text/javascript' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}.js`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      // Download como .html com CSS e JS inline
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <style>
${localCode.css || ''}
  </style>
</head>
<body>
${localCode.html || ''}
  <script>
${localCode.jsWeb || ''}
  </script>
</body>
</html>`

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    toast.success('Download iniciado!')
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
  
  // Debug: Log antes de renderizar
  console.log('Renderizando editor:', {
    projectType: project.type,
    isJavaScript,
    componentToRender: isJavaScript ? 'JavaScriptEditor' : 'WebCompleteEditor'
  })

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Info do Projeto */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
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

              <div>
                <h1 className="text-lg font-semibold text-gray-200">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-sm text-gray-400">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Atualizado {formatDistanceToNow(new Date(project.updated_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>

              {project.allow_edits ? (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                  <User className="w-3 h-3 mr-1" />
                  Edição Colaborativa
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  Apenas Visualização
                </Badge>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center space-x-2">
              {project.allow_edits && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleCreateCopy}
                className="bg-primary hover:bg-primary/90"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Criar Cópia
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div className={`flex-1 overflow-hidden ${!project.allow_edits ? 'pointer-events-none opacity-90' : ''}`}>
        {project.type === ProjectType.JAVASCRIPT ? (
          <JavaScriptEditor
            code={localCode.js}
            onChange={(newCode) => {
              if (project.allow_edits) {
                setLocalCode(prev => ({ ...prev, js: newCode }))
              }
            }}
            onSave={project.allow_edits ? handleSave : () => {}}
          />
        ) : project.type === ProjectType.WEB_COMPLETE ? (
          <WebCompleteEditor
            html={localCode.html}
            css={localCode.css}
            js={localCode.jsWeb}
            onHtmlChange={(newHtml) => {
              if (project.allow_edits) {
                setLocalCode(prev => ({ ...prev, html: newHtml }))
              }
            }}
            onCssChange={(newCss) => {
              if (project.allow_edits) {
                setLocalCode(prev => ({ ...prev, css: newCss }))
              }
            }}
            onJsChange={(newJs) => {
              if (project.allow_edits) {
                setLocalCode(prev => ({ ...prev, jsWeb: newJs }))
              }
            }}
            onSave={project.allow_edits ? handleSave : () => {}}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tipo de Projeto Desconhecido</h3>
              <p className="text-muted-foreground mb-4">
                Tipo detectado: <code className="bg-muted px-2 py-1 rounded">{project.type}</code>
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de modo somente leitura */}
      {!project.allow_edits && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm text-gray-300">
            📖 Modo apenas visualização - Crie uma cópia para editar
          </p>
        </div>
      )}
    </div>
  )
}
