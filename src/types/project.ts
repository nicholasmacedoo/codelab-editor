// Tipos para o sistema de projetos refatorado

/**
 * Enum para tipos de projeto
 */
export enum ProjectType {
  JAVASCRIPT = 'javascript',
  WEB_COMPLETE = 'web_complete',
  REACT = 'react'
}

/**
 * Interface principal para projetos
 */
export interface Project {
  id: string
  user_id: string | null
  slug: string
  name: string
  type: ProjectType
  description?: string | null
  
  // Campos para JavaScript Puro
  js_code?: string | null
  
  // Campos para Web Completo
  html_code?: string | null
  css_code?: string | null
  js_web_code?: string | null
  
  // Campos para React
  react_dependencies?: Record<string, string> | null
  
  // Configurações
  is_public: boolean
  allow_edits: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Versão de um projeto (save point)
 */
export interface ProjectVersion {
  id: string
  project_id: string
  label: string | null
  
  // Código salvo conforme o tipo do projeto
  js_code?: string | null
  html_code?: string | null
  css_code?: string | null
  js_web_code?: string | null
  
  created_by: string | null
  created_at: string
}

/**
 * Arquivo React em um projeto
 */
export interface ReactFile {
  id: string
  name: string
  path: string
  content: string
  file_type: 'jsx' | 'js' | 'css' | 'json' | 'md'
  created_at: string
  updated_at: string
}

/**
 * Dados para criar um novo projeto JavaScript
 */
export interface CreateJavaScriptProjectData {
  name: string
  type: ProjectType.JAVASCRIPT
  description?: string
  js_code: string
  is_public?: boolean
  allow_edits?: boolean
  user_id?: string | null
}

/**
 * Dados para criar um novo projeto Web Completo
 */
export interface CreateWebCompleteProjectData {
  name: string
  type: ProjectType.WEB_COMPLETE
  description?: string
  html_code: string
  css_code?: string
  js_web_code?: string
  is_public?: boolean
  allow_edits?: boolean
  user_id?: string | null
}

/**
 * Dados para criar um novo projeto React
 */
export interface CreateReactProjectData {
  name: string
  type: ProjectType.REACT
  description?: string
  react_dependencies?: Record<string, string>
  is_public?: boolean
  allow_edits?: boolean
  user_id?: string | null
}

/**
 * Union type para criação de projetos
 */
export type CreateProjectData = CreateJavaScriptProjectData | CreateWebCompleteProjectData | CreateReactProjectData

/**
 * Dados para atualizar um projeto JavaScript
 */
export interface UpdateJavaScriptProjectData {
  name?: string
  description?: string
  js_code?: string
  is_public?: boolean
  allow_edits?: boolean
}

/**
 * Dados para atualizar um projeto Web Completo
 */
export interface UpdateWebCompleteProjectData {
  name?: string
  description?: string
  html_code?: string
  css_code?: string
  js_web_code?: string
  is_public?: boolean
  allow_edits?: boolean
}

/**
 * Dados para atualizar um projeto React
 */
export interface UpdateReactProjectData {
  name?: string
  description?: string
  react_dependencies?: Record<string, string>
  is_public?: boolean
  allow_edits?: boolean
}

/**
 * Union type para atualização de projetos
 */
export type UpdateProjectData = UpdateJavaScriptProjectData | UpdateWebCompleteProjectData | UpdateReactProjectData

/**
 * Template para projetos JavaScript
 */
export interface JavaScriptTemplate {
  id: string
  name: string
  description: string
  code: string
}

/**
 * Template para projetos Web
 */
export interface WebTemplate {
  id: string
  name: string
  description: string
  html: string
  css: string
  js: string
}

/**
 * Template para projetos React
 */
export interface ReactTemplate {
  id: string
  name: string
  description: string
  files: Record<string, string>
}

/**
 * Templates disponíveis para JavaScript Puro
 */
export const JAVASCRIPT_TEMPLATES: JavaScriptTemplate[] = [
  {
    id: 'blank',
    name: 'Projeto em Branco',
    description: 'Comece do zero',
    code: '// Seu código JavaScript aqui\nconsole.log("Olá, mundo!");'
  },
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Exemplo básico com console.log',
    code: `// Exemplo Hello World
console.log("Olá, mundo!");
console.log("Bem-vindo ao editor JavaScript!");

// Variáveis
const nome = "Estudante";
console.log("Olá, " + nome + "!");

// Função simples
function saudar(pessoa) {
  return "Olá, " + pessoa + "!";
}

console.log(saudar("João"));`
  },
  {
    id: 'functions',
    name: 'Funções Básicas',
    description: 'Exemplos de funções e operações',
    code: `// Funções básicas em JavaScript

// 1. Função de soma
function somar(a, b) {
  return a + b;
}

console.log("5 + 3 =", somar(5, 3));

// 2. Função de multiplicação
function multiplicar(a, b) {
  return a * b;
}

console.log("4 x 7 =", multiplicar(4, 7));

// 3. Arrow function
const dividir = (a, b) => {
  if (b === 0) {
    return "Erro: divisão por zero";
  }
  return a / b;
};

console.log("10 / 2 =", dividir(10, 2));

// 4. Função com múltiplos parâmetros
function calcularMedia(...numeros) {
  const soma = numeros.reduce((acc, num) => acc + num, 0);
  return soma / numeros.length;
}

console.log("Média de 5, 8, 10:", calcularMedia(5, 8, 10));`
  },
  {
    id: 'arrays-loops',
    name: 'Arrays e Loops',
    description: 'Trabalhando com arrays e estruturas de repetição',
    code: `// Arrays e Loops

// 1. Criando um array
const frutas = ["maçã", "banana", "laranja", "uva"];
console.log("Frutas:", frutas);

// 2. Loop for tradicional
console.log("\\nUsando for:");
for (let i = 0; i < frutas.length; i++) {
  console.log(i + ":", frutas[i]);
}

// 3. forEach
console.log("\\nUsando forEach:");
frutas.forEach((fruta, index) => {
  console.log(index + ":", fruta);
});

// 4. map - transformar array
const numeros = [1, 2, 3, 4, 5];
const dobrados = numeros.map(num => num * 2);
console.log("\\nNúmeros:", numeros);
console.log("Dobrados:", dobrados);

// 5. filter - filtrar array
const pares = numeros.filter(num => num % 2 === 0);
console.log("Números pares:", pares);

// 6. reduce - somar todos os números
const soma = numeros.reduce((acc, num) => acc + num, 0);
console.log("Soma total:", soma);`
  }
]

