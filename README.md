# 🚀 LAB365 CodeLab Editor - Multi-Linguagem

> **IDE educacional multi-linguagem desenvolvida para o LAB365 + SENAI. Suporta projetos JavaScript Puro e Web Completo (HTML+CSS+JS) com preview ao vivo, compartilhamento em tempo real e ferramentas modernas para facilitar o aprendizado de programação.**

> 🎉 **NOVO:** Agora com suporte para projetos Web Completo com HTML, CSS e JavaScript!

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Funcionalidades

### 🎨 **Dois Tipos de Projetos**

**JavaScript Puro:**
- Monaco Editor com syntax highlighting
- Console interativo para outputs
- Execução em sandbox seguro
- Ideal para lógica e algoritmos

**Web Completo:**
- Editor multi-tab (HTML/CSS/JavaScript)
- Preview ao vivo com auto-refresh (500ms debounce)
- Desenvolvimento web interativo
- Exportação de projetos completos

### 🎯 **Dashboard Moderno**
- Grid responsivo com cards de projetos
- Busca rápida com Command Palette (⌘K)
- Filtros por tipo de projeto
- Templates prontos para começar
- Ações rápidas (duplicar, deletar, compartilhar)

### 💾 **Gerenciamento de Projetos**
- **Auto-save** com debounce de 2 segundos
- **Indicadores visuais** de status (salvando/salvo/erro)
- **Armazenamento local** (fallback quando offline)
- **Sincronização com Supabase** em tempo real
- **Duplicação** de projetos com um clique
- **Busca e filtros** avançados

### 🌐 **Compartilhamento e Colaboração**
- **Links de compartilhamento** únicos
- **Sincronização em tempo real** via Supabase Realtime
- **Controle de permissões** (público, unlisted, privado)
- **Edição colaborativa** em tempo real
- **Modo offline** com sincronização posterior

### 🔐 **Autenticação**
- **Login/Registro** via Supabase Auth
- **Recuperação de senha** por email
- **Sessões persistentes**
- **Projetos privados** por usuário

### ⌨️ **Atalhos de Teclado**
- `⌘/Ctrl + K` - Busca rápida de projetos
- `⌘/Ctrl + N` - Novo projeto
- `⌘/Ctrl + S` - Salvar projeto
- `⌘/Ctrl + Enter` - Executar código (JS Puro)

