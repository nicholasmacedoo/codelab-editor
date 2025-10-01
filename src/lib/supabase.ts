import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Verificar se as variáveis de ambiente estão configuradas
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey

// Cliente para uso no browser (apenas se configurado)
export const supabase = isSupabaseConfigured 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null

// Cliente para uso no servidor (com service role key)
export const supabaseAdmin = isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

// Tipos para o banco de dados
export interface Projeto {
  id: string
  user_id: string | null
  slug: string
  title: string
  code: string
  visibility: 'public' | 'unlisted' | 'private'
  allow_edits: boolean
  created_at: string
  updated_at: string
}

export interface VersaoProjeto {
  id: string
  project_id: string
  label: string | null
  code: string
  created_by: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Projeto
        Insert: Omit<Projeto, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Projeto, 'id' | 'created_at'>>
      }
      project_versions: {
        Row: VersaoProjeto
        Insert: Omit<VersaoProjeto, 'id' | 'created_at'>
        Update: Partial<Omit<VersaoProjeto, 'id' | 'created_at'>>
      }
    }
  }
}