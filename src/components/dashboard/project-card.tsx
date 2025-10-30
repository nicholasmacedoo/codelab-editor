'use client'

import { Project, ProjectType } from '@/types/project'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    if (isJavaScript) return <Code2 className="w-4 h-4" />
    if (isWebComplete) return <Globe className="w-4 h-4" />
    return <Layers className="w-4 h-4" />
  }

  const getTypeLabel = () => {
    if (isJavaScript) return 'JavaScript'
    if (isWebComplete) return 'Web Completo'
    return 'React'
  }

  const getTypeColor = () => {
    if (isJavaScript) return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
    if (isWebComplete) return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
    return 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20'
  }

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

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="secondary" className={getTypeColor()}>
              <span className="flex items-center gap-1">
                {getTypeIcon()}
                <span className="text-xs">{getTypeLabel()}</span>
              </span>
            </Badge>
            {isPublic ? (
              <Badge variant="outline" className="text-xs">
                <Unlock className="w-3 h-3 mr-1" />
                Público
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Lock className="w-3 h-3 mr-1" />
                Privado
              </Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          className="text-lg font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors mt-2"
          onClick={() => onOpen(project)}
        >
          {project.name}
        </CardTitle>
        
        {project.description && (
          <CardDescription className="line-clamp-2 text-sm">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="text-xs text-muted-foreground">
          Atualizado {formatDate(project.updated_at)}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t">
        <Button 
          onClick={() => onOpen(project)} 
          className="w-full"
          variant="default"
        >
          <Eye className="w-4 h-4 mr-2" />
          Abrir Projeto
        </Button>
      </CardFooter>
    </Card>
  )
}

