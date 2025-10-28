# 🔧 Correção dos Erros de Migração do Banco de Dados

## Problemas Identificados

O banco de dados ainda está usando a estrutura antiga, causando múltiplos erros:

**Erro 1:**
```
Erro ao criar projeto: null value in column "title" of relation "projects" violates not-null constraint
```

**Erro 2:**
```
Erro ao criar projeto: null value in column "code" of relation "projects" violates not-null constraint
```

## Causa Raiz

A aplicação foi completamente refatorada para a nova estrutura de projetos:
- `title` → `name` (nome do projeto)
- `code` → `js_code`, `html_code`, `css_code`, `js_web_code` (código separado por tipo)
- Adicionou suporte para dois tipos de projetos: `javascript` e `web_complete`

Mas o banco de dados Supabase não foi migrado para acompanhar essas mudanças.

## Solução

### Opção 1: Executar Script de Migração Completa (Recomendado) ⭐

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Abra o arquivo `migration-fix-title-to-name.sql` criado no projeto
4. Copie e cole **TODO o conteúdo** do script no SQL Editor
5. Clique em **Run** para executar

O script irá fazer a migração completa em 6 partes:

**Parte 1: Migrar coluna `title` → `name`**
- ✅ Adicionar coluna `name`
- ✅ Copiar dados de `title` para `name`
- ✅ Tornar `name` obrigatória (NOT NULL)

**Parte 2: Migrar coluna `code` → `js_code/html_code`**
- ✅ Adicionar colunas `js_code`, `html_code`, `css_code`, `js_web_code`
- ✅ Copiar dados de `code` para `js_code`

**Parte 3: Adicionar coluna `type`**
- ✅ Criar enum `project_type` (javascript, web_complete)
- ✅ Adicionar coluna `type` com valor padrão
- ✅ Tornar `type` obrigatória

**Parte 4: Atualizar constraints**
- ✅ Remover constraints antigas da coluna `code`
- ✅ Adicionar novas constraints de validação
- ✅ Garantir que projetos JavaScript tenham `js_code`
- ✅ Garantir que projetos Web tenham `html_code`

**Parte 5: Remover colunas antigas**
- ✅ Remover coluna `title`
- ✅ Remover coluna `code`

**Parte 6: Verificação**
- ✅ Mostrar estrutura final da tabela

### Opção 2: Recriar a Tabela (Se não houver dados importantes)

Se você não tem projetos importantes salvos, pode recriar a tabela do zero:

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute:
```sql
-- Deletar tabela antiga (CUIDADO: Isso apaga todos os dados!)
DROP TABLE IF EXISTS public.project_versions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TYPE IF EXISTS project_type;
```

4. Depois execute todo o conteúdo do arquivo `supabase-schema-refactor.sql`

## Verificação

Após executar a migração, teste criando um novo projeto no dashboard. O erro não deve mais aparecer.

## Prevenção

Para evitar este problema no futuro:
- Sempre execute os scripts de migração quando atualizar a estrutura do banco
- Mantenha sincronizado o schema do banco com os tipos TypeScript
- Use o arquivo `supabase-schema-refactor.sql` como referência da estrutura atual

## Arquivos Relacionados

- `migration-fix-title-to-name.sql` - Script de correção
- `supabase-schema-refactor.sql` - Schema completo atualizado
- `src/types/project.ts` - Tipos TypeScript do projeto
- `src/lib/projeto-service.ts` - Service que interage com o banco

