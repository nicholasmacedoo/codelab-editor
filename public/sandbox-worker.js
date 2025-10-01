// Web Worker para execução segura de JavaScript
// Este worker executa código JavaScript em um ambiente isolado

// Estado do worker
let isExecuting = false;
let executionTimeout = null;

// Interceptar console para capturar logs
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  clear: console.clear,
  table: console.table,
  group: console.group,
  groupEnd: console.groupEnd,
  time: console.time,
  timeEnd: console.timeEnd
};

// Função para enviar logs para o thread principal
function sendLog(type, args, stack) {
  self.postMessage({
    type: 'log',
    data: {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type: type,
      args: Array.from(args).map(arg => {
        try {
          // Serializar objetos complexos
          if (typeof arg === 'object' && arg !== null) {
            if (arg instanceof Error) {
              return {
                name: arg.name,
                message: arg.message,
                stack: arg.stack
              };
            }
            return JSON.parse(JSON.stringify(arg));
          }
          return arg;
        } catch (e) {
          return String(arg);
        }
      }),
      stack
    }
  });
}

// Sobrescrever métodos do console
console.log = function(...args) {
  sendLog('log', args);
  originalConsole.log.apply(console, args);
};

console.info = function(...args) {
  sendLog('info', args);
  originalConsole.info.apply(console, args);
};

console.warn = function(...args) {
  sendLog('warn', args);
  originalConsole.warn.apply(console, args);
};

console.error = function(...args) {
  sendLog('error', args);
  originalConsole.error.apply(console, args);
};

console.clear = function() {
  self.postMessage({ type: 'clear' });
  originalConsole.clear();
};

console.table = function(data) {
  sendLog('log', [data]);
  originalConsole.table(data);
};

console.group = function(...args) {
  sendLog('log', ['▼ ' + (args.length ? args.join(' ') : 'Group')]);
  originalConsole.group.apply(console, args);
};

console.groupEnd = function() {
  originalConsole.groupEnd();
};

console.time = function(label) {
  sendLog('log', [`⏱️ Timer '${label || 'default'}' started`]);
  originalConsole.time(label);
};

console.timeEnd = function(label) {
  originalConsole.timeEnd(label);
  sendLog('log', [`⏱️ Timer '${label || 'default'}' ended`]);
};

// Interceptar erros globais
self.addEventListener('error', function(event) {
  sendLog('error', [event.message], event.error?.stack);
  event.preventDefault();
});

self.addEventListener('unhandledrejection', function(event) {
  sendLog('error', ['Unhandled Promise Rejection:', event.reason]);
  event.preventDefault();
});

// Função para limitar APIs disponíveis
function createSafeEnvironment() {
  // Lista de APIs permitidas
  const allowedGlobals = [
    'console',
    'Math',
    'Date',
    'JSON',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'encodeURIComponent',
    'decodeURIComponent',
    'encodeURI',
    'decodeURI',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'RegExp',
    'Error',
    'TypeError',
    'ReferenceError',
    'SyntaxError',
    'RangeError',
    'Promise',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval'
  ];

  // Criar contexto seguro
  const safeGlobal = {};
  
  allowedGlobals.forEach(name => {
    if (typeof self[name] !== 'undefined') {
      safeGlobal[name] = self[name];
    }
  });

  // Adicionar setTimeout e setInterval com limitações
  safeGlobal.setTimeout = function(callback, delay) {
    if (delay < 1) delay = 1; // Mínimo 1ms
    if (delay > 5000) delay = 5000; // Máximo 5s
    return self.setTimeout(callback, delay);
  };

  safeGlobal.setInterval = function(callback, delay) {
    if (delay < 10) delay = 10; // Mínimo 10ms
    if (delay > 5000) delay = 5000; // Máximo 5s
    return self.setInterval(callback, delay);
  };

  safeGlobal.clearTimeout = self.clearTimeout;
  safeGlobal.clearInterval = self.clearInterval;

  return safeGlobal;
}

// Função para executar código
function executeCode(code) {
  if (isExecuting) {
    return;
  }

  isExecuting = true;
  const startTime = performance.now();

  // Notificar início da execução
  self.postMessage({ type: 'execution-start' });

  // Configurar timeout de execução (3 segundos)
  executionTimeout = setTimeout(() => {
    isExecuting = false;
    sendLog('error', ['Execução interrompida: Timeout de 3 segundos excedido']);
    self.postMessage({ 
      type: 'execution-end', 
      data: { duration: 3000, timedOut: true } 
    });
  }, 3000);

  try {
    // Criar ambiente seguro
    const safeGlobal = createSafeEnvironment();
    
    // Criar função que executa o código no contexto seguro
    const executeInContext = new Function(
      ...Object.keys(safeGlobal),
      `
      "use strict";
      try {
        ${code}
      } catch (error) {
        console.error(error.message);
        throw error;
      }
      `
    );

    // Executar código
    executeInContext(...Object.values(safeGlobal));

    // Execução bem-sucedida
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    clearTimeout(executionTimeout);
    isExecuting = false;
    
    self.postMessage({ 
      type: 'execution-end', 
      data: { duration, timedOut: false } 
    });

  } catch (error) {
    // Erro durante execução
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    clearTimeout(executionTimeout);
    isExecuting = false;
    
    sendLog('error', [error.message], error.stack);
    self.postMessage({ 
      type: 'execution-end', 
      data: { duration, timedOut: false, error: true } 
    });
  }
}

// Função para parar execução
function stopExecution() {
  if (executionTimeout) {
    clearTimeout(executionTimeout);
    executionTimeout = null;
  }
  
  if (isExecuting) {
    isExecuting = false;
    sendLog('warn', ['Execução interrompida pelo usuário']);
    self.postMessage({ 
      type: 'execution-end', 
      data: { duration: 0, stopped: true } 
    });
  }
}

// Escutar mensagens do thread principal
self.addEventListener('message', function(event) {
  const { type, data } = event.data;

  switch (type) {
    case 'execute':
      executeCode(data.code);
      break;
      
    case 'stop':
      stopExecution();
      break;
      
    case 'ping':
      self.postMessage({ type: 'pong' });
      break;
      
    default:
      console.warn('Tipo de mensagem desconhecido:', type);
  }
});

// Notificar que o worker está pronto
self.postMessage({ type: 'ready' });