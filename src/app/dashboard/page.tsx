'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProjetoService } from '@/lib/projeto-service'
import { Project, ProjectType, JAVASCRIPT_TEMPLATES, WEB_TEMPLATES } from '@/types/project'
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
  Command
} from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      } else {
        const template = WEB_TEMPLATES.find(t => t.id === data.template)
        projectData.html_code = template?.html || '<!DOCTYPE html>\n<html>\n<head>\n  <title>Meu Projeto</title>\n</head>\n<body>\n  <h1>Olá, Mundo!</h1>\n</body>\n</html>'
        projectData.css_code = template?.css || ''
        projectData.js_web_code = template?.js || ''
      }

      // Debug: Ver dados sendo enviados
      console.log('Criando projeto com dados:', projectData)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newProject = await ProjetoService.criarProjeto(projectData as any)
      
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
      web: projects.filter(p => p.type === ProjectType.WEB_COMPLETE).length
    }
  }

  const counts = getProjectCounts()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold font-mono">
                <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-700 text-transparent bg-clip-text">
                  &lt;
                </span>
                lab
                <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-700 text-transparent bg-clip-text">
                  code&gt;
                </span>
              </h1>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowNewProjectDialog(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90"
                disabled={!user && authLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>

              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <UserMenu />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
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

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Título e Busca */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {user ? 'Meus Projetos' : 'Projetos Públicos'}
              </h2>
              <p className="text-muted-foreground">
                {user 
                  ? `${counts.total} ${counts.total === 1 ? 'projeto' : 'projetos'}` 
                  : 'Explore projetos compartilhados pela comunidade'
                }
              </p>
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full md:w-80">
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => setShowSearchCommand(true)}
              >
                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Buscar projetos...</span>
                <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <Command className="w-3 h-3" />K
                </kbd>
              </Button>
            </div>
          </div>

          {/* Filtros por Tipo */}
          <Tabs value={filterType} onValueChange={(value) => setFilterType(value as typeof filterType)}>
            <TabsList>
              <TabsTrigger value="all">
                Todos ({counts.total})
              </TabsTrigger>
              <TabsTrigger value={ProjectType.JAVASCRIPT}>
                <Code2 className="w-4 h-4 mr-2" />
                JavaScript ({counts.javascript})
              </TabsTrigger>
              <TabsTrigger value={ProjectType.WEB_COMPLETE}>
                <Globe className="w-4 h-4 mr-2" />
                Web ({counts.web})
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
            <p className="text-muted-foreground">
              Nenhum projeto encontrado com &quot;{searchTerm}&quot;
            </p>
            <Button
              variant="link"
              onClick={() => setSearchTerm('')}
              className="mt-2"
            >
              Limpar busca
            </Button>
          </div>
        )}
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

