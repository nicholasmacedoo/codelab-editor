import { supabase, supabaseAdmin, Projeto, VersaoProjeto } from './supabase'
import { nanoid } from 'nanoid'

export class ProjetoService {
  /**
   * Verifica se o Supabase está configurado
   */
  private static verificarSupabase() {
    if (!supabase) {
      throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente.')
    }
    return supabase
  }

  /**
   * Cria um novo projeto no Supabase
   */
  static async criarProjeto(dados: {
    title: string
    code: string
    visibility?: 'public' | 'unlisted' | 'private'
    allow_edits?: boolean
    user_id?: string | null
  }): Promise<Projeto> {
    const client = this.verificarSupabase()
    const slug = await this.gerarSlugUnico(dados.title)

    const { data, error } = await client
      .from('projects')
      .insert({
        title: dados.title,
        code: dados.code,
        slug,
        visibility: dados.visibility || 'public',
        allow_edits: dados.allow_edits || true,
        user_id: dados.user_id || null
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar projeto: ${error.message}`)
    }

    return data
  }

  /**
   * Busca um projeto pelo slug
   */
  static async buscarProjetoPorSlug(slug: string): Promise<Projeto | null> {
    const client = this.verificarSupabase()
    
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Projeto não encontrado
      }
      throw new Error(`Erro ao buscar projeto: ${error.message}`)
    }

    return data
  }

  /**
   * Lista projetos públicos (paginado)
   */
  static async listarProjetosPublicos(
    pagina: number = 0,
    limite: number = 20
  ): Promise<{ projetos: Projeto[]; total: number }> {
    const client = this.verificarSupabase()
    const inicio = pagina * limite

    const { data, error, count } = await client
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false })
      .range(inicio, inicio + limite - 1)

    if (error) {
      throw new Error(`Erro ao listar projetos: ${error.message}`)
    }

    return {
      projetos: data || [],
      total: count || 0
    }
  }

  /**
   * Atualiza um projeto existente
   */
  /**
   * Atualiza um projeto existente
   */
  static async atualizarProjeto(
    id: string,
    dados: {
      title?: string
      code?: string
      visibility?: 'public' | 'unlisted' | 'private'
      allow_edits?: boolean
    }
  ): Promise<Projeto> {
    const client = this.verificarSupabase()
    
    // Primeiro, verificar se o projeto existe
    const { data: projetoExistente } = await client
      .from('projects')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!projetoExistente) {
      throw new Error(`Projeto com ID ${id} não encontrado`)
    }
    
    const { data, error } = await client
      .from('projects')
      .update(dados)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar projeto: ${error.message}`)
    }

    return data
  }

  /**
   * Deleta um projeto
   */
  static async deletarProjeto(id: string): Promise<void> {
    const client = this.verificarSupabase()
    
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar projeto: ${error.message}`)
    }
  }

  /**
   * Cria uma nova versão de um projeto
   */
  static async criarVersao(dados: {
    project_id: string
    label: string
    code: string
    created_by?: string | null
  }): Promise<VersaoProjeto> {
    const client = this.verificarSupabase()
    
    const { data, error } = await client
      .from('project_versions')
      .insert({
        project_id: dados.project_id,
        label: dados.label,
        code: dados.code,
        created_by: dados.created_by || null
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar versão: ${error.message}`)
    }

    return data
  }

  /**
   * Lista versões de um projeto
   */
  static async listarVersoesProjeto(projectId: string): Promise<VersaoProjeto[]> {
    const client = this.verificarSupabase()
    
    const { data, error } = await client
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao listar versões: ${error.message}`)
    }

    return data || []
  }

  /**
   * Gera um slug único para o projeto
   */
  private static async gerarSlugUnico(titulo: string): Promise<string> {
    const client = this.verificarSupabase()
    
    // Gerar slug base a partir do título
    let slugBase = titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, '') // Remove hífens do início e fim

    // Se o slug ficou vazio, usar um padrão
    if (!slugBase || slugBase.length === 0) {
      slugBase = 'projeto'
    }

    let slug = slugBase
    let contador = 1

    // Verificar se o slug já existe
    while (true) {
      const { data, error } = await client
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (error) {
        throw new Error(`Erro ao verificar slug: ${error.message}`)
      }

      if (!data) {
        break // Slug disponível
      }

      // Gerar novo slug com contador
      slug = `${slugBase}-${contador}`
      contador++
    }

    return slug
  }

  /**
   * Pesquisa projetos por termo
   */
  static async pesquisarProjetos(
    termo: string,
    limite: number = 10
  ): Promise<Projeto[]> {
    const client = this.verificarSupabase()
    
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('visibility', 'public')
      .or(`title.ilike.%${termo}%,code.ilike.%${termo}%`)
      .order('updated_at', { ascending: false })
      .limit(limite)

    if (error) {
      throw new Error(`Erro ao pesquisar projetos: ${error.message}`)
    }

    return data || []
  }
}