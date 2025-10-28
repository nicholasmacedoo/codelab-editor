import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: () => void
  description?: string
}

/**
 * Hook para registrar atalhos de teclado
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorar se estiver digitando em um input/textarea (exceto Monaco Editor)
    const target = event.target as HTMLElement
    const isEditable = 
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    
    // Permitir atalhos mesmo em inputs se for Cmd/Ctrl+K (busca)
    const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
    
    if (isEditable && !isSearchShortcut) {
      return
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey
      const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey
      const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey
      const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()

      // Tratamento especial para Cmd/Ctrl
      const cmdCtrlMatch = 
        (shortcut.ctrlKey || shortcut.metaKey) 
          ? (event.ctrlKey || event.metaKey) 
          : true

      if (keyMatch && cmdCtrlMatch && shiftMatch && altMatch) {
        event.preventDefault()
        shortcut.handler()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Formata atalho de teclado para exibição
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  
  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push('⌘') // ou 'Ctrl' dependendo do sistema
  }
  
  if (shortcut.shiftKey) {
    parts.push('⇧')
  }
  
  if (shortcut.altKey) {
    parts.push('⌥')
  }
  
  parts.push(shortcut.key.toUpperCase())
  
  return parts.join(' + ')
}

/**
 * Hook para detectar se é Mac
 */
export function useIsMac(): boolean {
  return typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

