/* eslint-disable @typescript-eslint/ban-ts-comment */
import { supabase, Project, Database } from './supabase'
import { 
  CreateProjectData, 
  CreateJavaScriptProjectData,
  CreateWebCompleteProjectData,
  UpdateProjectData, 
  ProjectType 
} from '@/types/project'
import { SupabaseClient } from '@supabase/supabase-js'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']

export class ProjetoService {
  /**
   * Verifica se o Supabase está configurado e retorna o client
   */
  private static getClient(): SupabaseClient<Database> {
    if (!supabase) {
      throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente.')
    }
    // Force type assertion para contornar problema de inferência do TypeScript
    return supabase as SupabaseClient<Database>
  }

  /**
   * Cria um novo projeto no Supabase
   */
  static async criarProjeto(dados: CreateProjectData): Promise<Project> {
    const client = this.getClient()
    const slug = await this.gerarSlugUnico(dados.name)

    // Preparar dados baseados no tipo de projeto
    let projectData: ProjectInsert
    
    if (dados.type === ProjectType.JAVASCRIPT) {
      const jsData = dados as CreateJavaScriptProjectData
      projectData = {
        name: dados.name,
        slug,
        type: dados.type,
        description: dados.description || null,
        is_public: dados.is_public || false,
        allow_edits: dados.allow_edits || false,
        user_id: dados.user_id || null,
        js_code: jsData.js_code,
        html_code: null,
        css_code: null,
        js_web_code: null
      }
    } else if (dados.type === ProjectType.WEB_COMPLETE) {
      const webData = dados as CreateWebCompleteProjectData
      projectData = {
        name: dados.name,
        slug,
        type: dados.type,
        description: dados.description || null,
        is_public: dados.is_public || false,
        allow_edits: dados.allow_edits || false,
        user_id: dados.user_id || null,
        js_code: null,
        html_code: webData.html_code,
        css_code: webData.css_code || '',
        js_web_code: webData.js_web_code || ''
      }
    } else {
      // REACT type
      projectData = {
        name: dados.name,
        slug,
        type: dados.type,
        description: dados.description || null,
        is_public: dados.is_public || false,
        allow_edits: dados.allow_edits || false,
        user_id: dados.user_id || null,
        js_code: null,
        html_code: null,
        css_code: null,
        js_web_code: null
      }
    }

    const { data, error } = await client
      .from('projects')
      // @ts-ignore - Supabase type inference issue with Database generic
      .insert(projectData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar projeto: ${error.message}`)
    }

    return data as Project
  }

  /**
   * Busca um projeto pelo slug
   */
  static async buscarProjetoPorSlug(slug: string): Promise<Project | null> {
    const client = this.getClient()
    
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

    return data as Project
  }

  /**
   * Busca um projeto pelo ID
   */
  static async buscarProjetoPorId(id: string): Promise<Project | null> {
    const client = this.getClient()
    
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Projeto não encontrado
      }
      throw new Error(`Erro ao buscar projeto: ${error.message}`)
    }

    return data as Project
  }

  /**
   * Lista projetos públicos (paginado)
   */
  static async listarProjetosPublicos(
    pagina: number = 0,
    limite: number = 20,
    tipo?: ProjectType
  ): Promise<{ projetos: Project[]; total: number }> {
    const client = this.getClient()
    const inicio = pagina * limite

    let query = client
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('is_public', true)

    if (tipo) {
      query = query.eq('type', tipo)
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(inicio, inicio + limite - 1)

    if (error) {
      throw new Error(`Erro ao listar projetos: ${error.message}`)
    }

    return {
      projetos: (data as Project[]) || [],
      total: count || 0
    }
  }

  /**
   * Lista projetos do usuário autenticado (paginado)
   */
  static async listarProjetosDoUsuario(
    userId: string,
    pagina: number = 0,
    limite: number = 20,
    tipo?: ProjectType
  ): Promise<{ projetos: Project[]; total: number }> {
    const client = this.getClient()
    const inicio = pagina * limite

    let query = client
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (tipo) {
      query = query.eq('type', tipo)
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(inicio, inicio + limite - 1)

    if (error) {
      throw new Error(`Erro ao listar projetos do usuário: ${error.message}`)
    }

    return {
      projetos: (data as Project[]) || [],
      total: count || 0
    }
  }

  /**
   * Pesquisa projetos do usuário por termo
   */
  static async pesquisarProjetosDoUsuario(
    termo: string,
    userId: string,
    limite: number = 10
  ): Promise<Project[]> {
    const client = this.getClient()

    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${termo}%,description.ilike.%${termo}%`)
      .order('updated_at', { ascending: false })
      .limit(limite)

    if (error) {
      throw new Error(`Erro ao pesquisar projetos do usuário: ${error.message}`)
    }

    return (data as Project[]) || []
  }

