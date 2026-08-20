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

// Import Components
import { ESAIngestion } from './components/ESA.Ingestion.js';
import { ESAButtonPanel } from './components/ESA.ButtonPanel.js';
import { ESADiagnosticCard } from './components/ESA.DiagnosticCard.js';
import { ESAInvPartsCardB } from './components/ESA.invpartscard-B.js';
import { ESAWorkorder } from './components/ESA.workorder.js';
import { activeTheme, toggleTheme } from './config/gruvbox-colors.js';

// Global ESA Namespace
window.ESA = window.ESA || { 
  version: '2.5.0', 
  initialized: false,
  
  // AI INGESTION CHAT BOX (OWNS Button + Voice!)
  ingestion: {
    instance: null,
    components: {
      buttonPanel: null,   // ESA.ButtonPanel belongs HERE
      voice: null          // Ava007 Voice belongs HERE
    }
  },
  
  // Other components
  components: {
    diagnosticCard: null,
    invPartsCard: null,
    workorder: null
  },
  
  // Logging
  log: null
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
  
  // ============================================
  // 1. ESA CONSOLE (Logging)
  // ============================================
  const consoleOutput = document.getElementById('esa-console-output');
  if (consoleOutput) {
    const logMessage = (msg, type = 'info') => {
      const colors = {
        info: activeTheme.fg,
        success: activeTheme.green,
        error: activeTheme.red,
        warning: activeTheme.yellow
      };
      
      const div = document.createElement('div');
      div.style.color = colors[type] || colors.info;
      div.style.margin = '2px 0';
      div.style.fontFamily = "'Courier New', 'JetBrains Mono', monospace";
      div.style.fontSize = '12px';
      div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      
      consoleOutput.appendChild(div);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };
    
    window.ESA.log = logMessage;
    logMessage('╔════════════════════════════════════════════════════╗', 'info');
    logMessage('║       ESA EXOSKELETON v2.5.0 INITIALIZING         ║', 'info');
    logMessage('╠════════════════════════════════════════════════════╣', 'info');
    logMessage('║  Button + Voice → AI INGESTION CHAT BOX          ║', 'info');
    logMessage('╚════════════════════════════════════════════════════╝', 'info');
    logMessage('', 'info');
  }
  
  // ============================================
  // 2. AI INGESTION CHAT BOX (OWNS BUTTON + VOICE!)
  // ============================================
  if (window.ESA.log) window.ESA.log('[1/6] Mounting AI INGESTION CHAT BOX...', 'info');
  
  const ingestionContainer = document.getElementById('esa-ingestion');
  if (ingestionContainer) {
    ingestionContainer.innerHTML = '';
    const ingestionComponent = ESAIngestion();
    ingestionContainer.appendChild(ingestionComponent);
    
    // Register as owner of Button + Voice
    window.ESA.ingestion.instance = ingestionComponent;
    window.ESA.ingestion.components.voice = ingestionComponent.state?.audioEngine || null;
    
    // Expose handleFile method for ButtonPanel
    window.ESA.ingestion.handleFile = (file, type) => {
      // Find the component's handleFile method
      if (ingestionComponent.state) {
        // Trigger through the component
        window.dispatchEvent(new CustomEvent('esa:ingestion-file', {
          detail: { file, type }
        }));
      }
    };
    
    if (window.ESA.log) window.ESA.log('      ✓ AI INGESTION mounted (owns Button + Voice)', 'success');
  }
  
  // ============================================
  // 3. ESA DIAGNOSTIC CARD
  // ============================================
  if (window.ESA.log) window.ESA.log('[2/6] Mounting Diagnostic Card...', 'info');
  
  const diagnosticContainer = document.getElementById('esa-diagnostics');
  if (diagnosticContainer) {
    diagnosticContainer.innerHTML = '';
    const diagComponent = ESADiagnosticCard();
    diagnosticContainer.appendChild(diagComponent);
    window.ESA.components.diagnosticCard = diagComponent;
    
    if (window.ESA.log) window.ESA.log('      ✓ Diagnostic Card with Ava007 voice mounted', 'success');
  }
  
  // ============================================
  // 4. ESA BROADCAST PARTS CARD
  // ============================================
  if (window.ESA.log) window.ESA.log('[3/6] Mounting Broadcast Parts Card...', 'info');
  
  const partsCardContainer = document.getElementById('esa-parts-card');
  if (partsCardContainer) {
    partsCardContainer.innerHTML = '';
    const partsComponent = ESAInvPartsCardB();
    partsCardContainer.appendChild(partsComponent);
    window.ESA.components.invPartsCard = partsComponent;
    
    if (window.ESA.log) window.ESA.log('      ✓ Broadcast Parts Card (HD Supply #223532) mounted', 'success');
  }
  
  // ============================================
  // 5. ESA WORKORDER SYSTEM
  // ============================================
  if (window.ESA.log) window.ESA.log('[4/6] Mounting Workorder System...', 'info');
  
  const workorderContainer = document.getElementById('esa-workorder');
  if (workorderContainer) {
    workorderContainer.innerHTML = '';
    const workorderComponent = ESAWorkorder();
    workorderContainer.appendChild(workorderComponent);
    window.ESA.components.workorder = workorderComponent;
    
    if (window.ESA.log) window.ESA.log('      ✓ Unified Workorder system mounted', 'success');
  }
  
  // ============================================
  // 6. ESA BUTTON PANEL (BELONGS TO INGESTION!)
  // ============================================
  if (window.ESA.log) window.ESA.log('[5/6] Mounting Button Panel → AI INGESTION...', 'info');
  
  const buttonContainer = document.getElementById('esa-button-panel');
  if (buttonContainer) {
    buttonContainer.innerHTML = '';
    const buttonComponent = ESAButtonPanel({
      // All captures go to INGESTION (parent)!
      onCapture: (file) => {
        console.log(`%c[ESA] 📸 Image captured: ${file.name} → INGESTION`, `color: ${activeTheme.green}`);
        if (window.ESA.log) window.ESA.log(`📸 Image captured: ${file.name} → Ingestion`, 'success');
        
        // Send to Ingestion (this is where Button BELONGS!)
        window.dispatchEvent(new CustomEvent('esa:capture', { 
          detail: { file, type: 'image', source: 'ButtonPanel→Ingestion' } 
        }));
        
        // Also try direct ingestion handle
        if (window.ESA.ingestion?.handleFile) {
          window.ESA.ingestion.handleFile(file, 'image');
        }
      },
      
      onAttachment: (file, type) => {
        console.log(`%c[ESA] 📎 ${type.toUpperCase()}: ${file.name} → INGESTION`, `color: ${activeTheme.yellow}`);
        if (window.ESA.log) window.ESA.log(`📎 ${type.toUpperCase()}: ${file.name} → Ingestion`, 'warning');
        
        // Send to Ingestion
        window.dispatchEvent(new CustomEvent('esa:attachment', { 
          detail: { file, type, source: 'ButtonPanel→Ingestion' } 
        }));
        
        // Also try direct ingestion handle
        if (window.ESA.ingestion?.handleFile) {
          window.ESA.ingestion.handleFile(file, type);
        }
      }
    });
    
    buttonContainer.appendChild(buttonComponent);
    window.ESA.components.buttonPanel = buttonComponent;
    
    // ALSO register with Ingestion (since it belongs there!)
    if (window.ESA.ingestion && window.ESA.ingestion.components) {
      window.ESA.ingestion.components.buttonPanel = buttonComponent;
    }
    
    if (window.ESA.log) {
      window.ESA.log('      ✓ Button Panel mounted → AI INGESTION BOX', 'success');
      window.ESA.log('         📌 Owner: AI Ingestion Chat Box', 'info');
    }
  }
  
  // ============================================
  // GSAP ANIMATIONS
  // ============================================
  if (typeof gsap !== 'undefined') {
    if (window.ESA.log) window.ESA.log('[6/6] Running GSAP animations...', 'info');
    
    gsap.from('#esa-console', { duration: 0.8, opacity: 0, y: 20, ease: 'power3.out' });
    gsap.from('#esa-ingestion', { duration: 0.8, opacity: 0, y: 20, delay: 0.2, ease: 'power3.out' });
    gsap.from('#esa-diagnostics', { duration: 0.8, opacity: 0, y: 20, delay: 0.4, ease: 'power3.out' });
    gsap.from('#esa-parts-card', { duration: 0.8, opacity: 0, y: 20, delay: 0.5, ease: 'power3.out' });
    gsap.from('#esa-workorder', { duration: 0.8, opacity: 0, y: 20, delay: 0.6, ease: 'power3.out' });
  }
  
  // ============================================
  // INITIALIZATION COMPLETE
  // ============================================
  window.ESA.initialized = true;
  
  const endTime = performance.now();
  const initTime = (endTime - startTime).toFixed(2);
  
  if (window.ESA.log) {
    window.ESA.log('', 'info');
    window.ESA.log('╔════════════════════════════════════════════════════╗', 'success');
    window.ESA.log('║       ESA EXOSKELETON v2.5.0 - READY              ║', 'success');
    window.ESA.log(`║       Initialized in ${initTime}ms                    ║`, 'success');
    window.ESA.log('║                                              ║', 'success');
    window.ESA.log('║  ✅ AI Ingestion Chat Box (owns Button+Voice)  ║', 'success');
    window.ESA.log('║  ✅ Diagnostic Card (Ava007 Voice)             ║', 'success');
    window.ESA.log('║  ✅ Broadcast Parts Card (HD Supply)           ║', 'success');
    window.ESA.log('║  ✅ Unified Workorder System                   ║', 'success');
    window.ESA.log('║  ✅ Button Panel (→ Ingestion)                 ║', 'success');
    window.ESA.log('╚════════════════════════════════════════════════════╝', 'success');
    window.ESA.log('', 'success');
    window.ESA.log('✅ System Ready - Ava007 standing by', 'success');
  }
  
  console.log(`%c[ESA] ✅ ESA EXOSKELETON v${window.ESA.version} ready (${initTime}ms)`, 
    `color: ${activeTheme.green}; font-weight: bold`);
  console.log(`%c[ESA] 📌 Button + Voice → AI Ingestion Chat Box`, 
    `color: ${activeTheme.aqua}`);
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('esa:ready', { 
    detail: { 
      version: window.ESA.version,
      initTime,
      components: {
        ingestion: !!window.ESA.ingestion?.instance,
        diagnosticCard: !!window.ESA.components.diagnosticCard,
        invPartsCard: !!window.ESA.components.invPartsCard,
        workorder: !!window.ESA.components.workorder,
        buttonPanel: !!window.ESA.components.buttonPanel
      }
    } 
  }));
  
  return window.ESA;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initESAExoskeleton);
} else {
  setTimeout(initESAExoskeleton, 100);
}

// Export for module usage
export default { initESAExoskeleton };
