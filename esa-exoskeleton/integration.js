/**
 * integration.js
 * Component wiring for ESA EXOSKELETON
 * 
 * ARCHITECTURE (GSAP is TRANSPORT, not animation):
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │                  CYBERNETIC AVA007                      │
 * │              (Voice belongs to AI INGESTION)            │
 * └──────────────────────┬──────────────────────────────────┘
 *                         │ intent
 *                         ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │              GSAP TRANSPORT LAYER                       │  ← ESAGSAPTransport
 * │              • Tween atoms (state sync)                 │
 * │              • Temporal orchestrator                    │
 * │              • Bandwidth-efficient transport            │
 * └──────────────────────┬──────────────────────────────────┘
 *                         │
 *                         ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │            ARROW.JS SANDBOX (components)                │  ← ESASandboxManager
 * │                                                         │
 * │  ┌─────────────────────────────────────────────────┐   │
 * │  │  AI INGESTION CHAT BOX                           │   │
 * │  │  ├─ ESA.ButtonPanel  (Camera/Upload)             │   │
 * │  │  └─ Ava007 Voice    (Speech Synthesis)           │   │
 * │  └─────────────────────────────────────────────────┘   │
 * │                                                         │
 * │  • ESA.workorder                                       │
 * │  • ESA.InvPartsCard-B                                  │
 * │  • ESA.Ptac-B (Service Broadcasting)                   │
 * │  • ESA.DiagnosticCard                                  │
 * └─────────────────────────────────────────────────────────┘
 * 
 * KEY: Button + Voice BELONG TO AI Ingestion Box!
 */

import { ESAButtonPanel } from './components/ESA.ButtonPanel.js';
import { ESADiagnosticCard } from './components/ESA.DiagnosticCard.js';
import { ESAInvPartsCardB } from './components/ESA.InvPartsCard-B.js';
import { ESAWorkorder } from './components/ESA.workorder.js';
import { ESAPtacB } from './components/ESA.Ptac-B.js';
import { ESASandboxManager } from './components/ESA.SandboxManager.js';
import { ESAGSAPTransport } from './components/ESA.GSAPTransport.js';
import { initDuckDB } from './config/duckdb-setup.js';
import { activeTheme, toggleTheme } from './config/gruvbox-colors.js';

// Global ESA namespace
window.ESA = {
  version: '2.2.0',
  initialized: false,
  
  // AI INGESTION CHAT BOX (owns Button + Voice)
  ingestion: {
    instance: null,
    components: {
      buttonPanel: null,   // ESA.ButtonPanel belongs HERE
      voice: null          // Ava007 Voice belongs HERE
    }
  },
  
  duckDB: null,
  sandbox: null,
  
  // GSAP TRANSPORT LAYER (THE TRANSPORT, not just animation!)
  transport: null,
  
  // Component references (rendered from Console, inside Sandbox, via Transport)
  components: {
    diagnosticCard: null,
    invPartsCard: null,
    invPartsCardB: null,  // Service Broadcasting (B-side)
    ptacB: null,           // PTAC-specific sliding card
    workorder: null,
    buttonPanel: null
  },
  
  // Register AI Ingestion Chat Box (owns Button + Voice!)
  registerIngestion: (ingestionInstance, options = {}) => {
    window.ESA.ingestion.instance = ingestionInstance;
    
    // Register Voice if provided (Ava007 belongs to Ingestion!)
    if (options.voice) {
      window.ESA.ingestion.components.voice = options.voice;
      console.log(`%c[ESA] 🎤 Ava007 Voice registered with AI Ingestion`, 
        `color: ${activeTheme?.purple || '#b16286'}`);
    }
    
    // Link ButtonPanel to Ingestion (already mounted)
    if (window.ESA.components.buttonPanel) {
      window.ESA.ingestion.components.buttonPanel = window.ESA.components.buttonPanel;
    }
    
    logToConsole('[ESA] ✅ AI INGESTION CHAT BOX registered (owns Button + Voice)', 'success');
    
    // Send through GSAP Transport
    if (window.ESA.transport) {
      window.ESA.transport.send('component:register', 1, {
        source: 'ESA.registerIngestion',
        metadata: { 
          component: 'ai-ingestion',
          owns: ['buttonPanel', 'voice']  // ← KEY: Ingestion owns these!
        }
      });
    }
  },
  
  // Log to console utility
  log: (message, level = 'info') => {
    logToConsole(message, level);
  },
  
  // Get current status (including transport stats)
  getStatus: () => ({
    initialized: window.ESA.initialized,
    version: window.ESA.version,
    hasDuckDB: !!window.ESA.duckDB,
    hasSandbox: !!window.ESA.sandbox,
    hasTransport: !!window.ESA.transport,
    transportStats: window.ESA.transport?.getBandwidthStats() || null,
    components: {
      diagnosticCard: !!window.ESA.components.diagnosticCard,
      invPartsCard: !!window.ESA.components.invPartsCard,
      invPartsCardB: !!window.ESA.components.invPartsCardB,
      ptacB: !!window.ESA.components.ptacB,
      workorder: !!window.ESA.components.workorder,
      buttonPanel: !!window.ESA.components.buttonPanel
    }
  }),
  
  // Send data through GSAP Transport
  send: (intent, value, options = {}) => {
    if (window.ESA.transport) {
      return window.ESA.transport.send(intent, value, options);
    }
    console.warn('[ESA] Transport not available, send failed');
    return null;
  },
  
  // Subscribe to transport events
  subscribe: (intent, handler) => {
    if (window.ESA.transport) {
      return window.ESA.transport.subscribe(intent, handler);
    }
    return () => {};
  }
};

