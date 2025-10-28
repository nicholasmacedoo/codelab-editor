'use client'

import { JsEditor } from '@/components/JsEditor'
import { ConsolePanel } from '@/components/ConsolePanel'
import { useSandboxRunner, LogEntry } from '@/components/SandboxRunner'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square } from 'lucide-react'

interface JavaScriptEditorProps {
  code: string
  onChange: (code: string) => void
  onSave: () => void
}

export function JavaScriptEditor({ code, onChange, onSave }: JavaScriptEditorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | undefined>(undefined)

  // Callbacks para o SandboxRunner
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
      args: [error],
      stack
    }
    setLogs(prev => [...prev, errorEntry])
  }, [])

  // Usar o hook do SandboxRunner
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

  return (
    <div className="flex h-full">
      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b p-2 bg-muted/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExecute}
                variant={isExecuting ? "destructive" : "default"}
                size="sm"
                className={isExecuting 
                  ? "bg-destructive hover:bg-destructive/90" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }
              >
                {isExecuting ? (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    Parar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Executar
                  </>
                )}
              </Button>
              <Button 
                onClick={handleClearConsole} 
                variant="outline" 
                size="sm"
              >
                Limpar Console
              </Button>
            </div>
            
            {executionTime !== undefined && (
              <div className="px-3 py-1 bg-success/20 text-success border border-success/30 rounded-md text-xs font-medium">
                ✓ Executado em {executionTime}ms
              </div>
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
      
      {/* Console */}
      <div className="w-[500px] border-l flex-shrink-0">
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

