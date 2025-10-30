-- Migração: Adicionar suporte para projetos React
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar 'react' ao enum project_type
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'react';

-- 2. Adicionar coluna react_dependencies para armazenar dependências do package.json
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS react_dependencies JSONB DEFAULT '{}';

-- 3. Remover constraints que impedem projetos React
-- Drop constraints antigas que exigem js_code ou html_code
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS valid_javascript_project;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS valid_web_project;

-- 4. Criar nova constraint que permite projeto React sem código obrigatório
-- Para React, não é necessário ter código obrigatório aqui pois os arquivos estão na tabela react_files
ALTER TABLE public.projects ADD CONSTRAINT valid_project_type 
  CHECK (
    (type = 'javascript' AND js_code IS NOT NULL) OR
    (type = 'web_complete' AND html_code IS NOT NULL) OR
    (type = 'react')
  );

-- 5. Criar tabela react_files para armazenar arquivos dos projetos React
CREATE TABLE IF NOT EXISTS public.react_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('jsx', 'js', 'css', 'json', 'md')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, path)
);

-- 6. Índices para react_files
CREATE INDEX IF NOT EXISTS idx_react_files_project_id ON public.react_files(project_id);
CREATE INDEX IF NOT EXISTS idx_react_files_path ON public.react_files(project_id, path);

-- 7. Função para atualizar updated_at em react_files
CREATE TRIGGER update_react_files_updated_at
  BEFORE UPDATE ON public.react_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. RLS para react_files
ALTER TABLE public.react_files ENABLE ROW LEVEL SECURITY;

-- 9. Policies para react_files
-- Usuários podem ver arquivos de projetos que eles podem ver
CREATE POLICY "users_can_view_react_files"
  ON public.react_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = react_files.project_id 
      AND (is_public = TRUE OR auth.uid() = user_id)
    )
  );

-- Usuários podem criar/atualizar arquivos em seus projetos
CREATE POLICY "users_can_manage_react_files"
  ON public.react_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = react_files.project_id 
      AND auth.uid() = user_id
    )
  );

-- 10. Adicionar trigger para broadcast de mudanças em react_files
CREATE OR REPLACE FUNCTION broadcast_react_file_change()
RETURNS TRIGGER AS $$
DECLARE
  payload_data JSON;
BEGIN
  IF TG_OP = 'DELETE' THEN
    payload_data := NULL;
  ELSE
    payload_data := json_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'path', NEW.path,
      'file_type', NEW.file_type,
      'updated_at', NEW.updated_at
    );
  END IF;
  
  PERFORM pg_notify(
    'project_' || COALESCE(NEW.project_id::TEXT, OLD.project_id::TEXT),
    json_build_object(
      'type', TG_OP,
      'file_id', COALESCE(NEW.id, OLD.id),
      'data', payload_data
    )::TEXT
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER react_file_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.react_files
  FOR EACH ROW EXECUTE FUNCTION broadcast_react_file_change();

-- 11. Comentários
COMMENT ON TABLE public.react_files IS 'Arquivos dos projetos React';
COMMENT ON COLUMN public.react_files.file_type IS 'Tipo do arquivo: jsx, js, css, json ou md';
COMMENT ON COLUMN public.react_files.path IS 'Caminho completo do arquivo (ex: src/App.jsx)';

