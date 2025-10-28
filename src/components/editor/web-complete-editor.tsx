'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { WebPreview } from './web-preview'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Code2, Palette, FileCode, Eye, EyeOff } from 'lucide-react'

type EditorTab = 'html' | 'css' | 'js'

interface WebCompleteEditorProps {
  html: string
  css: string
  js: string
  onHtmlChange: (value: string) => void
  onCssChange: (value: string) => void
  onJsChange: (value: string) => void
  onSave: () => void
}

export function WebCompleteEditor({
  html,
  css,
  js,
  onHtmlChange,
  onCssChange,
  onJsChange,
  onSave
}: WebCompleteEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('html')
  const [showPreview, setShowPreview] = useState(true)
  const [debouncedHtml, setDebouncedHtml] = useState(html)
  const [debouncedCss, setDebouncedCss] = useState(css)
  const [debouncedJs, setDebouncedJs] = useState(js)
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounce para preview (500ms)
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedHtml(html)
      setDebouncedCss(css)
      setDebouncedJs(js)
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [html, css, js])

  const getEditorLanguage = (tab: EditorTab): string => {
    switch (tab) {
      case 'html': return 'html'
      case 'css': return 'css'
      case 'js': return 'javascript'
    }
  }

  const getCurrentCode = (): string => {
    switch (activeTab) {
      case 'html': return html
      case 'css': return css
      case 'js': return js
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return

    switch (activeTab) {
      case 'html':
        onHtmlChange(value)
        break
      case 'css':
        onCssChange(value)
        break
      case 'js':
        onJsChange(value)
        break
    }
  }

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    // Atalhos de teclado
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave()
    })

    // Auto-complete e IntelliSense
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true
    })
  }, [onSave])

  return (
    <div className="flex h-full">
      {/* Editor */}
      <div 
        className="flex flex-col min-w-0 transition-all duration-300"
        style={{ width: showPreview ? '50%' : '100%' }}
      >
        {/* Toolbar com Tabs */}
        <div className="border-b bg-muted/30 backdrop-blur-sm">
          <div className="flex items-center justify-between px-2 py-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EditorTab)}>
              <TabsList className="h-9">
                <TabsTrigger value="html" className="gap-2">
                  <Code2 className="w-4 h-4" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="css" className="gap-2">
                  <Palette className="w-4 h-4" />
                  CSS
                </TabsTrigger>
                <TabsTrigger value="js" className="gap-2">
                  <FileCode className="w-4 h-4" />
                  JavaScript
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Ocultar Preview
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Mostrar Preview
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={getEditorLanguage(activeTab)}
            value={getCurrentCode()}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              parameterHints: { enabled: true },
              folding: true,
              bracketPairColorization: { enabled: true }
            }}
          />
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div 
          className="border-l flex-shrink-0 transition-all duration-300"
          style={{ width: '50%' }}
        >
          <WebPreview
            html={debouncedHtml}
            css={debouncedCss}
            js={debouncedJs}
          />
        </div>
      )}
    </div>
  )
}

