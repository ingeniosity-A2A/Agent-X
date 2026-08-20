/**
 * integration.js
 * Component wiring for ESA EXOSKELETON
 * 
 * Cards render from CONSOLE (not their own page)
 * - ESA.DiagnosticCard (PTAC diagnostics with Ava007)
 * - ESA.InvPartsCard-B (Inventory Parts with quantities)
 * - ESA.Workorder (Unified Maintenance System)
 * - ESA.ButtonPanel (Camera + attachments)
 */

import { ESAButtonPanel } from './components/ESA.ButtonPanel.js';
import { ESADiagnosticCard } from './components/ESA.DiagnosticCard.js';
import { ESAInvPartsCardB } from './components/ESA.InvPartsCard-B.js';
import { ESAWorkorder } from './components/ESA.workorder.js';
import { ESASandboxManager } from './components/ESA.SandboxManager.js';
import { initDuckDB } from './config/duckdb-setup.js';
import { activeTheme, toggleTheme } from './config/gruvbox-colors.js';

// Global ESA namespace
window.ESA = {
  version: '2.1.0',
  initialized: false,
  ingestion: null,
  duckDB: null,
  sandbox: null,
  
  // Component references (rendered from Console)
  components: {
    diagnosticCard: null,
    invPartsCard: null,
    workorder: null,
    buttonPanel: null
  },
  
  // Expose methods for external components to hook into
  registerIngestion: (ingestionInstance) => {
    window.ESA.ingestion = ingestionInstance;
    logToConsole('[ESA] Ingestion component registered', 'success');
  },
  
  // Log to console utility
  log: (message, level = 'info') => {
    logToConsole(message, level);
  },
  
  // Get current status
  getStatus: () => ({
    initialized: window.ESA.initialized,
    version: window.ESA.version,
    hasDuckDB: !!window.ESA.duckDB,
    hasSandbox: !!window.ESA.sandbox,
    hasIngestion: !!window.ESA.ingestion,
    components: {
      diagnosticCard: !!window.ESA.components.diagnosticCard,
      invPartsCard: !!window.ESA.components.invPartsCard,
      workorder: !!window.ESA.components.workorder,
      buttonPanel: !!window.ESA.components.buttonPanel
    }
  })
};

/**
 * Main initialization function
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
  logToConsole('╚════════════════════════════════════════════════════╝', 'info');
  logToConsole('', 'info');
  
  try {
    // 1. Initialize DuckDB with EXISTING catalog
    logToConsole('[1/7] Initializing DuckDB WASM...', 'info');
    const { conn } = await initDuckDB();
    window.ESA.duckDB = { conn };
    logToConsole('      ✓ DuckDB WASM ready (existing catalog)', 'success');
    
    // 2. Mount ESA.DiagnosticCard (in Console area)
    logToConsole('[2/7] Mounting DiagnosticCard component...', 'info');
    await mountDiagnosticCard();
    
    // 3. Mount ESA.InvPartsCard-B (in Console area, longer card)
    logToConsole('[3/7] Mounting InvPartsCard-B component...', 'info');
    await mountInvPartsCard();
    
    // 4. Mount ESA.Workorder (in main area)
    logToConsole('[4/7] Mounting Workorder component...', 'info');
    await mountWorkorder();
    
    // 5. Mount ESA.ButtonPanel (far right)
    logToConsole('[5/7] Mounting ButtonPanel component...', 'info');
    await mountButtonPanel();
    
    // 6. Initialize sandbox
    logToConsole('[6/7] Initializing Sandbox Manager...', 'info');
    const sandboxContainer = document.getElementById('esa-sandbox');
    if (sandboxContainer) {
      const sandboxResult = await ESASandboxManager({
        container: sandboxContainer,
        components: [
          { name: 'ESA.DiagnosticCard', verified: true },
          { name: 'ESA.InvPartsCard-B', verified: true },
          { name: 'ESA.ButtonPanel', verified: false }
        ],
        api: { 
          duckDB: { conn },
          version: window.ESA.version
        }
      });
      window.ESA.sandbox = sandboxResult;
      logToConsole('      ✓ Sandbox initialized (3 components)', 'success');
    }
    
    // 7. Setup UI controls
    logToConsole('[7/7] Setting up UI controls...', 'info');
    setupUIControls();
    
    // GSAP animations for all mounted components
    runGSAPAnimations();
    
    // Update status indicator
    updateStatusIndicator(true);
    
    window.ESA.initialized = true;
    
    const endTime = performance.now();
    const initTime = (endTime - startTime).toFixed(2);
    
    logToConsole('', 'info');
    logToConsole('╔════════════════════════════════════════════════════╗', 'success');
    logToConsole('║       ESA EXOSKELETON - READY                    ║', 'success');
    logToConsole(`║       Initialized in ${initTime}ms                    ║`, 'success');
    logToConsole('║       Components: Diagnostic, InvParts, Workorder ║', 'success');
    logToConsole('╚════════════════════════════════════════════════════╝', 'success');
    
    console.log(`%c[ESA] ✅ ESA EXOSKELETON ready (${initTime}ms)`, 
      `color: ${activeTheme.green}; font-weight: bold`);
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('esa:ready', { detail: window.ESA.getStatus() }));
    
    return window.ESA;
    
  } catch (error) {
    console.error(`%c[ESA] ❌ Initialization error: ${error.message}`, 
      `color: '#cc241d'; font-weight: bold`);
    logToConsole(`❌ Error: ${error.message}`, 'error');
    
    updateStatusIndicator(false, 'Error');
    throw error;
  }
}

/**
 * Mount ESA.DiagnosticCard in Console area
 */
