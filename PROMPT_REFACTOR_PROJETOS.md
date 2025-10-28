# Prompt de Refatoração - IDE Educational Multi-Linguagem

## Contexto do Projeto

Atualmente tenho uma IDE educacional desenvolvida com Next.js que suporta apenas JavaScript. Preciso refatorá-la para suportar dois tipos de projetos:
1. **JavaScript Puro** - Apenas código JS com console
2. **Web Completo** - HTML, CSS e JavaScript com preview

## Stack Tecnológica

- **Framework:** Next.js 15.5.4
- **Estilização:** Tailwind CSS + shadcn/ui
- **Editor:** Monaco Editor React
- **Backend:** Supabase (autenticação e banco de dados)
- **Gerenciamento de Estado:** React 19.1.0

## Objetivos da Refatoração

### 1. Sistema de Tipos de Projeto

Criar uma estrutura que suporte dois tipos de projetos:

```typescript
enum ProjectType {
  JAVASCRIPT = 'javascript',
  WEB_COMPLETE = 'web_complete'
}

interface Project {
  id: string
  name: string
  type: ProjectType
  description?: string
  created_at: string
  updated_at: string
  user_id: string
  is_public: boolean
  
  // Para JavaScript Puro
  js_code?: string
  
  // Para Web Completo
  html_code?: string
  css_code?: string
  js_web_code?: string
}
```

### 2. Página de Dashboard (Nova)

Criar uma página inicial (`/dashboard` ou `/projects`) com:

#### Layout e Componentes Necessários

**Header do Dashboard:**
- Logo/Nome da IDE
- Botão "Novo Projeto" (destaque primário)
- Menu do usuário (avatar, configurações, logout)
- Campo de busca de projetos

**Grid de Projetos:**
- Cards responsivos (grid: 1 col mobile, 2 cols tablet, 3-4 cols desktop)
- Cada card deve exibir:
  - Badge do tipo de projeto (JS ou Web)
  - Nome do projeto
  - Descrição (truncada)
  - Data de última modificação
  - Status de visibilidade (público/privado)

**Ações por Projeto:**
- **Visualizar/Editar** - Abre o editor
- **Deletar** - Com modal de confirmação
- **Compartilhar** - Gera link público ou copia código
- **Duplicar** - Cria cópia do projeto

**Estados:**
- Empty state quando não há projetos
- Loading state durante carregamento
- Error state para falhas

### 3. Modal de Novo Projeto

Criar componente de Dialog (shadcn) com:

**Campos:**
```typescript
interface NewProjectForm {
  name: string // obrigatório, min 3 chars
  type: ProjectType // obrigatório, radio group
  description?: string // opcional, textarea
  template?: string // opcional, select de templates
}
```

**Layout:**
- Input para nome do projeto
- Radio Group para tipo (JS Puro vs Web Completo)
  - Cada opção com ícone e descrição clara
  - "JavaScript Puro: Console e lógica de programação"
  - "Web Completo: HTML, CSS e JavaScript com preview"
- Textarea para descrição (opcional)
- Select de templates (opcional):
  - Para JS: "Hello World", "Funções Básicas", "Arrays e Loops"
  - Para Web: "Página em Branco", "Landing Page", "Formulário"
- Botões: Cancelar e Criar Projeto

### 4. Refatoração do Editor

**Estrutura Condicional:**

Para **JavaScript Puro:**
- Monaco Editor ocupando 60% da tela (esquerda)
- Console de output 40% (direita)
- Botão "Executar" para rodar código
- Console captura console.log, errors, warnings

Para **Web Completo:**
- Tabs superiores: HTML, CSS, JavaScript
- Monaco Editor com sintaxe apropriada por tab
- Preview ao vivo (iframe) ocupando 50% da tela (direita)
- Auto-refresh do preview ao digitar (debounced 500ms)
- Botão para abrir preview em tela cheia

**Componentes Compartilhados:**
- Barra superior com:
  - Nome do projeto (editável inline)
  - Badge do tipo
  - Botão Salvar (com indicador de salvamento automático)
  - Botão Compartilhar
  - Menu de configurações (tema, tamanho fonte)

### 5. Schema do Supabase

```sql
-- Tabela de projetos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('javascript', 'web_complete')),
  description TEXT,
  
  -- Campos para JavaScript Puro
  js_code TEXT,
  
  -- Campos para Web Completo
  html_code TEXT,
  css_code TEXT,
  js_web_code TEXT,
  
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_project_type CHECK (
    (type = 'javascript' AND js_code IS NOT NULL) OR
    (type = 'web_complete' AND html_code IS NOT NULL)
  )
);

-- Índices
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_type ON projects(type);
CREATE INDEX idx_projects_public ON projects(is_public) WHERE is_public = TRUE;

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver seus próprios projetos
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Qualquer um pode ver projetos públicos
CREATE POLICY "Anyone can view public projects"
  ON projects FOR SELECT
  USING (is_public = TRUE);

-- Usuário pode criar projetos
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode atualizar seus projetos
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuário pode deletar seus projetos
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6. Estrutura de Pastas Sugerida

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   └── page.tsx          # Nova página de listagem
│   ├── editor/
│   │   └── [id]/
│   │       └── page.tsx       # Editor refatorado
│   └── share/
│       └── [id]/
│           └── page.tsx       # Visualização pública
├── components/
│   ├── dashboard/
│   │   ├── project-card.tsx
│   │   ├── project-grid.tsx
│   │   ├── new-project-dialog.tsx
│   │   ├── delete-project-dialog.tsx
│   │   └── share-project-dialog.tsx
│   ├── editor/
│   │   ├── javascript-editor.tsx
│   │   ├── web-editor.tsx
│   │   ├── console-output.tsx
│   │   ├── web-preview.tsx
│   │   └── editor-toolbar.tsx
│   └── ui/                    # shadcn components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── hooks/
│   │   ├── use-projects.ts
│   │   ├── use-project.ts
│   │   └── use-code-execution.ts
│   └── utils/
│       ├── code-runner.ts
│       └── share-utils.ts
└── types/
    └── project.ts
```

