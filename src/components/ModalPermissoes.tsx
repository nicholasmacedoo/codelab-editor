'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  Lock,
  Unlock,
  Eye,
  Globe,
  EyeOff,
  Copy,
  CheckCircle,
  Share2,
} from 'lucide-react'

interface ModalPermissoesProps {
  isOpen: boolean
  onClose: () => void
  onCompartilhar: (configuracao: ConfiguracaoCompartilhamento) => void
  nomeProjeto: string
  projetoExistente?: boolean
}

export interface ConfiguracaoCompartilhamento {
  visibility: 'public' | 'unlisted' | 'private'
  allow_edits: boolean
  titulo: string
}

const VISIBILITY_OPTIONS = [
  {
    value: 'public' as const,
    label: 'Público',
    description: 'Qualquer pessoa pode encontrar e visualizar este projeto',
    icon: Globe,
    iconClass: 'text-emerald-400',
  },
  {
    value: 'unlisted' as const,
    label: 'Não Listado',
    description: 'Apenas pessoas com o link podem visualizar este projeto',
    icon: Eye,
    iconClass: 'text-blue-400',
  },
  {
    value: 'private' as const,
    label: 'Privado',
    description: 'Apenas você pode visualizar este projeto',
    icon: EyeOff,
    iconClass: 'text-slate-400',
  },
]

export function ModalPermissoes({
  isOpen,
  onClose,
  onCompartilhar,
  nomeProjeto,
  projetoExistente = false,
}: ModalPermissoesProps) {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoCompartilhamento>({
    visibility: 'public',
    allow_edits: false,
    titulo: projetoExistente ? nomeProjeto : '',
  })

  React.useEffect(() => {
    if (projetoExistente && nomeProjeto) {
      setConfiguracao((prev) => ({ ...prev, titulo: nomeProjeto }))
    }
  }, [nomeProjeto, projetoExistente])

  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const handleCompartilhar = () => {
    onCompartilhar(configuracao)
  }

  const handleClose = () => {
    setConfiguracao({
      visibility: 'public',
      allow_edits: false,
      titulo: projetoExistente ? nomeProjeto : '',
    })
    setLinkGerado(null)
    setCopiado(false)
    onClose()
  }

  const copiarLink = async () => {
    if (linkGerado) {
      try {
        await navigator.clipboard.writeText(linkGerado)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
      } catch (error) {
        console.error('Erro ao copiar link:', error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-[560px] border-slate-700/40 bg-[#131A2A]/95 backdrop-blur-xl text-white shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden [&_[data-slot=dialog-close]]:text-slate-400 [&_[data-slot=dialog-close]]:hover:text-white"
        showCloseButton={true}
      >
        <DialogHeader className="px-7 pt-6 pb-4 border-b border-slate-800/50 text-left">
          <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#5340FF]" />
            {projetoExistente ? 'Compartilhar Projeto' : 'Criar e Compartilhar Projeto'}
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-1">
            {projetoExistente
              ? 'Configure as permissões de compartilhamento para seu projeto.'
              : 'Crie um novo projeto e configure suas permissões de compartilhamento.'}
          </p>
        </DialogHeader>

        <div className="px-7 py-6 space-y-6">
          {/* Nome do Projeto (só quando não é projeto existente) */}
          {!projetoExistente && (
            <div className="space-y-2">
              <Label htmlFor="titulo" className="text-sm font-medium text-slate-300">
                Nome do Projeto
              </Label>
              <Input
                id="titulo"
                type="text"
                value={configuracao.titulo}
                onChange={(e) =>
                  setConfiguracao((prev) => ({ ...prev, titulo: e.target.value }))
                }
                placeholder="Digite o nome do projeto"
                className="bg-[#0B1120]/60 border-slate-700/50 text-white placeholder:text-slate-500 rounded-lg h-11 focus:border-[#5340FF]/50 focus:ring-1 focus:ring-[#5340FF]/30"
              />
            </div>
          )}

          {projetoExistente && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Projeto Atual</Label>
              <div className="p-4 rounded-xl border border-slate-700/50 bg-[#0B1120]/40">
                <p className="font-medium text-white">{nomeProjeto}</p>
                <p className="text-sm text-slate-400 mt-1">
                  Compartilhando o projeto atual com suas configurações
                </p>
              </div>
            </div>
          )}

          {/* Visibilidade — cards no mesmo estilo do "Criar Novo Projeto" */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">
              Visibilidade do Projeto
            </Label>
            <RadioGroup
              value={configuracao.visibility}
              onValueChange={(value: string) =>
                setConfiguracao((prev) => ({
                  ...prev,
                  visibility: value as 'public' | 'unlisted' | 'private',
                }))
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const isSelected = configuracao.visibility === opt.value
                  const Icon = opt.icon
                  return (
                    <label
                      key={opt.value}
                      className={`
                        relative flex flex-col gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                        ${isSelected
                          ? 'border-[#5340FF]/70 bg-[#5340FF]/[0.04] shadow-[0_0_16px_rgba(83,64,255,0.08)]'
                          : 'border-slate-700/50 bg-[#0B1120]/40 hover:border-slate-600/60 hover:bg-[#0B1120]/60 opacity-80 hover:opacity-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value={opt.value}
                          id={opt.value}
                          className="sr-only"
                        />
                        <div
                          className={`w-8 h-8 rounded-lg bg-[#5340FF]/10 flex items-center justify-center ${opt.iconClass}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {opt.description}
                      </p>
                    </label>
                  )
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Permissões de Edição */}
          {configuracao.visibility !== 'private' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-300">
                Permissões de Edição
              </Label>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-700/50 bg-[#0B1120]/40">
                <div className="flex items-center gap-3">
                  {configuracao.allow_edits ? (
                    <Unlock className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {configuracao.allow_edits ? 'Permitir Edição' : 'Somente Leitura'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {configuracao.allow_edits
                        ? 'Outras pessoas podem editar este projeto'
                        : 'Outras pessoas podem apenas visualizar'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={configuracao.allow_edits}
                  onCheckedChange={(checked: boolean) =>
                    setConfiguracao((prev) => ({ ...prev, allow_edits: checked }))
                  }
                />
              </div>
            </div>
          )}

          {/* Link Gerado */}
          {linkGerado && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">
                Link de Compartilhamento
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={linkGerado}
                  readOnly
                  className="flex-1 bg-[#0B1120]/60 border-slate-700/50 text-slate-300 rounded-lg h-11 font-mono text-sm"
                />
                <Button
                  onClick={copiarLink}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-11 px-4 flex items-center gap-2"
                >
                  {copiado ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-7 py-4 border-t border-slate-800/50 flex flex-row justify-end gap-3 bg-[#0B1120]/30">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-10"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCompartilhar}
            disabled={!projetoExistente && !configuracao.titulo.trim()}
            className="bg-[#0F766E] hover:bg-[#0D5E56] text-white h-10 px-6"
          >
            {linkGerado ? 'Atualizar Configurações' : 'Gerar Link de Compartilhamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
