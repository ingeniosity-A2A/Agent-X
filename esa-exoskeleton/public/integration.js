/**
 * integration.js
 * ESA EXOSKELETON - Component Wiring
 * 
 * Renders actual ESA modules (not dev information)
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
  
  const app = document.getElementById('esa-exoskeleton');
  if (app) app.classList.add('visible');
}

// ============================================
// MAIN INITIALIZATION
// ============================================
async function initESAExoskeleton() {
  console.log('[ESA] Initializing...');
  
  // Setup minimal console logging
  const consoleOutput = document.getElementById('esa-console-output');
  let logMessage = null;
  
  if (consoleOutput) {
    logMessage = (msg, type = 'info') => {
      const colors = { info: '#ebdbb2', success: '#98971a', error: '#cc241d', warning: '#d79921' };
      try {
        const div = document.createElement('div');
        div.style.color = colors[type] || colors.info;
        div.style.margin = '2px 0';
        div.style.fontFamily = "'Courier New', monospace";
        div.style.fontSize = '11px';
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        consoleOutput.appendChild(div);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
      } catch (e) {}
    };
  } else {
    logMessage = (msg) => console.log(`[ESA] ${msg}`);
  }
  
  // Initialize ESA namespace
  window.ESA = window.ESA || { 
    version: '2.5.2', 
    initialized: false,
    errors: [],
    ingestion: { instance: null, components: {} },
    components: {},
    mountedComponents: [],
    log: logMessage
  };
  
  // ============================================
  // LOAD COMPONENTS
  // ============================================
  let ESAIngestion, ESAButtonPanel, ESADiagnosticCard, ESAInvPartsCardB, ESAWorkorder, themeModule;
  
  try {
    logMessage('Loading ESA modules...', 'info');
    
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
    
    ESAIngestion = ingestionModule.status === 'fulfilled' ? ingestionModule.value.ESAIngestion : null;
    ESAButtonPanel = buttonModule.status === 'fulfilled' ? buttonModule.value.ESAButtonPanel : null;
    ESADiagnosticCard = diagnosticModule.status === 'fulfilled' ? diagnosticModule.value.ESADiagnosticCard : null;
    ESAInvPartsCardB = partsModule.status === 'fulfilled' ? partsModule.value.ESAInvPartsCardB : null;
    ESAWorkorder = workorderModule.status === 'fulfilled' ? workorderModule.value.ESAWorkorder : null;
    themeModule = themeMod.status === 'fulfilled' ? themeMod.value : null;
    
    // Log failures quietly
    if (ingestionModule.status === 'rejected') {
      logMessage(`Ingestion: ${ingestionModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'Ingestion', error: ingestionModule.reason });
    }
    if (buttonModule.status === 'rejected') {
      logMessage(`ButtonPanel: ${buttonModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'ButtonPanel', error: buttonModule.reason });
    }
    if (diagnosticModule.status === 'rejected') {
      logMessage(`DiagnosticCard: ${diagnosticModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'DiagnosticCard', error: diagnosticModule.reason });
    }
    if (partsModule.status === 'rejected') {
      logMessage(`InvPartsCard: ${partsModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'InvPartsCard', error: partsModule.reason });
    }
    if (workorderModule.status === 'rejected') {
      logMessage(`Workorder: ${workorderModule.reason?.message}`, 'error');
      window.ESA.errors.push({ component: 'Workorder', error: workorderModule.reason });
    }
    
    logMessage('Modules loaded', 'success');
    
  } catch (err) {
    logMessage(`Import error: ${err.message}`, 'error');
    window.ESA.errors.push({ phase: 'import', error: err });
  }
  
  // Get active theme
  const activeTheme = themeModule?.activeTheme || {
    fg: '#ebdbb2', bg: '#282828', bg_soft: '#32302f',
    red: '#cc241d', green: '#98971a', yellow: '#d79921',
    blue: '#458588', purple: '#b16286', aqua: '#689d6a',
    orange: '#d65d0e', border: '#3c3836', shadow: 'rgba(0, 0, 0, 0.5)',
    fg_soft: '#a89984'
  };
  
  // ============================================
  // MOUNT COMPONENTS
  // ============================================
  
  // 1. AI INGESTION CHAT BOX
  if (ESAIngestion && typeof ESAIngestion.mount === 'function') {
    try {
      logMessage('Mounting AI Ingestion...', 'info');
      
      const ingestionContainer = document.getElementById('esa-ingestion');
      if (ingestionContainer) {
        ingestionContainer.innerHTML = '';
        const mountResult = ESAIngestion.mount(ingestionContainer);
        
        if (mountResult) {
          window.ESA.ingestion.instance = mountResult;
          window.ESA.ingestion.components.voice = mountResult.state?.audioEngine || null;
          window.ESA.mountedComponents.push(mountResult);
          
          window.ESA.ingestion.handleFile = (file, type) => {
            window.dispatchEvent(new CustomEvent('esa:ingestion-file', { detail: { file, type } }));
          };
          
          // Initialize SoundPanels separately (Arrow.js can't nest views)
          if (mountResult.state && typeof mountResult.state.initSoundPanels === 'function') {
            setTimeout(() => {
              mountResult.state.initSoundPanels(mountResult.state, ingestionContainer);
            }, 100);
          }
          
          logMessage('✓ AI Ingestion ready', 'success');
        } else {
          logMessage('✗ Ingestion mount failed', 'error');
        }
      }
    } catch (err) {
      logMessage(`Ingestion error: ${err.message}`, 'error');
      window.ESA.errors.push({ component: 'Ingestion', phase: 'mount', error: err });
    }
  }
  
  // 2. DIAGNOSTIC CARD
  if (ESADiagnosticCard && typeof ESADiagnosticCard.mount === 'function') {
    try {
      const diagnosticContainer = document.getElementById('esa-diagnostics');
      if (diagnosticContainer) {
        diagnosticContainer.innerHTML = '';
        const mountResult = ESADiagnosticCard.mount(diagnosticContainer);
        if (mountResult) {
          window.ESA.components.diagnosticCard = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          logMessage('✓ Diagnostic Card ready', 'success');
        }
      }
    } catch (err) {
      logMessage(`Diagnostic error: ${err.message}`, 'error');
    }
  }
  
  // 3. BROADCAST PARTS CARD
  if (ESAInvPartsCardB && typeof ESAInvPartsCardB.mount === 'function') {
    try {
      const partsCardContainer = document.getElementById('esa-parts-card');
      if (partsCardContainer) {
        partsCardContainer.innerHTML = '';
        const mountResult = ESAInvPartsCardB.mount(partsCardContainer);
        if (mountResult) {
          window.ESA.components.invPartsCard = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          logMessage('✓ Parts Card ready', 'success');
        }
      }
    } catch (err) {
      logMessage(`Parts error: ${err.message}`, 'error');
    }
  }
  
  // 4. WORKORDER SYSTEM
  if (ESAWorkorder && typeof ESAWorkorder.mount === 'function') {
    try {
      const workorderContainer = document.getElementById('esa-workorder');
      if (workorderContainer) {
        workorderContainer.innerHTML = '';
        const mountResult = ESAWorkorder.mount(workorderContainer);
        if (mountResult) {
          window.ESA.components.workorder = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          logMessage('✓ Workorder ready', 'success');
        }
      }
    } catch (err) {
      logMessage(`Workorder error: ${err.message}`, 'error');
    }
  }
  
  // 5. BUTTON PANEL
  if (ESAButtonPanel && typeof ESAButtonPanel.mount === 'function') {
    try {
      const buttonContainer = document.getElementById('esa-button-panel');
      if (buttonContainer) {
        buttonContainer.innerHTML = '';
        
        const mountResult = ESAButtonPanel.mount(buttonContainer, {
          onCapture: (file) => {
            logMessage(`Image: ${file.name}`, 'success');
            window.dispatchEvent(new CustomEvent('esa:capture', { detail: { file, type: 'image' } }));
            if (window.ESA.ingestion?.handleFile) window.ESA.ingestion.handleFile(file, 'image');
          },
          onAttachment: (file, type) => {
            logMessage(`${type}: ${file.name}`, 'warning');
            window.dispatchEvent(new CustomEvent('esa:attachment', { detail: { file, type } }));
            if (window.ESA.ingestion?.handleFile) window.ESA.ingestion.handleFile(file, type);
          }
        });
        
        if (mountResult) {
          window.ESA.components.buttonPanel = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          if (window.ESA.ingestion?.components) window.ESA.ingestion.components.buttonPanel = mountResult;
          logMessage('✓ Button Panel ready', 'success');
        }
      }
    } catch (err) {
      logMessage(`ButtonPanel error: ${err.message}`, 'error');
    }
  }
  
  // 6. GSAP ANIMATIONS
  try {
    if (typeof gsap !== 'undefined') {
      gsap.from('#esa-console', { duration: 0.6, opacity: 0, y: 15, ease: 'power2.out' });
      gsap.from('#esa-ingestion', { duration: 0.6, opacity: 0, y: 15, delay: 0.1, ease: 'power2.out' });
      gsap.from('#esa-diagnostics', { duration: 0.6, opacity: 0, y: 15, delay: 0.2, ease: 'power2.out' });
      gsap.from('#esa-parts-card', { duration: 0.6, opacity: 0, y: 15, delay: 0.25, ease: 'power2.out' });
      gsap.from('#esa-workorder', { duration: 0.6, opacity: 0, y: 15, delay: 0.3, ease: 'power2.out' });
    }
  } catch (err) {
    // Animations non-critical
  }
  
  // ============================================
  // COMPLETE
  // ============================================
  window.ESA.initialized = true;
  
  logMessage('──────────────────────────────', 'info');
  logMessage('ESA SYSTEMS READY', 'success');
  logMessage(`Components: ${window.ESA.mountedComponents.length}/5 loaded`, 'info');
  
  if (window.ESA.errors.length > 0) {
    logMessage(`Warnings: ${window.ESA.errors.length}`, 'warning');
  }
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('esa:ready', { 
    detail: { 
      version: window.ESA.version,
      mountedCount: window.ESA.mountedComponents.length,
      components: {
        ingestion: !!window.ESA.ingestion?.instance,
        diagnosticCard: !!window.ESA.components.diagnosticCard,
        invPartsCard: !!window.ESA.components.invPartsCard,
        workorder: !!window.ESA.components.workorder,
        buttonPanel: !!window.ESA.components.buttonPanel
      }
    } 
  }));
  
  hideLoading();
  return window.ESA;
}

// ============================================
// START
// ============================================
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initESAExoskeleton().catch(err => {
        console.error('[ESA] Fatal:', err);
        showError(`Failed to initialize: ${err.message}`);
      });
    });
  } else {
    initESAExoskeleton().catch(err => {
      console.error('[ESA] Fatal:', err);
      showError(`Failed to initialize: ${err.message}`);
    });
  }
} catch (err) {
  console.error('[ESA] Startup:', err);
  showError(`Startup error: ${err.message}`);
}

export { initESAExoskeleton };
export default { initESAExoskeleton };