/**
 * Main initialization function
 * 
 * INITIALIZATION ORDER (CRITICAL):
 * 1. GSAP Transport Layer (THE TRANSPORT)
 * 2. DuckDB (data layer)
 * 3. Components (inside Arrow.js wrappers)
 * 4. Sandbox (WASM isolation, WRAPPED by GSAP)
 * 5. UI Controls
 */
export async function initESAExoskeleton() {
  if (window.ESA.initialized) {
    console.log(`%c[ESA] Already initialized`, `color: ${activeTheme.yellow}`);
    return window.ESA;
  }
  
  const startTime = performance.now();
  
  console.log(`%c[ESA] 🚀 Initializing ESA EXOSKELETON v${window.ESA.version}...`, 
    `color: ${activeTheme.aqua}; font-weight: bold`);
  
  logToConsole('╔════════════════════════════════════════════════════╗', 'info');
  logToConsole('║       ESA EXOSKELETON - INITIALIZING              ║', 'info');
  logToConsole('╠════════════════════════════════════════════════════╣', 'info');
  logToConsole('║  GSAP = TRANSPORT LAYER (not animation!)        ║', 'info');
  logToConsole('║  Arrow.js = Component Wrappers                   ║', 'info');
  logToConsole('║  Sandbox = WASM Isolation                       ║', 'info');
  logToConsole('╚════════════════════════════════════════════════════╝', 'info');
  logToConsole('', 'info');
  
  try {
    // ============================================
    // STEP 1: INITIALIZE GSAP TRANSPORT LAYER
    // THIS IS THE TRANSPORT - NOT ANIMATION!
    // ============================================
    logToConsole('[1/8] 🚀 Initializing GSAP TRANSPORT LAYER...', 'info');
    const gsapTransport = new ESAGSAPTransport({
      enableBroadcast: true,
      broadcastInterval: 16, // ~60fps state sync
      enableSpatial: true
    });
    await gsapTransport.init();
    window.ESA.transport = gsapTransport;
    logToConsole('      ✓ GSAP Transport ready (temporal orchestrator active)', 'success');
    
    // ============================================
    // STEP 2: Initialize DuckDB with EXISTING catalog
    // ============================================
    logToConsole('[2/8] Initializing DuckDB WASM...', 'info');
    const { conn } = await initDuckDB();
    window.ESA.duckDB = { conn };
    logToConsole('      ✓ DuckDB WASM ready (existing catalog)', 'success');
    
    // Register DuckDB with transport
    gsapTransport.send('data:ready', 1, {
      source: 'DuckDB',
      metadata: { type: 'wasm', catalog: 'hd-supply' }
    });
    
    // ============================================
    // STEP 3-6: MOUNT COMPONENTS (inside Arrow.js wrappers)
    // All components register with GSAP Transport
    // ============================================
    
    // 3. Mount ESA.DiagnosticCard (in Console area)
    logToConsole('[3/8] Mounting DiagnosticCard component...', 'info');
    await mountDiagnosticCard(gsapTransport);
    
    // 4. Mount ESA.InvPartsCard-B (in Console area, longer card)
    logToConsole('[4/8] Mounting InvPartsCard-B component...', 'info');
    await mountInvPartsCard(gsapTransport);
    
    // 5. Mount ESA.Workorder (in main area)
    logToConsole('[5/8] Mounting Workorder component...', 'info');
    await mountWorkorder(gsapTransport);
    
    // 6. Mount ESA.ButtonPanel (far right)
    logToConsole('[6/8] Mounting ButtonPanel component...', 'info');
    await mountButtonPanel(gsapTransport);
    
    // 6.5. Mount ESA-Ptac-B (Service Broadcasting sliding card)
    logToConsole('[6.5/8] Mounting ESA-Ptac-B Service Broadcasting...', 'info');
    await mountPtacB(gsapTransport);
    
    // ============================================
    // STEP 7: INITIALIZE SANDBOX (WRAPPED WITH GSAP TRANSPORT)
    // The sandbox CONTAINS all components
    // GSAP TRANSPORT wraps the sandbox
    // ============================================
    logToConsole('[7/8] Initializing ARROW.JS Sandbox (wrapped in GSAP Transport)...', 'info');
    const exoskeletonContainer = document.getElementById('esa-exoskeleton');
    const sandboxContainer = document.getElementById('esa-sandbox');
    
    if (exoskeletonContainer && sandboxContainer) {
      // Initialize sandbox with all components registered
      const sandboxResult = await ESASandboxManager({
        container: sandboxContainer,
        components: [
          { name: 'ESA.DiagnosticCard', verified: true },
          { name: 'ESA.InvPartsCard-B', verified: true },
          { name: 'ESA.Workorder', verified: true },
          { name: 'ESA.Ptac-B', verified: true },
          { name: 'ESA.ButtonPanel', verified: false }
        ],
        api: { 
          duckDB: { conn },
          transport: gsapTransport,
          version: window.ESA.version
        }
      });
      window.ESA.sandbox = sandboxResult;
      
      // 🔑 KEY: Wrap sandbox with GSAP TRANSPORT
      // This makes GSAP the transport layer FOR the sandbox
      await gsapTransport.wrapSandbox(exoskeletonContainer);
      
      logToConsole('      ✓ Sandbox initialized & wrapped with GSAP Transport', 'success');
    }
    
    // ============================================
    // STEP 8: Setup UI controls
    // ============================================
    logToConsole('[8/8] Setting up UI controls...', 'info');
    setupUIControls(gsapTransport);
    
    // Update status indicator
    updateStatusIndicator(true);
    
    window.ESA.initialized = true;
    
    const endTime = performance.now();
    const initTime = (endTime - startTime).toFixed(2);
    
    // Get transport statistics
    const transportStats = gsapTransport.getBandwidthStats();
    
    logToConsole('', 'info');
    logToConsole('╔════════════════════════════════════════════════════╗', 'success');
    logToConsole('║       ESA EXOSKELETON - READY                    ║', 'success');
    logToConsole(`║       Initialized in ${initTime}ms                    ║`, 'success');
    logToConsole('║       Transport: GSAP (Temporal Orchestrator)    ║', 'success');
    logToConsole(`║       Bandwidth saved: ${transportStats.efficiency}%              ║`, 'success');
    logToConsole('╚════════════════════════════════════════════════════╝', 'success');
    
    console.log(`%c[ESA] ✅ ESA EXOSKELETON ready (${initTime}ms)`, 
      `color: ${activeTheme.green}; font-weight: bold`);
    console.log(`%c[ESA] 📊 Transport: ${transportStats.activeTimelines} timelines, ${transportStats.efficiency}% efficiency`, 
      `color: ${activeTheme.aqua}`);
    
    // Dispatch ready event THROUGH transport
    gsapTransport.ingest({
      intent: 'esa:ready',
      cognitive_state: { intent: 'system:ready' },
      temporal_tween: { start: 0, end: 1, duration_ms: 200, easing: 'linear' },
      metadata: window.ESA.getStatus()
    });
    
    // Also dispatch DOM event for non-transport listeners
    window.dispatchEvent(new CustomEvent('esa:ready', { detail: window.ESA.getStatus() }));
    
    return window.ESA;
    
  } catch (error) {
    console.error(`%c[ESA] ❌ Initialization error: ${error.message}`, 
      `color: '#cc241d'; font-weight: bold`);
    logToConsole(`❌ Error: ${error.message}`, 'error');
    
    // Send error through transport
    if (window.ESA.transport) {
      window.ESA.transport.send('system:error', 1, {
        source: 'initESAExoskeleton',
        metadata: { error: error.message }
      });
    }
    
    updateStatusIndicator(false, 'Error');
    throw error;
  }
}

