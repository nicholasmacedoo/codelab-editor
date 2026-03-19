'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { ProjetoService } from '@/lib/projeto-service'
import { ReactFileService } from '@/lib/react-file-service'
import { Project, ProjectType, JAVASCRIPT_TEMPLATES, WEB_TEMPLATES, REACT_TEMPLATES } from '@/types/project'
import { ProjectGrid } from '@/components/dashboard/project-grid'
import { NewProjectDialog } from '@/components/dashboard/new-project-dialog'
import { DeleteProjectDialog } from '@/components/dashboard/delete-project-dialog'
import { SearchCommand } from '@/components/dashboard/search-command'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { 
  Plus, 
  Search, 
  LogIn,
  Code2,
  Globe,
  Layers,
  Command
} from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | ProjectType>('all')
  
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSearchCommand, setShowSearchCommand] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      handler: () => setShowSearchCommand(true),
      description: 'Buscar projetos'
    },
    {
      key: 'n',
      ctrlKey: true,
      metaKey: true,
      handler: () => setShowNewProjectDialog(true),
      description: 'Novo projeto'
    }
  ])

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      if (user) {
        const { projetos } = await ProjetoService.listarProjetosDoUsuario(user.id, 0, 100)
        setProjects(projetos)
      } else {
        // Se não estiver autenticado, mostrar projetos públicos
        const { projetos } = await ProjetoService.listarProjetosPublicos(0, 20)
        setProjects(projetos)
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }, [user])

  const filterProjects = useCallback(() => {
    let filtered = projects

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType)
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      )
    }

    setFilteredProjects(filtered)
  }, [projects, searchTerm, filterType])

  // Carregar projetos do usuário
  useEffect(() => {
    if (!authLoading) {
      loadProjects()
    }
  }, [authLoading, loadProjects])

  // Filtrar projetos quando mudar busca ou filtro
  useEffect(() => {
    filterProjects()
  }, [filterProjects])

  const handleCreateProject = async (data: {
    name: string
    type: ProjectType
    description?: string
    template?: string
  }) => {
    setCreatingProject(true)
    try {
      const projectData: Record<string, string | boolean | undefined> = {
        name: data.name,
        type: data.type,
        description: data.description,
        is_public: false,
        allow_edits: false,
        user_id: user?.id
      }

      // Adicionar código do template selecionado
      if (data.type === ProjectType.JAVASCRIPT) {
        const template = JAVASCRIPT_TEMPLATES.find(t => t.id === data.template)
        projectData.js_code = template?.code || '// Seu código JavaScript aqui\nconsole.log("Olá, mundo!");'
      } else if (data.type === ProjectType.WEB_COMPLETE) {
        const template = WEB_TEMPLATES.find(t => t.id === data.template)
        projectData.html_code = template?.html || '<!DOCTYPE html>\n<html>\n<head>\n  <title>Meu Projeto</title>\n</head>\n<body>\n  <h1>Olá, Mundo!</h1>\n</body>\n</html>'
        projectData.css_code = template?.css || ''
        projectData.js_web_code = template?.js || ''
      }
      // React projetos não precisam de campos adicionais aqui - serão criados os arquivos depois

      // Debug: Ver dados sendo enviados
      console.log('Criando projeto com dados:', projectData)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newProject = await ProjetoService.criarProjeto(projectData as any)
      
      // Se for projeto React, criar os arquivos do template
      if (data.type === ProjectType.REACT) {
        const template = REACT_TEMPLATES.find(t => t.id === data.template)
        if (template) {
          const files = Object.entries(template.files).map(([path, content]) => ({
            name: path.split('/').pop() || 'file',
            path,
            content,
            file_type: path.endsWith('.jsx') ? 'jsx' as const :
                       path.endsWith('.js') ? 'js' as const :
                       path.endsWith('.css') ? 'css' as const :
                       path.endsWith('.json') ? 'json' as const : 'md' as const
          }))
          
          await ReactFileService.criarArquivosEmLote(newProject.id, files)
        }
      }
      
      // Debug: Ver projeto retornado
      console.log('Projeto criado:', newProject)
      
      toast.success('Projeto criado com sucesso!')
      
      // Redirecionar para o editor
      router.push(`/editor/${newProject.id}`)
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      toast.error('Erro ao criar projeto')
    } finally {
      setCreatingProject(false)
    }
  }

  const handleOpenProject = (project: Project) => {
    router.push(`/editor/${project.id}`)
  }

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project)
    setShowDeleteDialog(true)
  }

  const confirmDeleteProject = async (project: Project) => {
    setDeletingProject(true)
    try {
      await ProjetoService.deletarProjeto(project.id)
      toast.success('Projeto deletado com sucesso!')
      setProjects(prev => prev.filter(p => p.id !== project.id))
      setShowDeleteDialog(false)
      setProjectToDelete(null)
    } catch (error) {
      console.error('Erro ao deletar projeto:', error)
      toast.error('Erro ao deletar projeto')
    } finally {
      setDeletingProject(false)
    }
  }

  const handleDuplicateProject = async (project: Project) => {
    try {
      const duplicated = await ProjetoService.duplicarProjeto(project.id, user?.id)
      toast.success('Projeto duplicado com sucesso!')
      setProjects(prev => [duplicated, ...prev])
    } catch (error) {
      console.error('Erro ao duplicar projeto:', error)
      toast.error('Erro ao duplicar projeto')
    }
  }

  const handleShareProject = (project: Project) => {
    router.push(`/editor/${project.id}?share=true`)
  }

  const getProjectCounts = () => {
    return {
      total: projects.length,
      javascript: projects.filter(p => p.type === ProjectType.JAVASCRIPT).length,
      web: projects.filter(p => p.type === ProjectType.WEB_COMPLETE).length,
      react: projects.filter(p => p.type === ProjectType.REACT).length
    }
  }

  const counts = getProjectCounts()

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Cabeçalho: logo | busca central | ações — limpo, sem bordas fortes */}
      <header className="bg-[#0B1120]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            <Image
              src="/labcode.svg"
              alt="lab code"
              width={140}
              height={26}
              className="h-6 w-auto shrink-0"
              priority
            />

            {/* Barra de busca central — frosted glass, borda Purple-Blue glowing */}
            <div className="flex-1 flex justify-center max-w-xl mx-auto">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar Projetos"
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#131A2A]/80 border border-slate-700/50 text-white placeholder:text-white/80 text-sm backdrop-blur-sm transition-all duration-200 focus:outline-none focus:border-[#5340FF]/70 focus:ring-2 focus:ring-[#5340FF]/20 focus:shadow-[0_0_20px_rgba(83,64,255,0.15)]"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-600/60 bg-slate-800/40 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  <Command className="w-3 h-3" />K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setShowNewProjectDialog(true)}
                size="sm"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
                disabled={!user && authLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-slate-700/50 animate-pulse" />
              ) : user ? (
                <UserMenu />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => router.push('/auth')}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo: filtros à esquerda + título e grid à direita */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtros laterais (esquerda em lg+) — abas minimalistas, ativa com barra Purple-Blue */}
          <aside className="w-full lg:w-44 shrink-0">
            <nav className="flex flex-row flex-wrap lg:flex-col gap-1 lg:gap-0.5" aria-label="Filtros por tipo">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left transition-colors border-b-2 ${
                  filterType === 'all'
                    ? 'text-[#5340FF] bg-[#5340FF]/5 border-b-[#5340FF] shadow-[0_2px_12px_rgba(83,64,255,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Todos ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterType(ProjectType.JAVASCRIPT)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left transition-colors border-b-2 ${
                  filterType === ProjectType.JAVASCRIPT
                    ? 'text-[#5340FF] bg-[#5340FF]/5 border-b-[#5340FF] shadow-[0_2px_12px_rgba(83,64,255,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Code2 className="w-4 h-4 shrink-0 text-slate-500" />
                JavaScript ({counts.javascript})
              </button>
              <button
                type="button"
                onClick={() => setFilterType(ProjectType.WEB_COMPLETE)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left transition-colors border-b-2 ${
                  filterType === ProjectType.WEB_COMPLETE
                    ? 'text-[#5340FF] bg-[#5340FF]/5 border-b-[#5340FF] shadow-[0_2px_12px_rgba(83,64,255,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0 text-slate-500" />
                Web ({counts.web})
              </button>
              <button
                type="button"
                onClick={() => setFilterType(ProjectType.REACT)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left transition-colors border-b-2 ${
                  filterType === ProjectType.REACT
                    ? 'text-[#5340FF] bg-[#5340FF]/5 border-b-[#5340FF] shadow-[0_2px_12px_rgba(83,64,255,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0 text-slate-500" />
                React ({counts.react})
              </button>
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Título e subtítulo */}
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-white tracking-tight">
                {user ? 'Meus Projetos' : 'Projetos Públicos'}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {user
                  ? `${counts.total} ${counts.total === 1 ? 'projeto' : 'projetos'}`
                  : 'Explore projetos compartilhados pela comunidade'}
              </p>
            </div>

            {/* Grid de Projetos */}
            <ProjectGrid
              projects={filteredProjects}
              loading={loading}
              onOpenProject={handleOpenProject}
              onDeleteProject={handleDeleteProject}
              onDuplicateProject={handleDuplicateProject}
              onShareProject={handleShareProject}
            />

            {/* Mensagem quando não há resultados de busca */}
            {!loading && filteredProjects.length === 0 && projects.length > 0 && (
              <div className="text-center py-20">
                <p className="text-slate-400">
                  Nenhum projeto encontrado com &quot;{searchTerm}&quot;
                </p>
                <Button
                  variant="link"
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-[#5340FF] hover:text-[#6366f1]"
                >
                  Limpar busca
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <NewProjectDialog
        open={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onCreateProject={handleCreateProject}
        loading={creatingProject}
      />

      <DeleteProjectDialog
        project={projectToDelete}
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setProjectToDelete(null)
        }}
        onConfirm={confirmDeleteProject}
        loading={deletingProject}
      />

      <SearchCommand
        open={showSearchCommand}
        onClose={() => setShowSearchCommand(false)}
        projects={projects}
        loading={loading}
      />
    </div>
  )
}

