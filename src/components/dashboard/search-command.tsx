'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Project, ProjectType } from '@/types/project'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Code2, Globe, Search, Loader2 } from 'lucide-react'

interface SearchCommandProps {
  open: boolean
  onClose: () => void
  projects: Project[]
  loading?: boolean
}

export function SearchCommand({ open, onClose, projects, loading = false }: SearchCommandProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filtrar projetos pela busca
  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects.slice(0, 10)
    
    const term = search.toLowerCase()
    return projects.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    ).slice(0, 10)
  }, [search, projects])

  // Resetar ao abrir
  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [open])

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            Math.min(prev + 1, filteredProjects.length - 1)
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredProjects[selectedIndex]) {
            handleSelectProject(filteredProjects[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredProjects, selectedIndex])

  // Resetar índice quando filtrar
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const handleSelectProject = (project: Project) => {
    router.push(`/editor/${project.id}`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogTitle className="sr-only">Buscar Projetos</DialogTitle>
        {/* Input de busca */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar projetos..."
            className="border-0 focus-visible:ring-0 shadow-none text-base"
            autoFocus
          />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            ESC
          </kbd>
        </div>

        {/* Lista de resultados */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {search.trim() 
                  ? `Nenhum projeto encontrado com "${search}"`
                  : 'Nenhum projeto encontrado'
                }
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredProjects.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors
                    ${index === selectedIndex ? 'bg-accent' : ''}
                  `}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Badge 
                    variant="secondary" 
                    className={
                      project.type === ProjectType.JAVASCRIPT
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-blue-500/10 text-blue-600'
                    }
                  >
                    {project.type === ProjectType.JAVASCRIPT ? (
                      <Code2 className="w-3 h-3" />
                    ) : (
                      <Globe className="w-3 h-3" />
                    )}
                  </Badge>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium truncate">
                      {project.name}
                    </div>
                    {project.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {project.description}
                      </div>
                    )}
                  </div>

                  {index === selectedIndex && (
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      ↵
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer com dicas */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 select-none items-center gap-1 rounded border bg-background px-1 font-mono text-[10px]">
                ↑↓
              </kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 select-none items-center gap-1 rounded border bg-background px-1 font-mono text-[10px]">
                ↵
              </kbd>
              Abrir
            </span>
          </div>
          <span>
            {filteredProjects.length} {filteredProjects.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

