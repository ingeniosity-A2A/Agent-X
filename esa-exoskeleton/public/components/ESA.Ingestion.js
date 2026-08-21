/**
 * ESA.Ingestion.js
 * ============================================
 * AI INGESTION CHAT BOX (PARENT COMPONENT)
 * ============================================
 * 
 * THIS IS THE PARENT THAT OWNS:
 * - ESA.ButtonPanel (Camera/Upload)
 * - ESA.SoundPanel / Voice (Ava007 Audio)
 * 
 * Architecture:
 * ┌─────────────────────────────────────┐
 * │      AI INGESTION CHAT BOX          │
 * │  ┌─────────┐  ┌─────────────────┐  │
 * │  │ Sound   │  │   Chat Core     │  │
 * │  │ Panel   │  │   (messages)    │  │
 * │  │ (Left)  │  │                 │  │
 * │  └─────────┘  ├─────────────────┤  │
 * │               │ Input + Send    │  │
 * │  ┌─────────┐  └─────────────────┘  │
 * │  │ Sound   │                       │
 * │  │ Panel   │  ← Button Panel       │
 * │  │ (Right) │    mounts HERE        │
 * │  └─────────┘                       │
 * └─────────────────────────────────────┘
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';
import { ESASoundPanel, DynamicAudioBroadcaster } from './ESA.SoundPanel.js';

// Export the full component wrapper with .mount() method
export const ESAIngestion = ESAVerifyComponent({
  name: 'Ingestion',
  version: '2.3.0',  // Bumped for mount() fix
  verified: true,
  
  // AI INGESTION OWNS THESE COMPONENTS:
  owns: {
    buttonPanel: true,   // ESA.ButtonPanel belongs HERE
    voice: true          // Ava007 Voice belongs HERE
  },
  
  state: {
    messages: [
      { role: 'assistant', content: 'ESA Ingestion Online. Assigned Agent: Ava007. Audio systems standing by.' }
    ],
    inputValue: '',
    assignedAgent: 'Ava007',
    audioEngine: null
  },
  
  methods: {
    initAudio: (state) => {
      if (!state.audioEngine && typeof window !== 'undefined') {
        state.audioEngine = new DynamicAudioBroadcaster();
        console.log(`%c[ESA.Ingestion] DynamicAudioBroadcaster initialized`, `color: ${activeTheme.aqua}`);
        
        // Register voice with ESA namespace (belongs to Ingestion!)
        if (window.ESA?.ingestion?.components) {
          window.ESA.ingestion.components.voice = state.audioEngine;
        }
      }
    },
    
    sendMessage: (state, text) => {
      if (!text.trim()) return;
      
      state.messages.push({
        role: 'user',
        content: text,
        timestamp: new Date().toISOString()
      });
      
      state.inputValue = '';
      
      setTimeout(() => {
        const response = `Processing "${text}" via ${state.assignedAgent}... Task routed to Exoskeleton.`;
        state.messages.push({
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        });
        
        // Trigger Ava007 Voice (belongs to Ingestion!)
        if (state.audioEngine) {
          state.audioEngine.triggerAvaVoice(440, 0.85);
        }
      }, 600);
    },
    
    // Handle file from ButtonPanel (Button belongs to Ingestion!)
    handleFile: (state, file, type) => {
      console.log(`%c[ESA.Ingestion] 📎 File received from ButtonPanel: ${file.name} (${type})`, 
        `color: ${activeTheme.yellow}`);
      
      state.messages.push({
        role: 'user',
        content: `[${type.toUpperCase()}] ${file.name}`,
        timestamp: new Date().toISOString(),
        attachment: { file, type }
      });
      
      // Process with Ava007
      setTimeout(() => {
        state.messages.push({
          role: 'assistant',
          content: `Received ${type}: "${file.name}". Processing with ${state.assignedAgent}...`,
          timestamp: new Date().toISOString()
        });
        
        if (state.audioEngine) {
          state.audioEngine.triggerAvaVoice(523, 0.7);
        }
      }, 400);
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
      <!-- Left Sound Panel (Voice - belongs to Ingestion!) -->
      <div style="flex: 0 0 220px;">
        ${ESASoundPanel({ side: 'left', audioEngine: state.audioEngine })}
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
        <div style="
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid ${activeTheme.border};
        ">
          <span style="color: ${activeTheme.aqua}; font-weight: bold; font-size: 13px;">
            💬 ESA INGESTION AI
          </span>
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
        </div>
        
        <!-- Messages -->
        <div style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding-right: 8px;">
          ${() => state.messages.map(msg => html`
            <div style="
              margin: 8px 0; padding: 10px 14px; border-radius: 8px;
              background: ${msg.role === 'user' ? activeTheme.bg_blue : activeTheme.bg_purple};
              color: ${activeTheme.fg}; font-size: 12px; line-height: 1.4;
            ">
              <div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">
                ${msg.role === 'user' ? '👤 OPERATOR' : `🤖 ${state.assignedAgent}`}
              </div>
              <div>${msg.content}</div>
            </div>
          `)}
        </div>
        
        <!-- Input (ButtonPanel sends files here!) -->
        <div style="display: flex; gap: 8px;">
          <input
            type="text"
            value=${() => state.inputValue}
            @input=${(e) => state.inputValue = e.target.value}
            @keydown=${(e) => { if (e.key === 'Enter') methods.sendMessage(state, state.inputValue); }}
            @click=${() => methods.initAudio(state)}
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
            "
          >
            SEND
          </button>
        </div>
      </div>
      
      <!-- Right Sound Panel (Voice - belongs to Ingestion!) -->
      <div style="flex: 0 0 220px;">
        ${ESASoundPanel({ side: 'right', audioEngine: state.audioEngine })}
      </div>
    `
});

export default ESAIngestion;
