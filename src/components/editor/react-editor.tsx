'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ReactFile } from '@/types/project'
import { FileExplorer } from './file-explorer'
import { BundleResult, bundleReactApp } from '@/lib/react-bundler'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { LABCODE_THEME, defineLabCodeTheme } from '@/lib/monaco-labcode-theme'
import { RefreshCw, Maximize2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReactEditorProps {
  files: ReactFile[]
  selectedFile?: ReactFile
  onFileSelect: (file: ReactFile) => void
  onFileUpdate: (fileId: string, content: string) => void
  onNewFile: () => void
  onNewFolder: () => void
  onRenameFile: () => void
  onDeleteFile: (file: ReactFile) => void
}

export function ReactEditor({
  files,
  selectedFile,
  onFileSelect,
  onFileUpdate,
  onNewFile,
  onNewFolder,
  onRenameFile,
  onDeleteFile
}: ReactEditorProps) {
  const [currentContent, setCurrentContent] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [isBundling, setIsBundling] = useState(false)
  const [bundlingError, setBundlingError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Atualizar conteúdo quando arquivo selecionado mudar
  useEffect(() => {
    if (selectedFile) {
      setCurrentContent(selectedFile.content)
    }
  }, [selectedFile])

  // Função para gerar preview
  const generatePreview = useCallback(async () => {
    if (!files.length) {
      setPreviewHtml('')
      return
    }

    setIsBundling(true)
    setBundlingError(null)

    try {
      const result: BundleResult = await bundleReactApp(files, 'src/index.jsx')
      
      if (result.error) {
        setBundlingError(result.error.message)
        setPreviewHtml('')
      } else {
        setPreviewHtml(result.code)
        setBundlingError(null)
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error)
      setBundlingError(error instanceof Error ? error.message : 'Erro desconhecido')
      setPreviewHtml('')
    } finally {
      setIsBundling(false)
    }
  }, [files])

  // Atualizar preview quando arquivos mudarem (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      generatePreview()
    }, 500)

    return () => clearTimeout(timeout)
  }, [files, generatePreview])


  // Salvar alterações
  const handleSave = () => {
    if (selectedFile) {
      onFileUpdate(selectedFile.id, currentContent)
      toast.success('Arquivo salvo')
    }
  }

  const getLanguage = (fileName: string) => {
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) {
      return 'javascript'
    }
    if (fileName.endsWith('.css')) {
      return 'css'
    }
    if (fileName.endsWith('.json')) {
      return 'json'
    }
    if (fileName.endsWith('.html')) {
      return 'html'
    }
    if (fileName.endsWith('.md')) {
      return 'markdown'
    }
    return 'text'
  }

  if (isFullscreen) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[#0B1120]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#131A2A]/50 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-white">Preview</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        <iframe
          ref={previewRef}
          srcDoc={previewHtml || undefined}
          className="flex-1 w-full border-0 bg-white min-h-[200px]"
          title="Preview React"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex bg-[#0B1120]">
      {/* File Explorer - 20% */}
      <div className="w-1/5 min-w-[200px]">
        <FileExplorer
          files={files}
          onFileSelect={onFileSelect}
          selectedFileId={selectedFile?.id}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onRenameFile={onRenameFile}
          onDeleteFile={onDeleteFile}
        />
      </div>

      {/* Editor - 40% */}
      <div className="w-2/5 border-l border-slate-800/60 flex flex-col">
        {selectedFile ? (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#131A2A]/50 border-b border-slate-800/60 backdrop-blur-sm">
              <span className="text-sm font-medium text-slate-300">
                {selectedFile.path}
              </span>
              <div className="flex items-center gap-2">
                {bundlingError && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                {!bundlingError && !isBundling && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {isBundling && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="text-slate-300 hover:text-white"
                >
                  Salvar
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={getLanguage(selectedFile.name)}
                value={currentContent}
                onChange={(value) => {
                  setCurrentContent(value || '')
                  if (selectedFile) {
                    onFileUpdate(selectedFile.id, value || '')
                  }
                }}
                theme={LABCODE_THEME}
                beforeMount={defineLabCodeTheme}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  automaticLayout: true
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-400 mb-2">Selecione um arquivo para editar</p>
              <p className="text-sm text-slate-500">Use o explorador ao lado para navegar</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview - 40% */}
      <div className="w-2/5 border-l border-slate-800/60 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-[#131A2A]/50 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Preview</span>
            {isBundling && (
              <span className="text-xs text-gray-400">Compilando...</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        
        {bundlingError && (
          <div className="p-4 bg-red-950/20 border-b border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500 mb-1">Erro de compilação</p>
                <p className="text-xs text-red-400 font-mono">{bundlingError}</p>
              </div>
            </div>
          </div>
        )}

        <iframe
          ref={previewRef}
          srcDoc={previewHtml || undefined}
          className="flex-1 w-full border-0 bg-white min-h-[200px]"
          title="Preview React"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}

