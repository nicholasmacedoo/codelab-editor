'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Maximize2, RefreshCw, ExternalLink } from 'lucide-react'

interface WebPreviewProps {
  html: string
  css: string
  js: string
  className?: string
}

export function WebPreview({ html, css, js, className = '' }: WebPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    updatePreview()
  }, [html, css, js, refreshKey])

  const updatePreview = () => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const document = iframe.contentDocument || iframe.contentWindow?.document

    if (!document) return

    // Criar o HTML completo com CSS e JS injetados
    const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset básico */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* CSS do usuário */
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    // Capturar erros e exibir no console
    window.addEventListener('error', (e) => {
      console.error('Erro:', e.message, 'na linha', e.lineno);
    });

    // Código JavaScript do usuário
    try {
      ${js}
    } catch (error) {
      console.error('Erro ao executar JavaScript:', error.message);
    }
  </script>
</body>
</html>
    `

    // Escrever o HTML no iframe
    document.open()
    document.write(fullHtml)
    document.close()
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      iframeRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const openInNewTab = () => {
    const blob = new Blob([`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}</script>
</body>
</html>
    `], { type: 'text/html' })
    
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">
          Preview
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            title="Recarregar preview"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            title="Abrir em nova aba"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title="Tela cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Iframe Preview */}
      <div className="flex-1 overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          title="Web Preview"
          sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  )
}

