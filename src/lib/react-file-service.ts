/**
 * Serviço para gerenciar arquivos React no Supabase
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { supabase, Database } from './supabase'
import { ReactFile, ReactFileRow } from '@/types/project'
import { SupabaseClient } from '@supabase/supabase-js'

type ReactFileInsert = Database['public']['Tables']['react_files']['Insert']
type ReactFileUpdate = Database['public']['Tables']['react_files']['Update']

export class ReactFileService {
  /**
   * Obtém o cliente Supabase
   */
  private static getClient(): SupabaseClient<Database> {
    if (!supabase) {
      throw new Error('Supabase não está configurado.')
    }
    return supabase
  }

  /**
   * Lista todos os arquivos de um projeto React
   */
  static async listarArquivos(projectId: string): Promise<ReactFile[]> {
    const client = this.getClient()

    const { data, error } = await client
      .from('react_files')
      .select('*')
      .eq('project_id', projectId)
      .order('path')

    if (error) {
      throw new Error(`Erro ao listar arquivos: ${error.message}`)
    }

    return (data as ReactFileRow[]).map(file => this.mapRowToFile(file))
  }

  /**
   * Busca um arquivo específico por ID
   */
  static async buscarArquivoPorId(id: string): Promise<ReactFile | null> {
    const client = this.getClient()

    const { data, error } = await client
      .from('react_files')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao buscar arquivo: ${error.message}`)
    }

    return data ? this.mapRowToFile(data as ReactFileRow) : null
  }

  /**
   * Busca um arquivo por path em um projeto
   */
  static async buscarArquivoPorPath(projectId: string, path: string): Promise<ReactFile | null> {
    const client = this.getClient()

    const { data, error } = await client
      .from('react_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('path', path)
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao buscar arquivo: ${error.message}`)
    }

    return data ? this.mapRowToFile(data as ReactFileRow) : null
  }

  /**
   * Cria um novo arquivo
   */
  static async criarArquivo(
    projectId: string,
    file: Omit<ReactFile, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ReactFile> {
    const client = this.getClient()

    const fileData: ReactFileInsert = {
      project_id: projectId,
      name: file.name,
      path: file.path,
      content: file.content,
      file_type: file.file_type
    }

    const { data, error } = await client
      .from('react_files')
      // @ts-ignore
      .insert(fileData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar arquivo: ${error.message}`)
    }

    return this.mapRowToFile(data as ReactFileRow)
  }

  /**
   * Atualiza um arquivo existente
   */
  static async atualizarArquivo(
    id: string,
    updates: {
      name?: string
      path?: string
      content?: string
      file_type?: ReactFile['file_type']
    }
  ): Promise<ReactFile> {
    const client = this.getClient()

    const { data, error } = await client
      .from('react_files')
      // @ts-ignore
      .update(updates as ReactFileUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar arquivo: ${error.message}`)
    }

    return this.mapRowToFile(data as ReactFileRow)
  }

  /**
   * Deleta um arquivo
   */
  static async deletarArquivo(id: string): Promise<void> {
    const client = this.getClient()

    const { error } = await client
      .from('react_files')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar arquivo: ${error.message}`)
    }
  }

  /**
   * Cria múltiplos arquivos de uma vez (para templates)
   */
  static async criarArquivosEmLote(
    projectId: string,
    files: Omit<ReactFile, 'id' | 'project_id' | 'created_at' | 'updated_at'>[]
  ): Promise<ReactFile[]> {
    const client = this.getClient()

    const filesData: ReactFileInsert[] = files.map(file => ({
      project_id: projectId,
      name: file.name,
      path: file.path,
      content: file.content,
      file_type: file.file_type
    }))

    const { data, error } = await client
      .from('react_files')
      // @ts-ignore
      .insert(filesData)
      .select()

    if (error) {
      throw new Error(`Erro ao criar arquivos em lote: ${error.message}`)
    }

    return (data as ReactFileRow[]).map(file => this.mapRowToFile(file))
  }

  /**
   * Deleta todos os arquivos de um projeto
   */
  static async deletarTodosArquivos(projectId: string): Promise<void> {
    const client = this.getClient()

    const { error } = await client
      .from('react_files')
      .delete()
      .eq('project_id', projectId)

    if (error) {
      throw new Error(`Erro ao deletar todos os arquivos: ${error.message}`)
    }
  }

  /**
   * Verifica se um arquivo existe
   */
  static async arquivoExiste(projectId: string, path: string): Promise<boolean> {
    const client = this.getClient()

    const { data, error } = await client
      .from('react_files')
      .select('id')
      .eq('project_id', projectId)
      .eq('path', path)
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao verificar arquivo: ${error.message}`)
    }

    return !!data
  }

  /**
   * Converte um ReactFileRow para ReactFile
   */
  private static mapRowToFile(row: ReactFileRow): ReactFile {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      content: row.content,
      file_type: row.file_type,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

