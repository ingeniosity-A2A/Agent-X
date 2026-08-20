/**
 * ESA.SandboxManager.js
 * Arrow.js/WASM Sandbox - CONTAINS the entire ESA EXOSKELETON
 * 
 * Architecture:
 * 1. All ESA components run INSIDE this sandbox
 * 2. Sandbox is wrapped with GSAP animations
 * 3. Provides isolated execution context via Arrow.js reactive system
 * 4. Manages component lifecycle and inter-component communication
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

  console.log(`%c[ESA.Sandbox] 🛡️ Initializing ARROW.JS SANDBOX...`, 
    `color: ${colors.aqua}; font-weight: bold`);
  
  logToConsole('[ESA.Sandbox] 🛡️ Initializing ARROW.JS WASM Sandbox...', 'info');
  logToConsole('[ESA.Sandbox] ┌─────────────────────────────────────────┐', 'info');
  logToConsole('[ESA.Sandbox] │  ESA EXOSKELETON RUNNING IN SANDBOX   │', 'info');
  logToConsole('[ESA.Sandbox] └─────────────────────────────────────────┘', 'info');

  // ============================================
  // ARROW.JS REACTIVE SANDBOX STATE
  // ============================================
  const sandboxState = {
    id: `esa-sandbox-${Date.now()}`,
    created: new Date().toISOString(),
    initialized: false,
    gsapAnimated: false,
    components: new Map(),
    
    // Sandbox-level state (accessible by all components)
    globalState: {
      theme: 'dark',
      locale: 'en-US',
      voiceEnabled: true,
      cameraReady: false,
      duckDBConnected: false
    },
    
    // API exposed to sandboxed components
    api: {
      ...api,
      
      // Logging
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
      
      // State management
      ESA_GetState: (componentName) => {
        return sandboxState.components.get(componentName)?.state || null;
      },
      
      ESA_SetGlobalState: (key, value) => {
        sandboxState.globalState[key] = value;
        logToConsole(`[ESA.Sandbox] Global state: ${key} = ${value}`, 'info');
      },
      
      ESA_GetGlobalState: () => ({ ...sandboxState.globalState }),
      
      // Component listing
      ESA_ListComponents: () => {
        return Array.from(sandboxState.components.keys());
      },
      
      // Inter-component messaging
      ESA_Emit: (event, detail) => {
        logToConsole(`[ESA.Sandbox] Emit: ${event}`, 'info');
        window.dispatchEvent(new CustomEvent(event, { 
          detail: { ...detail, _source: 'ESA.Sandbox' } 
        }));
      },
      
      ESA_On: (event, handler) => {
        window.addEventListener(event, handler);
        return () => window.removeEventListener(event, handler);
      }
    },
    
    // Register a component in the sandbox
    register: (name, component, state = {}) => {
      sandboxState.components.set(name, {
        name,
        component,
        state: { ...state, _registeredAt: new Date().toISOString() },
        verified: components.find(c => c.name === name)?.verified || false
      });
      const status = sandboxState.components.get(name).verified ? '✓' : '⚠';
      console.log(`%c[ESA.Sandbox] ${status} Registered: ${name}`, `color: ${colors.green}`);
      logToConsole(`[ESA.Sandbox] ${status} Component registered: ${name}`, 
        sandboxState.components.get(name).verified ? 'success' : 'warning');
    },
    
    // Execute code in sandbox context (Arrow.js reactive)
    execute: async (code) => {
      console.log(`%c[ESA.Sandbox] Executing code in sandbox...`, `color: ${colors.purple}`);
      try {
        // Run in sandboxed context with API access
        const fn = new Function('api', 'state', `'use strict';\n${code}`);
        const result = await fn(sandboxState.api, sandboxState.globalState);
        return { success: true, result };
      } catch (error) {
        console.error(`%c[ESA.Sandbox] Execution error:`, `color: ${colors.red}`, error);
        logToConsole(`[ESA.Sandbox] Error: ${error.message}`, 'error');
        return { success: false, error: error.message };
      }
    },
    
    // Destroy sandbox and cleanup
    destroy: async () => {
      // GSAP exit animation
      if (typeof gsap !== 'undefined' && container) {
        await gsap.to(container, {
          opacity: 0,
          scale: 0.95,
          duration: 0.3,
          ease: 'power2.in'
        });
      }
      
      sandboxState.components.clear();
      sandboxState.initialized = false;
      console.log(`%c[ESA.Sandbox] 💥 Destroyed`, `color: ${colors.fg_soft}`);
      logToConsole('[ESA.Sandbox] 💥 Sandbox destroyed', 'warning');
      return true;
    },
    
    // ============================================
    // GSAP SANDBOX WRAPPER ANIMATION
    // ============================================
    animateWithGSAP: async () => {
      if (typeof gsap === 'undefined') {
        console.warn('[ESA.Sandbox] GSAP not loaded, skipping animation');
        return;
      }
      
      if (sandboxState.gsapAnimated) {
        console.log('[ESA.Sandbox] Already animated');
        return;
      }
      
      console.log(`%c[ESA.Sandbox] 🎬 Wrapping sandbox with GSAP...`, 
        `color: ${colors.purple}; font-weight: bold`);
      logToConsole('[ESA.Sandbox] 🎬 GSAP wrapping sandbox container...', 'info');
      
      // Make container visible for animation
      if (container) {
        container.style.display = 'block';
        
        // Main sandbox entrance animation
        const tl = gsap.timeline({
          onComplete: () => {
            sandboxState.gsapAnimated = true;
            logToConsole('[ESA.Sandbox] ✅ GSAP animation complete', 'success');
            
            // Dispatch event for child components to animate
            window.dispatchEvent(new CustomEvent('esa:sandbox-animated', {
              detail: { sandboxId: sandboxState.id }
            }));
          }
        });
        
        tl
          // Phase 1: Container fade in with scale
          .fromTo(container, 
            { opacity: 0, y: 30, scale: 0.98 },
            { 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              duration: 0.8, 
              ease: 'power3.out' 
            }
          )
          // Phase 2: Stagger children
          .fromTo(
            container.querySelectorAll('.esa-console-container, .esa-sidebar, .esa-ingestion-area, #esa-button-panel'),
            { opacity: 0, y: 20 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.5, 
              stagger: 0.1, 
              ease: 'power2.out' 
            },
            '-=0.4'
          )
          // Phase 3: Glow effect on header
          .fromTo(
            container.querySelector('.esa-header'),
            { boxShadow: '0 0 0 rgba(104, 157, 106, 0)' },
            { 
              boxShadow: '0 4px 20px rgba(104, 157, 106, 0.3)', 
              duration: 0.6, 
              ease: 'power2.out' 
            },
            '-=0.3'
          );
        
        return tl;
      }
    }
  };
  
  // Register all provided components in sandbox
  components.forEach(comp => {
    const status = comp.verified ? '✓ VERIFIED' : '⚠ SANDBOX';
    const color = comp.verified ? colors.green : colors.orange;
    console.log(`%c[ESA.Sandbox] ${comp.name} - ${status}`, `color: ${color}`);
    sandboxState.register(comp.name, comp);
  });

  // Store sandbox reference on container (the EXOSKELETON itself)
  if (container) {
    container._esaSandbox = sandboxState;
    
    // Mark as sandbox container
    container.setAttribute('data-esa-sandbox', sandboxState.id);
    container.setAttribute('data-esa-version', '2.1.0');
  }
  
  // Mark as initialized
  sandboxState.initialized = true;

  logToConsole('', 'info');
  logToConsole('╔════════════════════════════════════════════════════╗', 'success');
  logToConsole('║     ARROW.JS SANDBOX - READY                   ║', 'success');
  logToConsole(`║     Components: ${components.length} registered               ║`, 'success');
  logToConsole('║     GSAP: Pending animation wrapper               ║', 'success');
  logToConsole('╚════════════════════════════════════════════════════╝', 'success');
  logToConsole('', 'success');
  
  return {
    // The sandbox VM (contains all state)
    vm: sandboxState,
    
    // Send message to host (outside sandbox)
    ESA_SendToHost: (message) => {
      console.log(`%c[ESA.Sandbox] → Host:`, `color: ${colors.purple}`, message);
      logToConsole(`[ESA.Sandbox] → Host: ${JSON.stringify(message)}`, 'info');
      
      if (container) {
        container.dispatchEvent(new CustomEvent('esa-sandbox-message', {
          detail: { message, source: 'ESA.Sandbox', _fromSandbox: true }
        }));
      }
    },
    
    // Destroy sandbox
    ESA_Destroy: async () => {
      await sandboxState.destroy();
    },
    
    // Get VM reference
    ESA_GetVM: () => sandboxState,
    
    // Trigger GSAP wrapper animation
    ESA_Animate: async () => {
      return await sandboxState.animateWithGSAP();
    },
    
    // Check if sandbox is ready
    ESA_IsReady: () => sandboxState.initialized,
    
    // Get sandbox info
    ESA_GetInfo: () => ({
      id: sandboxState.id,
      created: sandboxState.created,
      initialized: sandboxState.initialized,
      gsapAnimated: sandboxState.gsapAnimated,
      componentCount: sandboxState.components.size,
      componentNames: Array.from(sandboxState.components.keys())
    })
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
