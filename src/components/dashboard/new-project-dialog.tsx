'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ProjectType,
  JAVASCRIPT_TEMPLATES,
  WEB_TEMPLATES,
  REACT_TEMPLATES,
} from '@/types/project'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, FlaskConical, Layout, Layers, Terminal, Palette, Box } from 'lucide-react'

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

const PROJECT_TYPE_CARDS = [
  {
    type: ProjectType.JAVASCRIPT,
    title: 'Laboratório de Lógica',
    subtitle: 'JS Puro',
    description:
      'Aprenda fundamentos de programação, algoritmos e manipulação de dados com console limpo.',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-[#5340FF]/10 flex items-center justify-center">
        <span className="inline-flex items-center font-mono text-base text-[#5340FF]">
          &lt;<FlaskConical className="w-3.5 h-3.5 text-[#5340FF]/70" />&gt;
        </span>
      </div>
    ),
    bgVisual: (
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <pre className="absolute bottom-3 left-4 right-4 font-mono text-[10px] text-slate-500/20 whitespace-pre leading-relaxed select-none">
{`const soma = (a, b) => a + b;
const resultado = soma(3, 7);
console.log(resultado);`}
        </pre>
        <Terminal className="absolute top-3 right-3 w-10 h-10 text-slate-500/10" />
      </div>
    ),
  },
  {
    type: ProjectType.WEB_COMPLETE,
    title: 'Ateliê Web',
    subtitle: 'HTML + CSS + JS',
    description:
      'Crie páginas interativas, layouts responsivos e integre design com interatividade.',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-[#5340FF]/10 flex items-center justify-center gap-0.5">
        <span className="font-mono text-sm text-[#5340FF]">&lt;/&gt;</span>
        <Layout className="w-3.5 h-3.5 text-[#5340FF]/60" />
      </div>
    ),
    bgVisual: (
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute bottom-3 left-4 right-4 space-y-1.5">
          <div className="h-2 w-2/3 rounded-full bg-slate-500/10" />
          <div className="h-6 rounded border border-slate-600/15 bg-slate-700/8" />
          <div className="h-2 w-1/2 rounded-full bg-slate-500/8" />
        </div>
        <Palette className="absolute top-3 right-3 w-10 h-10 text-slate-500/10" />
        <div className="absolute top-4 right-14 w-5 h-5 rounded-full border-2 border-slate-500/15" />
      </div>
    ),
  },
  {
    type: ProjectType.REACT,
    title: 'Construção de Interfaces',
    subtitle: 'React / Vue',
    description:
      'Aprenda componentização, hooks e desenvolvimento de aplicações web modernas.',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-[#5340FF]/10 flex items-center justify-center gap-1">
        <Layers className="w-4 h-4 text-[#5340FF]" />
        <Box className="w-3.5 h-3.5 text-[#5340FF]/60" />
      </div>
    ),
    bgVisual: (
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute bottom-3 left-4 right-4 grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-5 rounded border border-slate-600/12 bg-slate-700/8"
            />
          ))}
        </div>
        <div className="absolute top-3 right-3 w-10 h-10 rounded-lg border border-slate-600/10 bg-slate-700/5 flex items-center justify-center">
          <div className="w-4 h-4 rounded-sm border border-slate-500/15 bg-slate-600/10" />
        </div>
      </div>
    ),
  },
] as const

export function NewProjectDialog({
  open,
  onClose,
  onCreateProject,
  loading = false,
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
    if (!validate()) return
    await onCreateProject({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      template,
    })
    handleClose()
  }

  const getTemplates = () => {
    if (type === ProjectType.JAVASCRIPT) return JAVASCRIPT_TEMPLATES
    if (type === ProjectType.WEB_COMPLETE) return WEB_TEMPLATES
    return REACT_TEMPLATES
  }

  const getSelectedTemplate = () => {
    return getTemplates().find((t) => t.id === template)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        className="max-w-[860px] border-slate-700/40 bg-[#131A2A]/95 backdrop-blur-xl text-white shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden [&_[data-slot=dialog-close]]:text-slate-400 [&_[data-slot=dialog-close]]:hover:text-white"
        showCloseButton={true}
      >
        {/* Cabeçalho: logo sutil + título */}
        <DialogHeader className="px-7 pt-6 pb-4 border-b border-slate-800/50 text-left">
          <div className="flex items-center gap-3">
            {/* <Image
              src="/labcode.svg"
              alt="lab code"
              width={80}
              height={15}
              className="h-4 w-auto opacity-40"
            />
            <div className="h-4 w-px bg-slate-700/50" /> */}
            <DialogTitle className="text-lg font-semibold text-white">
              Novo Projeto
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-7 py-6 space-y-6">
            {/* Nome do Projeto */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-300">
                Nome do Projeto
              </Label>
              <Input
                id="name"
                placeholder="Meu Projeto Incrível"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors({ ...errors, name: undefined })
                }}
                className={`bg-[#0B1120]/60 border-slate-700/50 text-white placeholder:text-slate-500 rounded-lg h-11 focus:border-[#5340FF]/50 focus:ring-1 focus:ring-[#5340FF]/30 ${
                  errors.name ? 'border-red-500/50' : ''
                }`}
                disabled={loading}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Grade de 3 Cards Educacionais */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-300">
                Tipo de Projeto
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PROJECT_TYPE_CARDS.map((card) => {
                  const isSelected = type === card.type
                  return (
                    <button
                      key={card.type}
                      type="button"
                      onClick={() => {
                        if (!loading) {
                          setType(card.type)
                          setTemplate('blank')
                        }
                      }}
                      disabled={loading}
                      className={`
                        group relative text-left p-5 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? 'border-[#5340FF]/70 bg-[#5340FF]/[0.04] shadow-[0_0_16px_rgba(83,64,255,0.08)]'
                          : 'border-slate-700/50 bg-[#0B1120]/40 hover:border-slate-600/60 hover:bg-[#0B1120]/60 opacity-60 hover:opacity-90'
                        }
                        ${loading ? '!opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {card.bgVisual}
                      <div className="relative flex flex-col gap-3">
                        {card.icon}
                        <div>
                          <h3 className="text-sm font-semibold text-white leading-tight">
                            {card.title}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {card.subtitle}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label htmlFor="template" className="text-sm font-medium text-slate-300">
                Template
              </Label>
              <Select
                value={template}
                onValueChange={setTemplate}
                disabled={loading}
              >
                <SelectTrigger
                  id="template"
                  className="bg-[#0B1120]/60 border-slate-700/50 text-white rounded-lg h-11 [&>span]:text-white focus:ring-[#5340FF]/30"
                >
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent className="bg-[#131A2A] border-slate-700">
                  {getTemplates().map((tmpl) => (
                    <SelectItem
                      key={tmpl.id}
                      value={tmpl.id}
                      className="text-slate-200 focus:bg-slate-800 focus:text-white"
                    >
                      {tmpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getSelectedTemplate()?.description && (
                <p className="text-xs text-slate-500">
                  {getSelectedTemplate()?.description}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-300">
                Descrição <span className="text-[11px] text-slate-500 font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva seu projeto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={loading}
                className="bg-[#0B1120]/60 border-slate-700/50 text-white placeholder:text-slate-500 rounded-lg resize-none focus:ring-[#5340FF]/30"
              />
            </div>
          </div>

          {/* Rodapé: Cancelar + Criar Projeto */}
          <DialogFooter className="px-7 py-4 border-t border-slate-800/50 flex flex-row justify-end gap-3 bg-[#0B1120]/30">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-[#0F766E] hover:bg-[#0D5E56] text-white h-10 px-6"
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
