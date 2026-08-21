/**
 * ESA.DiagnosticCard.js
 * ============================================
 * PTAC DIAGNOSTIC SERVICE PANEL
 * ============================================
 * 
 * Features:
 * - 20+ PTAC diagnostic codes
 * - Sliding panel interface
 * - Ava007 voice announcements (Web Speech API)
 * - Warranty detection
 * - Severity levels (info/critical)
 * 
 * Connections:
 * → ESA.Ingestion (voice via Ava007)
 * → ESA.workorder (create from diagnosis)
 * → GSAP Transport (diagnostic events)
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
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
  'C1': { status: 'Indoor Coil Freezing', severity: 'critical', voice: 'Indoor coil freezing detected. Check refrigerant charge and airflow. Unit may need replacement if out of warranty.', warranty: false, replaceUnit: true },
  'C2': { status: 'Indoor Coil Sensor Fault', severity: 'warning', voice: 'Indoor coil temperature sensor out of range.', warranty: true },
  'C3': { status: 'Outdoor Coil Sensor Fault', severity: 'warning', voice: 'Outdoor coil sensor fault. May affect efficiency.', warranty: true },
  'C4': { status: 'Discharge Sensor Fault', severity: 'critical', voice: 'Discharge line temperature sensor critical fault.', warranty: false },
  'C5': { status: 'Room Sensor Fault', severity: 'warning', voice: 'Room temperature sensor fault. Unit will run on timer mode.', warranty: true },
  'C6': { status: 'Liquid Line Sensor Fault', severity: 'warning', voice: 'Liquid line temperature sensor fault.', warranty: true },
  'C7': { status: 'Outdoor Air Sensor Fault', severity: 'warning', voice: 'Outdoor air temperature sensor fault.', warranty: true },
  'FP': { status: 'Freeze Protection Active', severity: 'info', voice: 'Freeze protection mode active. Compressor running to prevent coil freeze.', warranty: true },
  'Fd': { status: 'Fan Detection Fault', severity: 'warning', voice: 'Indoor fan speed feedback fault. Check fan motor and capacitor.', warranty: true },
  'Eo': { status: 'Unconfigured Board', severity: 'critical', voice: 'Unconfigured service board detected. Set C3 jumper to C for cooling or H for heating.', warranty: true },
  'EH': { status: 'Electric Heat Fault', severity: 'critical', voice: 'Electric heat fault detected. Check heat strips and limit switches.', warranty: true },
  'LS': { status: 'Loss of Power', severity: 'critical', voice: 'Power interruption detected. Check breaker and power supply.', warranty: true },
  'oP': { status: 'Outdoor Protection', severity: 'warning', voice: 'Outdoor unit protection activated. Check for obstructions or high head pressure.', warranty: true },
  'nP': { status: 'No Power', severity: 'critical', voice: 'No power to unit. Verify electrical connections.', warranty: false },
  'HP': { status: 'High Pressure', severity: 'critical', voice: 'High pressure switch tripped. Possible restricted airflow or overcharge.', warranty: true },
  'UR': { status: 'Voltage Range Fault', severity: 'critical', voice: 'Voltage out of acceptable range. Check supply voltage (208-230V).', warranty: false },
  'br': { status: 'Breaker Trip', severity: 'warning', voice: 'Circuit breaker has tripped. Reset and check for shorts.', warranty: true },
  'L6': { status: 'Line Voltage Error', severity: 'critical', voice: 'Line voltage monitoring error. Immediate service required.', warranty: true },
  'LC': { status: 'Load Current Error', severity: 'warning', voice: 'Load current anomaly detected. Monitor compressor performance.', warranty: true }
};

export const ESADiagnosticCard = ESAVerifyComponent({
  name: 'DiagnosticCard',
  version: '1.0.0',
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
      
      // Use Web Speech API (Ava007 Voice)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1; // Slightly higher pitch for female voice
        
        // Try to use Zira or Samantha (female voices)
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
      
      // Also trigger audio engine if available
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
      
      // Simulate scanning
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Pick random code for demo
      const codes = Object.keys(PTAC_DIAGNOSTICS);
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      
      state.detectedCode = randomCode;
      state.diagnosticCode = randomCode;
      state.scanning = false;
      
      // Announce via Ava007
      const diag = PTAC_DIAGNOSTICS[randomCode];
      methods.speak(state, `Diagnostic code ${randomCode} detected. ${diag.voice}`);
      
      // Dispatch event for other components
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
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-diagnostic-card" style="position: relative; width: 100%; max-width: 600px; margin: 20px auto;">
      <div style="
        position: relative;
        background: ${activeTheme.bg_soft};
        border: 2px solid ${activeTheme.border};
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.4s ease;
        box-shadow: 0 8px 24px ${activeTheme.shadow};
      ">
        <!-- Header -->
        <div 
          @click=${() => methods.slideOpen(state)}
          style="
            background: linear-gradient(135deg, ${activeTheme.blue}, ${activeTheme.purple});
            color: ${activeTheme.fg};
            padding: 16px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">🔧</span>
            <div>
              <div style="font-weight: bold; font-size: 14px;">ESA DIAGNOSTIC SERVICE PANEL</div>
              <div style="font-size: 11px; opacity: 0.9;">Slide to reveal AI diagnostics</div>
            </div>
          </div>
          <div style="transform: ${state.isSlidOpen ? 'rotate(180deg)' : 'rotate(0deg)'}; transition: transform 0.3s ease;">▼</div>
        </div>
        
        <!-- Sliding Content -->
        <div style="
          max-height: ${state.isSlidOpen ? '800px' : '0'};
          opacity: ${state.isSlidOpen ? '1' : '0'};
          transition: all 0.4s ease;
          overflow: hidden;
        ">
          <div style="padding: 20px;">
            <!-- Scan Button -->
            <button
              @click=${() => methods.scanForCodes(state)}
              disabled=${() => state.scanning}
              style="
                width: 100%;
                padding: 16px;
                background: ${activeTheme.green};
                color: ${activeTheme.bg};
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
              "
            >
              ${() => state.scanning ? '🔍 Scanning...' : '🔍 SCAN FOR DIAGNOSTIC CODES'}
            </button>
            
            <!-- Manual Code Entry -->
            <div style="margin-top: 16px; display: flex; gap: 8px;">
              <input
                type="text"
                value=${() => state.diagnosticCode}
                @input=${(e) => state.diagnosticCode = e.target.value.toUpperCase()}
                placeholder="Enter code (e.g., F1, C3)"
                maxlength="2"
                style="
                  flex: 1;
                  background: ${activeTheme.bg};
                  border: 1px solid ${activeTheme.border};
                  color: ${activeTheme.fg};
                  padding: 12px;
                  border-radius: 6px;
                  text-transform: uppercase;
                  font-family: monospace;
                  font-size: 18px;
                  text-align: center;
                "
              />
              <button
                @click=${() => {
                  if (state.diagnosticCode && PTAC_DIAGNOSTICS[state.diagnosticCode]) {
                    state.detectedCode = state.diagnosticCode;
                    const diag = PTAC_DIAGNOSTICS[state.diagnosticCode];
                    methods.speak(state, `Code ${state.diagnosticCode}. ${diag.voice}`);
                  }
                }}
                style="
                  background: ${activeTheme.blue};
                  color: ${activeTheme.fg};
                  border: none;
                  padding: 0 24px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: bold;
                "
              >
                ANALYZE
              </button>
            </div>
          </div>
          
          <!-- Results Panel -->
          ${() => state.detectedCode && PTAC_DIAGNOSTICS[state.detectedCode] ? html`
            <div style="padding: 0 20px 20px;">
              ${(() => {
                const recommendation = methods.getRecommendation(state, state.detectedCode);
                const diag = PTAC_DIAGNOSTICS[state.detectedCode];
                
                return html`
                  <!-- Code Display -->
                  <div style="
                    background: ${recommendation.severity === 'critical' ? activeTheme.red : activeTheme.blue};
                    color: ${activeTheme.bg};
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    text-align: center;
                  ">
                    <div style="font-size: 32px; font-weight: bold;">CODE: ${state.detectedCode}</div>
                    <div style="font-size: 14px; font-weight: bold;">${recommendation.status}</div>
                  </div>
                  
                  <!-- Warranty Status -->
                  <div style="
                    background: ${recommendation.warrantyStatus === 'under_warranty' ? activeTheme.green : activeTheme.red};
                    color: ${activeTheme.bg};
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 16px;
                    font-weight: bold;
                    text-align: center;
                  ">
                    ${recommendation.warrantyStatus === 'under_warranty' ? '✓ UNDER WARRANTY' : '⚠ WARRANTY EXPIRED'}
                  </div>
                  
                  <!-- Voice Repeat Button -->
                  <div style="margin-bottom: 16px;">
                    <button
                      @click=${() => methods.speak(state, recommendation.voice)}
                      style="
                        background: ${activeTheme.purple};
                        color: ${activeTheme.fg};
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                      "
                    >
                      🔊 REPEAT DIAGNOSIS (Ava007)
                    </button>
                  </div>
                  
                  <!-- Voice Guidance Text -->
                  <div style="
                    background: ${activeTheme.bg};
                    border: 1px solid ${activeTheme.border};
                    border-radius: 8px;
                    padding: 16px;
                  ">
                    <div style="font-weight: bold; margin-bottom: 8px; color: ${activeTheme.aqua};">VOICE GUIDANCE:</div>
                    <div style="font-size: 13px;">${recommendation.voice}</div>
                  </div>
                  
                  ${recommendation.shouldReplace ? html`
                    <div style="
                      margin-top: 16px;
                      padding: 12px;
                      background: ${activeTheme.red};
                      color: ${activeTheme.fg};
                      border-radius: 6px;
                      text-align: center;
                      font-weight: bold;
                    ">
                      ⚠️ UNIT REPLACEMENT RECOMMENDED
                    </div>
                  ` : ''}
                `;
              })()}
            </div>
          ` : ''}
        </div>
      </div>
    `
});

export default ESADiagnosticCard;
