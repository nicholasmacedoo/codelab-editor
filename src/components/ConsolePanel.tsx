'use client'

import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { LogEntry, SerializedValue } from './SandboxRunner'
import { Trash2, Copy, ChevronDown, ChevronRight, Terminal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ConsolePanelProps {
  logs: LogEntry[]
  onClear: () => void
  isExecuting?: boolean
  executionTime?: number
  className?: string
}

type FilterType = 'all' | 'log' | 'info' | 'warn' | 'error'

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'log', label: 'log' },
  { value: 'info', label: 'info' },
  { value: 'warn', label: 'warn' },
  { value: 'error', label: 'error' },
]

// --- ValueRenderer: renderiza valores como o console do navegador ---

function isCollapsible(val: SerializedValue): boolean {
  return val.__type === 'object' || val.__type === 'array'
}

function objectPreview(val: SerializedValue): string {
  if (val.__type === 'array') {
    const items = val.items ?? []
    const preview = items.slice(0, 5).map(inlinePreview).join(', ')
    const suffix = items.length > 5 ? ', …' : ''
    return `(${val.length ?? items.length}) [${preview}${suffix}]`
  }
  if (val.__type === 'object') {
    const keys = val.keys ?? []
    const entries = val.entries ?? {}
    const preview = keys.slice(0, 4).map(k => `${k}: ${inlinePreview(entries[k])}`).join(', ')
    const suffix = keys.length > 4 ? ', …' : ''
    return `{${preview}${suffix}}`
  }
  return ''
}

function inlinePreview(val: SerializedValue | undefined): string {
  if (!val) return 'undefined'
  switch (val.__type) {
    case 'null': return 'null'
    case 'undefined': return 'undefined'
    case 'number': return String(val.value)
    case 'boolean': return String(val.value)
    case 'string': return `"${val.value}"`
    case 'function': return String(val.value)
    case 'symbol': return String(val.value)
    case 'error': return `${val.name}: ${val.message}`
    case 'array': return `Array(${val.length ?? val.items?.length ?? 0})`
    case 'object': return `{…}`
    default: return String(val.value ?? '')
  }
}

function valueToText(val: SerializedValue): string {
  switch (val.__type) {
    case 'null': return 'null'
    case 'undefined': return 'undefined'
    case 'number':
    case 'boolean':
      return String(val.value)
    case 'string': return String(val.value)
    case 'function': return String(val.value)
    case 'symbol': return String(val.value)
    case 'error': return `${val.name}: ${val.message}`
    case 'array':
    case 'object':
      try { return JSON.stringify(val, null, 2) } catch { return objectPreview(val) }
    default: return String(val.value ?? '')
  }
}

const ValueRenderer = memo(function ValueRenderer({
  val,
  depth = 0,
  keyName,
  isLast = true,
}: {
  val: SerializedValue
  depth?: number
  keyName?: string
  isLast?: boolean
}) {
  const [open, setOpen] = useState(depth < 1 && isCollapsible(val) ? false : false)
  const collapsible = isCollapsible(val)
  const indent = depth * 16

  const renderKey = keyName !== undefined ? (
    <span className="text-[#c792ea]">{keyName}</span>
  ) : null

  const renderPrimitive = () => {
    switch (val.__type) {
      case 'null':
        return <span className="text-slate-500 italic">null</span>
      case 'undefined':
        return <span className="text-slate-500 italic">undefined</span>
      case 'number':
        return <span className="text-[#c792ea]">{String(val.value)}</span>
      case 'boolean':
        return <span className="text-[#5ec4ff]">{String(val.value)}</span>
      case 'string':
        return depth > 0
          ? <span className="text-[#a8a29e]">&quot;{String(val.value)}&quot;</span>
          : <span className="text-white">{String(val.value)}</span>
      case 'function':
        return <span className="text-slate-400 italic">{String(val.value)}</span>
      case 'symbol':
        return <span className="text-[#c792ea]">{String(val.value)}</span>
      case 'error':
        return <span className="text-red-400">{val.name}: {val.message}</span>
      default:
        return <span className="text-white">{String(val.value ?? '')}</span>
    }
  }

  if (!collapsible) {
    return (
      <span style={{ paddingLeft: depth > 0 ? indent : 0 }}>
        {renderKey && <>{renderKey}<span className="text-slate-500">: </span></>}
        {renderPrimitive()}
        {!isLast && <span className="text-slate-500">,</span>}
      </span>
    )
  }

  const isArray = val.__type === 'array'
  const items = isArray ? (val.items ?? []) : []
  const keys = !isArray ? (val.keys ?? []) : []
  const entries = !isArray ? (val.entries ?? {}) : {}

  return (
    <span className="block" style={{ paddingLeft: depth > 0 ? indent : 0 }}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:bg-slate-700/30 rounded px-0.5 -ml-0.5 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open
          ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
          : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
        }
        {renderKey && <>{renderKey}<span className="text-slate-500">: </span></>}
        <span className="text-slate-400">
          {isArray ? `Array(${val.length ?? items.length})` : 'Object'}
        </span>
        {!open && (
          <span className="text-slate-500 ml-1">
            {objectPreview(val)}
          </span>
        )}
      </button>
      {!isLast && !open && <span className="text-slate-500">,</span>}
      {open && (
        <span className="block">
          {isArray ? (
            items.map((item, i) => (
              <span key={i} className="block">
                <ValueRenderer
                  val={item}
                  depth={depth + 1}
                  keyName={String(i)}
                  isLast={i === items.length - 1}
                />
              </span>
            ))
          ) : (
            keys.map((k, i) => (
              <span key={k} className="block">
                <ValueRenderer
                  val={entries[k]}
                  depth={depth + 1}
                  keyName={k}
                  isLast={i === keys.length - 1}
                />
              </span>
            ))
          )}
          {isArray && (
            <span className="block text-slate-600 italic" style={{ paddingLeft: (depth + 1) * 16 }}>
              length: <span className="text-[#c792ea] not-italic">{val.length ?? items.length}</span>
            </span>
          )}
        </span>
      )}
    </span>
  )
})

