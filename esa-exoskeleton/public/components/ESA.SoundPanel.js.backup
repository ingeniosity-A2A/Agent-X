/**
 * ESA.SoundPanel.js
 * ============================================
 * DUAL AUDIO SYSTEM CORE - ESA INGESTION AI BOX
 * ============================================
 * 
 * OWNER: AI Ingestion Chat Box (Voice belongs here!)
 * 
 * ARCHITECTURE - Three Unified Operational Channels:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    ESA INGESTION AI BOX                     │
 * │                                                             │
 * │  ┌─────────────────┐          ┌─────────────────┐         │
 * │  │  SOUND I        │          │  AVA VOICE       │         │
 * │  │  (Inbound Mic)  │          │  (Synthesis)     │         │
 * │  │                 │          │                 │         │
 * │  │ • Mic Input     │  ────►   │ • FM Synthesizer│         │
 * │  │ • Lowpass Filter│   MIX    │ • LFO Modulation│         │
 * │  │ • Spectrum Anal.│          │ • ADSR Envelope │         │
 * │  └────────┬────────┘          └────────┬────────┘         │
 * │           │                            │                   │
 * │           ▼                            ▼                   │
 * │  ┌─────────────────────────────────────────────────┐      │
 * │  │           AVA BROADCASTING (Outbound)            │      │
 * │  │                                                 │      │
 * │  │  Master Bus → Compressor → Output → Speakers    │      │
 * │  └─────────────────────────────────────────────────┘      │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * PHYSICAL LAYOUT:
 * ┌──────────────────────────────────────────────────────────┐
 * │                    ESA INGESTION AI BOX                  │
 * │                                                           │
 * │  [Speaker/Mic 1]          AI Core          [Speaker/Mic 2]│
 * │   (Left Wing)                                 (Right Wing)│
 * │   Sound I (Mic)                              Ava Voice   │
 * └──────────────────────────────────────────────────────────┘
 * 
 * Features:
 * - DynamicAudioBroadcaster class (FM/AM synthesis)
 * - 32-segment LED visualizer rings per speaker
 * - Three-channel audio routing
 * - DynamicsCompressorNode (Threshold: -12dB, Ratio: 20:1)
 * - Real-time spectrum analysis
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// ============================================================================
// DUAL AUDIO SYSTEM CORE ENGINE
// ============================================================================

/**
 * DynamicAudioBroadcaster - Complete Audio Processing Engine
 * 
 * Channels:
 * 1. Sound I - Inbound Mic Processing (Real-time ingestion & analysis)
 * 2. Ava Voice - Synthesis & Speech Core (FM/LFO modulated voice)
 * 3. Ava Broadcasting - Outbound Stream & Output (Master pipeline)
 */
class DynamicAudioBroadcaster {
  constructor() {
    // Initialize Audio Context
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // ============================================
    // MASTER BUS NODES (Channel 3: Ava Broadcasting)
    // ============================================
    this.masterBus = this.audioCtx.createGain();
    this.limiter = this.audioCtx.createDynamicsCompressor();
    this.analyser = this.audioCtx.createAnalyser();
    
    // Compressor Setup (Professional broadcast settings)
    this.limiter.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
    this.limiter.knee.setValueAtTime(30, this.audioCtx.currentTime);
    this.limiter.ratio.setValueAtTime(20, this.audioCtx.currentTime);  // 20:1 ratio for limiting
    this.limiter.attack.setValueAtTime(0, this.audioCtx.currentTime);    // Instant attack
    this.limiter.release.setValueAtTime(0.15, this.audioCtx.currentTime); // 150ms release
    
    // Analyser for visualizer (64 bins for smooth LED ring)
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;
    
    // Signal Flow: Master -> Limiter -> Analyser -> Output
    this.masterBus.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    
    // ============================================
    // CHANNEL-SPECIFIC NODES
    // ============================================
    
    // Channel 1: Sound I (Inbound Mic) nodes
    this.micStream = null;
    this.micSource = null;
    this.micFilter = null;      // BiquadFilter for noise reduction
    this.micAnalyser = null;   // Separate analyser for mic input
    
    // Channel 2: Ava Voice (Synthesis) state
    this.activeOscillators = [];  // Track playing oscillators for cleanup
    
    // State tracking
    this.currentChannel = null;
    this.isProcessing = false;
    
    console.log('%c[ESA.SoundPanel] DynamicAudioBroadcaster initialized', 
      `color: ${activeTheme.aqua}`);
    console.log('%c[ESA.SoundPanel] 3-Channel Audio System Online:', `color: ${activeTheme.green}`);
    console.log('  → Sound I: Inbound Mic Processing');
    console.log('  → Ava Voice: FM Synthesis Engine');
    console.log('  → Ava Broadcasting: Master Output Bus');
  }