### 7. Funcionalidades Específicas

#### Sistema de Compartilhamento

**Opções de Compartilhamento:**
1. **Link Público** - Gera URL `/share/[project-id]`
   - View-only do código
   - Preview executável (sem edição)
   - Botão "Criar Cópia"

2. **Copiar Código** - Copia para clipboard
   - Formato apropriado por tipo de projeto
   - Com comentários indicando tipo e nome

3. **Exportar** - Download como arquivo
   - `.js` para JavaScript Puro
   - `.html` standalone para Web Completo (com CSS e JS inline)

#### Auto-save

- Debounce de 2 segundos após última mudança
- Indicador visual de status:
  - "Salvando..." (com spinner)
  - "Salvo" (com checkmark)
  - "Erro ao salvar" (com ícone de erro)
- Fallback para LocalForage caso offline

#### Execução de Código JavaScript

Para projetos JavaScript Puro, implementar sandbox seguro:

```typescript
const executeCode = (code: string): ExecutionResult => {
  const logs: LogEntry[] = []
  const errors: ErrorEntry[] = []
  
  // Captura console.log
  const originalLog = console.log
  console.log = (...args) => {
    logs.push({
      type: 'log',
      content: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      timestamp: Date.now()
    })
  }
  
  try {
    // Usar Function ao invés de eval para melhor isolamento
    const fn = new Function(code)
    fn()
  } catch (error) {
    errors.push({
      message: error.message,
      stack: error.stack,
      line: extractLineNumber(error)
    })
  } finally {
    console.log = originalLog
  }
  
  return { logs, errors }
}
```

### 8. Melhorias de UX

**Atalhos de Teclado:**
- `Cmd/Ctrl + S` - Salvar
- `Cmd/Ctrl + Enter` - Executar código (JS Puro)
- `Cmd/Ctrl + K` - Buscar projetos
- `Cmd/Ctrl + N` - Novo projeto

**Feedback Visual:**
- Toast notifications para ações (salvar, deletar, compartilhar)
- Loading skeletons nos cards
- Animações suaves de transição
- Indicadores de progresso claros

**Responsividade:**
- Mobile: Editor em tela cheia com tabs para alternar entre código/preview
- Tablet: Split vertical 50/50
- Desktop: Layout flexível com resize handles

### 9. Priorização de Implementação

**Fase 1 - Fundação:**
1. Criar schema do Supabase
2. Implementar página de dashboard
3. Dialog de novo projeto com tipos

**Fase 2 - Editor:**
4. Refatorar editor para suportar ambos os tipos
5. Implementar console output (JS Puro)
6. Implementar preview ao vivo (Web Completo)

**Fase 3 - Funcionalidades:**
7. Sistema de compartilhamento
8. Auto-save
9. Ações de deletar/duplicar

**Fase 4 - Polimento:**
10. Atalhos de teclado
11. Melhorias de UX
12. Testes e otimizações

## Requisitos Técnicos

- **Performance:** Preview deve atualizar sem lag (usar debounce)
- **Segurança:** Sandbox adequado para execução de código
- **Acessibilidade:** Componentes shadcn já são acessíveis, manter padrão
- **SEO:** Páginas públicas devem ter meta tags apropriadas
- **Offline:** LocalForage para backup local dos projetos

## Considerações Importantes

1. Manter compatibilidade com projetos existentes (apenas JS)
2. Migração automática de projetos antigos para novo schema
3. Validação de código antes de salvar
4. Rate limiting para prevenir spam de salvamento
5. Limpeza de projetos não salvos após 30 dias

---

## Prompt para IA Assistant

"Você é um desenvolvedor expert em Next.js, React e Supabase. Preciso refatorar minha IDE educacional seguindo as especificações acima. Por favor:

1. Comece criando o schema do Supabase com todas as tabelas, políticas RLS e triggers necessários
2. Implemente a página de dashboard com grid de projetos e todas as ações CRUD
3. Crie o dialog de novo projeto com seleção de tipo e validação
4. Refatore o editor para suportar ambos os tipos de projeto (JavaScript Puro e Web Completo)
5. Implemente o sistema de compartilhamento e auto-save

Para cada etapa, forneça:
- Código completo e funcional
- Componentes TypeScript com tipos adequados
- Integração com Supabase
- Estilização com Tailwind CSS
- Uso de componentes shadcn/ui onde apropriado
- Tratamento de erros e loading states
- Comentários explicativos em português

Priorize código limpo, performático e com boa experiência do usuário."