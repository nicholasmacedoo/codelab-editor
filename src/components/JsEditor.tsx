'use client'

import { Editor } from '@monaco-editor/react'
import { useCallback, useRef } from 'react'
import type { editor } from 'monaco-editor'

interface JsEditorProps {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  onSave?: () => void
  onClearConsole?: () => void
  readOnly?: boolean
  className?: string
}

export function JsEditor({
  value,
  onChange,
  onRun,
  onSave,
  onClearConsole,
  readOnly = false,
  className = ''
}: JsEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

    // Configurar atalhos de teclado usando keybindings simples
    editor.addAction({
      id: 'run-code',
      label: 'Executar Código',
      keybindings: [
        // Ctrl/Cmd + Enter (2048 = CtrlCmd, 3 = Enter)
        2048 | 3
      ],
      run: () => {
        onRun?.()
      }
    })

    editor.addAction({
      id: 'save-code',
      label: 'Salvar Código',
      keybindings: [
        // Ctrl/Cmd + S (2048 = CtrlCmd, 49 = KeyS)
        2048 | 49
      ],
      run: () => {
        onSave?.()
      }
    })

    editor.addAction({
      id: 'clear-console',
      label: 'Limpar Console',
      keybindings: [
        // Ctrl/Cmd + K (2048 = CtrlCmd, 41 = KeyK)
        2048 | 41
      ],
      run: () => {
        onClearConsole?.()
      }
    })

    // Focar no editor
    editor.focus()
  }, [onRun, onSave, onClearConsole])

  const handleChange = useCallback((value: string | undefined) => {
    onChange(value || '')
  }, [onChange])

  return (
    <div className={`h-full ${className}`}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          contextmenu: true,
          selectOnLineNumbers: true,
          glyphMargin: false,
          folding: true,
          foldingHighlight: true,
          showFoldingControls: 'mouseover',
          matchBrackets: 'always',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          parameterHints: {
            enabled: true
          },
          hover: {
            enabled: true
          },
          // Configurações de tema dark personalizado
          colorDecorators: true,
          bracketPairColorization: {
            enabled: true
          },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12
          }
        }}
      />
    </div>
  )
}

// Hook para usar o editor externamente
export function useJsEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const getEditor = useCallback(() => editorRef.current, [])
  
  const insertText = useCallback((text: string) => {
    const editor = editorRef.current
    if (!editor) return

    const selection = editor.getSelection()
    if (selection) {
      editor.executeEdits('insert-text', [{
        range: selection,
        text,
        forceMoveMarkers: true
      }])
    }
  }, [])

  const formatCode = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return

    await editor.getAction('editor.action.formatDocument')?.run()
  }, [])

  const getSelectedText = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return ''

    const selection = editor.getSelection()
    if (!selection) return ''

    return editor.getModel()?.getValueInRange(selection) || ''
  }, [])

  return {
    editorRef,
    getEditor,
    insertText,
    formatCode,
    getSelectedText
  }
}