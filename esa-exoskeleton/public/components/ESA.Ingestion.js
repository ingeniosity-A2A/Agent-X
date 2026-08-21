/**
 * ESA.Ingestion.js
 * ============================================
 * AI INGESTION CHAT BOX (PARENT COMPONENT)
 * ============================================
 * 
 * THIS IS THE PARENT THAT OWNS:
 * - ESA.ButtonPanel (Camera/Upload)
 * - ESA.SoundPanel / Dual Audio System (Ava007 Voice)
 * 
 * DUAL AUDIO ARCHITECTURE (Integrated):
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    ESA INGESTION AI BOX                     │
 * │                                                             │
 * │  ┌─────────────────┐          ┌─────────────────┐         │
 * │  │  SOUND I        │          │  AVA VOICE       │         │
 * │  │  (Left Wing)    │          │  (Right Wing)    │         │
 * │  │                 │          │                 │         │
 * │  │ • Mic Input     │  ────►   │ • FM Synthesizer│         │
 * │  │ • Lowpass Filter│   MIX    │ • LFO Modulation│         │
 * │  │ • Spectrum Anal.│          │ • ADSR Envelope │         │
 * │  └────────┬────────┘          └────────┬────────┘         │
 * │           │                            │                   │
 * │           ▼                            ▼                   │
 * │  ┌─────────────────────────────────────────────────┐      │
 * │  │           AVA BROADCASTING (Master Bus)          │      │
 * │  │            Compressor → Output → Speakers        │      │
 * │  └─────────────────────────────────────────────────┘      │
 * └─────────────────────────────────────────────────────────────┘
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';
import { ESASoundPanel, DynamicAudioBroadcaster } from './ESA.SoundPanel.js';

// Export the full component wrapper with .mount() method
export const ESAIngestion = ESAVerifyComponent({
  name: 'Ingestion',
  version: '2.4.0',  // Bumped for Dual Audio System integration
  verified: true,
  
  // AI INGESTION OWNS THESE COMPONENTS:
  owns: {
    buttonPanel: true,   // ESA.ButtonPanel belongs HERE
    voice: true,         // Ava007 Voice/Dual Audio belongs HERE
    soundPanel: true     // Both SoundPanels belong HERE
  },
  
  state: {
    messages: [
      { 
        role: 'assistant', 
        content: '🛡️ **ESA System Online**\n\nWelcome, Operator.\n\nAll modules loaded and operational.\nSelect an agent and begin your session.' 
      }
    ],
    inputValue: '',
    assignedAgent: 'Ava007',
    audioEngine: null,
    audioInitialized: false,
    systemStatus: 'ready'  // ready | processing | error
  },
  
  methods: {
    /**
     * Initialize Dual Audio System (DynamicAudioBroadcaster)
     * Creates the 3-channel audio engine owned by Ingestion
     */
    initAudio: (state) => {
      if (!state.audioEngine && typeof window !== 'undefined') {
        try {
          state.audioEngine = new DynamicAudioBroadcaster();
          state.audioInitialized = true;
          
          console.log(`%c[ESA.Ingestion] ✅ Dual Audio System initialized`, `color: ${activeTheme.aqua}`);
          console.log(`%c[ESA.Ingestion] Channels: Sound I | Ava Voice | Broadcasting`, `color: ${activeTheme.green}`);
          
          // Register voice/audio system with ESA namespace (belongs to Ingestion!)
          if (window.ESA?.ingestion?.components) {
            window.ESA.ingestion.components.voice = state.audioEngine;
            window.ESA.ingestion.components.dualAudio = true;
          }
          
          // Play initialization sound sequence (Ava007 greeting)
          setTimeout(() => {
            if (state.audioEngine) {
              // Pleasant ascending triad - "I'm here"
              state.audioEngine.triggerAvaVoice(523, 0.5, { duration: 0.15 });  // C5
              setTimeout(() => state.audioEngine.triggerAvaVoice(659, 0.5, { duration: 0.15 }), 150);  // E5
              setTimeout(() => state.audioEngine.triggerAvaVoice(784, 0.6, { duration: 0.25 }), 300);  // G5
            }
          }, 100);
          
        } catch (err) {
          console.error(`%c[ESA.Ingestion] Audio init failed: ${err.message}`, `color: ${activeTheme.red}`);
          state.systemStatus = 'error';
        }
      }
      return state.audioEngine;
    },
    
    /**
     * Send message with Ava007 voice response
     * Uses FM synthesis with varied parameters for natural feel
     */
    sendMessage: (state, text) => {
      if (!text.trim()) return;
      
      // Initialize audio if not done
      methods.initAudio(state);
      
      state.messages.push({
        role: 'user',
        content: text,
        timestamp: new Date().toISOString()
      });
      
      state.inputValue = '';
      state.systemStatus = 'processing';
      
      // Simulate AI processing delay
      setTimeout(() => {
        const responses = [
          `Processing "${text}" via ${state.assignedAgent}... Task routed to Exoskeleton.`,
          `Acknowledged. Routing "${text}" through ${state.assignedAgent} analysis pipeline.`,
          `Received input: "${text}". ${state.assignedAgent} is analyzing...`,
          `Processing complete. "${text}" has been queued for execution.`
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        state.messages.push({
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        });
        
        // Trigger Ava007 Voice with varied FM parameters (more natural)
        if (state.audioEngine && state.audioInitialized) {
          // Varied frequencies based on message length for interest
          const baseFreq = 440 + (text.length % 12) * 25;  // 440-715Hz range
          state.audioEngine.triggerAvaVoice(baseFreq, 0.75, {
            fmRatio: 2.1 + Math.random() * 0.5,   // Slight variation
            modDepth: 500 + Math.random() * 200,
            lfoRate: 4 + Math.random() * 4,         // 4-8Hz tremolo
            lfoDepth: 0.08 + Math.random() * 0.06
          });
        }
        
        state.systemStatus = 'ready';
      }, 400 + Math.random() * 300);  // Variable response time
    },
    
    /**
     * Handle file from ButtonPanel (Button belongs to Ingestion!)
     * Triggers appropriate audio feedback
     */
    handleFile: (state, file, type) => {
      console.log(`%c[ESA.Ingestion] 📎 File received from ButtonPanel: ${file.name} (${type})`, 
        `color: ${activeTheme.yellow}`);
      
      // Initialize audio for feedback
      methods.initAudio(state);
      
      state.messages.push({
        role: 'user',
        content: `[${type.toUpperCase()}] ${file.name}`,
        timestamp: new Date().toISOString(),
        attachment: { file, type }
      });
      
      // Process with Ava007 audio feedback
      setTimeout(() => {
        state.messages.push({
          role: 'assistant',
          content: `Received ${type}: "${file.name}". Processing with ${state.assignedAgent}...`,
          timestamp: new Date().toISOString()
        });
        
        // Different tones for different file types
        if (state.audioEngine && state.audioInitialized) {
          switch(type.toLowerCase()) {
            case 'image':
              // Higher pitch for images (photo capture sound)
              state.audioEngine.triggerAvaVoice(660, 0.65, { 
                frequency: 660, fmRatio: 2.5, duration: 0.2 
              });
              break;
            case 'pdf':
              // Two-tone for documents
              state.audioEngine.triggerAvaVoice(440, 0.6, { duration: 0.15 });
              setTimeout(() => state.audioEngine.triggerAvaVoice(550, 0.6, { duration: 0.15 }), 150);
              break;
            case 'text':
              // Soft confirmation
              state.audioEngine.triggerAvaVoice(523, 0.55, { 
                lfoRate: 6, lfoDepth: 0.12, duration: 0.18 
              });
              break;
            default:
              state.audioEngine.triggerAvaVoice(523, 0.6);
          }
        }
      }, 350);
    },
    
    /**
     * Play diagnostic tone via Ava Voice channel
     */
    playDiagnosticTone: (state, code) => {
      if (state.audioEngine && state.audioInitialized) {
        state.audioEngine.playDiagnosticSequence(code);
      }
    },
    
    /**
     * Get audio system status
     */
    getAudioStatus: (state) => {
      if (!state.audioEngine) return { initialized: false };
      return {
        initialized: state.audioInitialized,
        ...state.audioEngine.getStatus()
      };
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-ingestion-layout" style="
      display: flex; 
      align-items: stretch; 
      gap: 20px; 
      width: 100%;
      padding: 10px;
    ">
      <!-- Left Sound Panel: SOUND I (Inbound Mic Processing) -->
      <div style="flex: 0 0 220px;">
        ${ESASoundPanel.view({ side: 'left', audioEngine: state.audioEngine })}
      </div>
      
      <!-- Chat Core -->
      <div class="esa-ingestion-core" style="
        flex: 1; 
        display: flex; 
        flex-direction: column; 
        background: ${activeTheme.bg_soft}; 
        border: 1px solid ${activeTheme.border}; 
        border-radius: 12px; 
        padding: 16px;
        min-height: 320px;
      ">
        <!-- Header -->
        <div style="
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid ${activeTheme.border};
        ">
          <span style="color: ${activeTheme.aqua}; font-weight: bold; font-size: 13px;">
            💬 ESA INGESTION AI
          </span>
          <div style="display: flex; gap: 10px; align-items: center;">
            <!-- Agent Selector -->
            <select 
              value=${() => state.assignedAgent}
              @change=${(e) => state.assignedAgent = e.target.value}
              style="
                background: ${activeTheme.bg}; color: ${activeTheme.fg};
                border: 1px solid ${activeTheme.border}; border-radius: 4px;
                padding: 4px 8px; font-size: 11px; outline: none;
              "
            >
              <option value="Ava007">Ava007</option>
              <option value="Core-Q2">Core-Q²</option>
              <option value="Agent-X">Agent-X</option>
            </select>
            
            <!-- Audio Status Indicator -->
            <div style="
              width: 8px; height: 8px; border-radius: 50%;
              background: ${state.audioInitialized ? activeTheme.green : activeTheme.gray};
              box-shadow: 0 0 6px ${state.audioInitialized ? activeTheme.green : 'transparent'};
              title="${state.audioInitialized ? 'Dual Audio Online' : 'Audio Standby'}"
            "></div>
          </div>
        </div>
        
        <!-- Messages -->
        <div style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding-right: 8px;">
          ${() => state.messages.map(msg => html`
            <div style="
              margin: 8px 0; padding: 10px 14px; border-radius: 8px;
              background: ${msg.role === 'user' ? activeTheme.bg_blue : activeTheme.bg_purple};
              color: ${activeTheme.fg}; font-size: 12px; line-height: 1.5;
            ">
              <div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">
                ${msg.role === 'user' ? '👤 OPERATOR' : `🤖 ${state.assignedAgent}`}
                ${msg.timestamp ? `<span style="opacity: 0.6; font-weight: normal;">${new Date(msg.timestamp).toLocaleTimeString()}</span>` : ''}
              </div>
              <div>${msg.content}</div>
            </div>
          `)}
        </div>
        
        <!-- Input Area (ButtonPanel sends files here!) -->
        <div style="display: flex; gap: 8px;">
          <input
            type="text"
            value=${() => state.inputValue}
            @input=${(e) => state.inputValue = e.target.value}
            @keydown=${(e) => { if (e.key === 'Enter') methods.sendMessage(state, state.inputValue); }}
            @focus=${() => methods.initAudio(state)}
            placeholder="Chat with assigned agent..."
            style="
              flex: 1; background: ${activeTheme.bg}; border: 1px solid ${activeTheme.border};
              color: ${activeTheme.fg}; padding: 10px 14px; border-radius: 6px;
              font-size: 12px; outline: none;
            "
          />
          <button
            @click=${() => { methods.initAudio(state); methods.sendMessage(state, state.inputValue); }}
            style="
              background: ${activeTheme.green}; color: ${activeTheme.bg};
              border: none; padding: 0 20px; border-radius: 6px;
              cursor: pointer; font-weight: bold; font-size: 12px;
              transition: transform 0.1s ease;
            "
            onmouseenter=${(e) => e.target.style.transform = 'scale(1.05)'}
            onmouseleave=${(e) => e.target.style.transform = 'scale(1)'}
          >
            SEND
          </button>
        </div>
        
        <!-- Status Bar -->
        <div style="
          margin-top: 8px; padding-top: 8px; border-top: 1px solid ${activeTheme.border};
          display: flex; justify-content: space-between; font-size: 9px; color: ${activeTheme.fg_soft};
        ">
          <span>System: ${state.audioInitialized ? '✅ Ready' : '⏸ Standby'}</span>
          <span>${state.systemStatus.toUpperCase()}</span>
        </div>
      </div>
      
      <!-- Right Sound Panel: AVA VOICE (Synthesis & Speech Core) -->
      <div style="flex: 0 0 220px;">
        ${ESASoundPanel.view({ side: 'right', audioEngine: state.audioEngine })}
      </div>
    `
});

export default ESAIngestion;
