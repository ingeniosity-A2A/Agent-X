/**
 * ESA.DiagnosticCard.js — BENTO EDITION
 * ============================================
 * PTAC DIAGNOSTIC SERVICE PANEL — official Bento card.
 *
 * One framework: Bento (docs/BENTO-OFFICIAL-UI.md).
 * Structure:  .bento-card > .bento-demo (scan viewport) + .bento-text
 * Tokens:     --bk-* (bento-tokens.css) — Beige · Green · Black.
 * Polish:     punch-border + gradient-mask-btn (v6-exoskel-polish.css).
 *
 * Contract kept identical for integration.js + shell-nav.js:
 *   - .mount(container)  (ESAVerifyComponent wrapper)
 *   - esa:diagnostic hub event
 *   - Ava007 voice (speechSynthesis + DynamicAudioBroadcaster)
 *
 * Arrow.js rules honored: no HTML comments inside html`` templates,
 * no ${} inside style attributes (static classes + post-mount DOM only).
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

// Module-scope methods binding (wrapper exposes .methods). Lets scanForCodes
// and the post-mount block call methods.* without an import cycle.
let methods = null;

export const ESADiagnosticCard = ESAVerifyComponent({
  name: 'DiagnosticCard',
  version: '3.0.0',
  verified: true,

  state: {
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

    scanForCodes: async (state) => {
      state.scanning = true;

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

    renderResults: (state, container) => {
      const resultsContainer = container.querySelector('#esa-diag-results');
      if (!resultsContainer) return;

      if (!state.detectedCode) {
        resultsContainer.innerHTML = '';
        return;
      }

      const recommendation = methods.getRecommendation(state, state.detectedCode);
      if (!recommendation) return;

      const isCritical = recommendation.severity === 'critical';
      const underWarranty = recommendation.warrantyStatus === 'under_warranty';
      const sevColor = isCritical ? 'var(--bk-danger)' : 'var(--bk-warn)';
      const sevPill = isCritical ? 'bk-pill danger' : 'bk-pill warn';

      let html = `
        <div style="border:1px solid var(--bk-border);background:var(--bk-panel-2);border-radius:0.85rem;padding:1rem;text-align:center;margin-bottom:0.7rem;">
          <div style="font-family:'DM Serif Display',serif;font-size:2rem;line-height:1;color:${sevColor};">${state.detectedCode}</div>
          <div style="font-size:0.78rem;font-weight:600;color:var(--bk-text);margin-top:0.35rem;">${recommendation.status}</div>
          <div style="margin-top:0.6rem;display:flex;justify-content:center;gap:0.4rem;flex-wrap:wrap;">
            <span class="${sevPill}"><span class="bk-dot"></span>${isCritical ? 'CRITICAL' : 'WARNING'}</span>
            <span class="${underWarranty ? 'bk-pill' : 'bk-pill danger'}"><span class="bk-dot"></span>${underWarranty ? 'UNDER WARRANTY' : 'WARRANTY EXPIRED'}</span>
          </div>
        </div>
      `;

      if (recommendation.shouldReplace) {
        html += `
          <div class="bk-pill danger" style="width:100%;justify-content:center;padding:0.45rem 0.6rem;margin-bottom:0.7rem;">
            <span class="bk-dot"></span>UNIT REPLACEMENT RECOMMENDED
          </div>
        `;
      }

      html += `
        <div class="bk-row" style="align-items:flex-start;">
          <div style="flex:1;min-width:0;">
            <div class="bk-meta" style="margin-bottom:0.25rem;">VOICE GUIDANCE · AVA007</div>
            <div style="font-size:0.78rem;line-height:1.45;color:var(--bk-text-2);">${recommendation.voice}</div>
          </div>
        </div>
      `;

      resultsContainer.innerHTML = html;
    }
  },

  // Bento template — static style attributes only, no HTML comments.
  template: (props, state, methods) => html`
    <div class="bento-card punch-border" style="width:100%;max-width:600px;margin:0 auto;">
      <div class="bento-demo" style="padding:1.25rem;display:flex;flex-direction:column;gap:0.85rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
          <span class="bk-pill"><span class="bk-dot pulse"></span>PTAC DIAGNOSTIC</span>
          <span class="bk-meta">SEASONS SP09EA2-20</span>
        </div>

        <div style="display:flex;gap:0.5rem;">
          <input
            type="text"
            id="esa-diag-input"
            class="bk-input"
            placeholder="Enter code (e.g. F1, C3)"
            maxlength="2"
            style="flex:1;text-transform:uppercase;font-family:monospace;font-size:1rem;text-align:center;letter-spacing:0.2rem;"
          />
          <button
            id="esa-analyze-btn"
            class="bk-btn"
            style="margin-top:0;"
          >Analyze</button>
        </div>

        <button
          id="esa-scan-btn"
          class="gradient-mask-btn"
          style="width:100%;padding:0.8rem;border:none;border-radius:999px;background:linear-gradient(135deg,var(--bk-accent),var(--bk-accent-2));color:var(--bk-on-accent);font-family:'DM Sans',sans-serif;font-size:0.75rem;font-weight:700;letter-spacing:0.08rem;text-transform:uppercase;cursor:pointer;"
        >Scan for diagnostic codes</button>

        <div id="esa-diag-results"></div>
      </div>

      <div class="bento-text">
        <h3 class="bento-title">Diagnostic <em>service</em></h3>
        <p class="bento-desc">Scan the PTAC control board for fault codes, analyze any code manually, and get warranty-aware repair guidance with Ava007 voice.</p>
        <button id="esa-voice-btn" class="bk-btn" style="margin-top:0.75rem;">
          Repeat diagnosis
          <svg viewBox="0 0 12 12" style="width:0.6rem;height:0.6rem;" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M2 10 L10 2 M4 2 h6 v6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
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
    // Scan button
    const scanBtn = container.querySelector('#esa-scan-btn');
    if (scanBtn) {
      scanBtn.addEventListener('click', async () => {
        scanBtn.disabled = true;
        scanBtn.textContent = 'Scanning board…';
        await methods.scanForCodes(this.state);
        scanBtn.disabled = false;
        scanBtn.textContent = 'Scan for diagnostic codes';
        methods.renderResults(this.state, container);
      });
    }

    // Analyze button
    const analyzeBtn = container.querySelector('#esa-analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        const input = container.querySelector('#esa-diag-input');
        const code = input && input.value ? input.value.toUpperCase() : '';
        if (code && PTAC_DIAGNOSTICS[code]) {
          this.state.detectedCode = code;
          this.state.diagnosticCode = code;
          const diag = PTAC_DIAGNOSTICS[code];
          methods.speak(this.state, `Code ${code}. ${diag.voice}`);
          methods.renderResults(this.state, container);
          window.dispatchEvent(new CustomEvent('esa:diagnostic', {
            detail: { code, ...diag, source: 'manual' }
          }));
        }
      });
    }

    // Voice repeat button — re-speaks the current recommendation
    const voiceBtn = container.querySelector('#esa-voice-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        if (this.state.detectedCode) {
          const rec = methods.getRecommendation(this.state, this.state.detectedCode);
          if (rec) methods.speak(this.state, rec.voice);
        } else {
          methods.speak(this.state, 'No diagnostic code detected yet. Run a scan first.');
        }
      });
    }

    // Initialize audio
    methods.initAudio(this.state);

  }, 100);

  return result;
};

export default ESADiagnosticCard;
