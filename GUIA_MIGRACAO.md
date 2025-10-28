# 📦 Guia de Migração - Projetos Antigos para Novo Sistema

## 🎯 Objetivo

Este guia ajuda a migrar projetos existentes do sistema antigo (apenas JavaScript) para o novo sistema multi-tipo (JavaScript Puro + Web Completo).

---

## ⚠️ Antes de Começar

**IMPORTANTE:** Faça backup do seu banco de dados antes de executar qualquer script de migração!

```bash
# No Supabase Dashboard
# Vá em Database > Backups > Create Backup
```

---

## 🔄 Cenários de Migração

### Cenário 1: Banco de Dados Vazio (Novo Projeto)

Se você está começando do zero:

1. Execute o script completo:
   ```sql
   -- Execute todo o arquivo
   supabase-schema-refactor.sql
   ```

2. Pronto! Seu banco está configurado com:
   - Tabelas novas
   - Políticas RLS
   - Projetos de exemplo

---

### Cenário 2: Já Tenho Projetos (Migração)

Se você já tem projetos no sistema antigo, siga os passos:

#### Passo 1: Backup dos Projetos Antigos

```sql
-- Criar tabela de backup
CREATE TABLE projects_backup AS 
SELECT * FROM projects;
```

#### Passo 2: Adicionar Novas Colunas

**⚠️ IMPORTANTE:** Desabilite o trigger de broadcast antes de migrar para evitar erro de payload!

```sql
-- 1. DESABILITAR O TRIGGER temporariamente
ALTER TABLE projects DISABLE TRIGGER project_change_trigger;

-- 2. Adicionar coluna 'name' (se ainda for 'title')
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE projects 
SET name = title 
WHERE name IS NULL;

ALTER TABLE projects 
ALTER COLUMN name SET NOT NULL;

-- 3. Criar tipo enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
    CREATE TYPE project_type AS ENUM ('javascript', 'web_complete');
  END IF;
END $$;

-- 4. Adicionar coluna 'type'
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS type project_type DEFAULT 'javascript';

-- 5. Adicionar coluna 'description'
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 6. Adicionar coluna 'js_code'
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS js_code TEXT;

-- 7. Migrar código existente para js_code
UPDATE projects 
SET js_code = code 
WHERE js_code IS NULL AND code IS NOT NULL;

-- 8. Adicionar colunas para Web Completo
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS html_code TEXT,
ADD COLUMN IF NOT EXISTS css_code TEXT,
ADD COLUMN IF NOT EXISTS js_web_code TEXT;

-- 9. Adicionar coluna 'is_public'
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- 10. Migrar 'visibility' para 'is_public'
UPDATE projects 
SET is_public = (visibility = 'public') 
WHERE is_public IS NULL;

-- 11. REABILITAR O TRIGGER
ALTER TABLE projects ENABLE TRIGGER project_change_trigger;

-- 12. Verificar a migração
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE name IS NOT NULL) as com_nome,
  COUNT(*) FILTER (WHERE type IS NOT NULL) as com_tipo,
  COUNT(*) FILTER (WHERE js_code IS NOT NULL) as com_codigo
FROM projects;
```

#### Passo 3: Remover Colunas Antigas (CUIDADO!)

**⚠️ Só execute isso depois de confirmar que a migração funcionou!**

```sql
-- Opcional: Remover colunas antigas
ALTER TABLE projects DROP COLUMN IF EXISTS title;
ALTER TABLE projects DROP COLUMN IF EXISTS code;
ALTER TABLE projects DROP COLUMN IF EXISTS visibility;
```

#### Passo 4: Otimizar Função de Broadcast (Opcional mas Recomendado)

A função original pode causar erro de payload ao enviar projetos grandes. Atualize para enviar apenas metadados:

```sql
-- Função otimizada que envia apenas metadados (não o código completo)
CREATE OR REPLACE FUNCTION broadcast_project_change()
RETURNS TRIGGER AS $$
DECLARE
  payload_data JSON;
BEGIN
  -- Enviar apenas metadados essenciais, não o código completo
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
```

**Por quê?** O PostgreSQL tem limite de 8KB para payloads do `pg_notify`. Projetos com muito código HTML/CSS/JS ultrapassam esse limite.

#### Passo 5: Atualizar Políticas RLS

Execute as políticas do arquivo `supabase-schema-refactor.sql`:

```sql
-- Dropar políticas antigas
DROP POLICY IF EXISTS "Projetos públicos são visíveis para todos" ON public.projects;
DROP POLICY IF EXISTS "Projetos unlisted são visíveis para usuários autenticados" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios projetos" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem criar projetos" ON public.projects;
DROP POLICY IF EXISTS "Permitir criação de projetos anônimos" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios projetos" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios projetos" ON public.projects;

-- Criar novas políticas
CREATE POLICY "public_projects_visible_to_all" ON public.projects
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "users_can_view_own_projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_can_create_projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_anonymous_project_creation" ON public.projects
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "users_can_update_own_projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "public_editable_projects_can_be_updated" ON public.projects
  FOR UPDATE USING (is_public = TRUE AND allow_edits = TRUE);

CREATE POLICY "users_can_delete_own_projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 🧪 Validação da Migração

Execute estas queries para validar:

```sql
-- 1. Verificar se todos os projetos têm tipo
SELECT COUNT(*) as total,
       COUNT(*) FILTER (WHERE type IS NOT NULL) as com_tipo
FROM projects;

-- 2. Verificar se projetos JavaScript têm código
SELECT COUNT(*) as js_projects,
       COUNT(*) FILTER (WHERE js_code IS NOT NULL) as com_codigo
