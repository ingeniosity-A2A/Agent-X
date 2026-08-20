/**
 * ESA.SandboxManager.js
 * WASM sandbox wrapper for experimental components
 */

export async function ESASandboxManager(config) {
  const { container, components = [], api = {} } = config;
  
  // Default colors for logging when theme not available
  const colors = {
    aqua: '#689d6a',
    green: '#98971a',
    orange: '#d65d0e',
    purple: '#b16286',
    red: '#cc241d',
    fg_soft: '#a89984',
    fg: '#ebdbb2'
  };

  console.log(`%c[ESA.Sandbox] Initializing WASM sandbox...`, 
    `color: ${colors.aqua}`);
  
  // Log to ESA console if available
  logToConsole('[ESA.Sandbox] Initializing WASM sandbox...', 'info');

  // Sandbox VM simulation (in browser environment)
  const vm = {
    id: `sandbox-${Date.now()}`,
    created: new Date().toISOString(),
    components: new Map(),
    api: {
      ...api,
      ESA_Log: (message, level = 'info') => {
        const levelColors = {
          info: colors.fg,
          success: colors.green,
          warning: '#d79921',
          error: colors.red
        };
        console.log(`%c[ESA.Sandbox] ${message}`, `color: ${levelColors[level] || levelColors.info}`);
        logToConsole(`[ESA.Sandbox] ${message}`, level);
      },
      ESA_GetState: (componentName) => {
        return vm.components.get(componentName)?.state || null;
      },
      ESA_ListComponents: () => {
        return Array.from(vm.components.keys());
      }
    },
    
    // Register a component in the sandbox
    register: (name, component) => {
      vm.components.set(name, {
        name,
        component,
        state: {},
        registeredAt: new Date().toISOString()
      });
      console.log(`%c[ESA.Sandbox] Component registered: ${name}`, `color: ${colors.green}`);
    },
    
    // Execute code in sandbox context
    execute: async (code) => {
      console.log(`%c[ESA.Sandbox] Executing code...`, `color: ${colors.purple}`);
      try {
        // In a real WASM sandbox, this would run in isolated context
        // For now, we simulate with eval in a controlled manner
        const fn = new Function('api', code);
        const result = await fn(vm.api);
        return { success: true, result };
      } catch (error) {
        console.error(`%c[ESA.Sandbox] Execution error:`, `color: ${colors.red}`, error);
        return { success: false, error: error.message };
      }
    },
    
    // Destroy sandbox and cleanup
    destroy: async () => {
      vm.components.clear();
      console.log(`%c[ESA.Sandbox] Destroyed`, `color: ${colors.fg_soft}`);
      logToConsole('[ESA.Sandbox] Sandbox destroyed', 'info');
      return true;
    }
  };
  
  // Register all provided components
  components.forEach(comp => {
    const status = comp.verified ? '✓ VERIFIED' : '⚠ SANDBOX';
    const color = comp.verified ? colors.green : colors.orange;
    console.log(`%c[ESA.Sandbox] ${comp.name} - ${status}`, `color: ${color}`);
    vm.register(comp.name, comp);
  });

  // Store VM reference on container for external access
  if (container) {
    container._esaSandbox = vm;
  }

  logToConsole(`[ESA.Sandbox] Ready - ${components.length} components registered`, 'success');
  
  return {
    vm,
    ESA_SendToHost: (message) => {
      console.log(`%c[ESA.Sandbox] → Host:`, `color: ${colors.purple}`, message);
      logToConsole(`[ESA.Sandbox] → Host: ${JSON.stringify(message)}`, 'info');
      
      // Dispatch custom event for host to listen
      if (container) {
        container.dispatchEvent(new CustomEvent('esa-sandbox-message', {
          detail: { message, source: 'ESA.Sandbox' }
        }));
      }
    },
    ESA_Destroy: async () => {
      await vm.destroy();
    },
    ESA_GetVM: () => vm
  };
}

function logToConsole(message, level = 'info') {
  const consoleOutput = document.getElementById('esa-console-output');
  if (!consoleOutput) return;

  const colors = {
    info: '#ebdbb2',
    success: '#98971a',
    warning: '#d79921',
    error: '#cc241d'
  };

  const entry = document.createElement('div');
  entry.style.color = colors[level] || colors.info;
  entry.style.marginBottom = '4px';
  entry.style.fontFamily = "'Courier New', monospace";
  entry.style.fontSize = '12px';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  
  consoleOutput.appendChild(entry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

export default ESASandboxManager;
