'use client'

import { Editor } from '@monaco-editor/react'
import { useCallback, useRef } from 'react'
import type { editor } from 'monaco-editor'

const LABCODE_THEME = 'labcode-dark'

interface JsEditorProps {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  onSave?: () => void
  onClearConsole?: () => void
  readOnly?: boolean
  className?: string
}

function defineLabCodeTheme(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme(LABCODE_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // Paleta base — alto contraste para transmissão
      { token: 'keyword', foreground: '7dd3fc', fontStyle: '' },
      { token: 'string', foreground: 'fde047' },
      { token: 'number', foreground: 'e879f9' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'regexp', foreground: 'c4b5fd' },
      { token: 'operator', foreground: '94a3b8' },
      { token: 'delimiter', foreground: 'a5b4fc' },
      { token: 'type', foreground: '7dd3fc' },
      { token: 'identifier', foreground: 'f8fafc' },
      // Chaves e parênteses
      { token: 'delimiter.bracket', foreground: 'c4b5fd' },
      { token: 'delimiter.square', foreground: 'c4b5fd' },
      { token: 'delimiter.parenthesis', foreground: 'c4b5fd' },
      { token: 'delimiter.curly', foreground: 'c4b5fd' },
      // Funções, métodos e chamadas — máximo contraste (verde limpo sobre fundo escuro)
      { token: 'entity.name.function', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'entity.name.method', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'support.function', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'support.function.console', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'meta.function-call', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'variable.function', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'support.class', foreground: '6ee7b7' },
      { token: 'entity.name.class', foreground: '6ee7b7' },
      // Objetos e propriedades
      { token: 'variable.parameter', foreground: 'f8fafc' },
      { token: 'entity.name.type', foreground: '67e8f9' },
      { token: 'support.type', foreground: '67e8f9' },
      { token: 'variable.other.readwrite', foreground: 'f8fafc' },
      { token: 'variable.other.property', foreground: 'bae6fd' },
      { token: 'meta.method-call', foreground: '4ade80', fontStyle: 'bold' },
      // Constantes e literais
      { token: 'constant', foreground: 'e879f9' },
      { token: 'constant.language', foreground: 'e879f9' },
      { token: 'constant.character.escape', foreground: '94a3b8' },
    ],
    colors: {
      'editor.background': '#0B1120',
      'editor.foreground': '#f8fafc',
      'editorLineNumber.foreground': '#64748b',
      'editorLineNumber.activeForeground': '#cbd5e1',
      'editor.selectionBackground': '#33415580',
      'editorCursor.foreground': '#f8fafc',
      'editorBracketMatch.background': '#1e293b',
      'editorBracketMatch.border': '#94a3b8',
    },
  })
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