  // ==========================================================================
  // CHANNEL 1: SOUND I - INBOUND MIC PROCESSING
  // ==========================================================================

  /**
   * Enable Microphone Input (Sound I Channel)
   * Pipeline: MediaStream → BiquadFilter (Lowpass) → Analyser → MasterBus
   */
  async enableMicrophone() {
    try {
      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }
      
      // Request microphone access
      this.micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Create source from mic stream
      this.micSource = this.audioCtx.createMediaStreamSource(this.micStream);
      
      // Create lowpass filter for noise reduction (cutoff at 3kHz for voice)
      this.micFilter = this.audioCtx.createBiquadFilter();
      this.micFilter.type = "lowpass";
      this.micFilter.frequency.value = 3000;
      this.micFilter.Q.value = 0.7;
      
      // Create dedicated analyser for mic visualization (512 bins for detail)
      this.micAnalyser = this.audioCtx.createAnalyser();
      this.micAnalyser.fftSize = 512;
      this.micAnalyser.smoothingTimeConstant = 0.6;
      
      // Connect mic pipeline: Source → Filter → MicAnalyser → MasterBus
      this.micSource.connect(this.micFilter);
      this.micFilter.connect(this.micAnalyser);
      this.micAnalyser.connect(this.masterBus);
      
      this.currentChannel = 'sound-i';
      console.log('%c[ESA.SoundPanel] Sound I (Mic) activated - Channel 1 ONLINE', 
        `color: ${activeTheme.green}`);
      
      return this.micAnalyser;
      
    } catch (error) {
      console.error(`%c[ESA.SoundPanel] Mic error: ${error.message}`, 
        `color: ${activeTheme.red}`);
      throw error;
    }
  }

  /**
   * Disable Microphone Input
   */
  disableMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.micFilter) {
      this.micFilter.disconnect();
      this.micFilter = null;
    }
    if (this.micAnalyser) {
      this.micAnalyser.disconnect();
      this.micAnalyser = null;
    }
    this.currentChannel = null;
    console.log('%c[ESA.SoundPanel] Sound I (Mic) deactivated', `color: ${activeTheme.yellow}`);
  }

  // ==========================================================================
  // CHANNEL 2: AVA VOICE - SYNTHESIS & SPEECH CORE
  // ==========================================================================

  /**
   * Trigger Ava007 Voice Synthesis
   * 
   * FM Synthesis Pipeline:
   * Oscillator (Carrier) → FM Modulator → Filter → ADSR Gain → MasterBus
   * 
   * @param {number} frequency - Base frequency in Hz (440 = A4)
   * @param {number} velocity - Note velocity/amplitude (0-1)
   * @param {Object} options - Synthesis options
   */
  triggerAvaVoice(frequency = 440, velocity = 0.85, options = {}) {
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    
    const now = this.audioCtx.currentTime;
    const duration = options.duration || 0.5;
    
    // ==========================================
    // CARRIER OSCILLATOR
    // ==========================================
    const osc = this.audioCtx.createOscillator();
    const oscType = options.waveform || 'sine';
    osc.type = oscType;
    osc.frequency.setValueAtTime(frequency, now);
    
    // ==========================================
    // FILTER (Tone shaping)
    // ==========================================
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = options.filterType || 'lowpass';
    filter.frequency.setValueAtTime(options.cutoff || 2500, now);
    filter.Q.value = options.resonance || 1;
    
    // ==========================================
    // FM MODULATION (The "Ava" character)
    // ==========================================
    const modulator = this.audioCtx.createOscillator();
    const modGain = this.audioCtx.createGain();
    
    // FM Ratio determines timbre (2.1 = rich harmonic content)
    const fmRatio = options.fmRatio || 2.1;
    modulator.frequency.value = frequency * fmRatio;
    
    // Modulation index (higher = more harmonics)
    const modulationDepth = options.modDepth || 600;
    modGain.gain.value = modulationDepth;
    
    // Connect FM chain: Modulator → ModGain → Osc.frequency
    modulator.connect(modGain);
    modGain.connect(osc.frequency);
    modulator.start(now);
    
    // Schedule modulator stop
    modulator.stop(now + duration + 0.1);
    
    // ==========================================
    // LFO MODULATION (Tremolo/Vibrato)
    // ==========================================
    if (options.enableLFO !== false) {
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      
      lfo.type = options.lfoType || 'sine';
      lfo.frequency.value = options.lfoRate || 5;  // 5Hz tremolo
      lfoGain.gain.value = options.lfoDepth || 0.1;  // 10% depth
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);  // Vibrato on pitch
      lfo.start(now);
      lfo.stop(now + duration + 0.1);
      
      this.activeOscillators.push(lfo);
    }
    
    // ==========================================
    // ADSR ENVELOPE (Attack-Decay-Sustain-Release)
    // ==========================================
    const gainNode = this.audioCtx.createGain();
    
    // Attack: Instant (0.005ms to full volume)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.42 * velocity, now + 0.005);
    
    // Decay/Sustain: Hold then release
    if (duration > 0.1) {
      gainNode.gain.setValueAtTime(0.42 * velocity, now + duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else {
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }
    
    // ==========================================
    // CONNECT TO MASTER BUS (Channel 3)
    // ==========================================
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterBus);
    
    // Start/Stop carrier
    osc.start(now);
    osc.stop(now + duration + 0.1);
    
    // Track for cleanup
    this.activeOscillators.push(osc, modulator);
    this.currentChannel = 'ava-voice';
    
    console.log(`%c[ESA.SoundPanel] Ava Voice: ${frequency}Hz @ ${velocity}vel (FM ratio: ${fmRatio})`, 
      `color: #d79921`);
  }

  /**
   * Play diagnostic tone sequence (for PTAC codes)
   */
  playDiagnosticSequence(code) {
    const sequences = {
      'F1': [{ f: 440, d: 0.15 }, { f: 520, d: 0.15 }, { f: 440, d: 0.3 }],
      'F2': [{ f: 349, d: 0.15 }, { f: 440, d: 0.15 }, { f: 349, d: 0.3 }],
      'C1': [{ f: 523, d: 0.2 }, { f: 392, d: 0.4 }],
      'default': [{ f: 440, d: 0.25 }, { f: 554, d: 0.25 }]
    };
    
    const seq = sequences[code] || sequences['default'];
    let time = 0;
    
    seq.forEach(note => {
      setTimeout(() => this.triggerAvaVoice(note.f, 0.7), time * 1000);
      time += note.d;
    });
  }

  // ==========================================================================
  // CHANNEL 3: AVA BROADCASTING - OUTPUT & VISUALIZATION
  // ==========================================================================

  /**
   * Render Speaker Visualizer (32-segment LED ring)
   * Updates DOM elements based on frequency data
   * 
   * @param {AnalyserNode} analyserNode - The analyser to read data from
   * @param {Array<HTMLElement>} segmentsArray - Array of 32 DOM elements
   */
  renderSpeakerVisualizer(analyserNode, segmentsArray) {
    if (!analyserNode || !segmentsArray || segmentsArray.length === 0) return;
    
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    let animationId = null;
    
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      // Get frequency data
      analyserNode.getByteFrequencyData(dataArray);
      
      // Map frequency bins to 32 LED segments
      const step = Math.max(1, Math.floor(dataArray.length / segmentsArray.length));
      
      segmentsArray.forEach((segment, index) => {
        if (!segment) return;
        
        // Get magnitude for this segment (average of relevant bins)
        let magnitude = 0;
        for (let i = 0; i < step; i++) {
          magnitude += dataArray[index * step + i] || 0;
        }
        magnitude = magnitude / step;
        
        // Convert to height percentage (with minimum visibility)
        const height = Math.max(8, (magnitude / 255) * 100);
        segment.style.height = `${height}%`;
        
        // Color intensity based on level
        if (magnitude > 200) {
          segment.style.background = `linear-gradient(120deg, rgba(253, 134, 241, 1) 0%, rgba(255, 100, 100, 1) 100%)`;
        } else if (magnitude > 150) {
          segment.style.background = `linear-gradient(120deg, rgba(137, 58, 255, 0.9) 0%, rgba(253, 134, 241, 0.9) 100%)`;
        } else {
          segment.style.background = `linear-gradient(120deg, rgba(59, 180, 155, 0.8) 0%, rgba(137, 58, 255, 0.8) 53%, rgba(253, 134, 241, 0.7) 100%)`;
        }
      });
    };
    
    draw();
    
    // Return cleanup function
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }

  /**
   * Set Master Volume (Channel 3)
   * @param {number} value - Volume level (0-1)
   */
  setMasterVolume(value) {
    const clampedValue = Math.max(0, Math.min(1, value));
    this.masterBus.gain.setValueAtTime(clampedValue, this.audioCtx.currentTime);
    console.log(`%c[ESA.SoundPanel] Master Volume: ${Math.round(clampedValue * 100)}%`, 
      `color: ${activeTheme.aqua}`);
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      channel: this.currentChannel,
      isProcessing: this.isProcessing,
      activeOscillators: this.activeOscillators.length,
      micActive: !!this.micStream,
      ctxState: this.audioCtx.state,
      sampleRate: this.audioCtx.sampleRate
    };
  }

  /**
   * Cleanup all audio resources
   */
  dispose() {
    // Stop all oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];
    
    // Disable mic
    this.disableMicrophone();
    
    // Disconnect master bus
    this.masterBus.disconnect();
    this.limiter.disconnect();
    this.analyser.disconnect();
    
    // Close context
    if (this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    
    console.log('%c[ESA.SoundPanel] DynamicAudioBroadcaster disposed', `color: ${activeTheme.red}`);
  }
}

