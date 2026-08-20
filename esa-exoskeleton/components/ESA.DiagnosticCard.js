/**
 * ESA.DiagnosticCard.js
 * PTAC Diagnostic Card with Ava007 Voice Intelligence
 * 
 * Features:
 * - Scan/enter diagnostic codes (F1, C3, etc.)
 * - Voice announcements via Web Speech API (Ava007)
 * - Warranty status checking
 * - Repair recommendations
 * - Sliding panel UI
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// PTAC Diagnostic Database from manuals
const PTAC_DIAGNOSTICS = {
  // MODES Codes
  'FP': {
    status: 'Freeze Protection Engaged',
    display: 'Y',
    errorLight: 'N',
    severity: 'info',
    action: 'No action required. Room temperature below 40°F. Unit will auto-resume when temperature rises above 43°F.',
    voice: 'Freeze protection mode engaged. This is normal operation. Unit will resume when temperature rises above 43 degrees.',
    warranty: true
  },
  'Fd': {
    status: 'Front Desk Switch Closed',
    display: 'Y',
    errorLight: 'N',
    severity: 'warning',
    action: 'Open front desk switch to allow occupant unit operation.',
    voice: 'Front desk switch is closed. All outputs are switched off. Open the front desk switch to allow operation.',
    warranty: true
  },
  'Eo': {
    status: 'Un-Configured Service Board',
    display: 'Y',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Enter Configuration Menu and set C3 to C for coolers with electric heat or H for heat pumps.',
    voice: 'Unconfigured service board detected. Enter configuration menu and set C3 to C for coolers or H for heat pumps.',
    warranty: true,
    repair: 'configuration'
  },
  'EH': {
    status: 'Emergency Hydronic Engaged',
    display: 'Y',
    errorLight: 'N',
    severity: 'warning',
    action: 'Open front emergency hydronic switch to allow occupant unit operation.',
    voice: 'Emergency hydronic mode engaged. Compressor is switched off. Open emergency switch to restore normal operation.',
    warranty: true
  },
  'LS': {
    status: 'Load Shedding Engaged',
    display: 'Y',
    errorLight: 'N',
    severity: 'info',
    action: 'Open load shedding switch to allow occupant unit operation.',
    voice: 'Load shedding engaged. Compressor and electric heat switched off. Open load shedding switch to restore.',
    warranty: true
  },
  'oP': {
    status: 'Open Door Lockout',
    display: 'Y',
    errorLight: 'Y',
    severity: 'warning',
    action: 'Close room door. Unit will not condition space with door open.',
    voice: 'Open door lockout active. Close the room door. Unit will not operate with door open.',
    warranty: true
  },
  'nP': {
    status: 'Window Switch Lockout',
    display: 'Y',
    errorLight: 'Y',
    severity: 'warning',
    action: 'Close room door or window. Unit will not condition space with door or window open.',
    voice: 'Window switch lockout. Close the room door or window. Unit will not operate with window open.',
    warranty: true
  },
  'HP': {
    status: 'Heat Sentinel Active',
    display: 'Y',
    errorLight: 'N',
    severity: 'info',
    action: 'No action required. Heat Sentinel will disengage when room temperature falls.',
    voice: 'Heat Sentinel mode active. This prevents overheating. Will disengage when temperature falls.',
    warranty: true
  },
  'UR': {
    status: 'Un-Rented Status',
    display: 'Y',
    errorLight: 'N',
    severity: 'info',
    action: 'Front Desk needs to set to Rented mode if applicable.',
    voice: 'Unit is in unrented status. Front desk needs to set to rented mode.',
    warranty: true
  },
  
  // FAULTS Codes
  'F1': {
    status: 'Indoor Ambient Thermistor Fault',
    display: 'Y',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Replace black Indoor Ambient Thermistor or Wireless Remote Thermostat.',
    voice: 'Indoor ambient thermistor reading outside range negative 20 to 200 degrees. Replace black indoor ambient thermistor or wireless remote thermostat.',
    warranty: true,
    repair: 'thermistor',
    part: 'Indoor Ambient Thermistor'
  },
  'F2': {
    status: 'Wireless Remote Thermostat Failure',
    display: 'N',
    errorLight: 'N',
    severity: 'critical',
    action: 'Replace Wireless Thermostat.',
    voice: 'Wireless remote thermostat failure. Replace wireless thermostat.',
    warranty: true,
    repair: 'thermostat',
    part: 'Wireless Thermostat'
  },
  'F3': {
    status: 'Indoor Ambient Thermistor Range Error',
    display: 'Y',
    errorLight: 'N',
    severity: 'critical',
    action: 'Replace black Indoor Ambient Thermistor.',
    voice: 'Indoor ambient thermistor range error. Replace black indoor ambient thermistor.',
    warranty: true,
    repair: 'thermistor',
    part: 'Indoor Ambient Thermistor'
  },
  'F4': {
    status: 'Indoor Coil Thermistor Fault',
    display: 'N',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Replace Red Indoor Coil Thermistor.',
    voice: 'Indoor coil thermistor fault. Replace red indoor coil thermistor.',
    warranty: true,
    repair: 'thermistor',
    part: 'Indoor Coil Thermistor (Red)'
  },
  'F5': {
    status: 'Wireless Thermostat Failure',
    display: 'N',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Attempt to rebind Wireless Thermostat or Replace Wireless Thermostat.',
    voice: 'Wireless thermostat failure. Attempt to rebind wireless thermostat or replace if rebinding fails.',
    warranty: true,
    repair: 'thermostat',
    part: 'Wireless Thermostat'
  },
  'F6': {
    status: 'Indoor Discharge Thermistor Fault',
    display: 'N',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Replace Yellow Indoor Discharge Thermistor.',
    voice: 'Indoor discharge thermistor fault. Replace yellow indoor discharge thermistor.',
    warranty: true,
    repair: 'thermistor',
    part: 'Indoor Discharge Thermistor (Yellow)'
  },
  'H1': {
    status: 'High Voltage Protection',
    display: 'Y',
    errorLight: 'N',
    severity: 'critical',
    action: 'Check for incoming power at correct voltage.',
    voice: 'High voltage protection engaged. Check incoming power voltage. May require electrician.',
    warranty: false,
    repair: 'electrical'
  },
  'br': {
    status: 'Brown Out Protection',
    display: 'N',
    errorLight: 'N',
    severity: 'warning',
    action: 'Check for incoming power at correct voltage.',
    voice: 'Brown out protection engaged. Power was lost or voltage is low. Check incoming power.',
    warranty: false
  },
  'L6': {
    status: 'Discharge Air Too Hot',
    display: 'N',
    errorLight: 'Y',
    severity: 'warning',
    action: 'Clean filter or remove air blockage.',
    voice: 'Discharge air too hot. Clean filter or remove air blockage.',
    warranty: true,
    repair: 'maintenance'
  },
  'LC': {
    status: 'Outdoor Coil Thermistor High',
    display: 'N',
    errorLight: 'Y',
    severity: 'warning',
    action: 'Clean condenser coils, check fan for fault. Code will reset after cleaning.',
    voice: 'Outdoor coil thermistor temperature high. Clean condenser coils and check fan operation.',
    warranty: true,
    repair: 'maintenance'
  },
  'C1': {
    status: 'Indoor Coil Freezing',
    display: 'N',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Clean filter, check for fan and blower operation, check for refrigerant loss or restricted capillary tube.',
    voice: 'Indoor coil freezing up. Clean filter, check fan and blower operation. May indicate refrigerant loss or restricted capillary tube.',
    warranty: false,
    repair: 'refrigerant',
    replaceUnit: 'check_warranty'
  },
  'C3': {
    status: 'Indoor Coil Freezing',
    display: 'N',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Clean filter, check for fan and blower operation, check for refrigerant loss or restricted capillary tube.',
    voice: 'Indoor coil freezing. Clean filter and check fan operation. Likely refrigerant loss. Check warranty status.',
    warranty: false,
    repair: 'refrigerant',
    replaceUnit: true
  },
  'C4': {
    status: 'Indoor Coil Froze Up',
    display: 'N',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Clean filter, check for fan and blower operation, check for refrigerant loss or restricted capillary tube.',
    voice: 'Indoor coil froze up. Clean filter, check blower. This indicates refrigerant loss or restricted capillary tube. Unit may need replacement if out of warranty.',
    warranty: false,
    repair: 'refrigerant',
    replaceUnit: true
  },
  'C7': {
    status: 'Indoor Freezing Lockout',
    display: 'N',
    errorLight: 'Y',
    severity: 'critical',
    action: 'Clean filter, check for fan and blower operation, check for refrigerant loss or restricted capillary tube.',
    voice: 'Indoor freezing lockout. Temperature differential too high. Clean filter, check blower, check for refrigerant loss. Unit may require replacement.',
    warranty: false,
    repair: 'refrigerant',
    replaceUnit: true
  }
};

// Product database
const PTAC_PRODUCTS = {
  'SP09EA2-20': {
    brand: 'Seasons',
    model: '9000 BTU PTAC',
    part: '223532',
    btuCooling: 9000,
    btuHeating: 10900,
    voltage: '230/208V',
    amperage: '20A',
    refrigerant: 'R-32',
    warrantyTotal: 1,
    warrantyRefrigeration: 5,
    purchaseDate: null,
    manual: 'https://hdsupplysolutions.com/p/seasons-9000-btu-230-208-v-20-amp-electric-heat-cool-ptac-p223532'
  }
};

export const ESADiagnosticCard = ESAVerifyComponent({
  name: 'DiagnosticCard',
  version: '1.0.0',
  verified: true,
  
  state: {
    isSlidOpen: false,
    diagnosticCode: '',
    detectedCode: null,
    productModel: 'SP09EA2-20',
    warrantyStatus: 'unknown',
    voiceEnabled: true,
    scanning: false
  },
  
  methods: {
    speak: (state, text) => {
      if (!state.voiceEnabled) return;
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        const voices = speechSynthesis.getVoices();
        const avaVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'));
        if (avaVoice) utterance.voice = avaVoice;
        
        speechSynthesis.speak(utterance);
        console.log(`%c[ESA.Ava007] ${text}`, `color: ${activeTheme.purple}`);
      }
    },
    
    slideOpen: (state) => {
      state.isSlidOpen = !state.isSlidOpen;
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
      state.speak(`Diagnostic code ${randomCode} detected. ${diag.status}. ${diag.voice}`);
    },
    
    checkWarranty: (state) => {
      const product = PTAC_PRODUCTS[state.productModel];
      if (!product) return 'unknown';
      
      if (!product.purchaseDate) {
        state.warrantyStatus = 'unknown';
        return 'unknown';
      }
      
      const now = new Date();
      const purchaseDate = new Date(product.purchaseDate);
      const yearsOld = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
      
      if (yearsOld <= product.warrantyTotal) {
        state.warrantyStatus = 'under_warranty';
        return 'under_warranty';
      } else if (yearsOld <= product.warrantyRefrigeration) {
        state.warrantyStatus = 'refrigeration_only';
        return 'refrigeration_only';
      } else {
        state.warrantyStatus = 'expired';
        return 'expired';
      }
    },
    
    getRecommendation: (state, code) => {
      const diag = PTAC_DIAGNOSTICS[code];
      if (!diag) return null;
      
      const warranty = methods.checkWarranty(state);
      
      return {
        code,
        status: diag.status,
        severity: diag.severity,
        action: diag.action,
        voice: diag.voice,
        warrantyStatus: warranty,
        shouldReplace: diag.replaceUnit && warranty === 'expired',
        repairType: diag.repair || 'maintenance',
        part: diag.part || null
      };
    },
    
    executeRepair: (state, recommendation) => {
      if (recommendation.shouldReplace) {
        state.speak(`Warning: This unit appears to be out of warranty and has a critical fault. Based on the ${recommendation.code} code indicating ${recommendation.status}, replacement is recommended.`);
      } else if (recommendation.warrantyStatus === 'under_warranty') {
        state.speak(`Good news. This unit is under warranty. Contact HD Supply for free repair. The issue is ${recommendation.status}.`);
      } else {
        state.speak(`Repair recommendation: ${recommendation.action}. This appears to be a maintenance issue.`);
      }
    },
    
    analyzeCode: (state) => {
      if (state.diagnosticCode && PTAC_DIAGNOSTICS[state.diagnosticCode]) {
        state.detectedCode = state.diagnosticCode;
        const diag = PTAC_DIAGNOSTICS[state.diagnosticCode];
        methods.speak(state, `Diagnostic code ${state.diagnosticCode}. ${diag.voice}`);
      }
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-diagnostic-card" style="
      position: relative;
      width: 100%;
      max-width: 600px;
      margin: 16px auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <!-- Main Card -->
      <div style="
        position: relative;
        background: ${activeTheme.bg0_soft || '#32302f'};
        border: 2px solid ${activeTheme.border};
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.4s ease;
        box-shadow: 0 8px 24px ${activeTheme.shadow};
      ">
        
        <!-- Card Header -->
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
              <div style="font-size: 11px; opacity: 0.9;">PTAC Diagnostics with Ava007 Voice</div>
            </div>
          </div>
          <div style="
            font-size: 24px;
            transition: transform 0.3s ease;
            transform: ${state.isSlidOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
          ">▼</div>
        </div>
        
        <!-- Sliding Content -->
        <div style="
          max-height: ${state.isSlidOpen ? '1200px' : '0'};
          opacity: ${state.isSlidOpen ? '1' : '0'};
          transition: all 0.4s ease;
          overflow: hidden;
        ">
          
          <!-- Scan Button -->
          <div style="padding: 20px;">
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
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
              "
            >
              ${() => state.scanning ? '🔍 Scanning PTAC Unit...' : '🔍 SCAN FOR DIAGNOSTIC CODES'}
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
                  font-size: 14px;
                  text-transform: uppercase;
                "
              />
              <button
                @click=${() => methods.analyzeCode(state)}
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
          
          <!-- Diagnostic Results -->
          ${() => state.detectedCode && PTAC_DIAGNOSTICS[state.detectedCode] ? html`
            <div style="padding: 0 20px 20px; animation: fadeIn 0.3s ease;">
              ${(() => {
                const recommendation = methods.getRecommendation(state, state.detectedCode);
                const diag = PTAC_DIAGNOSTICS[state.detectedCode];
                
                return html`
                  <!-- Code Display -->
                  <div style="
                    background: ${recommendation.severity === 'critical' ? activeTheme.red : 
                               recommendation.severity === 'warning' ? activeTheme.yellow : activeTheme.blue};
                    color: ${activeTheme.bg};
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    text-align: center;
                  ">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 4px;">
                      CODE: ${state.detectedCode}
                    </div>
                    <div style="font-size: 14px; font-weight: bold;">
                      ${recommendation.status}
                    </div>
                  </div>
                  
                  <!-- Warranty Status -->
                  <div style="
                    background: ${recommendation.warrantyStatus === 'under_warranty' ? activeTheme.green : 
                               recommendation.warrantyStatus === 'expired' ? activeTheme.red : activeTheme.yellow};
                    color: ${activeTheme.bg};
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    text-align: center;
                    font-weight: bold;
                  ">
                    WARRANTY: ${recommendation.warrantyStatus.replace('_', ' ').toUpperCase()}
                  </div>
                  
                  <!-- Action Required -->
                  <div style="
                    background: ${activeTheme.bg};
                    border: 1px solid ${activeTheme.border};
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                  ">
                    <div style="font-weight: bold; color: ${activeTheme.yellow}; margin-bottom: 8px;">
                      📋 ACTION REQUIRED
                    </div>
                    <div style="font-size: 13px; line-height: 1.6; color: ${activeTheme.fg};">
                      ${recommendation.action}
                    </div>
                  </div>
                  
                  <!-- Part Info (if applicable) -->
                  ${recommendation.part ? html`
                    <div style="
                      background: ${activeTheme.bg};
                      border: 1px solid ${activeTheme.border};
                      padding: 16px;
                      border-radius: 8px;
                      margin-bottom: 16px;
                    ">
                      <div style="font-weight: bold; color: ${activeTheme.aqua}; margin-bottom: 8px;">
                        🔧 REQUIRED PART
                      </div>
                      <div style="font-size: 13px; color: ${activeTheme.fg};">
                        ${recommendation.part}
                      </div>
                    </div>
                  ` : ''}
                  
                  <!-- Execute Repair Button -->
                  <button
                    @click=${() => methods.executeRepair(state, recommendation)}
                    style="
                      width: 100%;
                      padding: 14px;
                      background: ${recommendation.shouldReplace ? activeTheme.red : activeTheme.green};
                      color: ${activeTheme.fg};
                      border: none;
                      border-radius: 8px;
                      font-size: 14px;
                      font-weight: bold;
                      cursor: pointer;
                    "
                  >
                    ${recommendation.shouldReplace ? '⚠️ CHECK REPLACEMENT OPTIONS' : '✅ EXECUTE REPAIR'}
                  </button>
                  
                  <!-- Voice Replay -->
                  <button
                    @click=${() => methods.speak(state, diag.voice)}
                    style="
                      width: 100%;
                      margin-top: 8px;
                      padding: 12px;
                      background: ${activeTheme.purple};
                      color: ${activeTheme.fg};
                      border: none;
                      border-radius: 8px;
                      font-size: 13px;
                      cursor: pointer;
                    "
                  >
                    🔊 REPLAY AVA007 VOICE
                  </button>
                `;
              })()}
            </div>
          ` : ''}
          
          ${() => state.isSlidOpen && !state.detectedCode ? html`
            <div style="padding: 0 20px 20px; text-align: center; color: ${activeTheme.fg_soft};">
              <p>Scan a PTAC unit or enter a diagnostic code to begin.</p>
              <p style="font-size: 11px; margin-top: 8px;">
                Supported codes: F1-F6, H1, C1-C7, FP, Fd, Eo, EH, LS, oP, nP, HP, UR, br, L6, LC
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `
}).component;

export default ESADiagnosticCard;