async function mountDiagnosticCard() {
  const consoleArea = document.getElementById('esa-console-output');
  if (!consoleArea) {
    logToConsole('      ⚠ Console area not found for DiagnosticCard', 'warning');
    return;
  }
  
  // Create container for DiagnosticCard (renders INSIDE console area)
  const diagContainer = document.createElement('div');
  diagContainer.id = 'esa-diagnostic-card-container';
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
    logToConsole('      ✓ DiagnosticCard mounted in Console', 'success');
  } catch (error) {
    logToConsole('      ⚠ DiagnosticCard mount error: ' + error.message, 'warning');
  }
}

/**
 * Mount ESA.InvPartsCard-B in Console area (LONGER card)
 */
async function mountInvPartsCard() {
  // Find or create InvParts card area (below console, in main grid)
  let invPartsContainer = document.getElementById('esa-invparts-card-container');
  
  if (!invPartsContainer) {
    // Create container in the main area (between console and bottom grid)
    const mainGrid = document.querySelector('.esa-main-grid');
    if (mainGrid) {
      invPartsContainer = document.createElement('div');
      invPartsContainer.id = 'esa-invparts-card-container';
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
    logToConsole('      ✓ InvPartsCard-B mounted (longer card, no priority)', 'success');
  } catch (error) {
    logToConsole('      ⚠ InvPartsCard mount error: ' + error.message, 'warning');
  }
}

/**
 * Mount ESA.Workorder in main content area
 */
async function mountWorkorder() {
  // Find or create Workorder container (full width below main grid)
  let workorderContainer = document.getElementById('esa-workorder-container');
  
  if (!workorderContainer) {
    // Create container after the main grid
    const mainGrid = document.querySelector('.esa-main-grid');
    if (mainGrid) {
      workorderContainer = document.createElement('div');
      workorderContainer.id = 'esa-workorder-container';
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
    logToConsole('      ✓ Workorder mounted (Unified Maintenance System)', 'success');
  } catch (error) {
    logToConsole('      ⚠ Workorder mount error: ' + error.message, 'warning');
  }
}

/**
 * Mount ESA.ButtonPanel (far right position)
 */
async function mountButtonPanel() {
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
        
        // Send to Ingestion via Lens integration
        window.ESA.ingestion?.handleFile?.(file, 'image');
        
        // Dispatch for Lens/Ava007
        window.dispatchEvent(new CustomEvent('esa:capture', { 
          detail: { file, type: 'image', source: 'ButtonPanel' } 
        }));
      },
      onAttachment: (file, type) => {
        console.log(`%c[ESA] 📎 ${type.toUpperCase()}: ${file.name}`, `color: ${activeTheme.yellow}`);
        logToConsole(`📎 Attachment: ${file.name} (${type})`, 'warning');
        
        // Send to Ingestion
        window.ESA.ingestion?.handleFile?.(file, type);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('esa:attachment', { 
          detail: { file, type, source: 'ButtonPanel' } 
        }));
      }
    });
    
    buttonContainer.appendChild(buttonComponent);
    window.ESA.components.buttonPanel = buttonComponent;
    
    logToConsole('      ✓ ButtonPanel mounted (far right)', 'success');
  } catch (error) {
    logToConsole('      ⚠ ButtonPanel mount error: ' + error.message, 'warning');
  }
}

/**
 * Setup UI controls (theme toggle, etc.)
 */
function setupUIControls() {
  const themeToggle = document.getElementById('esa-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      toggleTheme();
      logToConsole('🌓 Theme toggled', 'info');
    });
  }
  
  // Listen for inventory scan events (from InvPartsCard)
  window.addEventListener('esa:inventory-scan', (e) => {
    logToConsole(`🎤 Inventory scan: ${e.detail.model} (${e.detail.inventory.total} units)`, 'success');
  });
  
  // Listen for part order events
  window.addEventListener('esa:order-part', (e) => {
    logToConsole(`🛒 Order: ${e.detail.part.part} - ${e.detail.part.name}`, 'warning');
  });
  
  // Listen for workorder completion events
  window.addEventListener('esa:workorder-completed', (e) => {
    logToConsole(`✅ Workorder completed: ${e.detail.workorderId} ($${e.detail.totalCost})`, 'success');
  });
}

/**
 * Run GSAP animations for all components
 */
function runGSAPAnimations() {
  if (typeof gsap === 'undefined') return;
  
  // Animate console
  gsap.from('#esa-console', {
    duration: 0.8,
    opacity: 0,
    y: 20,
    ease: 'power3.out'
  });
  
  // Animate sidebar (ingestion)
  gsap.from('#esa-ingestion', {
    duration: 0.8,
    opacity: 0,
    y: 20,
    delay: 0.2,
    ease: 'power3.out'
  });
  
  // Animate InvPartsCard (longer card)
  gsap.from('#esa-invparts-card-container', {
    duration: 0.8,
    opacity: 0,
    y: 30,
    delay: 0.3,
    ease: 'power3.out'
  });
  
  // Animate Workorder
  gsap.from('#esa-workorder-container', {
    duration: 0.8,
    opacity: 0,
    y: 40,
    delay: 0.35,
    ease: 'power3.out'
  });
  
  // Animate ButtonPanel (far right)
  gsap.from('#esa-button-panel', {
    duration: 0.8,
    opacity: 0,
    x: 20,
    delay: 0.4,
    ease: 'power3.out'
  });
  
  // Animate bottom area
  gsap.from('#esa-ingestion-bottom', {
    duration: 0.8,
    opacity: 0,
    y: 20,
    delay: 0.5,
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
