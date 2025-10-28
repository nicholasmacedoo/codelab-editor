# ⚡ Setup Rápido - LAB365 CodeLab Editor

Guia rápido para configurar o editor em 5 minutos.

## 🚀 Setup em 5 Minutos

### 1. Clone e Instale
```bash
git clone https://github.com/seu-usuario/codelab-editor.git
cd codelab-editor
npm install
```

### 2. Configure o Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **Settings > API** e copie:
   - Project URL
   - anon/public key

### 3. Configure as Variáveis
```bash
# Copie o arquivo de exemplo
cp env.example .env.local

# Edite .env.local com suas credenciais
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 4. Configure o Banco
1. No Supabase, vá em **SQL Editor**
2. Copie todo o conteúdo de `supabase-schema.sql`
3. Cole e execute no SQL Editor

### 5. Execute
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

## 🔧 Configuração Avançada

### Variáveis Opcionais
```bash
# Para funcionalidades administrativas
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Para URLs de compartilhamento customizadas
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Autenticação (Opcional)
1. No Supabase, vá em **Authentication > Settings**
2. Configure **Site URL**: `http://localhost:3000`
3. Ative **Email** provider
4. Configure **Redirect URLs** se necessário

### Realtime (Opcional)
1. No Supabase, vá em **Database > Replication**
2. Ative para as tabelas `projects` e `project_versions`

## 🐛 Solução de Problemas

### Erro: "Supabase não configurado"
- Verifique se `.env.local` existe
- Confirme se as variáveis estão corretas
- Reinicie o servidor

### Erro: "Table doesn't exist"
- Execute o `supabase-schema.sql` no SQL Editor
- Verifique se as tabelas foram criadas

### Erro: "Invalid API key"
- Verifique se copiou a chave correta
- Confirme se não há espaços extras

## 📚 Documentação Completa

- **[README.md](README.md)** - Documentação principal
- **[FEATURES.md](FEATURES.md)** - Funcionalidades detalhadas
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Configuração completa do Supabase

## 🆘 Precisa de Ajuda?

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/codelab-editor/issues)
- **Email**: suporte@lab365.com.br
- **Discord**: [Comunidade LAB365](https://discord.gg/lab365)

---

**Pronto para começar! 🚀**