FROM projects
WHERE type = 'javascript';

-- 3. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 4. Testar políticas RLS
SELECT id, name, type, is_public 
FROM projects 
LIMIT 5;
```

---

## 🔧 Troubleshooting

### ❌ Erro: "payload string too long"

**Causa:** O trigger `broadcast_project_change()` tenta enviar o projeto inteiro (com código) via `pg_notify`, mas o limite é 8KB.

**Solução:**
```sql
-- Opção 1: Desabilitar trigger durante migração
ALTER TABLE projects DISABLE TRIGGER project_change_trigger;
-- ... execute suas migrations ...
ALTER TABLE projects ENABLE TRIGGER project_change_trigger;

-- Opção 2: Atualizar função para enviar apenas metadados
-- (veja Passo 4 do guia)
```

### ❌ Erro: "column 'code' does not exist"

Você já migrou mas o código ainda está tentando usar a coluna antiga. Verifique:

1. Certifique-se de que atualizou `src/lib/projeto-service.ts`
2. Reinicie o servidor de desenvolvimento
3. Limpe o cache: `npm run build`

### ❌ Erro: "type 'project_type' already exists"

O tipo já foi criado. Não é um problema, pode ignorar ou use:
```sql
DROP TYPE IF EXISTS project_type CASCADE;
CREATE TYPE project_type AS ENUM ('javascript', 'web_complete');
```

### ❌ Erro: RLS Policy Conflict

```sql
-- Listar todas as políticas
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'projects';

-- Dropar todas as políticas antigas
DROP POLICY IF EXISTS "<nome_da_politica>" ON public.projects;
```

### ❌ Erro: "trigger does not exist"

Se o trigger não existe ainda, ignore o erro ao tentar desabilitá-lo:
```sql
ALTER TABLE projects DISABLE TRIGGER IF EXISTS project_change_trigger;
```

---

## 📊 Script Completo de Migração

```sql
-- SCRIPT COMPLETO DE MIGRAÇÃO
-- ⚠️ IMPORTANTE: Execute dentro de uma transação para poder reverter se necessário

BEGIN;

-- 1. Backup dos dados originais
CREATE TABLE projects_backup AS SELECT * FROM projects;

-- 2. Desabilitar trigger para evitar erro de payload
ALTER TABLE projects DISABLE TRIGGER project_change_trigger;

-- 3. Criar tipo enum (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
    CREATE TYPE project_type AS ENUM ('javascript', 'web_complete');
  END IF;
END $$;

-- 4. Adicionar novas colunas
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS type project_type DEFAULT 'javascript',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS js_code TEXT,
ADD COLUMN IF NOT EXISTS html_code TEXT,
ADD COLUMN IF NOT EXISTS css_code TEXT,
ADD COLUMN IF NOT EXISTS js_web_code TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- 5. Migrar dados existentes
UPDATE projects SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE projects SET js_code = code WHERE js_code IS NULL AND code IS NOT NULL;
UPDATE projects SET is_public = (visibility = 'public') WHERE is_public IS NULL;

-- 6. Tornar 'name' obrigatório
ALTER TABLE projects ALTER COLUMN name SET NOT NULL;

-- 7. Otimizar função de broadcast (enviar apenas metadados)
CREATE OR REPLACE FUNCTION broadcast_project_change()
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
      'type', NEW.type,
      'is_public', NEW.is_public,
      'allow_edits', NEW.allow_edits,
      'updated_at', NEW.updated_at
    );
  END IF;
  
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

-- 8. Reabilitar trigger
ALTER TABLE projects ENABLE TRIGGER project_change_trigger;

-- 9. Verificar migração
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE name IS NOT NULL) as com_nome,
  COUNT(*) FILTER (WHERE type IS NOT NULL) as com_tipo,
  COUNT(*) FILTER (WHERE js_code IS NOT NULL) as com_codigo
FROM projects;

-- ✅ Se tudo estiver OK, faça COMMIT
-- ❌ Se houver problemas, faça ROLLBACK

-- COMMIT;  -- Descomente para confirmar
-- ROLLBACK;  -- Descomente para reverter
```

**💡 Dica:** Execute a query de verificação (passo 9) antes de fazer COMMIT. Se os números estiverem corretos, faça o COMMIT. Caso contrário, faça ROLLBACK.

---

## ✅ Checklist Pós-Migração

- [ ] Todos os projetos têm `name`
- [ ] Todos os projetos têm `type` = 'javascript'
- [ ] Todos os projetos têm `js_code` (migrado de `code`)
- [ ] Políticas RLS funcionando
- [ ] Consegue criar novo projeto JavaScript
- [ ] Consegue criar novo projeto Web Completo
- [ ] Consegue editar projetos antigos
- [ ] Consegue deletar projetos
- [ ] Auto-save funcionando
- [ ] Compartilhamento funcionando

---

## 🆘 Suporte

Se encontrar problemas:

1. **Reverta a migração:**
   ```sql
   DROP TABLE projects;
   ALTER TABLE projects_backup RENAME TO projects;
   ```

2. **Peça ajuda:**
   - Verifique os logs do Supabase
   - Revise o arquivo `supabase-schema-refactor.sql`
   - Consulte `REFATORACAO_COMPLETA.md`

---

## 🎉 Conclusão

Após a migração bem-sucedida, você terá:

✅ Sistema multi-tipo funcionando  
✅ Projetos antigos preservados  
✅ Capacidade de criar projetos Web Completo  
✅ Todas as novas funcionalidades disponíveis  

**Boa sorte!** 🚀