/**
 * Mount ESA.DiagnosticCard in Console area
 * Registers with GSAP Transport for state synchronization
 */
async function mountDiagnosticCard(transport) {
  const consoleArea = document.getElementById('esa-console-output');
  if (!consoleArea) {
    logToConsole('      ⚠ Console area not found for DiagnosticCard', 'warning');
    return;
  }
  
  // Create container for DiagnosticCard (renders INSIDE console area)
  const diagContainer = document.createElement('div');
  diagContainer.id = 'esa-diagnostic-card-container';
  diagContainer.setAttribute('data-esa-component', 'ESA.DiagnosticCard');
  diagContainer.style.cssText = `
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${activeTheme.border};
  `;
  
  // Add section header
  const header = document.createElement('div');
  header.style.cssText = `
    color: ${activeTheme.purple};
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  `;
  header.textContent = '🔧 PTAC DIAGNOSTICS (Ava007 Voice)';
  diagContainer.appendChild(header);
  
  // Mount the component
  try {
    const diagCard = ESADiagnosticCard({});
    diagContainer.appendChild(diagCard);
    consoleArea.appendChild(diagContainer);
    
    window.ESA.components.diagnosticCard = diagCard;
    
    // Register with GSAP Transport
    if (transport) {
      transport.registerComponent('ESA.DiagnosticCard', diagContainer, [
        'diagnostic:code',
        'diagnostic:result', 
        'voice:speak',
        'component:mount'
      ]);
    }
    
    logToConsole('      ✓ DiagnosticCard mounted in Console (via GSAP Transport)', 'success');
  } catch (error) {
    logToConsole('      ⚠ DiagnosticCard mount error: ' + error.message, 'warning');
  }
}

