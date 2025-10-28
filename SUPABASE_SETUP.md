# 🔧 Guia de Configuração do Supabase

Este guia te ajudará a configurar o Supabase para o LAB365 CodeLab Editor.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Acesso ao painel de administração do Supabase

## 🚀 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **"New Project"**
3. Preencha os dados:
   - **Name**: `codelab-editor` (ou nome de sua escolha)
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)
4. Clique em **"Create new project"**
5. Aguarde a criação (pode levar alguns minutos)

### 2. Obter Credenciais

1. No painel do projeto, vá em **Settings** → **API**
2. Copie as seguintes informações:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (opcional, mas recomendado)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Configurar Banco de Dados

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **"New Query"**
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor SQL
5. Clique em **"Run"** para executar

### 4. Verificar Configuração

Após executar o schema, verifique se as tabelas foram criadas:

1. Vá em **Table Editor**
2. Você deve ver as tabelas:
   - `projects`
   - `project_versions`

### 5. Configurar Autenticação (Opcional)

Se quiser usar autenticação de usuários:

1. Vá em **Authentication** → **Settings**
2. Configure as opções desejadas:
   - **Site URL**: `http://localhost:3000` (desenvolvimento)
   - **Redirect URLs**: Adicione URLs de redirecionamento
3. Em **Providers**, configure:
   - **Email**: Ative para login por email
   - **Google/GitHub**: Configure se desejar

### 6. Ativar Realtime (Opcional)

Para funcionalidades de tempo real:

1. Vá em **Database** → **Replication**
2. Ative a replicação para as tabelas:
   - `projects`
   - `project_versions`

## 🔐 Configuração de Segurança

### Row Level Security (RLS)

O schema já inclui políticas RLS configuradas:

- **Projetos públicos**: Visíveis para todos
- **Projetos unlisted**: Visíveis apenas para usuários autenticados
- **Projetos privados**: Visíveis apenas para o dono
- **Criação**: Usuários podem criar projetos
- **Atualização/Exclusão**: Apenas o dono pode modificar

### Políticas Incluídas

```sql
-- Projetos públicos visíveis para todos
CREATE POLICY "Projetos públicos são visíveis para todos"
  ON public.projects FOR SELECT
  USING (visibility = 'public');

-- Usuários podem ver seus próprios projetos
CREATE POLICY "Usuários podem ver seus próprios projetos"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

-- E mais políticas...
```

## 🧪 Testando a Configuração

### 1. Teste de Conexão

Crie um arquivo `.env.local` com suas credenciais:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### 2. Executar o Projeto

```bash
npm run dev
```

### 3. Verificar Funcionalidades

- ✅ Editor carrega sem erros
- ✅ Console funciona
- ✅ Salvamento funciona
- ✅ Compartilhamento funciona
- ✅ Autenticação funciona (se configurada)

## 🚨 Solução de Problemas

### Erro: "Supabase não está configurado"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique se o arquivo `.env.local` existe
2. Confirme se as variáveis estão corretas
3. Reinicie o servidor de desenvolvimento

### Erro: "Invalid API key"

**Causa**: Chave da API incorreta

**Solução**:
1. Verifique se copiou a chave correta
2. Confirme se não há espaços extras
3. Regenerar a chave no painel do Supabase

### Erro: "Table doesn't exist"

**Causa**: Schema não foi executado

**Solução**:
1. Execute o arquivo `supabase-schema.sql` no SQL Editor
2. Verifique se as tabelas foram criadas
3. Confirme as permissões RLS

### Erro: "RLS policy violation"

**Causa**: Política de segurança bloqueando operação

**Solução**:
1. Verifique se o usuário está autenticado
2. Confirme se o projeto pertence ao usuário
3. Verifique as políticas RLS

## 📊 Monitoramento

### Logs do Supabase

1. Vá em **Logs** no painel
2. Monitore:
   - **API Logs**: Requisições à API
   - **Auth Logs**: Tentativas de autenticação
   - **Database Logs**: Queries SQL

### Métricas

1. Vá em **Reports** no painel
2. Monitore:
   - **API Usage**: Uso da API
   - **Database Size**: Tamanho do banco
   - **Auth Users**: Usuários registrados

## 🔄 Backup e Restauração

### Backup Automático

O Supabase faz backup automático diário. Para backup manual:

1. Vá em **Settings** → **Database**
2. Clique em **"Backup"**
3. Baixe o arquivo SQL

### Restauração

1. Vá em **SQL Editor**
2. Cole o conteúdo do backup
3. Execute o script

## 📈 Otimizações

### Índices

O schema já inclui índices otimizados:

```sql
-- Índices para performance
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_visibility ON public.projects(visibility);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);
```

### Configurações Recomendadas

1. **Connection Pooling**: Ative no painel
2. **Database Extensions**: Instale se necessário
3. **Edge Functions**: Para funcionalidades avançadas

## 🆘 Suporte

- **Documentação Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Comunidade**: [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

---

**Configuração concluída! 🎉** Seu editor está pronto para uso.

