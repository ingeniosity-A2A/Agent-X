/**
 * ESA.Ingestion.js
 * ============================================
 * AI INGESTION CHAT BOX (PARENT COMPONENT)
 * ============================================
 * 
 * THIS IS THE PARENT THAT OWNS:
 * - ESA.ButtonPanel (Camera/Upload)
 * - ESA.SoundPanel / Dual Audio System (Ava007 Voice)
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';
import { ESASoundPanel, DynamicAudioBroadcaster } from './ESA.SoundPanel.js';

// Pre-computed style strings (Arrow.js doesn't allow ${} in style attrs)
const styles = {
  layout: `display: flex; align-items: stretch; gap: 20px; width: 100%; padding: 10px;`,
  core: `flex: 1; display: flex; flex-direction: column; background: ${activeTheme.bg_soft}; border: 1px solid ${activeTheme.border}; border-radius: 12px; padding: 16px; min-height: 320px;`,
  header: `display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid ${activeTheme.border};`,
  title: `color: ${activeTheme.aqua}; font-weight: bold; font-size: 13px;`,
  select: `background: ${activeTheme.bg}; color: ${activeTheme.fg}; border: 1px solid ${activeTheme.border}; border-radius: 4px; padding: 4px 8px; font-size: 11px; outline: none;`,
  input: `flex: 1; background: ${activeTheme.bg}; border: 1px solid ${activeTheme.border}; color: ${activeTheme.fg}; padding: 10px 14px; border-radius: 6px; font-size: 12px; outline: none;`,
  button: `background: ${activeTheme.green}; color: ${activeTheme.bg}; border: none; padding: 0 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;`,
  statusBar: `margin-top: 8px; padding-top: 8px; border-top: 1px solid ${activeTheme.border}; display: flex; justify-content: space-between; font-size: 9px; color: ${activeTheme.fg_soft};`
};

// Export the full component wrapper with .mount() method
export const ESAIngestion = ESAVerifyComponent({
  name: 'Ingestion',
  version: '2.6.0',
  verified: true,
  
  owns: {
    buttonPanel: true,
    voice: true,
    soundPanel: true
  },
  
  state: {
    messages: [
      { 
        role: 'assistant', 
        content: '🛡️ **ESA System Online**\n\nWelcome, Operator.\n\nAll modules loaded and operational.' 
      }
    ],
    inputValue: '',
    assignedAgent: 'Ava007',
    audioEngine: null,
    audioInitialized: false,
    systemStatus: 'ready'
  },
  
  methods: {
    initAudio: (state) => {
      if (!state.audioEngine && typeof window !== 'undefined') {
        try {
          state.audioEngine = new DynamicAudioBroadcaster();
          state.audioInitialized = true;
          
          if (window.ESA?.ingestion?.components) {
            window.ESA.ingestion.components.voice = state.audioEngine;
            window.ESA.ingestion.components.dualAudio = true;
          }
        } catch (err) {
          state.systemStatus = 'error';
        }
      }
      return state.audioEngine;
    },
    
    sendMessage: (state, text) => {
      if (!text.trim()) return;
      
      methods.initAudio(state);
      
      state.messages.push({ role: 'user', content: text, timestamp: new Date().toISOString() });
      state.inputValue = '';
      state.systemStatus = 'processing';
      
      setTimeout(() => {
        const responses = [
          `Processing "${text}" via ${state.assignedAgent}...`,
          `Acknowledged. Routing through ${state.assignedAgent}.`,
          `Received: "${text}". Analyzing...`
        ];
        
        state.messages.push({
          role: 'assistant',
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString()
        });
        
        if (state.audioEngine && state.audioInitialized) {
          const baseFreq = 440 + (text.length % 12) * 25;
          state.audioEngine.triggerAvaVoice(baseFreq, 0.75);
        }
        
        state.systemStatus = 'ready';
      }, 400 + Math.random() * 300);
    },
    
    handleFile: (state, file, type) => {
      methods.initAudio(state);
      
      state.messages.push({
        role: 'user',
        content: `[${type.toUpperCase()}] ${file.name}`,
        timestamp: new Date().toISOString(),
        attachment: { file, type }
      });
      
      setTimeout(() => {
        state.messages.push({
          role: 'assistant',
          content: `Received ${type}: "${file.name}". Processing...`,
          timestamp: new Date().toISOString()
        });
        
        if (state.audioEngine && state.audioInitialized) {
          state.audioEngine.triggerAvaVoice(523, 0.6);
        }
      }, 350);
    },
    
    getAudioStatus: (state) => {
      if (!state.audioEngine) return { initialized: false };
      return { initialized: state.audioInitialized, ...state.audioEngine.getStatus() };
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-ingestion-layout" style=${styles.layout}>
      <!-- Left Sound Panel -->
      <div style="flex: 0 0 220px;">
        ${ESASoundPanel.view({ side: 'left', audioEngine: state.audioEngine })}
      </div>
      
      <!-- Chat Core -->
      <div class="esa-ingestion-core" style=${styles.core}>
        <!-- Header -->
        <div style=${styles.header}>
          <span style=${styles.title}>💬 ESA INGESTION AI</span>
          <div style="display: flex; gap: 10px; align-items: center;">
            <select 
              value=${() => state.assignedAgent}
              @change=${(e) => state.assignedAgent = e.target.value}
              style=${styles.select}
            >
              <option value="Ava007">Ava007</option>
              <option value="Core-Q2">Core-Q²</option>
              <option value="Agent-X">Agent-X</option>
            </select>
            
            <div style="
              width: 8px; height: 8px; border-radius: 50%;
              background: ${state.audioInitialized ? '#98971a' : '#928374'};
              box-shadow: 0 0 6px ${state.audioInitialized ? '#98971a' : 'transparent'};
            "></div>
          </div>
        </div>
        
        <!-- Messages -->
        <div style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding-right: 8px;">
          ${() => state.messages.map(msg => html`
            <div style="
              margin: 8px 0; padding: 10px 14px; border-radius: 8px;
              background: ${msg.role === 'user' ? '#264244' : '#3c3836'};
              color: #ebdbb2; font-size: 12px; line-height: 1.5;
            ">
              <div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">
                ${msg.role === 'user' ? '👤 OPERATOR' : `🤖 ${state.assignedAgent}`}
              </div>
              <div>${msg.content}</div>
            </div>
          `)}
        </div>
        
        <!-- Input Area -->
        <div style="display: flex; gap: 8px;">
          <input
            type="text"
            value=${() => state.inputValue}
            @input=${(e) => state.inputValue = e.target.value}
            @keydown=${(e) => { if (e.key === 'Enter') methods.sendMessage(state, state.inputValue); }}
            @focus=${() => methods.initAudio(state)}
            placeholder="Chat with assigned agent..."
            style=${styles.input}
          />
          <button
            @click=${() => { methods.initAudio(state); methods.sendMessage(state, state.inputValue); }}
            style=${styles.button}
          >
            SEND
          </button>
        </div>
        
        <!-- Status Bar -->
        <div style=${styles.statusBar}>
          <span>System: ${state.audioInitialized ? '✅ Ready' : '⏸ Standby'}</span>
          <span>${state.systemStatus.toUpperCase()}</span>
        </div>
      </div>
      
      <!-- Right Sound Panel -->
      <div style="flex: 0 0 220px;">
        ${ESASoundPanel.view({ side: 'right', audioEngine: state.audioEngine })}
      </div>
    `
});

export default ESAIngestion;
