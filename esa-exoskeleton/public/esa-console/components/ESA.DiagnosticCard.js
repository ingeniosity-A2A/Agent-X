/**
 * ESA.DiagnosticCard.js (Arrow.js Compatible - FULLY FIXED)
 * ============================================
 * PTAC DIAGNOSTIC SERVICE PANEL
 * 
 * FIX 1: All ${} removed from style attributes (hardcoded styles only).
 * FIX 2: Template root <div> is now properly closed — Arrow.js threw
 *        "Invalid HTML position" on the unbalanced template.
 * FIX 3: Module-scope `methods` binding — scanForCodes and the post-mount
 *        block call methods.* which previously threw "methods is not defined".
 * Dynamic styling via post-mount DOM manipulation only.
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';
import { DynamicAudioBroadcaster } from './ESA.SoundPanel.js';

const PTAC_DIAGNOSTICS = {
  'FP': { status: 'Freeze Protection', severity: 'info', voice: 'Freeze protection mode engaged. Normal operation.', warranty: true },
  'F1': { status: 'Indoor Thermistor Fault', severity: 'critical', voice: 'Indoor ambient thermistor fault. Replace black thermistor.', warranty: true, repair: 'thermistor' },
  'F2': { status: 'Outdoor Thermistor Fault', severity: 'critical', voice: 'Outdoor ambient thermistor fault. Replace outdoor sensor.', warranty: true, repair: 'thermistor' },
  'F3': { status: 'Indoor Coil Thermistor Fault', severity: 'warning', voice: 'Indoor coil temperature sensor fault. Check connection.', warranty: true },
  'F4': { status: 'Outdoor Coil Thermistor Fault', severity: 'warning', voice: 'Outdoor coil sensor fault. Verify wiring.', warranty: true },
  'F5': { status: 'Discharge Thermistor Fault', severity: 'critical', voice: 'Discharge line thermistor fault. High risk of compressor damage.', warranty: false },
  'F6': { status: 'Indoor/Outdoor Comm Fault', severity: 'critical', voice: 'Communication error between indoor and outdoor units. Check wiring harness.', warranty: true },
  'C1': { status: 'Indoor Coil Freezing', severity: 'critical', voice: 'Indoor coil freezing detected. Check refrigerant charge and airflow.', warranty: false, replaceUnit: true },
  'C2': { status: 'Indoor Coil Sensor Fault', severity: 'warning', voice: 'Indoor coil temperature sensor out of range.', warranty: true },
  'C3': { status: 'Outdoor Coil Sensor Fault', severity: 'warning', voice: 'Outdoor coil sensor fault. May affect efficiency.', warranty: true },
  'C4': { status: 'Discharge Sensor Fault', severity: 'critical', voice: 'Discharge line temperature sensor critical fault.', warranty: false },
  'C5': { status: 'Room Sensor Fault', severity: 'warning', voice: 'Room temperature sensor fault. Unit will run on timer mode.', warranty: true },
  'Fd': { status: 'Fan Detection Fault', severity: 'warning', voice: 'Indoor fan speed feedback fault. Check fan motor and capacitor.', warranty: true },
  'Eo': { status: 'Unconfigured Board', severity: 'critical', voice: 'Unconfigured service board detected. Set C3 jumper.', warranty: true },
  'EH': { status: 'Electric Heat Fault', severity: 'critical', voice: 'Electric heat fault detected. Check heat strips.', warranty: true },
  'LS': { status: 'Loss of Power', severity: 'critical', voice: 'Power interruption detected. Check breaker.', warranty: true },
  'HP': { status: 'High Pressure', severity: 'critical', voice: 'High pressure switch tripped.', warranty: true },
  'UR': { status: 'Voltage Range Fault', severity: 'critical', voice: 'Voltage out of acceptable range.', warranty: false }
};

// Module-scope methods binding. Assigned right after the component below is
// created; the wrapper now exposes .methods. Lets methods call each other
// (methods.speak) and lets the post-mount block reach them.
let methods = null;

export const ESADiagnosticCard = ESAVerifyComponent({
  name: 'DiagnosticCard',
  version: '1.0.1',
  verified: true,
  
  state: {
    isSlidOpen: false,
    diagnosticCode: '',
    detectedCode: null,
    voiceEnabled: true,
    audioEngine: null,
    scanning: false
  },
  
  methods: {
    initAudio: (state) => {
      if (!state.audioEngine) {
        state.audioEngine = new DynamicAudioBroadcaster();
      }
    },
    
    speak: (state, text) => {
      if (!state.voiceEnabled) return;
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        
        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => 
          v.name.includes('Zira') || 
          v.name.includes('Samantha') || 
          v.name.includes('Female')
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        speechSynthesis.speak(utterance);
      }
      
      if (state.audioEngine) {
        state.audioEngine.triggerAvaVoice(440, 0.85);
      }
    },
    
    slideOpen: (state) => { 
      state.isSlidOpen = true; 
    },
    slideClose: (state) => { 
      state.isSlidOpen = false; 
    },
    
    scanForCodes: async (state) => {
      state.scanning = true;
      state.isSlidOpen = true;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const codes = Object.keys(PTAC_DIAGNOSTICS);
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      
      state.detectedCode = randomCode;
      state.diagnosticCode = randomCode;
      state.scanning = false;
      
      const diag = PTAC_DIAGNOSTICS[randomCode];
      methods.speak(state, `Diagnostic code ${randomCode} detected. ${diag.voice}`);
      
      window.dispatchEvent(new CustomEvent('esa:diagnostic', {
        detail: { code: randomCode, ...diag }
      }));
    },
    
    getRecommendation: (state, code) => {
      const diag = PTAC_DIAGNOSTICS[code];
      if (!diag) return null;
      
      return {
        code,
        status: diag.status,
        severity: diag.severity,
        voice: diag.voice,
        shouldReplace: diag.replaceUnit || false,
        warrantyStatus: diag.warranty ? 'under_warranty' : 'expired',
        repairType: diag.repair || 'service'
      };
    },
    
    updateSlideState: (state, container) => {
      // Update header arrow rotation
      const header = container.querySelector('#esa-diag-header-arrow');
      if (header) {
        header.style.transform = state.isSlidOpen ? 'rotate(180deg)' : 'rotate(0deg)';
      }
      
      // Update content panel visibility
      const content = container.querySelector('#esa-diag-content');
      if (content) {
        content.style.maxHeight = state.isSlidOpen ? '800px' : '0';
        content.style.opacity = state.isSlidOpen ? '1' : '0';
      }
    },
    
    renderResults: (state, container) => {
      const resultsContainer = container.querySelector('#esa-diag-results');
      if (!resultsContainer || !state.detectedCode) {
        if (resultsContainer) resultsContainer.innerHTML = '';
        return;
      }
      
      const recommendation = methods.getRecommendation(state, state.detectedCode);
      const diag = PTAC_DIAGNOSTICS[state.detectedCode];
      if (!recommendation) return;
      
      const isCritical = recommendation.severity === 'critical';
      const underWarranty = recommendation.warrantyStatus === 'under_warranty';
      const bgColor = isCritical ? '#cc241d' : '#458588';
      const warrantyBgColor = underWarranty ? '#98971a' : '#cc241d';
      const warrantyText = underWarranty ? '✓ UNDER WARRANTY' : '⚠ WARRANTY EXPIRED';
      
      let html = `
        <div style="background: ${bgColor}; color: #ebdbb2; padding: 16px; border-radius: 8px; margin-bottom: 16px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold;">CODE: ${state.detectedCode}</div>
          <div style="font-size: 14px; font-weight: bold;">${recommendation.status}</div>
        </div>
        
        <div style="background: ${warrantyBgColor}; color: #282828; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-weight: bold; text-align: center;">
          ${warrantyText}
        </div>
        
        <div style="margin-bottom: 16px;">
          <button id="esa-voice-btn" style="background: #b16286; color: #ebdbb2; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            🔊 REPEAT DIAGNOSIS (Ava007)
          </button>
        </div>
        
        <div style="background: #282828; border: 1px solid #3c3836; border-radius: 8px; padding: 16px;">
          <div style="font-weight: bold; margin-bottom: 8px; color: #689d6a;">VOICE GUIDANCE:</div>
          <div style="font-size: 13px;">${recommendation.voice}</div>
        </div>
      `;
      
      if (recommendation.shouldReplace) {
        html += `
          <div style="margin-top: 16px; padding: 12px; background: #cc241d; color: #ebdbb2; border-radius: 6px; text-align: center; font-weight: bold;">
            ⚠️ UNIT REPLACEMENT RECOMMENDED
          </div>
        `;
      }
      
      resultsContainer.innerHTML = html;
      
      // Re-attach voice button listener
      const voiceBtn = container.querySelector('#esa-voice-btn');
      if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
          if (state.detectedCode) {
            const rec = methods.getRecommendation(state, state.detectedCode);
            if (rec) methods.speak(state, rec.voice);
          }
        });
      }
    }
  },
  
  // Template with ALL HARDCODED STYLES - no ${} in any style attribute!
  template: (props, state, methods) => html`
    <div class="esa-diagnostic-card" style="position: relative; width: 100%; max-width: 600px; margin: 20px auto;">
      <div style="position: relative; background: #32302f; border: 2px solid #3c3836; border-radius: 12px; overflow: hidden; transition: all 0.4s ease; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);">
        
        <div
          id="esa-diag-header"
          style="background: linear-gradient(135deg, #458588, #b16286); color: #ebdbb2; padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">🔧</span>
            <div>
              <div style="font-weight: bold; font-size: 14px;">ESA DIAGNOSTIC SERVICE PANEL</div>
              <div style="font-size: 11px; opacity: 0.9;">Slide to reveal AI diagnostics</div>
            </div>
          </div>
          <div id="esa-diag-header-arrow" style="transition: transform 0.3s ease;">▼</div>
        </div>
        
        
        <div id="esa-diag-content" style="max-height: 0; opacity: 0; transition: all 0.4s ease; overflow: hidden;">
          <div style="padding: 20px;">
            
            <button
              id="esa-scan-btn"
              style="width: 100%; padding: 16px; background: #98971a; color: #282828; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer;"
            >
              🔍 SCAN FOR DIAGNOSTIC CODES
            </button>
            
            
            <div style="margin-top: 16px; display: flex; gap: 8px;">
              <input
                type="text"
                id="esa-diag-input"
                placeholder="Enter code (e.g., F1, C3)"
                maxlength="2"
                style="flex: 1; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 12px; border-radius: 6px; text-transform: uppercase; font-family: monospace; font-size: 18px; text-align: center;"
              />
              <button
                id="esa-analyze-btn"
                style="background: #458588; color: #ebdbb2; border: none; padding: 0 24px; border-radius: 6px; cursor: pointer; font-weight: bold;"
              >
                ANALYZE
              </button>
            </div>
          </div>
          
          
          <div id="esa-diag-results" style="padding: 0 20px 20px;"></div>
        </div>
      </div>
    </div>
    `
});

// Bind the component's methods for scanForCodes + the post-mount block below
methods = ESADiagnosticCard.methods;

// Setup event listeners after mount
const origDiagMount = ESADiagnosticCard.mount;
ESADiagnosticCard.mount = function(container) {
  const result = origDiagMount.call(this, container);
  
  setTimeout(() => {
    // Header click - toggle slide
    const header = container.querySelector('#esa-diag-header');
    if (header) {
      header.addEventListener('click', () => {
        if (this.state.isSlidOpen) {
          methods.slideClose(this.state);
        } else {
          methods.slideOpen(this.state);
        }
        methods.updateSlideState(this.state, container);
      });
    }
    
    // Scan button
    const scanBtn = container.querySelector('#esa-scan-btn');
    if (scanBtn) {
      scanBtn.addEventListener('click', async () => {
        scanBtn.textContent = '🔍 Scanning...';
        await methods.scanForCodes(this.state);
        scanBtn.textContent = '🔍 SCAN FOR DIAGNOSTIC CODES';
        methods.updateSlideState(this.state, container);
        methods.renderResults(this.state, container);
      });
    }
    
    // Analyze button
    const analyzeBtn = container.querySelector('#esa-analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        const input = container.querySelector('#esa-diag-input');
        if (input && input.value && PTAC_DIAGNOSTICS[input.value.toUpperCase()]) {
          this.state.detectedCode = input.value.toUpperCase();
          this.state.diagnosticCode = input.value.toUpperCase();
          this.state.isSlidOpen = true;
          const diag = PTAC_DIAGNOSTICS[input.value.toUpperCase()];
          methods.speak(this.state, `Code ${input.value.toUpperCase()}. ${diag.voice}`);
          methods.updateSlideState(this.state, container);
          methods.renderResults(this.state, container);
        }
      });
    }
    
    // Initialize audio
    methods.initAudio(this.state);
    
  }, 100);
  
  return result;
};

export default ESADiagnosticCard;
