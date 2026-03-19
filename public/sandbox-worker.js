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

function extractRawLine(stack) {
  if (!stack) return null;
  var lines = stack.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var match = lines[i].match(/(?:Function>|<anonymous>):(\d+):(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

// Calibração: usa o mesmo formato do executeCode ("use strict";\n + código)
// para descobrir qual raw line o engine reporta para a linha 1 do usuário
var LINE_OFFSET = 0;
(function calibrate() {
  try {
    var fn = new Function('"use strict";\nthrow new Error("__cal__")');
    fn();
  } catch (e) {
    var rawLine = extractRawLine(e.stack);
    if (rawLine !== null) {
      LINE_OFFSET = rawLine - 1;
    }
  }
})();

function extractLineNumber(stack) {
  var rawLine = extractRawLine(stack);
  if (rawLine === null) return null;
  var userLine = rawLine - LINE_OFFSET;
  return userLine > 0 ? userLine : null;
}

function serializeArg(arg) {
  try {
    if (arg === null) return { __type: 'null' };
    if (arg === undefined) return { __type: 'undefined' };
    if (typeof arg === 'number') return { __type: 'number', value: arg };
    if (typeof arg === 'boolean') return { __type: 'boolean', value: arg };
    if (typeof arg === 'string') return { __type: 'string', value: arg };
    if (typeof arg === 'function') return { __type: 'function', value: 'ƒ ' + (arg.name || 'anonymous') + '()' };
    if (typeof arg === 'symbol') return { __type: 'symbol', value: arg.toString() };
    if (arg instanceof Error) {
      return { __type: 'error', name: arg.name, message: arg.message, stack: arg.stack };
    }
    if (Array.isArray(arg)) {
      return { __type: 'array', items: arg.map(serializeArg), length: arg.length };
    }
    if (typeof arg === 'object') {
      var entries = {};
      var keys = Object.keys(arg);
      for (var k = 0; k < keys.length; k++) {
        try { entries[keys[k]] = serializeArg(arg[keys[k]]); } catch(e) { entries[keys[k]] = { __type: 'string', value: '[Circular]' }; }
      }
      return { __type: 'object', entries: entries, keys: keys };
    }
    return { __type: 'string', value: String(arg) };
  } catch (e) {
    return { __type: 'string', value: String(arg) };
  }
}

function sendLog(type, args, stack) {
  var callStack = stack || null;
  if (!callStack) {
    try { throw new Error(); } catch (e) { callStack = e.stack; }
  }
  var lineNumber = extractLineNumber(callStack);

  self.postMessage({
    type: 'log',
    data: {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type: type,
      args: Array.from(args).map(serializeArg),
      lineNumber: lineNumber,
      stack: stack || null
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
    
    const executeInContext = new Function(
      ...Object.keys(safeGlobal),
      '"use strict";\n' + code
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