/**
 * Mount ESA.InvPartsCard-B in Console area (LONGER card)
 * Registers with GSAP Transport for inventory synchronization
 */
async function mountInvPartsCard(transport) {
  // Find or create InvParts card area (below console, in main grid)
  let invPartsContainer = document.getElementById('esa-invparts-card-container');
  
  if (!invPartsContainer) {
    // Create container in the main area (between console and bottom grid)
    const mainGrid = document.querySelector('.esa-main-grid');
    if (mainGrid) {
      invPartsContainer = document.createElement('div');
      invPartsContainer.id = 'esa-invparts-card-container';
      invPartsContainer.setAttribute('data-esa-component', 'ESA.InvPartsCard-B');
      invPartsContainer.style.cssText = `
        grid-column: 1 / -1;
        margin-top: 16px;
      `;
      mainGrid.appendChild(invPartsContainer);
    } else {
      // Fallback: append after console
      const consoleArea = document.getElementById('esa-console');
      if (consoleArea) {
        invPartsContainer = document.createElement('div');
        invPartsContainer.id = 'esa-invparts-card-container';
        invPartsContainer.setAttribute('data-esa-component', 'ESA.InvPartsCard-B');
        invPartsContainer.style.cssText = `
          margin-top: 16px;
        `;
        consoleArea.parentNode.insertBefore(invPartsContainer, consoleArea.nextSibling);
      }
    }
  }
  
  if (!invPartsContainer) {
    logToConsole('      ⚠ Could not find location for InvPartsCard', 'warning');
    return;
  }
  
  // Mount the component
  try {
    const invPartsCard = ESAInvPartsCardB({});
    invPartsContainer.appendChild(invPartsCard);
    
    window.ESA.components.invPartsCard = invPartsCard;
    
    // Register with GSAP Transport
    if (transport) {
      transport.registerComponent('ESA.InvPartsCard-B', invPartsContainer, [
        'inventory:scan',
        'inventory:update',
        'part:lookup',
        'part:add',
        'part:remove',
        'voice:speak',
        'component:mount'
      ]);
    }
    
    logToConsole('      ✓ InvPartsCard-B mounted (via GSAP Transport)', 'success');
  } catch (error) {
    logToConsole('      ⚠ InvPartsCard mount error: ' + error.message, 'warning');
  }
}

