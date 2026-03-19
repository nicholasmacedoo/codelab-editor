/**
 * Sistema de bundling e transpilação React usando Babel Standalone
 * Este módulo transpila JSX em tempo real no navegador
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactFile } from '@/types/project'

/**
 * Resultado do bundling
 */
export interface BundleResult {
  code: string
  error?: Error | null
}

/**
 * Mapa de arquivos React
 */
export interface ReactFiles {
  [path: string]: string
}

/**
 * Carrega Babel Standalone dinamicamente
 */
let babelLoaded = false
const loadBabel = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (babelLoaded) {
      resolve()
      return
    }

    // Verificar se já existe
    if (typeof window !== 'undefined' && (window as any).Babel) {
      babelLoaded = true
      resolve()
      return
    }

    // Carregar Babel Standalone
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@babel/standalone@7.23.0/babel.min.js'
    script.async = true
    script.onload = () => {
      babelLoaded = true
      resolve()
    }
    script.onerror = () => {
      reject(new Error('Falha ao carregar Babel Standalone'))
    }
    document.head.appendChild(script)
  })
}

/**
 * Transpila um arquivo JSX/JS para JavaScript
 */
const transpileFile = (content: string, filename: string): string => {
  if (typeof window === 'undefined' || !(window as any).Babel) {
    return content
  }

  const Babel = (window as any).Babel

  try {
    if (filename.endsWith('.jsx')) {
      const result = Babel.transform(content, {
        presets: ['react', 'env'],
        filename: filename
      })
      return result.code
    } else if (filename.endsWith('.js')) {
      // Verificar se o conteúdo parece JSX
      if (content.includes('React.createElement') || content.includes('<')) {
        const result = Babel.transform(content, {
          presets: ['react', 'env'],
          filename: filename
        })
        return result.code
      }
      return content
    }
  } catch (error) {
    console.error(`Erro ao transpilar ${filename}:`, error)
    throw error
  }

  return content
}

/**
 * Resolve path relativo
 */
const resolveImportPath = (currentPath: string, importPath: string): string => {
  // Path absoluto
  if (importPath.startsWith('/')) {
    return importPath.slice(1)
  }

  // Path relativo
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const dir = currentPath.split('/').slice(0, -1).join('/')
    if (importPath.startsWith('./')) {
      return dir ? `${dir}/${importPath.slice(2)}` : importPath.slice(2)
    } else {
      // ../
      const path = importPath.split('/')
      const segments = dir.split('/')
      let depth = 0
      for (const segment of path) {
        if (segment === '..') {
          depth++
        }
      }
      const remaining = segments.slice(0, segments.length - depth)
      const finalPath = path.slice(depth)
      return remaining.length > 0 ? `${remaining.join('/')}/${finalPath.join('/')}` : finalPath.join('/')
    }
  }

  return importPath
}

/**
 * Remove todas as linhas de import/export para o bundle rodar em script tag (globals React/ReactDOM)
 */
const stripModuleSyntax = (code: string): string => {
  return code
    .replace(/export\s+default\s+\w+\s*;?\s*$/gm, '')
    .replace(/export\s*\{\s*[^}]+\s*\}\s*;?\s*$/gm, '')
    .replace(/import\s+[\w{},\s*]+\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '')
    .replace(/import\s+['"][^'"]+['"]\s*;?\s*/g, '')
    .trim()
}

/**
 * Resolve imports e cria bundle único (sem import/export; React/ReactDOM via globals)
 */
