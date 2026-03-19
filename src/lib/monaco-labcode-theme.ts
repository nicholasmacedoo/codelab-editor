/**
 * Tema labcode-dark para Monaco Editor — compartilhado por JS, Web e React editors
 */
export const LABCODE_THEME = 'labcode-dark'

export function defineLabCodeTheme(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme(LABCODE_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '7dd3fc', fontStyle: '' },
      { token: 'string', foreground: 'fde047' },
      { token: 'number', foreground: 'e879f9' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'regexp', foreground: 'c4b5fd' },
      { token: 'operator', foreground: '94a3b8' },
      { token: 'delimiter', foreground: 'a5b4fc' },
      { token: 'type', foreground: '7dd3fc' },
      { token: 'identifier', foreground: 'f8fafc' },
      { token: 'delimiter.bracket', foreground: 'c4b5fd' },
      { token: 'delimiter.square', foreground: 'c4b5fd' },
      { token: 'delimiter.parenthesis', foreground: 'c4b5fd' },
      { token: 'delimiter.curly', foreground: 'c4b5fd' },
      { token: 'entity.name.function', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'entity.name.method', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'support.function', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'support.function.console', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'meta.function-call', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'variable.function', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'support.class', foreground: '6ee7b7' },
      { token: 'entity.name.class', foreground: '6ee7b7' },
      { token: 'variable.parameter', foreground: 'f8fafc' },
      { token: 'entity.name.type', foreground: '67e8f9' },
      { token: 'support.type', foreground: '67e8f9' },
      { token: 'variable.other.readwrite', foreground: 'f8fafc' },
      { token: 'variable.other.property', foreground: 'bae6fd' },
      { token: 'meta.method-call', foreground: '4ade80', fontStyle: 'bold' },
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
