'use client'

import { Project, ProjectType } from '@/types/project'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Code2, 
  Globe, 
  Layers,
  MoreVertical, 
  Eye, 
  Trash2, 
  Copy, 
  Share2,
  Lock,
  Unlock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProjectCardProps {
  project: Project
  onOpen: (project: Project) => void
  onDelete: (project: Project) => void
  onDuplicate: (project: Project) => void
  onShare: (project: Project) => void
}

export function ProjectCard({ 
  project, 
  onOpen, 
  onDelete, 
  onDuplicate, 
  onShare 
}: ProjectCardProps) {
  const isJavaScript = project.type === ProjectType.JAVASCRIPT
  const isWebComplete = project.type === ProjectType.WEB_COMPLETE
  const isReact = project.type === ProjectType.REACT
  const isPublic = project.is_public

  const getTypeIcon = () => {
    if (isJavaScript) return null // JavaScript usa ícone < > em fúcsia
    if (isWebComplete) return <Globe className="w-4 h-4 text-slate-500" />
    return <Layers className="w-4 h-4 text-slate-500" />
  }

  const getTypeLabel = () => {
    if (isJavaScript) return 'JavaScript'
    if (isWebComplete) return 'Web Completo'
    return 'React'
  }

  // Tags: pílulas de contorno fino; JS com Purple-Blue (logo) no contorno e texto
  const typeTagClass = isJavaScript
    ? 'border border-[#5340FF]/60 text-[#5340FF]/90 bg-transparent'
    : 'border border-slate-500/50 text-slate-400 bg-transparent'

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return 'Data inválida'
    }
  }

  const jsTagIcon = (
    <span className="font-mono text-[#5340FF]/90 text-xs" aria-hidden>&lt;&gt;</span>
  )

  return (
    <Card className="group bg-[#131A2A]/80 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:shadow-xl hover:shadow-slate-900/20 transition-all duration-200 hover:border-slate-600/80 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${typeTagClass}`}>
              {isJavaScript ? jsTagIcon : getTypeIcon()}
              <span>{getTypeLabel()}</span>
            </span>
            {isPublic ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-slate-500/50 text-slate-400 bg-transparent">
                <Unlock className="w-3 h-3" />
                Público
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-slate-500/50 text-slate-500 bg-transparent">
                <Lock className="w-3 h-3" />
                Privado
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
              >
                <MoreVertical className="w-4 h-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(project)}>
                <Eye className="w-4 h-4 mr-2" />
                Abrir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(project)}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(project)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(project)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CardTitle
          className="text-xl font-semibold line-clamp-2 cursor-pointer text-white hover:text-slate-100 transition-colors mt-2 tracking-tight"
          onClick={() => onOpen(project)}
        >
          {project.name}
        </CardTitle>
        
        {project.description && (
          <CardDescription className="line-clamp-2 text-sm text-slate-400">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="text-xs text-slate-500">
          Atualizado {formatDate(project.updated_at)}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t border-slate-700/50">
        <Button
          onClick={() => onOpen(project)}
          variant="outline"
          className="w-full border-[#0F766E]/60 text-[#14B8A6] hover:bg-[#115E59]/20 hover:border-[#0F766E] rounded-lg h-10"
        >
          <Eye className="w-4 h-4 mr-2" />
          Abrir Projeto
        </Button>
      </CardFooter>
    </Card>
  )
}