/**
 * Mount ESA.Workorder in main content area
 * Registers with GSAP Transport for workorder synchronization
 */
async function mountWorkorder(transport) {
  // Find or create Workorder container (full width below main grid)
  let workorderContainer = document.getElementById('esa-workorder-container');
  
  if (!workorderContainer) {
    // Create container after the main grid
    const mainGrid = document.querySelector('.esa-main-grid');
    if (mainGrid) {
      workorderContainer = document.createElement('div');
      workorderContainer.id = 'esa-workorder-container';
      workorderContainer.setAttribute('data-esa-component', 'ESA.Workorder');
      workorderContainer.style.cssText = `
        margin-top: 20px;
      `;
      mainGrid.parentNode.insertBefore(workorderContainer, mainGrid.nextSibling);
    }
  }
  
  if (!workorderContainer) {
    logToConsole('      ⚠ Could not find location for Workorder', 'warning');
    return;
  }
  
  try {
    const workorderComponent = ESAWorkorder({});
    workorderContainer.appendChild(workorderComponent);
    
    window.ESA.components.workorder = workorderComponent;
    
    // Register with GSAP Transport
    if (transport) {
      transport.registerComponent('ESA.Workorder', workorderContainer, [
        'workorder:create',
        'workorder:update',
        'workorder:complete',
        'part:add',
        'part:remove',
        'component:mount'
      ]);
    }
    
    logToConsole('      ✓ Workorder mounted (via GSAP Transport)', 'success');
  } catch (error) {
    logToConsole('      ⚠ Workorder mount error: ' + error.message, 'warning');
  }
}

/**
 * Mount ESA.ButtonPanel → AI INGESTION CHAT BOX
 * ============================================
 * THIS COMPONENT BELONGS TO AI INGESTION!
 * 
 * - Camera captures flow TO Ingestion
 * - File attachments flow TO Ingestion  
 * - All events registered with GSAP Transport
 * - Voice (Ava007) triggered via Ingestion
 */
async function mountButtonPanel(transport) {
  const buttonContainer = document.getElementById('esa-button-panel');
  if (!buttonContainer) {
    logToConsole('      ⚠ ButtonPanel container not found', 'warning');
    return;
  }
  
  try {
    const buttonComponent = ESAButtonPanel({
      onCapture: (file) => {
        console.log(`%c[ESA] 📸 Image captured: ${file.name}`, `color: ${activeTheme.green}`);
        logToConsole(`📸 Image captured: ${file.name}`, 'success');
        
        // Send through GSAP Transport
        if (window.ESA.transport) {
          window.ESA.transport.send('capture:image', 1, {
            source: 'ESA.ButtonPanel',
            metadata: { fileName: file.name, type: 'image' }
          });
        }
        
        // Send to Ingestion via Lens integration
        window.ESA.ingestion?.handleFile?.(file, 'image');
        
        // Dispatch for Lens/Ava007 (legacy support)
        window.dispatchEvent(new CustomEvent('esa:capture', { 
          detail: { file, type: 'image', source: 'ButtonPanel' } 
        }));
      },
      onAttachment: (file, type) => {
        console.log(`%c[ESA] 📎 ${type.toUpperCase()}: ${file.name}`, `color: ${activeTheme.yellow}`);
        logToConsole(`📎 Attachment: ${file.name} (${type})`, 'warning');
        
        // Send through GSAP Transport
        if (window.ESA.transport) {
          window.ESA.transport.send('capture:file', 1, {
            source: 'ESA.ButtonPanel',
            metadata: { fileName: file.name, type }
          });
        }
        
        // Send to Ingestion
        window.ESA.ingestion?.handleFile?.(file, type);
        
        // Dispatch event (legacy support)
        window.dispatchEvent(new CustomEvent('esa:attachment', { 
          detail: { file, type, source: 'ButtonPanel' } 
        }));
      }
    });
    
    buttonContainer.appendChild(buttonComponent);
    window.ESA.components.buttonPanel = buttonComponent;
    
    // 🔑 KEY: Also register with AI INGESTION (this component BELONGS to Ingestion!)
    if (window.ESA.ingestion && window.ESA.ingestion.components) {
      window.ESA.ingestion.components.buttonPanel = buttonComponent;
      console.log(`%c[ESA.ButtonPanel] 📦 Registered with AI Ingestion Chat Box`, 
        `color: ${activeTheme.aqua}`);
    }
    
    // Register with GSAP Transport
    if (transport) {
      transport.registerComponent('ESA.ButtonPanel', buttonContainer, [
        'capture:image',
        'capture:file',
        'ingestion:input',  // ← All captures are Ingestion inputs!
        'component:mount'
      ]);
    }
    
    logToConsole('      ✓ ButtonPanel mounted → AI INGESTION BOX (via GSAP Transport)', 'success');
    logToConsole('         📌 Owner: AI Ingestion Chat Box', 'info');
  } catch (error) {
    logToConsole('      ⚠ ButtonPanel mount error: ' + error.message, 'warning');
  }
}