### 🎨 **Interface Moderna**
- **Design responsivo** para desktop e mobile
- **Layout flexível** (console lateral/embaixo)
- **Redimensionamento** de painéis
- **Preview fullscreen** para projetos web
- **Feedback visual** com toasts e animações
- **Acessibilidade** com ARIA labels
- **Dark mode** profissional

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+ 
- npm, yarn, pnpm ou bun
- Conta no [Supabase](https://supabase.com)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/codelab-editor.git
cd codelab-editor
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env.local

# Edite o arquivo .env.local com suas credenciais do Supabase
```

### 4. Configure o Supabase
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto
3. Vá em **Settings > API** e copie:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (opcional)
4. Execute o script **`supabase-schema-refactor.sql`** no **SQL Editor**
   - ⚠️ Se você já tem projetos antigos, veja o arquivo `GUIA_MIGRACAO.md`

### 5. Execute o projeto
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
src/
├── app/                              # Páginas Next.js (App Router)
│   ├── auth/                        # Página de autenticação
│   ├── dashboard/                   # 🆕 Dashboard de projetos
│   ├── editor/[id]/                 # 🆕 Editor multi-tipo
│   ├── compartilhar/[slug]/         # Página de projetos compartilhados
│   └── layout.tsx                   # Layout principal
├── components/
│   ├── dashboard/                   # 🆕 Componentes do dashboard
│   │   ├── project-card.tsx         # Card de projeto
│   │   ├── project-grid.tsx         # Grid responsivo
│   │   ├── new-project-dialog.tsx   # Dialog de criação
│   │   ├── delete-project-dialog.tsx # Dialog de deleção
│   │   └── search-command.tsx       # Busca rápida (⌘K)
│   ├── editor/                      # 🆕 Componentes de editor
│   │   ├── javascript-editor.tsx    # Editor JS Puro
│   │   ├── web-complete-editor.tsx  # Editor Web Completo
│   │   └── web-preview.tsx          # Preview ao vivo
│   ├── auth/                        # Componentes de autenticação
│   └── ui/                          # Componentes shadcn/ui
├── contexts/
│   └── AuthContext.tsx              # Contexto de autenticação
├── hooks/                           # 🆕 Hooks customizados
│   └── useKeyboardShortcuts.ts      # Atalhos de teclado
├── lib/
│   ├── supabase.ts                  # Configuração do Supabase
│   ├── projeto-service.ts           # 🆕 Serviços multi-tipo
│   ├── realtime-service.ts          # Serviços de tempo real
│   └── storage.ts                   # Armazenamento local
├── types/                           # 🆕 Tipos TypeScript
│   └── project.ts                   # Tipos de projetos e templates
└── middleware.ts                    # Middleware Next.js
```

## 🔧 Configuração Detalhada

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Chave de serviço (opcional) |
| `NEXT_PUBLIC_APP_URL` | ❌ | URL base da aplicação |

### Configuração do Supabase

1. **Crie um projeto** no [Supabase Dashboard](https://supabase.com/dashboard)
2. **Execute o schema** copiando o conteúdo de `supabase-schema.sql` no SQL Editor
3. **Configure RLS** (Row Level Security) - já incluído no schema
4. **Ative Realtime** nas tabelas `projects` e `project_versions`

### Funcionalidades do Schema

- **Tabela `projects`**: Armazena os projetos com metadados
- **Tabela `project_versions`**: Histórico de versões dos projetos
- **RLS Policies**: Controle de acesso baseado em usuário
- **Triggers**: Atualização automática de timestamps
- **Realtime**: Sincronização em tempo real via PostgreSQL NOTIFY

## 🎮 Como Usar

### Criando um Projeto
1. Acesse o **Dashboard** (`/dashboard`)
2. Clique em **"Novo Projeto"** ou pressione `⌘/Ctrl + N`
3. Escolha o tipo:
   - **JavaScript Puro**: Para lógica e algoritmos
   - **Web Completo**: Para páginas web
4. Selecione um template (opcional)
5. Dê um nome e descrição
6. Clique em **"Criar Projeto"**

### Editando um Projeto

**JavaScript Puro:**
- Digite o código no editor Monaco
- Clique em **"Executar"** ou pressione `⌘/Ctrl + Enter`
- Veja o resultado no console interativo
- Auto-save salvará automaticamente

**Web Completo:**
- Use as tabs para alternar entre HTML, CSS e JS
- O preview atualiza automaticamente (500ms debounce)
- Clique no ícone de tela cheia para expandir o preview
- Exporte o projeto como arquivo HTML standalone

### Busca Rápida
- Pressione `⌘/Ctrl + K` para abrir a busca
- Use as setas para navegar
- Pressione `Enter` para abrir o projeto

### Compartilhando Projetos
1. No editor, clique em **"Compartilhar"**
2. Configure as permissões:
   - **Público**: Visível para todos
   - **Privado**: Apenas você
3. Escolha se permite edição colaborativa
4. O link é copiado automaticamente

### Duplicando Projetos
- No card do projeto, clique no menu (⋮)
- Selecione **"Duplicar"**
- Uma cópia será criada instantaneamente

### Modo Offline
- Funciona sem conexão
- Armazenamento local com LocalForage
- Sincronização automática quando online
- Indicador visual de status de conexão

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento com Turbopack

# Produção
npm run build        # Build para produção
npm run start        # Servidor de produção

# Qualidade de código
npm run lint         # ESLint
```

## 🧪 Tecnologias Utilizadas

### Frontend
- **Next.js 15.5.4** - Framework React com App Router
- **React 19.1.0** - Biblioteca de interface
- **TypeScript 5.0** - Tipagem estática
- **Tailwind CSS 4.0** - Estilização utilitária
- **Monaco Editor** - Editor de código
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Banco de dados
- **Supabase Auth** - Autenticação
- **Supabase Realtime** - Sincronização em tempo real
- **Row Level Security** - Controle de acesso

### Utilitários
- **LocalForage** - Armazenamento local
- **Sonner** - Notificações toast
- **Date-fns** - Manipulação de datas
- **Nanoid** - Geração de IDs únicos

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
- **Netlify**: Suporte completo
- **Railway**: Deploy simples
- **Docker**: Containerização disponível

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📚 Documentação Adicional

- **REFATORACAO_COMPLETA.md** - Documentação completa da refatoração multi-linguagem
- **GUIA_MIGRACAO.md** - Guia para migrar projetos antigos
- **SUPABASE_SETUP.md** - Configuração detalhada do Supabase
- **PROMPT_REFACTOR_PROJETOS.md** - Especificações técnicas completas

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/codelab-editor/issues)
- **Documentação**: Veja os arquivos `.md` na raiz do projeto
- **Email**: suporte@lab365.com.br

## 🙏 Agradecimentos

- **LAB365 + SENAI** - Pela oportunidade e suporte
- **Supabase** - Pela plataforma incrível
- **Vercel** - Pela hospedagem e ferramentas
- **Comunidade Open Source** - Pelas bibliotecas utilizadas

---

**Desenvolvido com ❤️ para a educação em programação**