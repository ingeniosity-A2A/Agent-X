/**
 * ESA.SoundPanel.js (Fully Arrow.js Compatible)
 * ============================================
 * DUAL AUDIO SYSTEM CORE - ESA INGESTION AI BOX
 * 
 * CRITICAL: No ${} allowed in style attributes for Arrow.js compatibility!
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// ============================================================================
// DUAL AUDIO SYSTEM CORE ENGINE
// ============================================================================

class DynamicAudioBroadcaster {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master Bus Nodes
    this.masterBus = this.audioCtx.createGain();
    this.limiter = this.audioCtx.createDynamicsCompressor();
    this.analyser = this.audioCtx.createAnalyser();
    
    this.limiter.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
    this.limiter.knee.setValueAtTime(30, this.audioCtx.currentTime);
    this.limiter.ratio.setValueAtTime(20, this.audioCtx.currentTime);
    this.limiter.attack.setValueAtTime(0, this.audioCtx.currentTime);
    this.limiter.release.setValueAtTime(0.15, this.audioCtx.currentTime);
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.masterBus.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    
    // Channel nodes
    this.micStream = null;
    this.micSource = null;
    this.micFilter = null;
    this.micAnalyser = null;
    this.voiceOscillator = null;
    this.voiceGain = null;
    this.voiceLFO = null;
    this.voiceLFOGain = null;
  }
  
  async enableMicrophone() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micSource = this.audioCtx.createMediaStreamSource(this.micStream);
      this.micFilter = this.audioCtx.createBiquadFilter();
      this.micFilter.type = 'lowpass';
      this.micFilter.frequency.setValueAtTime(2000, this.audioCtx.currentTime);
      this.micAnalyser = this.audioCtx.createAnalyser();
      this.micAnalyser.fftSize = 512;
      
      this.micSource.connect(this.micFilter);
      this.micFilter.connect(this.micAnalyser);
      this.micAnalyser.connect(this.masterBus);
      
      return this.micAnalyser;
    } catch (err) {
      console.error('[AudioBroadcaster] Mic access denied:', err);
      throw err;
    }
  }
  
  disableMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }
  
  triggerAvaVoice(frequency = 440, volume = 0.5, options = {}) {
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const now = this.audioCtx.currentTime;
      const duration = options.duration || 0.3;
      const fmRatio = options.fmRatio || 2;
      const modDepth = options.modDepth || 100;
      const lfoRate = options.lfoRate || 5;
      const lfoDepth = options.lfoDepth || 0.1;
      
      // Carrier oscillator
      this.voiceOscillator = this.audioCtx.createOscillator();
      this.voiceOscillator.type = 'sine';
      this.voiceOscillator.frequency.setValueAtTime(frequency, now);
      
      // FM Modulator
      const modulator = this.audioCtx.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(frequency * fmRatio, now);
      
      const modGain = this.audioCtx.createGain();
      modGain.gain.setValueAtTime(modDepth, now);
      
      // LFO for tremolo
      this.voiceLFO = this.audioCtx.createOscillator();
      this.voiceLFO.type = 'sine';
      this.voiceLFO.frequency.setValueAtTime(lfoRate, now);
      
      this.voiceLFOGain = this.audioCtx.createGain();
      this.voiceLFOGain.gain.setValueAtTime(lfoDepth, now);
      
      // Output gain
      this.voiceGain = this.audioCtx.createGain();
      this.voiceGain.gain.setValueAtTime(volume * 0.3, now);
      this.voiceGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // Connect signal chain
      modulator.connect(modGain);
      modGain.connect(this.voiceOscillator.frequency);
      this.voiceOscillator.connect(this.voiceGain);
      
      this.voiceLFO.connect(this.voiceLFOGain);
      this.voiceLFOGain.connect(this.voiceGain.gain);
      
      this.voiceGain.connect(this.masterBus);
      
      // Start/stop
      this.voiceOscillator.start(now);
      modulator.start(now);
      this.voiceLFO.start(now);
      this.voiceOscillator.stop(now + duration);
      modulator.stop(now + duration);
      this.voiceLFO.stop(now + duration);
      
      setTimeout(() => {
        this.voiceOscillator = null;
        this.voiceGain = null;
        this.voiceLFO = null;
      }, duration * 1000 + 50);
      
    } catch (err) {
      console.error('[AudioBroadcaster] Voice error:', err);
    }
  }
  
  setMasterVolume(volume) {
    this.masterBus.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioCtx.currentTime);
  }
  
  renderSpeakerVisualizer(analyser, segments) {
    if (!analyser || !segments.length) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      segments.forEach((segment, i) => {
        const value = dataArray[i * 2] || 0;
        const height = Math.max(10, (value / 255) * 50);
        segment.style.height = height + '%';
      });
      requestAnimationFrame(draw);
    };
    draw();
  }
  
  playDiagnosticSequence(code) {
    const sequences = {
      'OK': [[523, 0.15], [659, 0.15], [784, 0.25]],
      'ERROR': [[440, 0.2], [349, 0.2], [294, 0.3]],
      'WARN': [[440, 0.15], [440, 0.15], [550, 0.25]]
    };
    
    const seq = sequences[code] || sequences['OK'];
    let time = 0;
    seq.forEach(([freq, dur]) => {
      setTimeout(() => this.triggerAvaVoice(freq, 0.6, { duration: dur }), time);
      time += dur * 1000 + 50;
    });
  }
  
  getStatus() {
    return {
      contextState: this.audioCtx.state,
      micActive: !!this.micStream,
      masterVolume: this.masterBus.gain.value
    };
  }
  
  destroy() {
    this.disableMicrophone();
    if (this.audioCtx.state !== 'closed') this.audioCtx.close();
  }
}

export { DynamicAudioBroadcaster };

// ============================================================================
// ARROW.JS COMPONENT - ALL STYLES HARDCODED
// ============================================================================

export const ESASoundPanel = ESAVerifyComponent({
  name: 'SoundPanel',
  version: '3.0.0',
  owner: 'AI-Ingestion-Chat-Box',
  verified: true,
  
  state: {
    status: 'IDLE',
    visualizerActive: false,
    masterVolume: 0.75,
    showControls: false,
    selectedTab: 'visualizer'
  },
  
  methods: {
    toggleMic: async (state, props) => {
      if (state.status === 'IDLE') {
        state.status = 'INGEST';
        state.visualizerActive = true;
        
        if (props.audioEngine) {
          try {
            const analyser = await props.audioEngine.enableMicrophone();
            setTimeout(() => {
              const side = props.side || 'left';
              const segments = document.querySelectorAll(`.esa-vis-segment-${side}`);
              if (segments.length > 0 && analyser) {
                props.audioEngine.renderSpeakerVisualizer(analyser, segments);
              }
            }, 100);
          } catch (err) {
            state.status = 'ERROR';
          }
        }
      } else {
        state.status = 'IDLE';
        state.visualizerActive = false;
        if (props.audioEngine) props.audioEngine.disableMicrophone();
      }
    },
    
    testAvaVoice: (state, props) => {
      state.status = 'BROADCAST';
      if (props.audioEngine) {
        props.audioEngine.triggerAvaVoice(523, 0.6, { duration: 0.2 });
        setTimeout(() => props.audioEngine.triggerAvaVoice(659, 0.6, { duration: 0.2 }), 200);
        setTimeout(() => props.audioEngine.triggerAvaVoice(784, 0.8, { duration: 0.4 }), 400);
        setTimeout(() => { if (state.status === 'BROADCAST') state.status = 'IDLE'; }, 800);
      }
    },
    
    setVolume: (state, props, event) => {
      const value = parseFloat(event.target.value);
      state.masterVolume = value;
      if (props.audioEngine) props.audioEngine.setMasterVolume(value);
    },
    
    toggleControls: (state) => {
      state.showControls = !state.showControls;
    },
    
    switchTab: (state, tab) => {
      state.selectedTab = tab;
    }
  },
  
  template: (props, state, methods) => {
    const side = props.side || 'left';
    const isLeft = side === 'left';
    const channelLabel = isLeft ? 'SOUND I' : 'AVA VOICE';
    const channelDesc = isLeft ? 'Inbound Mic' : 'Speech Synthesis';
    
    return html`
      <div class="speaker_enclosure" style="background: linear-gradient(165deg, #1d1f27 0%, #0c0d12 100%); border-radius: 2em; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 60px 120px rgba(0,0,0,0.9); position: relative; overflow: hidden; height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
        <!-- Status Indicator -->
        <div style="position: absolute; top: 15px; background: rgba(0,0,0,0.6); padding: 4px 12px; border-radius: 12px; border: 1px solid #3c3836; font-size: 10px; font-weight: bold; letter-spacing: 1px; color: #a89984; z-index: 10;">
          STATUS: ${() => state.status}
        </div>
        
        <!-- Channel Label -->
        <div style="position: absolute; top: 35px; font-size: 9px; letter-spacing: 2px; color: #a89984; opacity: 0.7; z-index: 10;">
          ${channelLabel} — ${channelDesc}
        </div>

        <!-- Visualizer Glow Ring -->
        <div class="speaker_glow_ring" style="width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle at 50% 50%, rgba(0,255,204,0.15) 0%, transparent 70%); display: flex; align-items: center; justify-content: center; position: relative;">
          <!-- LED Segments - Static positions, no dynamic rotation in style -->
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${() => Array.from({ length: 8 }).map((_, i) => html`
              <div 
                class="speaker_vis_bar esa-vis-segment-${side}" 
                style="position: absolute; width: 40px; height: 3px; background: linear-gradient(90deg, rgba(59,180,155,0.8) 0%, rgba(137,58,255,0.8) 100%); border-radius: 2px; transform-origin: center;"
              ></div>
            `)}
          </div>
          
          <!-- Speaker Cone -->
          <div style="width: 70px; height: 70px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #3a3a3a, #0c0d12); box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.5); z-index: 2; display: flex; align-items: center; justify-content: center;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: radial-gradient(circle at 40% 40%, #4a4a4a, #1a1a1a); box-shadow: inset 0 1px 2px rgba(255,255,255,0.1);"></div>
          </div>
        </div>

        <!-- Control Buttons -->
        <div style="margin-top: 25px; display: flex; flex-direction: column; gap: 8px; z-index: 10; width: 100%;">
          <button 
            @click=${() => isLeft ? methods.toggleMic(state, props) : methods.testAvaVoice(state, props)}
            style="padding: 10px 16px; background: #458588; color: #ebdbb2; border: 1px solid #3c3836; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;"
          >
            ${isLeft 
              ? (state.status === 'INGEST' ? '⏹ STOP INGEST' : '🎤 ACTIVATE MIC')
              : ('🔊 TEST AVA VOICE')
            }
          </button>
          
          <button 
            @click=${() => methods.toggleControls(state)}
            style="padding: 6px 12px; background: transparent; color: #a89984; border: 1px dashed #3c3836; border-radius: 4px; cursor: pointer; font-size: 9px;"
          >
            ${state.showControls ? '▼ Hide Controls' : '▸ Show Controls'}
          </button>
        </div>
      </div>
    `;
  }
});
