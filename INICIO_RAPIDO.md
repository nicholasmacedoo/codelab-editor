# 🚀 Início Rápido - 5 Minutos

Guia rápido para colocar a IDE funcionando em 5 minutos!

## ⚡ Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)

## 📋 Passo a Passo

### 1. Clone e Instale

```bash
git clone <seu-repositorio>
cd codelab-editor
npm install
```

### 2. Configure as Variáveis de Ambiente

```bash
cp env.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 3. Configure o Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto
3. Copie as credenciais de **Settings > API**
4. Vá em **SQL Editor**
5. **IMPORTANTE:** Execute este script:

```sql
-- Cole e execute TODO o conteúdo do arquivo:
supabase-schema-refactor.sql
```

> ⚠️ **Atenção:** Se você vir erros sobre "title" ou "code", significa que ainda tem o schema antigo. Veja o arquivo `ERRO_MIGRACAO_PENDENTE.md`

### 4. Inicie o Servidor

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## ✅ Teste Rápido

1. Você será redirecionado para `/dashboard`
2. Clique em **"Novo Projeto"** (ou pressione `Cmd/Ctrl + N`)
3. Escolha **"JavaScript Puro"**
4. Digite:
   ```javascript
   console.log("Olá, mundo!");
   ```
5. Clique em **"Executar"**
6. Veja o resultado no console! 🎉

## 🐛 Problemas Comuns

### Erro: "column 'title' violates not-null constraint"

**Causa:** Schema antigo no banco.

**Solução:** Execute o `supabase-schema-refactor.sql` completo no SQL Editor.

### Erro: "Supabase não está configurado"

**Causa:** Variáveis de ambiente faltando ou incorretas.

**Solução:** Verifique o `.env.local` e reinicie o servidor.

### Nada acontece ao criar projeto

**Causa:** RLS (Row Level Security) bloqueando.

**Solução:** Verifique se executou TODAS as políticas do schema.

## 📚 Próximos Passos

- **README.md** - Documentação completa
- **REFATORACAO_COMPLETA.md** - Guia detalhado das funcionalidades
- **GUIA_MIGRACAO.md** - Se você tem projetos antigos

## 🎯 Recursos

### Criar Projetos
- Pressione `Cmd/Ctrl + N` para novo projeto
- Escolha entre **JavaScript Puro** ou **Web Completo**

### Buscar Projetos
- Pressione `Cmd/Ctrl + K` para busca rápida
- Digite para filtrar instantaneamente

### Editar Projetos
- **JavaScript:** Editor Monaco + Console
- **Web:** Tabs HTML/CSS/JS + Preview ao vivo

### Compartilhar
- Clique em "Compartilhar" no editor
- Configure público/privado
- Link copiado automaticamente

## 💡 Dicas

- Auto-save está ativo (2s após parar de digitar)
- Use `Cmd/Ctrl + S` para salvar manualmente
- Use `Cmd/Ctrl + Enter` para executar código JS
- Projetos são sincronizados em tempo real

---

**Pronto! Agora você pode começar a programar!** 🎉

Se algo não funcionar, veja os arquivos de documentação ou o `ERRO_MIGRACAO_PENDENTE.md`.


