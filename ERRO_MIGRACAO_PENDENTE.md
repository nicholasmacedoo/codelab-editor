# ⚠️ Erro: Migração Pendente

## 🔴 Problema Detectado

Você está tentando usar o código refatorado, mas **o banco de dados ainda está no schema antigo**!

### Erros Comuns:

```
❌ null value in column "title" of relation "projects" violates not-null constraint
❌ Projeto com ID xxx não encontrado
❌ column "name" does not exist
```

## 🎯 Causa

O código está usando a **estrutura nova** (colunas: `name`, `type`, `js_code`, etc.), mas o banco de dados ainda tem a **estrutura antiga** (colunas: `title`, `code`, `visibility`).

## ✅ Solução: Execute a Migração!

### Opção 1: Banco de Dados NOVO (Recomendado)

Se você está começando do zero ou pode recriar o banco:

```sql
-- No SQL Editor do Supabase
-- Execute o arquivo completo:
supabase-schema-refactor.sql
```

Isso criará todas as tabelas, triggers e políticas do zero.

### Opção 2: Banco de Dados com Projetos ANTIGOS

Se você já tem projetos salvos e quer migrar:

1. **Faça backup:**
   ```sql
   CREATE TABLE projects_backup AS SELECT * FROM projects;
   ```

2. **Execute a migração:**
   
   Siga o guia passo a passo em: **`GUIA_MIGRACAO.md`**
   
   Ou use o script completo (seção "Script Completo de Migração")

### Opção 3: Script Rápido (Se não tem projetos importantes)

```sql
-- 1. Dropar tabela antiga
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS project_versions CASCADE;

-- 2. Executar o schema novo
-- Cole e execute todo o conteúdo de: supabase-schema-refactor.sql
```

## 🔍 Como Verificar se a Migração Foi Bem-Sucedida

Execute no SQL Editor:

```sql
-- Verificar se as colunas novas existem
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

**Deve ter essas colunas:**
- ✅ `name` (TEXT)
- ✅ `type` (project_type)
- ✅ `js_code` (TEXT)
- ✅ `html_code` (TEXT)
- ✅ `css_code` (TEXT)
- ✅ `js_web_code` (TEXT)
- ✅ `is_public` (BOOLEAN)

**NÃO deve ter (ou são opcionais):**
- ❌ `title` (deve ser migrada para `name`)
- ❌ `code` (deve ser migrada para `js_code`)
- ❌ `visibility` (deve ser migrada para `is_public`)

## 🚀 Depois da Migração

1. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Teste criar um projeto:**
   - Acesse `/dashboard`
   - Clique em "Novo Projeto"
   - Crie um projeto JavaScript Puro ou Web Completo

3. **Verifique no banco:**
   ```sql
   SELECT id, name, type FROM projects ORDER BY created_at DESC LIMIT 5;
   ```

## 📚 Documentação Relacionada

- **GUIA_MIGRACAO.md** - Guia completo de migração passo a passo
- **supabase-schema-refactor.sql** - Schema novo do banco
- **REFATORACAO_COMPLETA.md** - Documentação da refatoração

## 💡 Dica

Se você está em **desenvolvimento** e não tem dados importantes, é mais rápido:

1. Dropar as tabelas antigas
2. Executar o `supabase-schema-refactor.sql` completo
3. Recomeçar

Se você está em **produção** com dados reais:

1. SEMPRE faça backup
2. Siga o `GUIA_MIGRACAO.md` cuidadosamente
3. Execute dentro de uma transação (BEGIN/COMMIT/ROLLBACK)

---

**Após resolver, este arquivo pode ser deletado!** ✨