// --- Console Panel principal ---

export function ConsolePanel({
  logs,
  onClear,
  isExecuting = false,
  executionTime,
  className = '',
}: ConsolePanelProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const filteredLogs = logs.filter(log =>
    filter === 'all' || log.type === filter
  )

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Erro ao copiar para clipboard:', err)
    }
  }, [])

  const getLogBg = useCallback((type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'bg-red-500/5 border-l-red-500/60'
      case 'warn': return 'bg-amber-500/5 border-l-amber-500/50'
      default: return 'border-l-transparent'
    }
  }, [])

  const getLogIcon = useCallback((type: LogEntry['type']) => {
    switch (type) {
      case 'error': return <span className="text-red-400 text-[11px]">✕</span>
      case 'warn': return <span className="text-amber-400 text-[11px]">▲</span>
      case 'info': return <span className="text-blue-400 text-[11px]">ℹ</span>
      default: return null
    }
  }, [])

  const getFilterCount = useCallback((filterType: FilterType) => {
    if (filterType === 'all') return logs.length
    return logs.filter(log => log.type === filterType).length
  }, [logs])

  return (
    <div className={`flex flex-col h-full bg-[#131A2A] ${className}`}>
      {/* Header: Console + filtros + limpar */}
      <div className="flex-shrink-0 border-b border-slate-800/60 bg-[#0B1120]/50 px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <h3 className="text-sm font-semibold text-white whitespace-nowrap">Console</h3>
            {isExecuting && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 bg-[#0F766E] rounded-full animate-pulse" />
              </div>
            )}
            {executionTime !== undefined && !isExecuting && (
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                {executionTime}ms
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-slate-700/60 flex-shrink-0" />

          <div ref={filtersRef} className="flex-1 flex items-center gap-1 min-w-0 overflow-hidden">
            {FILTER_OPTIONS.map(({ value, label }) => {
              const isActive = filter === value
              const displayLabel = value === 'all' ? 'Todos' : label
              const count = getFilterCount(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`
                    flex-shrink-0 h-6 px-2 rounded text-[11px] font-medium transition-colors whitespace-nowrap
                    ${isActive
                      ? 'border border-[#5340FF]/80 text-[#5340FF] bg-transparent'
                      : 'text-slate-500 hover:text-slate-300 bg-transparent'
                    }
                  `}
                >
                  {displayLabel}
                  {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
                </button>
              )
            })}
          </div>

          <DropdownMenu open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex-shrink-0 h-6 px-2 rounded text-[11px] text-slate-400 hover:text-slate-300 hidden"
                aria-label="Mais filtros"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#131A2A] border-slate-700 w-40">
              {FILTER_OPTIONS.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => {
                    setFilter(value)
                    setFiltersOpen(false)
                  }}
                  className={filter === value ? 'text-[#5340FF]' : 'text-slate-300'}
                >
                  {value === 'all' ? 'Todos' : label} ({getFilterCount(value)})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="flex-shrink-0 h-6 w-6 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-700/40"
            title="Limpar Console (Ctrl/Cmd + K)"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-[13px] leading-5"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 py-10">
            <div className="text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-xl bg-slate-700/30 flex items-center justify-center mb-4">
                <Terminal className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">Console vazio...</p>
              <p className="text-xs mt-1.5 text-slate-500">
                Execute seu código para ver os logs aqui
              </p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const logText = log.args.map(a => valueToText(a)).join(' ')
            return (
              <div
                key={log.id}
                className={`group flex items-start border-b border-slate-800/30 border-l-2 hover:bg-slate-800/15 transition-colors ${getLogBg(log.type)}`}
              >
                {/* Ícone de tipo (erro/warn) */}
                <div className="w-7 flex-shrink-0 flex items-center justify-center pt-2">
                  {getLogIcon(log.type)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 py-1.5 pr-2">
                  <div className="flex items-start gap-1">
                    {log.args.map((arg, i) => (
                      <span key={i} className="inline">
                        <ValueRenderer val={arg} />
                        {i < log.args.length - 1 && <span className="mr-2" />}
                      </span>
                    ))}
                  </div>

                  {log.stack && log.type === 'error' && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-300">
                        Stack trace
                      </summary>
                      <pre className="mt-1 text-[11px] text-slate-500 whitespace-pre-wrap break-all">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </div>

                {/* Linha + ações (direita) */}
                <div className="flex-shrink-0 flex items-center gap-1 pt-1.5 pr-2">
                  {log.lineNumber && (
                    <span className="text-[11px] text-slate-600 font-mono tabular-nums">
                      :{log.lineNumber}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300 hover:bg-slate-700/40"
                    onClick={() => copyToClipboard(logText)}
                    title="Copiar"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
