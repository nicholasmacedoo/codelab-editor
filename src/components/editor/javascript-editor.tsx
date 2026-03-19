'use client'

import { JsEditor } from '@/components/JsEditor'
import { ConsolePanel } from '@/components/ConsolePanel'
import { useSandboxRunner, LogEntry } from '@/components/SandboxRunner'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, GripVertical } from 'lucide-react'

interface JavaScriptEditorProps {
  code: string
  onChange: (code: string) => void
  onSave: () => void
}

const MIN_CONSOLE_WIDTH = 280
const MAX_CONSOLE_RATIO = 0.65
const DEFAULT_CONSOLE_WIDTH = 420

export function JavaScriptEditor({ code, onChange, onSave }: JavaScriptEditorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | undefined>(undefined)
  const [consoleWidth, setConsoleWidth] = useState(DEFAULT_CONSOLE_WIDTH)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  const onLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [...prev, entry])
  }, [])

  const onExecutionStart = useCallback(() => {
    setIsExecuting(true)
    setExecutionTime(undefined)
  }, [])

  const onExecutionEnd = useCallback((duration: number) => {
    setIsExecuting(false)
    setExecutionTime(duration)
  }, [])

  const onError = useCallback((error: string, stack?: string) => {
    const errorEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'error',
      args: [{ __type: 'string', value: error }],
      stack
    }
    setLogs(prev => [...prev, errorEntry])
  }, [])

  const sandbox = useSandboxRunner({
    onLog,
    onExecutionStart,
    onExecutionEnd,
    onError
  })

  const handleExecute = useCallback(() => {
    if (isExecuting) {
      sandbox.pararExecucao()
    } else {
      sandbox.executarCodigo(code)
    }
  }, [code, isExecuting, sandbox])

  const handleClearConsole = useCallback(() => {
    setLogs([])
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartWidth.current = consoleWidth
  }, [consoleWidth])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const containerWidth = container.offsetWidth
      const maxWidth = containerWidth * MAX_CONSOLE_RATIO
      const delta = dragStartX.current - e.clientX
      const newWidth = Math.min(maxWidth, Math.max(MIN_CONSOLE_WIDTH, dragStartWidth.current + delta))

      setConsoleWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  return (
    <div ref={containerRef} className="flex h-full bg-[#0B1120]">
      {/* Painel do editor (esquerdo) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 border-b border-slate-800/60 px-4 py-2.5 bg-[#131A2A]/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleExecute}
                size="sm"
                className={
                  isExecuting
                    ? 'bg-red-600/90 hover:bg-red-600 text-white'
                    : 'bg-[#0F766E] hover:bg-[#0D5E56] text-white'
                }
              >
                {isExecuting ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Parar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Executar
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={handleClearConsole}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Limpar Console
              </button>
            </div>
            {executionTime !== undefined && !isExecuting && (
              <span className="text-xs text-slate-500 font-medium">
                ✓ Executado em {executionTime}ms
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <JsEditor
            value={code}
            onChange={onChange}
            onRun={handleExecute}
            onSave={onSave}
            onClearConsole={handleClearConsole}
          />
        </div>
      </div>

      {/* Handle de resize arrastável */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          group flex-shrink-0 w-2 cursor-col-resize flex items-center justify-center
          border-l border-slate-800/60 bg-[#0B1120] hover:bg-[#5340FF]/10
          transition-colors relative z-10
          ${isDragging ? 'bg-[#5340FF]/15' : ''}
        `}
      >
        <GripVertical
          className={`w-3 h-5 text-slate-600 group-hover:text-slate-400 transition-colors ${isDragging ? 'text-[#5340FF]/60' : ''}`}
        />
      </div>

      {/* Painel do console (direito, redimensionável) */}
      <div
        className="flex-shrink-0 flex flex-col min-w-0"
        style={{ width: consoleWidth }}
      >
        <ConsolePanel
          logs={logs}
          onClear={handleClearConsole}
          isExecuting={isExecuting}
          executionTime={executionTime}
        />
      </div>
    </div>
  )
}
