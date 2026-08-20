/**
 * ESA.SoundPanel.js
 * ============================================
 * AI INGESTION CHAT BOX COMPONENT
 * ============================================
 * 
 * OWNER: AI Ingestion Chat Box (Voice belongs here!)
 * 
 * Features:
 * - DynamicAudioBroadcaster class (FM synthesis)
 * - 32-segment LED visualizer rings
 * - Microphone input with analysis
 * - Ava007 voice trigger
 * 
 * Connections:
 * → AI Ingestion Chat Box (PARENT)
 * → ESA.ButtonPanel (sibling in Ingestion)
 * → Web Audio API
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

export class DynamicAudioBroadcaster {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterBus = this.audioCtx.createGain();
    this.limiter = this.audioCtx.createDynamicsCompressor();
    this.analyser = this.audioCtx.createAnalyser();
    
    this.limiter.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
    this.limiter.knee.setValueAtTime(30, this.audioCtx.currentTime);
    this.limiter.ratio.setValueAtTime(20, this.audioCtx.currentTime);
    this.limiter.attack.setValueAtTime(0, this.audioCtx.currentTime);
    this.limiter.release.setValueAtTime(0.15, this.audioCtx.currentTime);

    this.analyser.fftSize = 512;
    
    this.masterBus.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    
    this.micStream = null;
    this.micAnalyser = null;
  }

  async enableMicrophone() {
    if (this.audioCtx.state === "suspended") await this.audioCtx.resume();
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const micSource = this.audioCtx.createMediaStreamSource(this.micStream);
    
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3000;
    
    this.micAnalyser = this.audioCtx.createAnalyser();
    this.micAnalyser.fftSize = 512;
    
    micSource.connect(filter);
    filter.connect(this.micAnalyser);
    return this.micAnalyser;
  }

  triggerAvaVoice(frequency, velocity = 0.85) {
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2500, now);

    const modulator = this.audioCtx.createOscillator();
    const modGain = this.audioCtx.createGain();
    modulator.frequency.value = frequency * 2.1;
    modGain.gain.value = 600;
    modulator.connect(modGain);
    modGain.connect(osc.frequency);
    modulator.start(now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterBus);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.42 * velocity, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
    modulator.stop(now + 0.5);
  }

  renderSpeakerVisualizer(analyserNode, segmentsArray) {
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const draw = () => {
      requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);
      
      const step = Math.floor(dataArray.length / segmentsArray.length);
      segmentsArray.forEach((segment, index) => {
        const magnitude = dataArray[index * step] || 0;
        if (segment) {
          segment.style.height = `${Math.max(8, (magnitude / 255) * 100)}%`;
        }
      });
    };
    draw();
  }
}

export const ESASoundPanel = ESAVerifyComponent({
  name: 'SoundPanel',
  version: '1.0.0',
  owner: 'AI-Ingestion-Chat-Box',  // ← BELONGS TO INGESTION
  verified: false,
  
  state: {
    status: 'IDLE',
    visualizerActive: false
  },
  
  methods: {
    toggleMic: async (state, props) => {
      if (state.status === 'IDLE') {
        state.status = 'INGEST';
        if (props.audioEngine) {
          const analyser = await props.audioEngine.enableMicrophone();
          console.log(`%c[ESA.SoundPanel] Sound I (Mic) activated`, `color: ${activeTheme.green}`);
          
          setTimeout(() => {
            const segments = document.querySelectorAll(`.esa-vis-segment-${props.side}`);
            props.audioEngine.renderSpeakerVisualizer(analyser, segments);
          }, 100);
        }
      } else {
        state.status = 'IDLE';
        if (props.audioEngine?.micStream) {
          props.audioEngine.micStream.getTracks().forEach(track => track.stop());
        }
      }
    }
  },
  
  template: (props, state, methods) => {
    return html`
      <div class="speaker_enclosure" style="
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
        <div style="
          position: absolute; inset: 0; border-radius: 2em;
          border: 1px solid transparent;
          background: linear-gradient(-90deg, rgba(0, 0, 0, 1), rgba(102, 102, 102, 1)) border-box;
          -webkit-mask: linear-gradient(#fff 0, #fff 100%) padding-box, linear-gradient(#fff 0, #fff 100%);
          mask: linear-gradient(#fff 0, #fff 100%) padding-box, linear-gradient(#fff 0, #fff 100%);
          -webkit-mask-composite: xor; mask-composite: exclude;
          pointer-events: none;
        "></div>

        <div style="
          position: absolute; top: 15px;
          background: rgba(0,0,0,0.6); padding: 4px 12px; border-radius: 12px;
          border: 1px solid ${activeTheme.border};
          font-size: 10px; font-weight: bold; letter-spacing: 1px;
          color: ${state.status === 'INGEST' ? activeTheme.green : state.status === 'BROADCAST' ? activeTheme.aqua : activeTheme.fg_soft};
        ">
          STATUS: ${() => state.status}
        </div>

        <div class="speaker_glow_ring" style="
          width: 140px; height: 140px; border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, rgba(0, 255, 204, 0.15) 0%, transparent 70%);
          display: flex; align-items: center; justify-content: center; position: relative;
        ">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${() => Array.from({ length: 32 }).map((_, i) => html`
              <div class="speaker_vis_bar esa-vis-segment-${props.side}" style="
                position: absolute; width: 3px; height: 10%;
                background: linear-gradient(120deg, rgba(59, 180, 155, 0.8) 0%, rgba(137, 58, 255, 0.8) 53%, rgba(253, 134, 241, 0.7) 100%);
                border-radius: 2px;
                transform: rotate(${i * 11.25}deg) translateY(-55px);
                transform-origin: center 60px;
                transition: height 0.05s ease-out;
              "></div>
            `)}
          </div>
          
          <div style="
            width: 70px; height: 70px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #3a3a3a, #0c0d12);
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.5);
            z-index: 2;
          "></div>
        </div>

        <button 
          @click=${() => methods.toggleMic(state, props)}
          style="
            margin-top: 30px; padding: 8px 16px;
            background: ${state.status === 'INGEST' ? activeTheme.red : activeTheme.blue};
            color: ${activeTheme.fg}; border: 1px solid ${activeTheme.border};
            border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold;
          "
        >
          ${() => state.status === 'INGEST' ? 'STOP INGEST' : 'ACTIVATE MIC'}
        </button>
      </div>
    `;
  }
}).component;
