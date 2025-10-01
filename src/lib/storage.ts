import localforage from 'localforage'
import { Projeto, VersaoProjeto } from './supabase'

// Configuração do localforage
const projetosStore = localforage.createInstance({
  name: 'EditorJS',
  storeName: 'projetos',
  description: 'Armazenamento local de projetos JavaScript'
})

const versoesStore = localforage.createInstance({
  name: 'EditorJS',
  storeName: 'versoes',
  description: 'Armazenamento local de versões de projetos'
})

// Interface para projeto local (com versões incluídas)
export interface ProjetoLocal extends Projeto {
  versions?: VersaoProjeto[]
  isLocal?: boolean // Flag para indicar se é apenas local
}

export class ArmazenamentoLocal {
  // Projetos
  static async salvarProjeto(projeto: ProjetoLocal): Promise<void> {
    await projetosStore.setItem(projeto.id, projeto)
  }

  static async obterProjeto(id: string): Promise<ProjetoLocal | null> {
    return await projetosStore.getItem(id)
  }

  static async obterProjetoPorSlug(slug: string): Promise<ProjetoLocal | null> {
    const projetos = await this.listarProjetos()
    return projetos.find(p => p.slug === slug) || null
  }

  static async listarProjetos(): Promise<ProjetoLocal[]> {
    const projetos: ProjetoLocal[] = []
    await projetosStore.iterate((projeto: ProjetoLocal) => {
      projetos.push(projeto)
    })
    return projetos.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }

  static async excluirProjeto(id: string): Promise<void> {
    await projetosStore.removeItem(id)
    // Excluir também todas as versões do projeto
    const versoes = await this.listarVersoesProjeto(id)
    for (const versao of versoes) {
      await versoesStore.removeItem(versao.id)
    }
  }

  static async limparProjetos(): Promise<void> {
    await projetosStore.clear()
  }

  // Versões
  static async salvarVersao(versao: VersaoProjeto): Promise<void> {
    await versoesStore.setItem(versao.id, versao)
  }

  static async obterVersao(id: string): Promise<VersaoProjeto | null> {
    return await versoesStore.getItem(id)
  }

  static async listarVersoesProjeto(projectId: string): Promise<VersaoProjeto[]> {
    const versoes: VersaoProjeto[] = []
    await versoesStore.iterate((versao: VersaoProjeto) => {
      if (versao.project_id === projectId) {
        versoes.push(versao)
      }
    })
    return versoes.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  static async excluirVersao(id: string): Promise<void> {
    await versoesStore.removeItem(id)
  }

  // Utilitários
  static async obterEstatisticas() {
    const totalProjetos = await projetosStore.length()
    const totalVersoes = await versoesStore.length()
    
    return {
      totalProjetos,
      totalVersoes,
      tamanhoEstimado: await this.calcularTamanhoArmazenamento()
    }
  }

  private static async calcularTamanhoArmazenamento(): Promise<string> {
    let tamanhoTotal = 0
    
    await projetosStore.iterate((projeto: ProjetoLocal) => {
      tamanhoTotal += JSON.stringify(projeto).length
    })
    
    await versoesStore.iterate((versao: VersaoProjeto) => {
      tamanhoTotal += JSON.stringify(versao).length
    })
    
    // Converter para KB/MB
    if (tamanhoTotal < 1024) {
      return `${tamanhoTotal} bytes`
    } else if (tamanhoTotal < 1024 * 1024) {
      return `${(tamanhoTotal / 1024).toFixed(1)} KB`
    } else {
      return `${(tamanhoTotal / (1024 * 1024)).toFixed(1)} MB`
    }
  }

  // Sincronização
  static async marcarComoSincronizado(projetoId: string): Promise<void> {
    const projeto = await this.obterProjeto(projetoId)
    if (projeto) {
      projeto.isLocal = false
      await this.salvarProjeto(projeto)
    }
  }

  static async obterProjetosNaoSincronizados(): Promise<ProjetoLocal[]> {
    const projetos = await this.listarProjetos()
    return projetos.filter(p => p.isLocal === true)
  }
}