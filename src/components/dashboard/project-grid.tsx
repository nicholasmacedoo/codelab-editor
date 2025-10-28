'use client'

import { Project } from '@/types/project'
import { ProjectCard } from './project-card'
import { Loader2 } from 'lucide-react'

interface ProjectGridProps {
  projects: Project[]
  loading?: boolean
  onOpenProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onDuplicateProject: (project: Project) => void
  onShareProject: (project: Project) => void
}

export function ProjectGrid({ 
  projects, 
  loading = false,
  onOpenProject, 
  onDeleteProject, 
  onDuplicateProject,
  onShareProject
}: ProjectGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando projetos...</p>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Crie seu primeiro projeto para começar a programar!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpenProject}
          onDelete={onDeleteProject}
          onDuplicate={onDuplicateProject}
          onShare={onShareProject}
        />
      ))}
    </div>
  )
}

