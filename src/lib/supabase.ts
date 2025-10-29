import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { Database, Project, ProjectVersion } from '@/types/project'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Verificar se as variáveis de ambiente estão configuradas
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey

// Cliente para uso no browser (apenas se configurado)
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured 
  ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Cliente para uso no servidor (com service role key)
export const supabaseAdmin: SupabaseClient<Database> | null = isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

// Re-exportar tipos principais para compatibilidade
export type { Project, ProjectVersion, Database }
export type { Project as Projeto, ProjectVersion as VersaoProjeto }