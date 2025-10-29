import { useEffect, useCallback } from 'react'
import { RealtimeService, RealtimeProjectUpdate } from '@/lib/realtime-service'
import { Project } from '@/types/project'

interface UseRealtimeProjetosProps {
  /** Função para atualizar a lista de projetos */
  setProjetos: (updater: (projetos: Project[]) => Project[]) => void
  /** ID do projeto específico para monitorar (opcional) */
  projetoId?: string
  /** Se deve monitorar todos os projetos públicos */
  monitorarPublicos?: boolean
}

/**
 * Hook para gerenciar atualizações em tempo real de projetos
 */
export function useRealtimeProjetos({
  setProjetos,
  projetoId,
  monitorarPublicos = false
}: UseRealtimeProjetosProps) {
  
  const handleProjectUpdate = useCallback((update: RealtimeProjectUpdate) => {
    console.log('Atualização em tempo real recebida:', update)
    
    setProjetos((projetosAtuais: Project[]) => {
      switch (update.type) {
        case 'INSERT': {
          // Adiciona novo projeto se não existir
          const novoProjetoExiste = projetosAtuais.some((p: Project) => p.id === update.project_id)
          if (!novoProjetoExiste && update.data) {
            const novoProjeto = update.data as unknown as Project
            return [...projetosAtuais, novoProjeto]
          }
          return projetosAtuais
        }
        
        case 'UPDATE': {
          // Atualiza projeto existente
          return projetosAtuais.map((projeto: Project) => 
            projeto.id === update.project_id && update.data
              ? { ...projeto, ...(update.data as Partial<Project>) }
              : projeto
          )
        }
        
        case 'DELETE': {
          // Remove projeto da lista
          return projetosAtuais.filter((projeto: Project) => projeto.id !== update.project_id)
        }
        
        default:
          return projetosAtuais
      }
    })
  }, [setProjetos])

  useEffect(() => {
    // Verifica se o serviço de tempo real está disponível
    if (!RealtimeService.isRealtimeAvailable()) {
      console.warn('Funcionalidades em tempo real não estão disponíveis')
      return
    }

    const unsubscribeFunctions: (() => void)[] = []

    try {
      // Inscreve-se em projeto específico se fornecido
      if (projetoId) {
        const unsubscribeProject = RealtimeService.subscribeToProject(
          projetoId,
          handleProjectUpdate
        )
        unsubscribeFunctions.push(unsubscribeProject)
      }

      // Inscreve-se em projetos públicos se solicitado
      if (monitorarPublicos) {
        const unsubscribePublic = RealtimeService.subscribeToPublicProjects(
          handleProjectUpdate
        )
        unsubscribeFunctions.push(unsubscribePublic)
      }
    } catch (error) {
      console.error('Erro ao configurar inscrições em tempo real:', error)
    }

    // Cleanup: cancela todas as inscrições
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          unsubscribe()
        } catch (error) {
          console.warn('Erro ao cancelar inscrição:', error)
        }
      })
    }
  }, [projetoId, monitorarPublicos, handleProjectUpdate])

  return {
    /** Indica se as funcionalidades em tempo real estão disponíveis */
    realtimeDisponivel: RealtimeService.isRealtimeAvailable(),
    /** Lista dos canais ativos */
    canaisAtivos: RealtimeService.getActiveChannels()
  }
}