/**
 * Mount ESA-Ptac-B (Service Broadcasting Sliding Card)
 * Connected to: ESA.InvPartsCard, ESA.workorder, ESA.DiagnosticCard, ESA.duckDB
 * Uses: GSAP Transport for state sync, Ava007 Voice for broadcasts
 */
async function mountPtacB(transport) {
  // PTAC-B is a SLIDING PANEL that mounts to body (fixed position)
  // It doesn't need a container element - it creates its own
  
  try {
    const ptacBComponent = ESAPtacB({});
    
    // PTAC-B appends itself to body as fixed-position sliding panel
    document.body.appendChild(ptacBComponent);
    
    window.ESA.components.ptacB = ptacBComponent;
    window.ESA.components.invPartsCardB = ptacBComponent; // Also reference as InvPartsCard-B
    
    // Register with GSAP Transport (ALL connections!)
    if (transport) {
      transport.registerComponent('ESA.Ptac-B', ptacBComponent, [
        // Workorder connections
        'workorder:create',
        'workorder:update',
        'workorder:complete',
        // Inventory/Parts connections
        'inventory:scan',
        'inventory:update',
        'part:lookup',
        'part:add',
        'part:order',
        // Diagnostic connections
        'diagnostic:code',
        'diagnostic:result',
        // Voice/Broadcast connections
        'voice:speak',
        'broadcast:start',
        'broadcast:stop',
        'broadcast:message',
        // Service connections
        'service:scheduled',
        'service:urgent',
        'service:completed',
        // Component lifecycle
        'ptac-b:panel',
        'ptac-b:tab',
        'ptac-b:hd-supply',
        'component:mount'
      ]);
      
      // Verify and log all connections
      console.log(`%c[ESA-Ptac-B] 🔗 Connected via GSAP Transport:`, `color: ${activeTheme.aqua}`);
      console.log(`   → ESA.duckDB: ${!!window.ESA.duckDB ? '✅' : '❌'}`);
      console.log(`   → ESA.InvPartsCard: ${!!window.ESA.components.invPartsCard ? '✅' : '❌'}`);
      console.log(`   → ESA.workorder: ${!!window.ESA.components.workorder ? '✅' : '❌'}`);
      console.log(`   → ESA.DiagnosticCard: ${!!window.ESA.components.diagnosticCard ? '✅' : '❌'}`);
      console.log(`   → GSAP Transport: ✅`);
    }
    
    logToConsole('      ✓ ESA-Ptac-B mounted (Service Broadcasting sliding card)', 'success');
    logToConsole('         📡 HD Supply: Seasons 9000 BTU PTAC (#223532)', 'info');
    logToConsole('         🔗 Connected to: duckDB, InvParts, Workorder, Diagnostics', 'info');
    
  } catch (error) {
    logToConsole('      ⚠ ESA-Ptac-B mount error: ' + error.message, 'warning');
  }
}