  /**
   * Atualiza um projeto existente
   */
  static async atualizarProjeto(
    id: string,
    dados: UpdateProjectData
  ): Promise<Project> {
    const client = this.getClient()
    
    // Primeiro, verificar se o projeto existe
    const { data: projetoExistente } = await client
      .from('projects')
      .select('id, type')
      .eq('id', id)
      .maybeSingle()

    if (!projetoExistente) {
      throw new Error(`Projeto com ID ${id} não encontrado`)
    }
    
    const { data, error } = await client
      .from('projects')
      // @ts-ignore - Supabase type inference issue with Database generic
      .update(dados)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar projeto: ${error.message}`)
    }

    return data as Project
  }

  /**
   * Deleta um projeto
   */
  static async deletarProjeto(id: string): Promise<void> {
    const client = this.getClient()
    
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar projeto: ${error.message}`)
    }
  }

  /**
   * Duplica um projeto existente
   */
  static async duplicarProjeto(id: string, userId?: string): Promise<Project> {
    const client = this.getClient()
    
    // Buscar projeto original
    const original = await this.buscarProjetoPorId(id)
    if (!original) {
      throw new Error('Projeto original não encontrado')
    }

    // Criar cópia com novo slug
    const slug = await this.gerarSlugUnico(`${original.name} (cópia)`)
    
    // Copiar código baseado no tipo
    const copyData: ProjectInsert = original.type === ProjectType.JAVASCRIPT
      ? {
          name: `${original.name} (cópia)`,
          slug,
          type: original.type,
          description: original.description || null,
          is_public: false,
          allow_edits: false,
          user_id: userId || null,
          js_code: original.js_code || null,
          html_code: null,
          css_code: null,
          js_web_code: null
        }
      : {
          name: `${original.name} (cópia)`,
          slug,
          type: original.type,
          description: original.description || null,
          is_public: false,
          allow_edits: false,
          user_id: userId || null,
          js_code: null,
          html_code: original.html_code || null,
          css_code: original.css_code || null,
          js_web_code: original.js_web_code || null
        }

    const { data, error } = await client
      .from('projects')
      // @ts-ignore - Supabase type inference issue with Database generic
      .insert(copyData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao duplicar projeto: ${error.message}`)
    }

    return data as Project
  }

  /**
   * Gera um slug único para o projeto
   */
  private static async gerarSlugUnico(titulo: string): Promise<string> {
    const client = this.getClient()
    
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
   * Pesquisa projetos públicos por termo
   */
  static async pesquisarProjetos(
    termo: string,
    limite: number = 10
  ): Promise<Project[]> {
    const client = this.getClient()
    
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .or(`name.ilike.%${termo}%,description.ilike.%${termo}%`)
      .order('updated_at', { ascending: false })
      .limit(limite)

    if (error) {
      throw new Error(`Erro ao pesquisar projetos: ${error.message}`)
    }

    return (data as Project[]) || []
  }

  /**
   * Conta projetos por tipo do usuário
   */
  static async contarProjetosPorTipo(userId: string): Promise<{
    javascript: number
    web_complete: number
    total: number
  }> {
    const client = this.getClient()

    const { count: jsCount } = await client
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', ProjectType.JAVASCRIPT)

    const { count: webCount } = await client
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', ProjectType.WEB_COMPLETE)

    return {
      javascript: jsCount || 0,
      web_complete: webCount || 0,
      total: (jsCount || 0) + (webCount || 0)
    }
  }
}
