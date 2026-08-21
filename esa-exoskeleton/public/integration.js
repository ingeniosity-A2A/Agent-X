/**
 * integration.js
 * ESA EXOSKELETON - Production Component Wiring
 * 
 * Loads and mounts all ESA modules silently
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
  // Initialize ESA namespace (minimal, no dev output)
  window.ESA = window.ESA || { 
    version: '3.0.0', 
    initialized: false,
    errors: [],
    ingestion: { instance: null, components: {} },
    components: {},
    mountedComponents: []
  };
  
  // ============================================
  // LOAD COMPONENTS
  // ============================================
  let ESAIngestion, ESAButtonPanel, ESADiagnosticCard, ESAInvPartsCardB, ESAWorkorder, ESAMaintenanceChecklist, themeModule;
  
  try {
    const [
      ingestionModule,
      buttonModule,
      diagnosticModule,
      partsModule,
      workorderModule,
      checklistModule,
      themeMod
    ] = await Promise.allSettled([
      import('./components/ESA.Ingestion.js'),
      import('./components/ESA.ButtonPanel.js'),
      import('./components/ESA.DiagnosticCard.js'),
      import('./components/ESA.invpartscard-B.js'),
      import('./components/ESA.workorder.js'),
      import('./components/ESA.MaintenanceChecklist.js'),
      import('./config/gruvbox-colors.js')
    ]);
    
    ESAIngestion = ingestionModule.status === 'fulfilled' ? ingestionModule.value.ESAIngestion : null;
    ESAButtonPanel = buttonModule.status === 'fulfilled' ? buttonModule.value.ESAButtonPanel : null;
    ESADiagnosticCard = diagnosticModule.status === 'fulfilled' ? diagnosticModule.value.ESADiagnosticCard : null;
    ESAInvPartsCardB = partsModule.status === 'fulfilled' ? partsModule.value.ESAInvPartsCardB : null;
    ESAWorkorder = workorderModule.status === 'fulfilled' ? workorderModule.value.ESAWorkorder : null;
    ESAMaintenanceChecklist = checklistModule.status === 'fulfilled' ? checklistModule.value.ESAMaintenanceChecklist : null;
    themeModule = themeMod.status === 'fulfilled' ? themeMod.value : null;
    
    // Log failures silently
    if (ingestionModule.status === 'rejected') {
      window.ESA.errors.push({ component: 'Ingestion', error: ingestionModule.reason });
    }
    if (buttonModule.status === 'rejected') {
      window.ESA.errors.push({ component: 'ButtonPanel', error: buttonModule.reason });
    }
    if (diagnosticModule.status === 'rejected') {
      window.ESA.errors.push({ component: 'DiagnosticCard', error: diagnosticModule.reason });
    }
    if (partsModule.status === 'rejected') {
      window.ESA.errors.push({ component: 'InvPartsCard', error: partsModule.reason });
    }
    if (workorderModule.status === 'rejected') {
      window.ESA.errors.push({ component: 'Workorder', error: workorderModule.reason });
    }
    if (checklistModule.status === 'rejected') {
      window.ESA.errors.push({ component: 'MaintenanceChecklist', error: checklistModule.reason });
    }
    
  } catch (err) {
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
          
          // Initialize SoundPanels and event listeners after mount
          if (mountResult.state && typeof mountResult.state.initSoundPanels === 'function') {
            setTimeout(() => {
              mountResult.state.initSoundPanels(mountResult.state, ingestionContainer);
            }, 100);
          }
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'Ingestion', phase: 'mount', error: err });
    }
  }
  
  // 2. BUTTON PANEL
  if (ESAButtonPanel && typeof ESAButtonPanel.mount === 'function') {
    try {
      const buttonContainer = document.getElementById('esa-button-panel');
      if (buttonContainer) {
        buttonContainer.innerHTML = '';
        buttonContainer.style.background = 'transparent';
        buttonContainer.style.border = 'none';
        buttonContainer.style.padding = '0';
        
        const mountResult = ESAButtonPanel.mount(buttonContainer, {
          onCapture: (file) => {
            window.dispatchEvent(new CustomEvent('esa:capture', { detail: { file, type: 'image' } }));
            if (window.ESA.ingestion?.handleFile) window.ESA.ingestion.handleFile(file, 'image');
          },
          onAttachment: (file, type) => {
            window.dispatchEvent(new CustomEvent('esa:attachment', { detail: { file, type } }));
            if (window.ESA.ingestion?.handleFile) window.ESA.ingestion.handleFile(file, type);
          }
        });
        
        if (mountResult) {
          window.ESA.components.buttonPanel = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          if (window.ESA.ingestion?.components) window.ESA.ingestion.components.buttonPanel = mountResult;
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'ButtonPanel', phase: 'mount', error: err });
    }
  }
  
  // 3. DIAGNOSTIC CARD
  if (ESADiagnosticCard && typeof ESADiagnosticCard.mount === 'function') {
    try {
      const diagnosticContainer = document.getElementById('esa-diagnostics');
      if (diagnosticContainer) {
        diagnosticContainer.innerHTML = '';
        const mountResult = ESADiagnosticCard.mount(diagnosticContainer);
        if (mountResult) {
          window.ESA.components.diagnosticCard = mountResult;
          window.ESA.mountedComponents.push(mountResult);
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'DiagnosticCard', phase: 'mount', error: err });
    }
  }
  
  // 4. BROADCAST PARTS CARD
  if (ESAInvPartsCardB && typeof ESAInvPartsCardB.mount === 'function') {
    try {
      const partsCardContainer = document.getElementById('esa-parts-card');
      if (partsCardContainer) {
        partsCardContainer.innerHTML = '';
        const mountResult = ESAInvPartsCardB.mount(partsCardContainer);
        if (mountResult) {
          window.ESA.components.invPartsCard = mountResult;
          window.ESA.mountedComponents.push(mountResult);
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'InvPartsCard', phase: 'mount', error: err });
    }
  }
  
  // 5. WORKORDER SYSTEM
  if (ESAWorkorder && typeof ESAWorkorder.mount === 'function') {
    try {
      const workorderContainer = document.getElementById('esa-workorder');
      if (workorderContainer) {
        workorderContainer.innerHTML = '';
        const mountResult = ESAWorkorder.mount(workorderContainer);
        if (mountResult) {
          window.ESA.components.workorder = mountResult;
          window.ESA.mountedComponents.push(mountResult);
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'Workorder', phase: 'mount', error: err });
    }
  }
  
  // 6. MAINTENANCE CHECKLIST
  if (ESAMaintenanceChecklist && typeof ESAMaintenanceChecklist.mount === 'function') {
    try {
      const checklistContainer = document.getElementById('esa-maintenance-checklist');
      if (checklistContainer) {
        checklistContainer.innerHTML = '';
        const mountResult = ESAMaintenanceChecklist.mount(checklistContainer);
        if (mountResult) {
          window.ESA.components.maintenanceChecklist = mountResult;
          window.ESA.mountedComponents.push(mountResult);
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'MaintenanceChecklist', phase: 'mount', error: err });
    }
  }
  
  // 7. GSAP ANIMATIONS (subtle entrance)
  try {
    if (typeof gsap !== 'undefined') {
      gsap.from('#esa-ingestion', { duration: 0.5, opacity: 0, y: 20, ease: 'power2.out' });
      gsap.from('#esa-diagnostics', { duration: 0.5, opacity: 0, y: 20, delay: 0.1, ease: 'power2.out' });
      gsap.from('#esa-parts-card', { duration: 0.5, opacity: 0, y: 20, delay: 0.15, ease: 'power2.out' });
      gsap.from('#esa-workorder', { duration: 0.5, opacity: 0, y: 20, delay: 0.2, ease: 'power2.out' });
      gsap.from('#esa-maintenance-checklist', { duration: 0.5, opacity: 0, y: 20, delay: 0.25, ease: 'power2.out' });
    }
  } catch (err) {
    // Animations non-critical
  }
  
  // ============================================
  // COMPLETE
  // ============================================
  window.ESA.initialized = true;
  
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
        buttonPanel: !!window.ESA.components.buttonPanel,
        maintenanceChecklist: !!window.ESA.components.maintenanceChecklist
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
        showError(`System initialization failed: ${err.message}`);
      });
    });
  } else {
    initESAExoskeleton().catch(err => {
      console.error('[ESA] Fatal:', err);
      showError(`System initialization failed: ${err.message}`);
    });
  }
} catch (err) {
  console.error('[ESA] Startup:', err);
  showError(`Startup error: ${err.message}`);
}

export { initESAExoskeleton };
export default { initESAExoskeleton };