/**
 * Setup UI controls (theme toggle, etc.)
 * Uses GSAP Transport for event handling
 */
function setupUIControls(transport) {
  const themeToggle = document.getElementById('esa-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      toggleTheme();
      logToConsole('🌓 Theme toggled', 'info');
      
      // Send through GSAP Transport
      if (transport) {
        transport.send('theme:toggle', 1, {
          source: 'setupUIControls',
          metadata: { timestamp: Date.now() }
        });
      }
    });
  }
  
  // Listen for inventory scan events (from InvPartsCard) - via Transport
  if (transport) {
    transport.subscribe('inventory:scan', (data) => {
      logToConsole(`🎤 Inventory scan via Transport: intent=${data.intent}, value=${data.value}`, 'success');
    });
  }
  
  // Legacy DOM event listeners (for non-transport components)
  window.addEventListener('esa:inventory-scan', (e) => {
    logToConsole(`🎤 Inventory scan: ${e.detail.model} (${e.detail.inventory.total} units)`, 'success');
    
    // Also send through transport if available
    if (transport) {
      transport.send('inventory:scan', e.detail.inventory.total || 1, {
        source: 'esa:inventory-scan (legacy)',
        metadata: e.detail
      });
    }
  });
  
  // Listen for part order events
  window.addEventListener('esa:order-part', (e) => {
    logToConsole(`🛒 Order: ${e.detail.part.part} - ${e.detail.part.name}`, 'warning');
    
    if (transport) {
      transport.send('part:order', 1, {
        source: 'esa:order-part (legacy)',
        metadata: e.detail
      });
    }
  });
  
  // Listen for workorder completion events
  window.addEventListener('esa:workorder-completed', (e) => {
    logToConsole(`✅ Workorder completed: ${e.detail.workorderId} ($${e.detail.totalCost})`, 'success');
    
    if (transport) {
      transport.send('workorder:complete', 1, {
        source: 'esa:workorder-completed (legacy)',
        metadata: e.detail
      });
    }
  });
}

/**
 * Note: GSAP visual animations are now handled by
 * ESAGSAPTransport.wrapSandbox() - which wraps the ENTIRE
 * exoskeleton container with GSAP.
 * 
 * This function is kept for legacy fallback but
 * the PRIMARY animation/transport is now in:
 * → ESAGSAPTransport.wrapSandbox(container)
 * → Uses Tween Atoms for state transport
 * → Visual GSAP is secondary to transport function
 */
function runGSAPAnimations() {
  // GSAP Transport handles this now via wrapSandbox()
  // This is only a fallback if transport isn't available
  if (typeof gsap === 'undefined') return;
  if (window.ESA?.transport) {
    console.log('[ESA] GSAP animations handled by Transport layer');
    return; // Transport handles it
  }
  
  // Fallback: direct GSAP (no transport)
  console.warn('[ESA] Using fallback GSAP (no transport)');
  
  gsap.from('#esa-exoskeleton', {
    duration: 0.8,
    opacity: 0,
    y: 20,
    ease: 'power3.out'
  });
}

/**
 * Update status indicator
 */
function updateStatusIndicator(isOnline, text = null) {
  const statusDot = document.getElementById('esa-status');
  if (statusDot) {
    if (isOnline) {
      statusDot.classList.remove('offline');
      statusDot.classList.add('online');
      statusDot.nextElementSibling.textContent = text || 'Online';
    } else {
      statusDot.style.background = '#cc241d';
      statusDot.style.boxShadow = '0 0 8px #cc241d';
      statusDot.classList.remove('online');
      statusDot.nextElementSibling.textContent = text || 'Error';
    }
  }
}

/**
 * Console logging utility
 */
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
  entry.style.marginBottom = '2px';
  entry.style.fontFamily = "'Courier New', 'JetBrains Mono', monospace";
  entry.style.fontSize = '12px';
  entry.style.whiteSpace = 'pre-wrap';
  entry.textContent = message;
  
  consoleOutput.appendChild(entry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initESAExoskeleton);
} else {
  setTimeout(initESAExoskeleton, 100);
}

// Export for module usage
export default { initESAExoskeleton, logToConsole };
