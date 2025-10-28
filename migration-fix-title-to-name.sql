-- Migração Completa: Estrutura Antiga -> Nova Estrutura
-- Execute este script no SQL Editor do Supabase

-- ====================================================================
-- PARTE 1: MIGRAR COLUNA TITLE PARA NAME
-- ====================================================================

-- Passo 1.1: Verificar se a coluna 'name' existe, se não, adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN name TEXT;
    RAISE NOTICE 'Coluna name adicionada';
  ELSE
    RAISE NOTICE 'Coluna name já existe';
  END IF;
END $$;

-- Passo 1.2: Migrar dados de title para name (se title existir)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'title'
  ) THEN
    -- Copiar dados de title para name onde name está vazio
    UPDATE public.projects SET name = title WHERE name IS NULL OR name = '';
    RAISE NOTICE 'Dados migrados de title para name';
  ELSE
    RAISE NOTICE 'Coluna title não existe, nada a migrar';
  END IF;
END $$;

-- Passo 1.3: Tornar a coluna name obrigatória (NOT NULL)
DO $$ 
BEGIN
  -- Primeiro garantir que não há valores NULL
  UPDATE public.projects SET name = 'Projeto Sem Nome' WHERE name IS NULL OR name = '';
  
  ALTER TABLE public.projects ALTER COLUMN name SET NOT NULL;
  RAISE NOTICE 'Coluna name agora é NOT NULL';
END $$;

-- ====================================================================
-- PARTE 2: MIGRAR COLUNA CODE PARA JS_CODE/HTML_CODE
-- ====================================================================

-- Passo 2.1: Adicionar novas colunas de código se não existirem
DO $$ 
BEGIN
  -- Adicionar js_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'js_code'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN js_code TEXT;
    RAISE NOTICE 'Coluna js_code adicionada';
  END IF;

  -- Adicionar html_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'html_code'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN html_code TEXT;
    RAISE NOTICE 'Coluna html_code adicionada';
  END IF;

  -- Adicionar css_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'css_code'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN css_code TEXT;
    RAISE NOTICE 'Coluna css_code adicionada';
  END IF;

  -- Adicionar js_web_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'js_web_code'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN js_web_code TEXT;
    RAISE NOTICE 'Coluna js_web_code adicionada';
  END IF;
END $$;

-- Passo 2.2: Migrar dados de code para js_code (assumindo que projetos antigos são JavaScript)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'code'
  ) THEN
    -- Copiar code para js_code onde js_code está vazio
    UPDATE public.projects 
    SET js_code = code 
    WHERE (js_code IS NULL OR js_code = '') AND code IS NOT NULL;
    
    RAISE NOTICE 'Dados migrados de code para js_code';
  ELSE
    RAISE NOTICE 'Coluna code não existe, nada a migrar';
  END IF;
END $$;

-- ====================================================================
-- PARTE 3: ADICIONAR/ATUALIZAR COLUNA TYPE
-- ====================================================================

-- Passo 3.1: Criar enum project_type se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
    CREATE TYPE project_type AS ENUM ('javascript', 'web_complete');
    RAISE NOTICE 'Enum project_type criado';
  ELSE
    RAISE NOTICE 'Enum project_type já existe';
  END IF;
END $$;

-- Passo 3.2: Adicionar coluna type se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN type project_type DEFAULT 'javascript';
    RAISE NOTICE 'Coluna type adicionada';
  END IF;
END $$;

-- Passo 3.3: Garantir que todos os projetos tenham um tipo
UPDATE public.projects 
SET type = 'javascript' 
WHERE type IS NULL;

-- Passo 3.4: Tornar type obrigatório
ALTER TABLE public.projects ALTER COLUMN type SET NOT NULL;
ALTER TABLE public.projects ALTER COLUMN type SET DEFAULT 'javascript';

-- ====================================================================
-- PARTE 4: REMOVER CONSTRAINT ANTIGA DE code E ADICIONAR NOVAS
-- ====================================================================

-- Passo 4.1: Remover constraints antigas se existirem
DO $$ 
BEGIN
  -- Remover constraint de code se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_code_check' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE public.projects DROP CONSTRAINT projects_code_check;
    RAISE NOTICE 'Constraint antiga projects_code_check removida';
  END IF;
END $$;

-- Passo 4.2: Remover NOT NULL de code antes de deletar
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'code'
  ) THEN
    ALTER TABLE public.projects ALTER COLUMN code DROP NOT NULL;
    RAISE NOTICE 'NOT NULL removido da coluna code';
  END IF;
END $$;

-- Passo 4.3: Adicionar constraints para validar projetos
DO $$ 
BEGIN
  -- Constraint para projetos JavaScript
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_javascript_project'
  ) THEN
    ALTER TABLE public.projects ADD CONSTRAINT valid_javascript_project 
    CHECK (type != 'javascript' OR js_code IS NOT NULL);
    RAISE NOTICE 'Constraint valid_javascript_project adicionada';
  END IF;

  -- Constraint para projetos Web
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_web_project'
  ) THEN
    ALTER TABLE public.projects ADD CONSTRAINT valid_web_project 
    CHECK (type != 'web_complete' OR html_code IS NOT NULL);
    RAISE NOTICE 'Constraint valid_web_project adicionada';
  END IF;
END $$;

-- ====================================================================
-- PARTE 5: REMOVER COLUNAS ANTIGAS
-- ====================================================================

-- Passo 5.1: Remover coluna title
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.projects DROP COLUMN title;
    RAISE NOTICE 'Coluna title removida';
  END IF;
END $$;

-- Passo 5.2: Remover coluna code
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'code'
  ) THEN
    ALTER TABLE public.projects DROP COLUMN code;
    RAISE NOTICE 'Coluna code removida';
  END IF;
END $$;

-- ====================================================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- ====================================================================

-- Verificar estrutura final da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
ORDER BY ordinal_position;

