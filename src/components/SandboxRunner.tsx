'use client'

import { useRef, useCallback, useEffect } from 'react'

export interface LogEntry {
  id: string
  timestamp: Date
  type: 'log' | 'info' | 'warn' | 'error'
  args: unknown[]
  stack?: string
}

interface SandboxRunnerConfig {
  onLog: (entry: LogEntry) => void
  onExecutionStart: () => void
  onExecutionEnd: (duration: number) => void
  onError: (error: string, stack?: string) => void
}

interface SandboxRunnerReturn {
  executarCodigo: (code: string) => void
  pararExecucao: () => void
  isRunning: boolean
  cleanup: () => void
}

export function useSandboxRunner(config: SandboxRunnerConfig): SandboxRunnerReturn {
  const workerRef = useRef<Worker | null>(null)
  const isRunningRef = useRef(false)
  const { onLog, onExecutionStart, onExecutionEnd, onError } = config

  // Inicializar worker
  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }

    try {
      workerRef.current = new Worker('/sandbox-worker.js')
      
      workerRef.current.onmessage = (event) => {
        const { type, data } = event.data

        switch (type) {
          case 'ready':
            console.log('Sandbox worker pronto')
            break

          case 'log':
            const logEntry: LogEntry = {
              ...data,
              timestamp: new Date(data.timestamp)
            }
            onLog(logEntry)
            break

          case 'clear':
            // Limpar console será tratado pelo componente pai
            break

          case 'execution-start':
            isRunningRef.current = true
            onExecutionStart()
            break

          case 'execution-end':
            isRunningRef.current = false
            const { duration, timedOut, stopped, error } = data
            
            if (timedOut) {
              onError('Execução interrompida: Timeout de 3 segundos excedido')
            } else if (stopped) {
              onError('Execução interrompida pelo usuário')
            }
            
            onExecutionEnd(duration)
            break

          case 'pong':
            // Resposta ao ping - worker está vivo
            break

          default:
            console.warn('Tipo de mensagem desconhecido do worker:', type)
        }
      }

      workerRef.current.onerror = (error) => {
        console.error('Erro no worker:', error)
        onError('Erro interno do sandbox', error.message)
        isRunningRef.current = false
      }

    } catch (error) {
      console.error('Erro ao inicializar worker:', error)
      onError('Erro ao inicializar sandbox', error instanceof Error ? error.message : String(error))
    }
  }, [onLog, onExecutionStart, onExecutionEnd, onError])

  // Executar código
  const executarCodigo = useCallback((code: string) => {
    if (!workerRef.current) {
      initWorker()
      // Aguardar um pouco para o worker inicializar
      setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.postMessage({ type: 'execute', data: { code } })
        }
      }, 100)
    } else {
      workerRef.current.postMessage({ type: 'execute', data: { code } })
    }
  }, [initWorker])

  // Parar execução
  const pararExecucao = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' })
    }
    isRunningRef.current = false
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    isRunningRef.current = false
  }, [])

  // Inicializar worker na montagem
  useEffect(() => {
    initWorker()
    return cleanup
  }, [initWorker, cleanup])

  return {
    executarCodigo,
    pararExecucao,
    isRunning: isRunningRef.current,
    cleanup
  }
}

// Manter compatibilidade com a função anterior
export function SandboxRunner(config: SandboxRunnerConfig): SandboxRunnerReturn {
  return useSandboxRunner(config)
}