-- Schema Refatorado - IDE Educational Multi-Linguagem
-- Este schema adiciona suporte para projetos JavaScript Puro e Web Completo
-- Execute este script no SQL Editor do Supabase

-- Primeiro, fazer backup dos projetos existentes (se necessário)
-- CREATE TABLE projects_backup AS SELECT * FROM projects;

-- Dropar tabela existente com cuidado (descomentar se necessário)
-- DROP TABLE IF EXISTS public.project_versions CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE;

-- Criar enum para tipos de projeto
CREATE TYPE project_type AS ENUM ('javascript', 'web_complete');

-- Tabela de projetos refatorada
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type project_type NOT NULL DEFAULT 'javascript',
  description TEXT,
  
  -- Campos para JavaScript Puro
  js_code TEXT,
  
  -- Campos para Web Completo
  html_code TEXT,
  css_code TEXT,
  js_web_code TEXT,
  
  -- Configurações de visibilidade e permissões
  is_public BOOLEAN DEFAULT FALSE,
  allow_edits BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Validação: garantir que os campos corretos estejam preenchidos
  CONSTRAINT valid_javascript_project CHECK (
    type != 'javascript' OR js_code IS NOT NULL
  ),
  CONSTRAINT valid_web_project CHECK (
    type != 'web_complete' OR (html_code IS NOT NULL)
  )
);

-- Tabela de versões dos projetos (save points)
CREATE TABLE IF NOT EXISTS public.project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label TEXT, -- ex.: "Checkpoint 1" (opcional)
  
  -- Salvar código conforme o tipo do projeto pai
  js_code TEXT,
  html_code TEXT,
  css_code TEXT,
  js_web_code TEXT,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_public ON public.projects(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_created_at ON public.project_versions(created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at na tabela projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Projetos públicos são visíveis para todos" ON public.projects;
DROP POLICY IF EXISTS "Projetos unlisted são visíveis para usuários autenticados" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios projetos" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem criar projetos" ON public.projects;
DROP POLICY IF EXISTS "Permitir criação de projetos anônimos" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios projetos" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios projetos" ON public.projects;
DROP POLICY IF EXISTS "Versões visíveis baseadas no projeto" ON public.project_versions;
DROP POLICY IF EXISTS "Usuários podem criar versões de seus projetos" ON public.project_versions;
DROP POLICY IF EXISTS "Usuários podem deletar versões de seus projetos" ON public.project_versions;

-- Políticas para projetos
-- Qualquer pessoa pode ver projetos públicos
CREATE POLICY "public_projects_visible_to_all"
  ON public.projects FOR SELECT
  USING (is_public = TRUE);

-- Usuários podem ver seus próprios projetos
CREATE POLICY "users_can_view_own_projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar projetos (autenticados)
CREATE POLICY "authenticated_users_can_create_projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir criação de projetos anônimos (user_id = null)
CREATE POLICY "allow_anonymous_project_creation"
  ON public.projects FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Usuários podem atualizar seus próprios projetos
CREATE POLICY "users_can_update_own_projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Projetos públicos com edição permitida podem ser atualizados por qualquer um
CREATE POLICY "public_editable_projects_can_be_updated"
  ON public.projects FOR UPDATE
  USING (is_public = TRUE AND allow_edits = TRUE);

-- Usuários podem deletar seus próprios projetos
CREATE POLICY "users_can_delete_own_projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para versões de projetos
-- Usuários podem ver versões de projetos que eles podem ver
CREATE POLICY "versions_visible_based_on_project"
  ON public.project_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_versions.project_id 
      AND (is_public = TRUE OR auth.uid() = user_id)
    )
  );

-- Usuários podem criar versões de projetos que possuem
CREATE POLICY "users_can_create_versions_of_own_projects"
  ON public.project_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_versions.project_id 
      AND auth.uid() = user_id
    )
  );