// ============================================================================
// ARROW.JS COMPONENT - SPEAKER ENCLOSURE UI
// ============================================================================

export { DynamicAudioBroadcaster };

export const ESASoundPanel = ESAVerifyComponent({
  name: 'SoundPanel',
  version: '2.0.0',  // Major upgrade - Dual Audio System
  owner: 'AI-Ingestion-Chat-Box',
  verified: true,
  
  state: {
    status: 'IDLE',  // IDLE | INGEST | BROADCAST | ERROR
    visualizerActive: false,
    masterVolume: 0.75,
    showControls: false,
    selectedTab: 'visualizer'  // visualizer | controls | info
  },
  
  methods: {
    toggleMic: async (state, props) => {
      if (state.status === 'IDLE') {
        state.status = 'INGEST';
        state.visualizerActive = true;
        
        try {
          if (props.audioEngine) {
            const analyser = await props.audioEngine.enableMicrophone();
            
            // Start visualizer after short delay for DOM
            setTimeout(() => {
              const side = props.side || 'left';
              const segments = document.querySelectorAll(`.esa-vis-segment-${side}`);
              
              if (segments.length > 0 && analyser) {
                props.audioEngine.renderSpeakerVisualizer(analyser, segments);
                console.log(`%c[ESA.SoundPanel] Visualizer started for ${side} speaker`, 
                  `color: ${activeTheme.green}`);
              }
            }, 100);
          }
        } catch (err) {
          state.status = 'ERROR';
          console.error(`%c[ESA.SoundPanel] Mic activation failed: ${err.message}`, 
            `color: ${activeTheme.red}`);
        }
      } else {
        state.status = 'IDLE';
        state.visualizerActive = false;
        
        if (props.audioEngine) {
          props.audioEngine.disableMicrophone();
        }
      }
    },
    
    testAvaVoice: (state, props) => {
      state.status = 'BROADCAST';
      
      if (props.audioEngine) {
        // Play a pleasant Ava007 greeting sequence
        props.audioEngine.triggerAvaVoice(523, 0.6, { duration: 0.2 });  // C5
        setTimeout(() => {
          props.audioEngine.triggerAvaVoice(659, 0.6, { duration: 0.2 });  // E5
        }, 200);
        setTimeout(() => {
          props.audioEngine.triggerAvaVoice(784, 0.8, { duration: 0.4 });  // G5
        }, 400);
        
        // Return to IDLE after sequence
        setTimeout(() => {
          if (state.status === 'BROADCAST') state.status = 'IDLE';
        }, 800);
      }
    },
    
    setVolume: (state, props, event) => {
      const value = parseFloat(event.target.value);
      state.masterVolume = value;
      
      if (props.audioEngine) {
        props.audioEngine.setMasterVolume(value);
      }
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
      <div class="speaker_enclosure" style="
        /* Speaker Housing Aesthetic - Deep ambient dark finish */
        background: linear-gradient(165deg, #1d1f27 0%, #0c0d12 100%);
        border-radius: 2em;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 60px 120px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
        height: 320px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      ">
        <!-- Outer Gradient Mask Overlay -->
        <div style="
          position: absolute; inset: 0; border-radius: 2em;
          border: 1px solid transparent;
          background: linear-gradient(-90deg, rgba(0, 0, 0, 1), rgba(102, 102, 102, 1)) border-box;
          -webkit-mask: linear-gradient(#fff 0, #fff 100%) padding-box, linear-gradient(#fff 0, #fff 100%);
          mask: linear-gradient(#fff 0, #fff 100%) padding-box, linear-gradient(#fff 0, #fff 100%);
          -webkit-mask-composite: xor; mask-composite: exclude;
          pointer-events: none;
        "></div>

        <!-- Status Indicator -->
        <div style="
          position: absolute; top: 15px;
          background: rgba(0,0,0,0.6); padding: 4px 12px; border-radius: 12px;
          border: 1px solid ${activeTheme.border};
          font-size: 10px; font-weight: bold; letter-spacing: 1px;
          color: ${state.status === 'INGEST' ? activeTheme.green : 
                 state.status === 'BROADCAST' ? activeTheme.aqua : 
                 state.status === 'ERROR' ? activeTheme.red : activeTheme.fg_soft};
          z-index: 10;
        ">
          STATUS: ${() => state.status}
        </div>
        
        <!-- Channel Label -->
        <div style="
          position: absolute; top: 35px;
          font-size: 9px; letter-spacing: 2px;
          color: ${activeTheme.fg_soft}; opacity: 0.7;
          z-index: 10;
        ">
          ${channelLabel} — ${channelDesc}
        </div>

        <!-- Ambient Radial Visualizer Glow -->
        <div class="speaker_glow_ring" style="
          width: 140px; height: 140px; border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, 
            ${state.visualizerActive ? 'rgba(0, 255, 204, 0.35)' : 'rgba(0, 255, 204, 0.15)'} 0%, 
            transparent 70%);
          display: flex; align-items: center; justify-content: center; position: relative;
          transition: background 0.3s ease;
        ">
          <!-- Equalizer Visualizer Ring (32-segment LED) -->
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${() => Array.from({ length: 32 }).map((_, i) => html`
              <div 
                class="speaker_vis_bar esa-vis-segment-${side}" 
                style="
                  position: absolute; width: 3px; height: 10%;
                  background: linear-gradient(120deg, 
                    rgba(59, 180, 155, 0.8) 0%, 
                    rgba(137, 58, 255, 0.8) 53%, 
                    rgba(253, 134, 241, 0.7) 100%);
                  border-radius: 2px;
                  transform: rotate(${i * 11.25}deg) translateY(-55px);
                  transform-origin: center 60px;
                  transition: height 0.05s ease-out, background 0.1s ease;
                "
              ></div>
            `)}
          </div>
          
          <!-- Speaker Cone -->
          <div style="
            width: 70px; height: 70px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #3a3a3a, #0c0d12);
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.5);
            z-index: 2;
            display: flex; align-items: center; justify-content: center;
          ">
            <!-- Center dust cap -->
            <div style="
              width: 24px; height: 24px; border-radius: 50%;
              background: radial-gradient(circle at 40% 40%, #4a4a4a, #1a1a1a);
              box-shadow: inset 0 1px 2px rgba(255,255,255,0.1);
            "></div>
          </div>
        </div>

        <!-- Control Buttons -->
        <div style="
          margin-top: 25px; 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
          z-index: 10;
          width: 100%;
        ">
          <!-- Primary Action Button -->
          <button 
            @click=${() => isLeft ? methods.toggleMic(state, props) : methods.testAvaVoice(state, props)}
            style="
              padding: 10px 16px;
              background: ${state.status === 'INGEST' ? activeTheme.red : 
                         state.status === 'BROADCAST' ? activeTheme.purple : activeTheme.blue};
              color: ${activeTheme.fg}; 
              border: 1px solid ${activeTheme.border};
              border-radius: 6px; 
              cursor: pointer; 
              font-size: 11px; 
              font-weight: bold;
              transition: all 0.2s ease;
              text-transform: uppercase;
              letter-spacing: 1px;
            "
            onmouseenter=${(e) => e.target.style.transform = 'scale(1.02)'}
            onmouseleave=${(e) => e.target.style.transform = 'scale(1)'}
          >
            ${isLeft 
              ? (state.status === 'INGEST' ? '⏹ STOP INGEST' : '🎤 ACTIVATE MIC')
              : ('🔊 TEST AVA VOICE')
            }
          </button>
          
          <!-- Expand Controls Toggle -->
          <button 
            @click=${() => methods.toggleControls(state)}
            style="
              padding: 6px 12px;
              background: transparent;
              color: ${activeTheme.fg_soft}; 
              border: 1px dashed ${activeTheme.border};
              border-radius: 4px; 
              cursor: pointer; 
              font-size: 9px;
            "
          >
            ${state.showControls ? '▼ Hide Controls' : '▸ Show Controls'}
          </button>
        </div>
        
        <!-- Expanded Controls Panel -->
        ${() => state.showControls ? html`
          <div style="
            position: absolute;
            bottom: 70px;
            left: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            border: 1px solid ${activeTheme.border};
            border-radius: 8px;
            padding: 12px;
            z-index: 20;
          ">
            <!-- Tab Navigation -->
            <div style="display: flex; gap: 4px; margin-bottom: 10px;">
              ${['visualizer', 'controls', 'info'].map(tab => html`
                <button
                  @click=${() => methods.switchTab(state, tab)}
                  style="
                    flex: 1;
                    padding: 4px 8px;
                    font-size: 9px;
                    background: ${state.selectedTab === tab ? activeTheme.bg_selection : 'transparent'};
                    color: ${activeTheme.fg};
                    border: 1px solid ${state.selectedTab === tab ? activeTheme.fg_soft : activeTheme.border};
                    border-radius: 4px;
                    cursor: pointer;
                  "
                >
                  ${tab === 'visualizer' ? '📊 Visual' : tab === 'controls' ? '🎛️ Controls' : 'ℹ️ Info'}
                </button>
              `)}
            </div>
            
            <!-- Tab Content -->
            ${state.selectedTab === 'visualizer' ? html`
              <div style="font-size: 10px; color: ${activeTheme.fg_soft};">
                <div style="margin-bottom: 6px;"><b>Visualizer Settings</b></div>
                <div>LED Segments: 32</div>
                <div>Update Rate: 60fps</div>
                <div>FFT Size: ${isLeft ? '512' : '64'}</div>
              </div>
            ` : state.selectedTab === 'controls' ? html`
              <div>
                <div style="font-size: 10px; margin-bottom: 8px; color: ${activeTheme.fg_soft};">
                  <b>Master Volume: ${Math.round(state.masterVolume * 100)}%</b>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value=${() => state.masterVolume}
                  @input=${(e) => methods.setVolume(state, props, e)}
                  style="width: 100%; accent-color: ${activeTheme.aqua};"
                />
                <div style="display: flex; justify-content: space-between; font-size: 9px; color: ${activeTheme.fg_soft}; margin-top: 4px;">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            ` : html`
              <div style="font-size: 10px; color: ${activeTheme.fg_soft};">
                <div style="margin-bottom: 6px;"><b>${channelLabel} Channel</b></div>
                <div>Type: ${channelDesc}</div>
                <div>Position: ${isLeft ? 'Left Wing' : 'Right Wing'}</div>
                <div>Status: ${state.status}</div>
              </div>
            `}
          </div>
        ` : ''}
      </div>
    `;
  }
});
