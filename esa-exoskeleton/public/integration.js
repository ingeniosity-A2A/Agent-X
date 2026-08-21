/**
 * integration.js
 * Component wiring for ESA EXOSKELETON v2.5.0
 * 
 * ARCHITECTURE:
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │                  CYBERNETIC AVA007                      │
 * │              (Voice belongs to AI INGESTION)            │
 * └──────────────────────┬──────────────────────────────────┘
 *                         │ intent
 *                         ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │              GSAP TRANSPORT LAYER                       │
 * │              • Tween atoms (state sync)                 │
 * │              • Temporal orchestrator                    │
 * │              • Bandwidth-efficient transport            │
 * └──────────────────────┬──────────────────────────────────┘
 *                         │
 *                         ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │            ARROW.JS SANDBOX (components)                │
 * │                                                         │
 * │  ┌─────────────────────────────────────────────────┐   │
 * │  │  AI INGESTION CHAT BOX (owns Button + Voice!)   │   │
 * │  │  ├─ ESA.Ingestion (Chat Core + Audio Engine)    │   │
 * │  │  ├─ ESA.SoundPanel (Left - Mic Input)           │   │
 * │  │  ├─ ESA.SoundPanel (Right - Voice Output)       │   │
 * │  │  └─ ESA.ButtonPanel (Camera/Upload → Ingestion) │   │
 * │  └─────────────────────────────────────────────────┘   │
 * │                                                         │
 * │  • ESA.workorder                                       │
 * │  • ESA.InvPartsCard-B (Broadcast Parts)                │
 * │  • ESA.DiagnosticCard (PTAC Diagnostics)               │
 * └─────────────────────────────────────────────────────────┘
 * 
 * KEY: Button Panel + Voice BELONG TO AI Ingestion Box!
 */

// ============================================
// UTILITY: Show/Hide Loading & Error States
// ============================================
function hideLoading() {
  const loading = document.getElementById('esa-loading');
  const app = document.getElementById('esa-exoskeleton');
  if (loading) loading.classList.add('hidden');
  if (app) app.classList.add('visible');
}

function showError(message) {
  const errorScreen = document.getElementById('esa-error');
  const errorMessage = document.getElementById('esa-error-message');
  const loading = document.getElementById('esa-loading');
  
  if (loading) loading.classList.add('hidden');
  if (errorMessage) errorMessage.textContent = message;
  if (errorScreen) errorScreen.classList.add('visible');
  
  // Still show the app in background
  const app = document.getElementById('esa-exoskeleton');
  if (app) app.classList.add('visible');
}