-- Usuários podem deletar versões de projetos que possuem
CREATE POLICY "users_can_delete_versions_of_own_projects"
  ON public.project_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_versions.project_id 
      AND auth.uid() = user_id
    )
  );

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(base_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Converter título para slug
  base_slug := LOWER(TRIM(REGEXP_REPLACE(base_title, '[^a-zA-Z0-9\s]', '', 'g')));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := TRIM(base_slug, '-');
  
  -- Se o slug estiver vazio, usar um padrão
  IF base_slug = '' THEN
    base_slug := 'projeto';
  END IF;
  
  final_slug := base_slug;
  
  -- Verificar se o slug já existe e adicionar número se necessário
  WHILE EXISTS (SELECT 1 FROM public.projects WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Função para broadcast de mudanças em tempo real
-- OTIMIZADA: Envia apenas metadados para evitar erro de payload (limite 8KB)
CREATE OR REPLACE FUNCTION broadcast_project_change()
RETURNS TRIGGER AS $$
DECLARE
  payload_data JSON;
BEGIN
  -- Enviar apenas metadados essenciais, não o código completo
  -- Isso evita o erro "payload string too long" ao trabalhar com projetos grandes
  IF TG_OP = 'DELETE' THEN
    payload_data := NULL;
  ELSE
    payload_data := json_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'type', NEW.type,
      'is_public', NEW.is_public,
      'allow_edits', NEW.allow_edits,
      'updated_at', NEW.updated_at
    );
  END IF;
  
  -- Enviar notificação para o canal do projeto
  PERFORM pg_notify(
    'project_' || COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    json_build_object(
      'type', TG_OP,
      'project_id', COALESCE(NEW.id, OLD.id),
      'data', payload_data
    )::TEXT
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para broadcast
DROP TRIGGER IF EXISTS project_change_trigger ON public.projects;
CREATE TRIGGER project_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION broadcast_project_change();

-- Comentários para documentação
COMMENT ON TABLE public.projects IS 'Tabela principal de projetos - suporta JavaScript Puro e Web Completo';
COMMENT ON TABLE public.project_versions IS 'Versões salvas dos projetos (save points)';
COMMENT ON COLUMN public.projects.type IS 'Tipo do projeto: javascript (apenas JS) ou web_complete (HTML+CSS+JS)';
COMMENT ON COLUMN public.projects.is_public IS 'Se TRUE, qualquer pessoa pode visualizar o projeto';
COMMENT ON COLUMN public.projects.allow_edits IS 'Se TRUE e is_public=TRUE, permite edição colaborativa';
COMMENT ON COLUMN public.project_versions.label IS 'Nome opcional da versão (ex: "Checkpoint 1")';

-- Inserir projetos de exemplo
INSERT INTO public.projects (slug, name, type, description, js_code, is_public, allow_edits, user_id)
VALUES (
  'exemplo-hello-world-js',
  'Exemplo: Hello World JavaScript',
  'javascript',
  'Exemplo básico de JavaScript com console.log',
  'console.log("Olá, mundo!");
console.log("Bem-vindo ao Editor JavaScript!");

// Exemplo de função
function somar(a, b) {
  return a + b;
}

console.log("2 + 3 =", somar(2, 3));',
  TRUE,
  FALSE,
  NULL
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.projects (slug, name, type, description, html_code, css_code, js_web_code, is_public, allow_edits, user_id)
VALUES (
  'exemplo-hello-world-web',
  'Exemplo: Hello World Web',
  'web_complete',
  'Exemplo básico de página web com HTML, CSS e JavaScript',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
</head>
<body>
  <div class="container">
    <h1>Olá, Mundo!</h1>
    <p>Bem-vindo ao editor web!</p>
    <button id="btn-click">Clique aqui</button>
    <p id="contador">Cliques: 0</p>
  </div>
</body>
</html>',
  'body {
  margin: 0;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

h1 {
  font-size: 3rem;
  margin: 0 0 20px 0;
}

button {
  background: white;
  color: #667eea;
  border: none;
  padding: 15px 30px;
  font-size: 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 20px;
}

button:hover {
  transform: scale(1.05);
}

#contador {
  font-size: 1.5rem;
  margin-top: 20px;
}',
  'let cliques = 0;

document.getElementById("btn-click").addEventListener("click", function() {
  cliques++;
  document.getElementById("contador").textContent = "Cliques: " + cliques;
});',
  TRUE,
  FALSE,
  NULL
) ON CONFLICT (slug) DO NOTHING;

-- Script de migração de projetos antigos (se necessário)
-- Descomente e ajuste conforme necessário se você já tem projetos
/*
-- Migrar projetos existentes da estrutura antiga
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE public.projects SET name = title WHERE name IS NULL;
ALTER TABLE public.projects ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS type project_type DEFAULT 'javascript';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS js_code TEXT;
UPDATE public.projects SET js_code = code WHERE type = 'javascript' AND js_code IS NULL;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
UPDATE public.projects SET is_public = (visibility = 'public') WHERE is_public IS NULL;

-- Remover colunas antigas (cuidado!)
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS title;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS code;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS visibility;
*/

