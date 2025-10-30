'use client'

import { useState } from 'react'
import { 
  ProjectType, 
  JAVASCRIPT_TEMPLATES, 
  WEB_TEMPLATES,
  REACT_TEMPLATES
} from '@/types/project'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Code2, Globe, Layers } from 'lucide-react'

interface NewProjectDialogProps {
  open: boolean
  onClose: () => void
  onCreateProject: (data: {
    name: string
    type: ProjectType
    description?: string
    template?: string
  }) => Promise<void>
  loading?: boolean
}

export function NewProjectDialog({ 
  open, 
  onClose, 
  onCreateProject,
  loading = false
}: NewProjectDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ProjectType>(ProjectType.JAVASCRIPT)
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState<string>('blank')
  const [errors, setErrors] = useState<{ name?: string }>({})

  const handleClose = () => {
    if (!loading) {
      setName('')
      setType(ProjectType.JAVASCRIPT)
      setDescription('')
      setTemplate('blank')
      setErrors({})
      onClose()
    }
  }

  const validate = () => {
    const newErrors: { name?: string } = {}
    
    if (!name.trim()) {
      newErrors.name = 'O nome do projeto é obrigatório'
    } else if (name.trim().length < 3) {
      newErrors.name = 'O nome deve ter pelo menos 3 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    await onCreateProject({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      template
    })

    handleClose()
  }

  const getTemplates = () => {
    if (type === ProjectType.JAVASCRIPT) {
      return JAVASCRIPT_TEMPLATES
    } else if (type === ProjectType.WEB_COMPLETE) {
      return WEB_TEMPLATES
    } else {
      return REACT_TEMPLATES
    }
  }

  const getSelectedTemplate = () => {
    const templates = getTemplates()
    return templates.find(t => t.id === template)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Criar Novo Projeto</DialogTitle>
          <DialogDescription>
            Escolha o tipo de projeto e personalize as configurações iniciais
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Nome do Projeto */}
            <div className="space-y-2">
              <Label htmlFor="name" className="required">
                Nome do Projeto
              </Label>
              <Input
                id="name"
                placeholder="Meu Projeto Incrível"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined })
                  }
                }}
                className={errors.name ? 'border-destructive' : ''}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Tipo de Projeto */}
            <div className="space-y-3">
              <Label className="required">Tipo de Projeto</Label>
              <RadioGroup
                value={type}
                onValueChange={(value) => {
                  setType(value as ProjectType)
                  setTemplate('blank') // Reset template quando mudar o tipo
                }}
                disabled={loading}
              >
                <div className="flex flex-col gap-3">
                  {/* JavaScript Puro */}
                  <label
                    htmlFor="type-javascript"
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${type === ProjectType.JAVASCRIPT 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <RadioGroupItem 
                      value={ProjectType.JAVASCRIPT} 
                      id="type-javascript"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Code2 className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold">JavaScript Puro</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Apenas código JavaScript com console de saída. Ideal para aprender lógica de programação, funções e algoritmos.
                      </p>
                    </div>
                  </label>

                  {/* Web Completo */}
                  <label
                    htmlFor="type-web"
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${type === ProjectType.WEB_COMPLETE 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <RadioGroupItem 
                      value={ProjectType.WEB_COMPLETE} 
                      id="type-web"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">Web Completo</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        HTML, CSS e JavaScript com preview ao vivo. Perfeito para criar páginas web interativas e projetos visuais.
                      </p>
                    </div>
                  </label>

                  {/* React */}
                  <label
                    htmlFor="type-react"
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${type === ProjectType.REACT 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <RadioGroupItem 
                      value={ProjectType.REACT} 
                      id="type-react"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-5 h-5 text-cyan-600" />
                        <span className="font-semibold">React</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Componentes React com JSX e preview ao vivo. Ideal para aprender React, hooks e desenvolvimento moderno.
                      </p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label htmlFor="template">Template (opcional)</Label>
              <Select
                value={template}
                onValueChange={setTemplate}
                disabled={loading}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {getTemplates().map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getSelectedTemplate() && (
                <p className="text-xs text-muted-foreground">
                  {getSelectedTemplate()?.description}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva seu projeto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Projeto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

