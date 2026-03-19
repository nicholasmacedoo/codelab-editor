'use client'

import { Editor } from '@monaco-editor/react'
import { useCallback, useRef } from 'react'
import type { editor } from 'monaco-editor'
import { LABCODE_THEME, defineLabCodeTheme } from '@/lib/monaco-labcode-theme'

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

  const handleBeforeMount = useCallback((monaco: typeof import('monaco-editor')) => {
    defineLabCodeTheme(monaco)
  }, [])

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor

    editor.addAction({
      id: 'run-code',
      label: 'Executar Código',
      keybindings: [2048 | 3],
      run: () => onRun?.(),
    })
    editor.addAction({
      id: 'save-code',
      label: 'Salvar Código',
      keybindings: [2048 | 49],
      run: () => onSave?.(),
    })
    editor.addAction({
      id: 'clear-console',
      label: 'Limpar Console',
      keybindings: [2048 | 41],
      run: () => onClearConsole?.(),
    })
    editor.focus()
  }, [onRun, onSave, onClearConsole])

  const handleChange = useCallback((value: string | undefined) => {
    onChange(value || '')
  }, [onChange])

  return (
    <div className={`h-full labcode-editor-wrap ${className}`}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={value}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        theme={LABCODE_THEME}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
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
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
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