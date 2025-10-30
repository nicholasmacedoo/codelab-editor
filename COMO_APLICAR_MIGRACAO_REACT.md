# 🚀 Como Aplicar a Migração React no Supabase

Este guia explica como aplicar a migração para habilitar projetos React no seu banco de dados Supabase.

## ⚠️ Erro Atual

Se você está vendo este erro:

```
Erro ao criar projeto: invalid input value for enum project_type: "react"
```

Significa que o enum `project_type` no banco de dados ainda não possui o valor `"react"`.

## 📋 Passo a Passo

### 1. Acesse o SQL Editor do Supabase

1. Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor** (no menu lateral)
4. Clique em **New Query**

### 2. Copie e Cole a Migração

1. Abra o arquivo `migration-add-react-support.sql` neste projeto
2. Copie **TODO o conteúdo** do arquivo
3. Cole no editor SQL do Supabase

### 3. Execute a Migração

1. Clique no botão **Run** (ou pressione `Ctrl/Cmd + Enter`)
2. Aguarde a execução (deve levar alguns segundos)
3. Você verá mensagens como:
   - `Valor 'react' adicionado ao enum project_type`
   - `Constraint valid_project_type criada`
   - E outras confirmações

### 4. Verifique se Funcionou

Execute esta query para verificar:

```sql
SELECT unnest(enum_range(NULL::project_type)) AS project_types;
```

Você deve ver:
- `javascript`
- `web_complete`
- `react` ✅

### 5. Teste no Aplicativo

1. Volte para sua aplicação
2. Tente criar um novo projeto do tipo "React"
3. O erro deve ter desaparecido! 🎉

## 🔄 Se a Migração Falhar

Se você ver algum erro durante a execução:

### Erro: "enum already exists"

Isso significa que o valor `react` já foi adicionado ao enum. Isso é bom! Continue executando o resto do script.

### Erro: "constraint already exists"

Isso significa que a constraint já existe. Você pode remover manualmente esta linha do script e executar novamente:

```sql
-- Comente ou remova esta linha:
-- ALTER TABLE public.projects ADD CONSTRAINT valid_project_type ...
```

### Erro: "table already exists"

A tabela `react_files` já foi criada. Continue com o resto do script normalmente.

## 📊 O Que Esta Migração Faz?

1. ✅ Adiciona `'react'` ao enum `project_type`
2. ✅ Adiciona coluna `react_dependencies` na tabela `projects`
3. ✅ Remove constraints antigas que impediam projetos React
4. ✅ Cria nova constraint que permite projetos React
5. ✅ Cria tabela `react_files` para armazenar arquivos React
6. ✅ Configura índices para performance
7. ✅ Configura triggers para atualizar timestamps
8. ✅ Configura RLS (Row Level Security) para segurança
9. ✅ Configura policies para acesso aos arquivos
10. ✅ Configura broadcast em tempo real

## 🆘 Ainda Com Problemas?

Se após aplicar a migração o erro continuar:

1. Verifique se o script foi executado completamente
2. Verifique os logs no Supabase (SQL Editor → Logs)
3. Tente fazer logout e login novamente na aplicação
4. Limpe o cache do navegador

---

**Depois de aplicar a migração, você poderá criar projetos React! 🚀**

