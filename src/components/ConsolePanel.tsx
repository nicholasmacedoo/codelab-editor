'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogEntry } from './SandboxRunner'
import { Trash2, Copy, Filter, ChevronDown, ChevronRight } from 'lucide-react'

interface ConsolePanelProps {
  logs: LogEntry[]
  onClear: () => void
  isExecuting?: boolean
  executionTime?: number
  className?: string
  compact?: boolean
}

type FilterType = 'all' | 'log' | 'info' | 'warn' | 'error'

export function ConsolePanel({ 
  logs, 
  onClear, 
  isExecuting = false,
  executionTime,
  className = '',
  compact = false
}: ConsolePanelProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para o final quando novos logs chegam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.type === filter
  )

  const toggleExpanded = useCallback((logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Erro ao copiar para clipboard:', err)
    }
  }, [])

  const formatValue = useCallback((value: unknown): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }, [])

  const getLogIcon = useCallback((type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return '❌'
      case 'warn':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📝'
    }
  }, [])

  const getLogColor = useCallback((type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-destructive'
      case 'warn':
        return 'text-secondary'
      case 'info':
        return 'text-accent'
      default:
        return 'text-foreground'
    }
  }, [])

  const getFilterCount = useCallback((filterType: FilterType) => {
    if (filterType === 'all') return logs.length
    return logs.filter(log => log.type === filterType).length
  }, [logs])

  return (
    <div className={`flex flex-col h-full bg-card border-t border-border ${className}`}>
      {/* Header do Console */}
      <div className={`p-3 border-b border-border bg-muted/20 ${compact ? 'flex flex-col gap-2' : 'flex items-center justify-between'}`}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Console</h3>
          {isExecuting && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Executando...
            </div>
          )}
          {executionTime !== undefined && !isExecuting && (
            <span className="text-xs text-success font-medium">
              ✓ ({executionTime}ms)
            </span>
          )}
        </div>

        <div className={`flex items-center gap-2 ${compact ? 'flex-wrap' : ''}`}>
          {/* Filtros */}
          <div className="flex items-center gap-1">
            {(['all', 'log', 'info', 'warn', 'error'] as FilterType[]).map(filterType => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-2 text-xs transition-colors ${
                  filter === filterType 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setFilter(filterType)}
              >
                {filterType === 'all' ? 'Todos' : filterType}
                <span className="ml-1 text-xs opacity-60">
                  ({getFilterCount(filterType)})
                </span>
              </Button>
            ))}
          </div>

          {/* Botão Limpar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 hover:bg-destructive/20 hover:text-destructive transition-colors"
            title="Limpar Console (Ctrl/Cmd + K)"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Área de Logs */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <p>Console vazio</p>
              <p className="text-xs mt-1">
                Execute seu código para ver os logs aqui
              </p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogs.has(log.id)
            const hasMultipleArgs = log.args.length > 1
            const logText = log.args.map(formatValue).join(' ')
            
            return (
              <div
                key={log.id}
                className={`group relative px-3 py-1.5 border-b border-border/30 hover:bg-muted/30 transition-colors ${getLogColor(log.type)}`}
              >
                <div className="flex items-start gap-2">
                  {/* Ícone do tipo de log */}
                  <span className="text-xs mt-0.5 flex-shrink-0 w-4 text-center">
                    {getLogIcon(log.type)}
                  </span>

                  {/* Botão de expandir (se necessário) */}
                  {hasMultipleArgs && (
                    <button
                      onClick={() => toggleExpanded(log.id)}
                      className="text-xs mt-0.5 flex-shrink-0 hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  )}

                  {/* Conteúdo do log */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {isExpanded && hasMultipleArgs ? (
                          <div className="space-y-1">
                            {log.args.map((arg, index) => (
                              <div key={index} className="pl-2 border-l-2 border-border">
                                <pre className="text-sm font-mono whitespace-pre-wrap break-all overflow-hidden">
                                  {formatValue(arg)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <pre className="text-sm font-mono whitespace-pre-wrap break-all overflow-hidden leading-tight">
                            {logText}
                          </pre>
                        )}

                        {/* Stack trace para erros */}
                        {log.stack && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              Stack trace
                            </summary>
                            <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono">
                              {log.stack}
                            </pre>
                          </details>
                        )}
                      </div>

                      {/* Timestamp e botão copiar */}
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.timestamp.toLocaleTimeString('pt-BR', { 
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-muted"
                          onClick={() => copyToClipboard(logText)}
                          title="Copiar"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}