const resolveImports = (files: ReactFiles, entryPoint: string): string => {
  let bundle = ''
  const visited = new Set<string>()

  const addFile = (path: string) => {
    if (visited.has(path)) {
      return
    }
    visited.add(path)

    let content = files[path] || ''

    // Encontrar imports
    const importRegex = /import\s+([^'"]+?)\s+from\s+['"](.+?)['"]/g
    const imports = [...content.matchAll(importRegex)]

    imports.forEach(([fullMatch, , importPath]) => {
      const resolvedPath = resolveImportPath(path, importPath)

      if (files[resolvedPath]) {
        addFile(resolvedPath)
      }
      // Remover este import (local ou externo - React/ReactDOM virão de window)
      content = content.replace(fullMatch, '')
    })
    // Remover import de CSS (ex: import './styles.css')
    content = content.replace(/import\s+['"][^'"]+\.css['"]\s*;?\s*/g, '')

    content = stripModuleSyntax(content)
    bundle += `\n// File: ${path}\n${content}\n`
  }

  if (!files[entryPoint]) {
    const fallback = Object.keys(files).find((p) => p.endsWith('index.jsx') || p === 'index.jsx')
    if (fallback) {
      entryPoint = fallback
    }
  }
  addFile(entryPoint)
  return bundle
}

/**
 * Converte arquivos ReactFile para mapa de strings
 */
const filesToMap = (files: ReactFile[]): ReactFiles => {
  const map: ReactFiles = {}
  files.forEach(file => {
    map[file.path] = file.content
  })
  return map
}

/**
 * Bundle um app React completo
 * Transpila JSX, resolve imports e gera HTML com React CDN
 */
export const bundleReactApp = async (
  files: ReactFile[],
  entryPoint: string = 'src/index.jsx'
): Promise<BundleResult> => {
  try {
    // Carregar Babel se ainda não foi carregado
    await loadBabel()

    // Converter para mapa
    const filesMap = filesToMap(files)
    
    console.log('🔍 Arquivos para bundle:', Object.keys(filesMap))
    console.log('🎯 Entry point:', entryPoint)

    // PRIMEIRO: Transpilar cada arquivo individualmente (nunca injetar JSX bruto)
    const transpiledFiles: ReactFiles = {}
    for (const [path, content] of Object.entries(filesMap)) {
      if (path.endsWith('.jsx') || path.endsWith('.js')) {
        try {
          transpiledFiles[path] = transpileFile(content, path)
          console.log(`✅ Transpilado: ${path}`)
        } catch (error) {
          console.error(`❌ Erro ao transpilar ${path}:`, error)
          throw error
        }
      } else {
        transpiledFiles[path] = content
      }
    }

    // SEGUNDO: Resolver imports no código já transpilado
    let bundledCode = resolveImports(transpiledFiles, entryPoint)
    console.log('📦 Bundle criado, tamanho:', bundledCode.length)

    // Evitar que </script> no código feche o tag e quebre o HTML (parser interpreta resto como HTML)
    bundledCode = bundledCode.replace(/<\/script/gi, '<\\/script')

    // Pegar CSS (vários caminhos possíveis)
    const cssFile =
      filesMap['src/styles.css'] ||
      filesMap['src/style.css'] ||
      Object.entries(filesMap).filter(([p]) => p.endsWith('.css')).map(([, c]) => c).join('\n') ||
      ''

    const globals = 'var React = window.React; var ReactDOM = window.ReactDOM;'

    // Gerar HTML final com React CDN; script inline usa globals (sem import/export)
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.development.js"><\\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"><\\/script>
  <style>${cssFile}</style>
</head>
<body>
  <div id="root"><p style="padding:20px;color:#64748b;font-family:sans-serif;">Carregando...</p></div>
  <script>
    (function() {
      var root = document.getElementById('root');
      try {
        if (typeof window.React === 'undefined' || typeof window.ReactDOM === 'undefined') {
          root.innerHTML = '<div style="padding:20px;color:red;font-family:sans-serif;"><h2>React n\u00e3o carregou</h2><p>Verifique a aba Network: react.development.js e react-dom.development.js devem retornar 200.</p></div>';
          return;
        }
        ${globals}
        ${bundledCode}
        setTimeout(function() {
          if (root.children.length === 1 && root.querySelector('p') && root.querySelector('p').textContent === 'Carregando...') {
            root.innerHTML = '<div style="padding:20px;color:#f59e0b;font-family:sans-serif;"><h2>App n\u00e3o renderizou</h2><p>Confira se o entry (ex: src/index.jsx) chama ReactDOM.createRoot(document.getElementById(\'root\')).render(&lt;App /&gt;).</p></div>';
          }
        }, 2000);
      } catch (e) {
        root.innerHTML = '<div style="padding:20px;color:red;font-family:sans-serif;"><h2>Erro</h2><pre>' + (e.message || e) + '</pre></div>';
      }
    })();
  <\\/script>
</body>
</html>`

    return { code: fullHtml }
  } catch (error) {
    console.error('❌ Erro no bundle React:', error)
    return { 
      code: '', 
      error: error instanceof Error ? error : new Error('Erro desconhecido no bundling') 
    }
  }
}

/**
 * Valida um arquivo React antes de fazer bundle
 */
export const validateReactFile = (file: ReactFile): { valid: boolean; error?: string } => {
  try {
    if (file.file_type === 'jsx' || (file.file_type === 'js' && file.content.includes('<'))) {
      // Validar sintaxe JSX básica
      if (typeof window !== 'undefined' && (window as any).Babel) {
        const Babel = (window as any).Babel
        Babel.transform(file.content, {
          presets: ['react', 'env'],
          filename: file.path
        })
      }
    }
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro de sintaxe desconhecido'
    }
  }
}

/**
 * Preload Babel para melhor performance
 */
export const preloadBabel = async (): Promise<void> => {
  await loadBabel()
}