/**
 * Templates disponíveis para Web Completo
 */
export const WEB_TEMPLATES: WebTemplate[] = [
  {
    id: 'blank',
    name: 'Página em Branco',
    description: 'Comece do zero com estrutura básica',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu Projeto</title>
</head>
<body>
  <h1>Olá, Mundo!</h1>
</body>
</html>`,
    css: `body {
  margin: 0;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}`,
    js: `// Seu código JavaScript aqui
console.log("Página carregada!");`
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Template de página inicial moderna',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
</head>
<body>
  <header>
    <nav>
      <h1>MeuProduto</h1>
      <button id="cta-btn">Começar Agora</button>
    </nav>
  </header>
  
  <main>
    <section class="hero">
      <h2>Transforme suas ideias em realidade</h2>
      <p>A melhor solução para o seu negócio</p>
      <button class="btn-primary">Experimente Grátis</button>
    </section>
    
    <section class="features">
      <div class="feature">
        <h3>⚡ Rápido</h3>
        <p>Desempenho excepcional</p>
      </div>
      <div class="feature">
        <h3>🔒 Seguro</h3>
        <p>Seus dados protegidos</p>
      </div>
      <div class="feature">
        <h3>💡 Intuitivo</h3>
        <p>Fácil de usar</p>
      </div>
    </section>
  </main>
</body>
</html>`,
    css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  color: #333;
}

header {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px 40px;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

nav h1 {
  font-size: 1.5rem;
  color: #667eea;
}

#cta-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

#cta-btn:hover {
  background: #5568d3;
}

.hero {
  text-align: center;
  padding: 100px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero h2 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.hero p {
  font-size: 1.5rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.btn-primary {
  background: white;
  color: #667eea;
  border: none;
  padding: 15px 40px;
  font-size: 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: scale(1.05);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  max-width: 1200px;
  margin: 80px auto;
  padding: 0 20px;
}

.feature {
  text-align: center;
  padding: 30px;
  border-radius: 10px;
  background: #f8f9fa;
}

.feature h3 {
  font-size: 2rem;
  margin-bottom: 15px;
}

.feature p {
  color: #666;
  font-size: 1.1rem;
}`,
    js: `document.getElementById('cta-btn').addEventListener('click', () => {
  alert('Obrigado pelo interesse! 🚀');
});

document.querySelector('.btn-primary').addEventListener('click', () => {
  alert('Iniciando teste grátis...');
});`
  },
  {
    id: 'form',
    name: 'Formulário',
    description: 'Formulário interativo com validação',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formulário de Contato</title>
</head>
<body>
  <div class="container">
    <h1>Entre em Contato</h1>
    <form id="contact-form">
      <div class="form-group">
        <label for="name">Nome:</label>
        <input type="text" id="name" required>
      </div>
      
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" required>
      </div>
      
      <div class="form-group">
        <label for="message">Mensagem:</label>
        <textarea id="message" rows="5" required></textarea>
      </div>
      
      <button type="submit">Enviar</button>
    </form>
    
    <div id="result"></div>
  </div>
</body>
</html>`,
    css: `body {
  margin: 0;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #667eea;
  margin-bottom: 30px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

input, textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  background: #667eea;
  color: white;
  border: none;
  padding: 15px;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #5568d3;
}

#result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  display: none;
}

#result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  display: block;
}`,
    js: `document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;
  
  // Simulação de envio
  const result = document.getElementById('result');
  result.className = 'success';
  result.textContent = \`Obrigado, \${name}! Sua mensagem foi enviada com sucesso.\`;
  
  // Limpar formulário
  document.getElementById('contact-form').reset();
});`
  }
]

/**
 * Templates disponíveis para React
 */
export const REACT_TEMPLATES: ReactTemplate[] = [
  {
    id: 'blank',
    name: 'Blank App',
    description: 'App React em branco para começar do zero',
    files: {
      'src/App.jsx': `import React from 'react'

function App() {
  return (
    <div className="app">
      <h1>Meu App React</h1>
      <p>Comece a editar para ver as mudanças!</p>
    </div>
  )
}

export default App`,
      'src/index.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App />)`,
      'src/styles.css': `.app {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
}`,
      'public/index.html': `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meu App React</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      'package.json': `{
  "name": "meu-app-react",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`
    }
  },
  {
    id: 'counter',
    name: 'Counter App',
    description: 'App de contador simples com useState',
    files: {
      'src/App.jsx': `import React, { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="app">
      <h1>Contador</h1>
      <div className="counter">
        <button onClick={() => setCount(count - 1)}>-</button>
        <span className="count">{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

export default App`,
      'src/index.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App />)`,
      'src/styles.css': `.app {
  font-family: Arial, sans-serif;
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
}

.counter {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.count {
  font-size: 48px;
  font-weight: bold;
  min-width: 80px;
}

button {
  padding: 10px 20px;
  font-size: 24px;
  cursor: pointer;
  border: 2px solid #333;
  background: white;
  border-radius: 5px;
}

button:hover {
  background: #f0f0f0;
}`,
      'public/index.html': `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Contador React</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      'package.json': `{
  "name": "contador-react",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`
    }
  },
  {
    id: 'todo',
    name: 'Todo List',
    description: 'Lista de tarefas com múltiplos componentes',
    files: {
      'src/App.jsx': `import React, { useState } from 'react'
import TodoList from './components/TodoList'

function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  
  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, done: false }])
      setInput('')
    }
  }
  
  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ))
  }
  
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }
  
  return (
    <div className="app">
      <h1>📝 Lista de Tarefas</h1>
      <div className="input-group">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Adicionar nova tarefa..."
        />
        <button onClick={addTodo}>Adicionar</button>
      </div>
      <TodoList 
        todos={todos} 
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
    </div>
  )
}

