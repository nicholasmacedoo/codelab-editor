'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Lock, 
  Unlock, 
  Eye, 
  Users, 
  Globe,
  EyeOff,
  Copy,
  CheckCircle,
  X
} from 'lucide-react'

interface ModalPermissoesProps {
  isOpen: boolean
  onClose: () => void
  onCompartilhar: (configuracao: ConfiguracaoCompartilhamento) => void
  nomeProjeto: string
  projetoExistente?: boolean // Nova prop para indicar se já existe um projeto
}

export interface ConfiguracaoCompartilhamento {
  visibility: 'public' | 'unlisted' | 'private'
  allow_edits: boolean
  titulo: string
}

export function ModalPermissoes({ 
  isOpen, 
  onClose, 
  onCompartilhar, 
  nomeProjeto,
  projetoExistente = false
}: ModalPermissoesProps) {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoCompartilhamento>({
    visibility: 'public',
    allow_edits: false,
    titulo: projetoExistente ? nomeProjeto : ''
  })

  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  if (!isOpen) return null

  const handleCompartilhar = () => {
    onCompartilhar(configuracao)
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

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />
      case 'unlisted': return <Eye className="w-4 h-4" />
      case 'private': return <EyeOff className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public': 
        return 'Qualquer pessoa pode encontrar e visualizar este projeto'
      case 'unlisted': 
        return 'Apenas pessoas com o link podem visualizar este projeto'
      case 'private': 
        return 'Apenas você pode visualizar este projeto'
      default: 
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {projetoExistente ? 'Compartilhar Projeto' : 'Criar e Compartilhar Projeto'}
              </CardTitle>
              <CardDescription>
                {projetoExistente 
                  ? 'Configure as permissões de compartilhamento para seu projeto atual.'
                  : 'Crie um novo projeto e configure suas permissões de compartilhamento.'
                }
              </CardDescription>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Nome do Projeto */}
          {!projetoExistente && (
            <div className="space-y-2">
              <Label htmlFor="titulo">Nome do Projeto</Label>
              <input
                id="titulo"
                type="text"
                value={configuracao.titulo}
                onChange={(e) => setConfiguracao(prev => ({ 
                  ...prev, 
                  titulo: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Digite o nome do projeto"
              />
            </div>
          )}

          {projetoExistente && (
            <div className="space-y-2">
              <Label>Projeto Atual</Label>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="font-medium">{nomeProjeto}</p>
                <p className="text-sm text-muted-foreground">
                  Compartilhando o projeto atual com suas configurações
                </p>
              </div>
            </div>
          )}

          {/* Visibilidade */}
          <div className="space-y-3">
            <Label>Visibilidade do Projeto</Label>
            <RadioGroup
              value={configuracao.visibility}
              onValueChange={(value: string) => setConfiguracao(prev => ({ 
                ...prev, 
                visibility: value as 'public' | 'unlisted' | 'private'
              }))}
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="public" id="public" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="public" className="flex items-center gap-2 font-medium cursor-pointer">
                      <Globe className="w-4 h-4 text-green-600" />
                      Público
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Qualquer pessoa pode encontrar e visualizar este projeto
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="unlisted" id="unlisted" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="unlisted" className="flex items-center gap-2 font-medium cursor-pointer">
                      <Eye className="w-4 h-4 text-blue-600" />
                      Não Listado
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Apenas pessoas com o link podem visualizar este projeto
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="private" className="flex items-center gap-2 font-medium cursor-pointer">
                      <EyeOff className="w-4 h-4 text-red-600" />
                      Privado
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Apenas você pode visualizar este projeto
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Permissões de Edição */}
          {configuracao.visibility !== 'private' && (
            <div className="space-y-3">
              <Label>Permissões de Edição</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {configuracao.allow_edits ? (
                    <Unlock className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {configuracao.allow_edits ? 'Permitir Edição' : 'Somente Leitura'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {configuracao.allow_edits 
                        ? 'Outras pessoas podem editar este projeto'
                        : 'Outras pessoas podem apenas visualizar este projeto'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={configuracao.allow_edits}
                  onCheckedChange={(checked: boolean) => setConfiguracao(prev => ({ 
                    ...prev, 
                    allow_edits: checked 
                  }))}
                />
              </div>
            </div>
          )}

          {/* Resumo da Configuração */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Resumo da Configuração</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {getVisibilityIcon(configuracao.visibility)}
                {configuracao.visibility === 'public' ? 'Público' :
                 configuracao.visibility === 'unlisted' ? 'Não Listado' : 'Privado'}
              </Badge>
              <Badge variant={configuracao.allow_edits ? "default" : "secondary"}>
                {configuracao.allow_edits ? (
                  <><Unlock className="w-3 h-3 mr-1" /> Editável</>
                ) : (
                  <><Lock className="w-3 h-3 mr-1" /> Somente Leitura</>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {getVisibilityDescription(configuracao.visibility)}
            </p>
          </div>

          {/* Link Gerado */}
          {linkGerado && (
            <div className="space-y-2">
              <Label>Link de Compartilhamento</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkGerado}
                  readOnly
                  className="flex-1 px-3 py-2 border border-input bg-muted rounded-md text-sm"
                />
                <Button
                  onClick={copiarLink}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copiado ? (
                    <><CheckCircle className="w-4 h-4" /> Copiado!</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copiar</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button 
              onClick={handleCompartilhar}
              disabled={!projetoExistente && !configuracao.titulo.trim()}
            >
              {linkGerado ? 'Atualizar Configurações' : 'Gerar Link de Compartilhamento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}