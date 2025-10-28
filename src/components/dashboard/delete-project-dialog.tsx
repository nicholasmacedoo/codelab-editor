'use client'

import { Project } from '@/types/project'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteProjectDialogProps {
  project: Project | null
  open: boolean
  onClose: () => void
  onConfirm: (project: Project) => Promise<void>
  loading?: boolean
}

export function DeleteProjectDialog({ 
  project, 
  open, 
  onClose, 
  onConfirm,
  loading = false
}: DeleteProjectDialogProps) {
  const handleConfirm = async () => {
    if (project) {
      await onConfirm(project)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Deletar Projeto</DialogTitle>
              <DialogDescription className="mt-1">
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {project && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Você está prestes a deletar o projeto:
            </p>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-semibold">{project.name}</p>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deletando...
              </>
            ) : (
              'Deletar Projeto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

