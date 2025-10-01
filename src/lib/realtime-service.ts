import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeProjectUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  project_id: string
  data?: Record<string, unknown>
}

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map()

  /**
   * Verifica se o Supabase está configurado
   */
  private static verificarSupabase() {
    if (!supabase) {
      throw new Error('Supabase não está configurado. Funcionalidades em tempo real não disponíveis.')
    }
    return supabase
  }

  /**
   * Inscreve-se em atualizações de um projeto específico
   */
  static subscribeToProject(
    projectId: string,
    callback: (update: RealtimeProjectUpdate) => void
  ): () => void {
    try {
      const client = this.verificarSupabase()
      const channelName = `project_${projectId}`
      
      // Se já existe um canal para este projeto, remove o anterior
      if (this.channels.has(channelName)) {
        this.unsubscribeFromProject(projectId)
      }

      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `id=eq.${projectId}`
          },
          (payload) => {
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              project_id: projectId,
              data: payload.new || payload.old
            })
          }
        )
        .subscribe()

      this.channels.set(channelName, channel)

      // Retorna função para cancelar a inscrição
      return () => this.unsubscribeFromProject(projectId)
    } catch (error) {
      console.warn('Erro ao inscrever-se no projeto:', error)
      return () => {}
    }
  }

  /**
   * Cancela inscrição de um projeto específico
   */
  static unsubscribeFromProject(projectId: string): void {
    try {
      const client = this.verificarSupabase()
      const channelName = `project_${projectId}`
      const channel = this.channels.get(channelName)
      
      if (channel) {
        client.removeChannel(channel)
        this.channels.delete(channelName)
      }
    } catch (error) {
      console.warn('Erro ao cancelar inscrição do projeto:', error)
    }
  }

  /**
   * Inscreve-se em atualizações de todos os projetos públicos
   */
  static subscribeToPublicProjects(
    callback: (update: RealtimeProjectUpdate) => void
  ): () => void {
    try {
      const client = this.verificarSupabase()
      const channelName = 'public_projects'
      
      // Remove canal anterior se existir
      if (this.channels.has(channelName)) {
        const oldChannel = this.channels.get(channelName)
        if (oldChannel) {
          client.removeChannel(oldChannel)
        }
      }

      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: 'visibility=eq.public'
          },
          (payload) => {
            const data = payload.new || payload.old
            const projectId = (data as Record<string, unknown>)?.id as string
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              project_id: projectId,
              data
            })
          }
        )
        .subscribe()

      this.channels.set(channelName, channel)

      return () => {
        const channel = this.channels.get(channelName)
        if (channel) {
          try {
            const client = this.verificarSupabase()
            client.removeChannel(channel)
            this.channels.delete(channelName)
          } catch (error) {
            console.warn('Erro ao cancelar inscrição de projetos públicos:', error)
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao inscrever-se em projetos públicos:', error)
      return () => {}
    }
  }

  /**
   * Limpa todas as inscrições ativas
   */
  static unsubscribeAll(): void {
    try {
      const client = this.verificarSupabase()
      this.channels.forEach((channel) => {
        client.removeChannel(channel)
      })
      this.channels.clear()
    } catch (error) {
      console.warn('Erro ao limpar inscrições:', error)
    }
  }

  /**
   * Verifica se o Supabase Realtime está disponível
   */
  static isRealtimeAvailable(): boolean {
    return !!supabase
  }

  /**
   * Obtém estatísticas dos canais ativos
   */
  static getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

// Limpar canais quando a página é fechada
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    RealtimeService.unsubscribeAll()
  })
}