// ============================================
// MAIN INITIALIZATION (with error handling)
// ============================================
async function initESAExoskeleton() {
  const startTime = performance.now();
  
  console.log('%c[ESA] 🚀 Initializing ESA EXOSKELETON v2.5.0...', 
    'color: #689d6a; font-weight: bold');
  
  // Setup console logging first
  const consoleOutput = document.getElementById('esa-console-output');
  let logMessage = null;
  
  if (consoleOutput) {
    logMessage = (msg, type = 'info') => {
      const colors = {
        info: '#ebdbb2',
        success: '#98971a',
        error: '#cc241d',
        warning: '#d79921'
      };
      
      try {
        const div = document.createElement('div');
        div.style.color = colors[type] || colors.info;
        div.style.margin = '2px 0';
        div.style.fontFamily = "'Courier New', 'JetBrains Mono', monospace";
        div.style.fontSize = '12px';
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        
        consoleOutput.appendChild(div);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
      } catch (e) {
        console.log(`[ESA] ${msg}`);
      }
    };
    
    logMessage('╔════════════════════════════════════════════════════╗', 'info');
    logMessage('║       ESA EXOSKELETON v2.5.0 INITIALIZING         ║', 'info');
    logMessage('╠════════════════════════════════════════════════════╣', 'info');
    logMessage('║  Button + Voice → AI INGESTION CHAT BOX          ║', 'info');
    logMessage('╚════════════════════════════════════════════════════╝', 'info');
    logMessage('', 'info');
  } else {
    logMessage = (msg, type) => console.log(`[ESA] ${msg}`);
  }
  
  // Initialize ESA namespace
  window.ESA = window.ESA || { 
    version: '2.5.0', 
    initialized: false,
    errors: [],
    
    // AI INGESTION CHAT BOX (OWNS Button + Voice!)
    ingestion: {
      instance: null,
      components: {
        buttonPanel: null,
        voice: null
      }
    },
    
    // Other components
    components: {
      diagnosticCard: null,
      invPartsCard: null,
      workorder: null
    },
    
    log: logMessage
  };
  
  // ============================================
  // LOAD COMPONENTS WITH ERROR HANDLING
  // ============================================
  let ESAIngestion, ESAButtonPanel, ESADiagnosticCard, ESAInvPartsCardB, ESAWorkorder, themeModule;
  
  // Try to load Arrow.js and components
  try {
    logMessage('[LOAD] Importing Arrow.js from esm.sh...', 'info');
    
    // Load all components
    const [
      ingestionModule,
      buttonModule,
      diagnosticModule,
      partsModule,
      workorderModule,
      themeMod
    ] = await Promise.allSettled([
      import('./components/ESA.Ingestion.js'),
      import('./components/ESA.ButtonPanel.js'),
      import('./components/ESA.DiagnosticCard.js'),
      import('./components/ESA.invpartscard-B.js'),
      import('./components/ESA.workorder.js'),
      import('./config/gruvbox-colors.js')
    ]);
    
    // Extract successful imports
    ESAIngestion = ingestionModule.status === 'fulfilled' ? ingestionModule.value.ESAIngestion : null;
    ESAButtonPanel = buttonModule.status === 'fulfilled' ? buttonModule.value.ESAButtonPanel : null;
    ESADiagnosticCard = diagnosticModule.status === 'fulfilled' ? diagnosticModule.value.ESADiagnosticCard : null;
    ESAInvPartsCardB = partsModule.status === 'fulfilled' ? partsModule.value.ESAInvPartsCardB : null;
    ESAWorkorder = workorderModule.status === 'fulfilled' ? workorderModule.value.ESAWorkorder : null;
    themeModule = themeMod.status === 'fulfilled' ? themeMod.value : null;
    
    // Log any import failures
    if (ingestionModule.status === 'rejected') {
      logMessage(`[ERROR] Ingestion module failed: ${ingestionModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'Ingestion', error: ingestionModule.reason });
    }
    if (buttonModule.status === 'rejected') {
      logMessage(`[ERROR] ButtonPanel module failed: ${buttonModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'ButtonPanel', error: buttonModule.reason });
    }
    if (diagnosticModule.status === 'rejected') {
      logMessage(`[ERROR] DiagnosticCard module failed: ${diagnosticModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'DiagnosticCard', error: diagnosticModule.reason });
    }
    if (partsModule.status === 'rejected') {
      logMessage(`[ERROR] InvPartsCard module failed: ${partsModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'InvPartsCard', error: partsModule.reason });
    }
    if (workorderModule.status === 'rejected') {
      logMessage(`[ERROR] Workorder module failed: ${workorderModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'Workorder', error: workorderModule.reason });
    }
    
    logMessage('[LOAD] All module imports complete', 'success');
    
  } catch (err) {
    logMessage(`[FATAL] Module import error: ${err.message}`, 'error');
    console.error('[ESA] Import error:', err);
    window.ESA.errors.push({ phase: 'import', error: err });
  }
  
  // Get active theme (with fallback)
  const activeTheme = themeModule?.activeTheme || {
    fg: '#ebdbb2', bg: '#282828', bg_soft: '#32302f',
    red: '#cc241d', green: '#98971a', yellow: '#d79921',
    blue: '#458588', purple: '#b16286', aqua: '#689d6a',
    orange: '#d65d0e', border: '#3c3836', shadow: 'rgba(0, 0, 0, 0.5)',
    fg_soft: '#a89984'
  };
  
  // ============================================
  // MOUNT COMPONENTS (with individual error handling)
  // ============================================
  
  // 1. AI INGESTION CHAT BOX
  if (ESAIngestion) {
    try {
      logMessage('[1/6] Mounting AI INGESTION CHAT BOX...', 'info');
      
      const ingestionContainer = document.getElementById('esa-ingestion');
      if (ingestionContainer) {
        // Remove fallback
        const fallback = ingestionContainer.querySelector('.esa-fallback');
        if (fallback) fallback.remove();
        
        ingestionContainer.innerHTML = '';
        const ingestionComponent = ESAIngestion();
        ingestionContainer.appendChild(ingestionComponent);
        
        window.ESA.ingestion.instance = ingestionComponent;
        window.ESA.ingestion.components.voice = ingestionComponent.state?.audioEngine || null;
        
        window.ESA.ingestion.handleFile = (file, type) => {
          if (ingestionComponent.state) {
            window.dispatchEvent(new CustomEvent('esa:ingestion-file', {
              detail: { file, type }
            }));
          }
        };
        
        logMessage('      ✓ AI INGESTION mounted (owns Button + Voice)', 'success');
      }
    } catch (err) {
      logMessage(`[ERROR] Ingestion mount failed: ${err.message}`, 'error');
      window.ESA.errors.push({ component: 'Ingestion', phase: 'mount', error: err });
    }
  } else {
    logMessage('[SKIP] Ingestion component not available', 'warning');
  }
  
  // 2. DIAGNOSTIC CARD
  if (ESADiagnosticCard) {
    try {
      logMessage('[2/6] Mounting Diagnostic Card...', 'info');
      
      const diagnosticContainer = document.getElementById('esa-diagnostics');
      if (diagnosticContainer) {
        diagnosticContainer.innerHTML = '';
        const diagComponent = ESADiagnosticCard();
        diagnosticContainer.appendChild(diagComponent);
        window.ESA.components.diagnosticCard = diagComponent;
        
        logMessage('      ✓ Diagnostic Card with Ava007 voice mounted', 'success');
      }
    } catch (err) {
      logMessage(`[ERROR] DiagnosticCard mount failed: ${err.message}`, 'error');
      window.ESA.errors.push({ component: 'DiagnosticCard', phase: 'mount', error: err });
    }
  } else {
    logMessage('[SKIP] DiagnosticCard component not available', 'warning');
  }
  
  // 3. BROADCAST PARTS CARD
  if (ESAInvPartsCardB) {
    try {
      logMessage('[3/6] Mounting Broadcast Parts Card...', 'info');
      
      const partsCardContainer = document.getElementById('esa-parts-card');
      if (partsCardContainer) {
        partsCardContainer.innerHTML = '';
        const partsComponent = ESAInvPartsCardB();
        partsCardContainer.appendChild(partsComponent);
        window.ESA.components.invPartsCard = partsComponent;
        
        logMessage('      ✓ Broadcast Parts Card (HD Supply #223532) mounted', 'success');
      }
    } catch (err) {
      logMessage(`[ERROR] InvPartsCard mount failed: ${err.message}`, 'error');
      window.ESA.errors.push({ component: 'InvPartsCard', phase: 'mount', error: err });
    }
  } else {
    logMessage('[SKIP] InvPartsCard component not available', 'warning');
  }
  
  // 4. WORKORDER SYSTEM
  if (ESAWorkorder) {
    try {
      logMessage('[4/6] Mounting Workorder System...', 'info');
      
      const workorderContainer = document.getElementById('esa-workorder');
      if (workorderContainer) {
        workorderContainer.innerHTML = '';
        const workorderComponent = ESAWorkorder();
        workorderContainer.appendChild(workorderComponent);
        window.ESA.components.workorder = workorderComponent;
        
        logMessage('      ✓ Unified Workorder system mounted', 'success');
      }
    } catch (err) {
      logMessage(`[ERROR] Workorder mount failed: ${err.message}`, 'error');
      window.ESA.errors.push({ component: 'Workorder', phase: 'mount', error: err });
    }
  } else {
    logMessage('[SKIP] Workorder component not available', 'warning');
  }
  
  // 5. BUTTON PANEL (BELONGS TO INGESTION!)
  if (ESAButtonPanel) {
    try {
      logMessage('[5/6] Mounting Button Panel → AI INGESTION...', 'info');
      
      const buttonContainer = document.getElementById('esa-button-panel');
      if (buttonContainer) {
        // Remove fallback
        const fallback = buttonContainer.querySelector('.esa-fallback');
        if (fallback) fallback.remove();
        
        buttonContainer.innerHTML = '';
        const buttonComponent = ESAButtonPanel({
          onCapture: (file) => {
            console.log(`%c[ESA] 📸 Image captured: ${file.name} → INGESTION`, 'color: #98971a');
            logMessage(`📸 Image captured: ${file.name} → Ingestion`, 'success');
            
            window.dispatchEvent(new CustomEvent('esa:capture', { 
              detail: { file, type: 'image', source: 'ButtonPanel→Ingestion' } 
            }));
            
            if (window.ESA.ingestion?.handleFile) {
              window.ESA.ingestion.handleFile(file, 'image');
            }
          },
          
          onAttachment: (file, type) => {
            console.log(`%c[ESA] 📎 ${type.toUpperCase()}: ${file.name} → INGESTION`, 'color: #d79921');
            logMessage(`📎 ${type.toUpperCase()}: ${file.name} → Ingestion`, 'warning');
            
            window.dispatchEvent(new CustomEvent('esa:attachment', { 
              detail: { file, type, source: 'ButtonPanel→Ingestion' } 
            }));
            
            if (window.ESA.ingestion?.handleFile) {
              window.ESA.ingestion.handleFile(file, type);
            }
          }
        });
        
        buttonContainer.appendChild(buttonComponent);
        window.ESA.components.buttonPanel = buttonComponent;
        
        if (window.ESA.ingestion && window.ESA.ingestion.components) {
          window.ESA.ingestion.components.buttonPanel = buttonComponent;
        }
        
        logMessage('      ✓ Button Panel mounted → AI INGESTION BOX', 'success');
        logMessage('         📌 Owner: AI Ingestion Chat Box', 'info');
      }
    } catch (err) {
      logMessage(`[ERROR] ButtonPanel mount failed: ${err.message}`, 'error');
      window.ESA.errors.push({ component: 'ButtonPanel', phase: 'mount', error: err });
    }
  } else {
    logMessage('[SKIP] ButtonPanel component not available', 'warning');
  }
  
  // 6. GSAP ANIMATIONS
  try {
    if (typeof gsap !== 'undefined') {
      logMessage('[6/6] Running GSAP animations...', 'info');
      
      gsap.from('#esa-console', { duration: 0.8, opacity: 0, y: 20, ease: 'power3.out' });
      gsap.from('#esa-ingestion', { duration: 0.8, opacity: 0, y: 20, delay: 0.2, ease: 'power3.out' });
      gsap.from('#esa-diagnostics', { duration: 0.8, opacity: 0, y: 20, delay: 0.4, ease: 'power3.out' });
      gsap.from('#esa-parts-card', { duration: 0.8, opacity: 0, y: 20, delay: 0.5, ease: 'power3.out' });
      gsap.from('#esa-workorder', { duration: 0.8, opacity: 0, y: 20, delay: 0.6, ease: 'power3.out' });
      
      logMessage('      ✓ GSAP animations triggered', 'success');
    } else {
      logMessage('[WARN] GSAP not available - skipping animations', 'warning');
    }
  } catch (err) {
    logMessage(`[WARN] GSAP animation error: ${err.message}`, 'warning');
  }
  
  // ============================================
  // INITIALIZATION COMPLETE
  // ============================================
  window.ESA.initialized = true;
  
  const endTime = performance.now();
  const initTime = (endTime - startTime).toFixed(2);
  
  // Summary
  logMessage('', 'info');
  logMessage('╔════════════════════════════════════════════════════╗', 'success');
  logMessage('║       ESA EXOSKELETON v2.5.0 - READY              ║', 'success');
  logMessage(`║       Initialized in ${initTime}ms                    ║`, 'success');
  logMessage('║                                              ║', 'success');
  logMessage(`║  ${window.ESA.ingestion.instance ? '✅' : '⚠️'} AI Ingestion Chat Box (owns Button+Voice)  ║`, 'success');
  logMessage(`║  ${window.ESA.components.diagnosticCard ? '✅' : '⚠️'} Diagnostic Card (Ava007 Voice)             ║`, 'success');
  logMessage(`║  ${window.ESA.components.invPartsCard ? '✅' : '⚠️'} Broadcast Parts Card (HD Supply)           ║`, 'success');
  logMessage(`║  ${window.ESA.components.workorder ? '✅' : '⚠️'} Unified Workorder System                   ║`, 'success');
  logMessage(`║  ${window.ESA.components.buttonPanel ? '✅' : '⚠️'} Button Panel (→ Ingestion)                 ║`, 'success');
  logMessage('╚════════════════════════════════════════════════════╝', 'success');
  
  if (window.ESA.errors.length > 0) {
    logMessage('', 'warning');
    logMessage(`⚠️ ${window.ESA.errors.length} error(s) occurred during initialization`, 'warning');
  } else {
    logMessage('', 'success');
    logMessage('✅ All systems operational - Ava007 standing by', 'success');
  }
  
  console.log(`%c[ESA] ✅ ESA EXOSKELETON v${window.ESA.version} ready (${initTime}ms)`, 
    'color: #98971a; font-weight: bold');
  console.log(`%c[ESA] 📌 Button + Voice → AI Ingestion Chat Box`, 
    'color: #689d6a');
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('esa:ready', { 
    detail: { 
      version: window.ESA.version,
      initTime,
      errors: window.ESA.errors.length,
      components: {
        ingestion: !!window.ESA.ingestion?.instance,
        diagnosticCard: !!window.ESA.components.diagnosticCard,
        invPartsCard: !!window.ESA.components.invPartsCard,
        workorder: !!window.ESA.components.workorder,
        buttonPanel: !!window.ESA.components.buttonPanel
      }
    } 
  }));
  
  // HIDE LOADING SCREEN
  hideLoading();
  
  return window.ESA;
}

// ============================================
// START INITIALIZATION
// ============================================
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initESAExoskeleton().catch(err => {
        console.error('[ESA] Fatal initialization error:', err);
        showError(`Failed to initialize: ${err.message}\n\nCheck browser console for details.`);
      });
    });
  } else {
    initESAExoskeleton().catch(err => {
      console.error('[ESA] Fatal initialization error:', err);
      showError(`Failed to initialize: ${err.message}\n\nCheck browser console for details.`);
    });
  }
} catch (err) {
  console.error('[ESA] Startup error:', err);
  showError(`Startup error: ${err.message}`);
}

// Export for external use
export { initESAExoskeleton };
export default { initESAExoskeleton };
