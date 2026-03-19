'use client'

import { Project } from '@/types/project'
import { ProjectCard } from './project-card'
import { Skeleton } from '@/components/ui/skeleton'

interface ProjectGridProps {
  projects: Project[]
  loading?: boolean
  onOpenProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onDuplicateProject: (project: Project) => void
  onShareProject: (project: Project) => void
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-slate-700/50 bg-[#131A2A]/60 overflow-hidden flex flex-col">
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-full max-w-[140px]" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex justify-between items-center mt-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-700/40 flex items-center justify-center">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum projeto encontrado</h3>
          <p className="text-sm text-slate-400">
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