export default App`,
      'src/components/TodoList.jsx': `import React from 'react'

function TodoList({ todos, onToggle, onDelete }) {
  return (
    <ul className="todo-list">
      {todos.map(todo => (
        <li key={todo.id} className={todo.done ? 'done' : ''}>
          <input 
            type="checkbox" 
            checked={todo.done}
            onChange={() => onToggle(todo.id)}
          />
          <span>{todo.text}</span>
          <button onClick={() => onDelete(todo.id)}>🗑️</button>
        </li>
      ))}
    </ul>
  )
}

export default TodoList`,
      'src/index.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App />)`,
      'src/styles.css': `.app {
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 5px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
}

.todo-list li.done span {
  text-decoration: line-through;
  color: #999;
}

.todo-list li button {
  margin-left: auto;
  background: #dc3545;
  padding: 5px 10px;
}

.todo-list li button:hover {
  background: #c82333;
}`,
      'public/index.html': `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo List React</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      'package.json': `{
  "name": "todo-list-react",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`
    }
  }
]

/**
 * Projeto local (usado para fallback offline)
 */
export interface LocalProject extends Project {
  isLocal: boolean
}

/**
 * Database types para Supabase
 */
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at'>>
      }
      project_versions: {
        Row: ProjectVersion
        Insert: Omit<ProjectVersion, 'id' | 'created_at'>
        Update: Partial<Omit<ProjectVersion, 'id' | 'created_at'>>
      }
    }
  }
}

