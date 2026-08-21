/**
 * ESA.Ingestion.js (Arrow.js Compatible - No Nested Views)
 * ============================================
 * AI INGESTION CHAT BOX (PARENT COMPONENT)
 * 
 * ARROW.JS LIMITATION: Cannot embed view functions via ${} in templates!
 * Solution: SoundPanels mount to separate containers, not embedded in template.
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';
import { DynamicAudioBroadcaster } from './ESA.SoundPanel.js';

export const ESAIngestion = ESAVerifyComponent({
  name: 'Ingestion',
  version: '3.0.0',
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
    systemStatus: 'ready',
    // Container refs for SoundPanels (mounted separately)
    leftSoundPanelContainer: null,
    rightSoundPanelContainer: null
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
    },
    
    // Called after mount to set up SoundPanels and event listeners
    initSoundPanels: async (state, container) => {
      try {
        const { ESASoundPanel } = await import('./ESA.SoundPanel.js');
        
        // Set up select change handler (Arrow.js can't handle @change on select)
        const agentSelect = container.querySelector('#esa-agent-select');
        if (agentSelect) {
          agentSelect.addEventListener('change', (e) => {
            state.assignedAgent = e.target.value;
          });
        }
        
        // Set up input handlers (Arrow.js can't handle @input on input)
        const chatInput = container.querySelector('#esa-chat-input');
        if (chatInput) {
          chatInput.addEventListener('input', (e) => {
            state.inputValue = e.target.value;
          });
          chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') methods.sendMessage(state, state.inputValue);
          });
          chatInput.addEventListener('focus', () => {
            methods.initAudio(state);
          });
        }
        
        // Find or create left panel container
        let leftContainer = container.querySelector('#esa-soundpanel-left');
        if (!leftContainer) {
          leftContainer = document.createElement('div');
          leftContainer.id = 'esa-soundpanel-left';
          leftContainer.style.cssText = 'flex: 0 0 220px;';
          const core = container.querySelector('.esa-ingestion-core');
          if (core) {
            container.insertBefore(leftContainer, core);
          } else {
            container.appendChild(leftContainer);
          }
        }
        
        // Find or create right panel container
        let rightContainer = container.querySelector('#esa-soundpanel-right');
        if (!rightContainer) {
          rightContainer = document.createElement('div');
          rightContainer.id = 'esa-soundpanel-right';
          rightContainer.style.cssText = 'flex: 0 0 220px;';
          container.appendChild(rightContainer);
        }
        
        // Mount SoundPanels to their containers
        ESASoundPanel.mount(leftContainer, { side: 'left', audioEngine: state.audioEngine });
        ESASoundPanel.mount(rightContainer, { side: 'right', audioEngine: state.audioEngine });
        
        state.leftSoundPanelContainer = leftContainer;
        state.rightSoundPanelContainer = rightContainer;
        
        console.log('[ESA.Ingestion] SoundPanels and event listeners initialized');
      } catch (e) {
        console.error('[ESA.Ingestion] Init error:', e);
      }
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-ingestion-layout" style="display: flex; align-items: stretch; gap: 20px; width: 100%; padding: 10px;">
      <!-- Chat Core (SoundPanels will be mounted separately) -->
      <div class="esa-ingestion-core" style="flex: 1; display: flex; flex-direction: column; background: #32302f; border: 1px solid #3c3836; border-radius: 12px; padding: 16px; min-height: 320px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #3c3836;">
          <span style="color: #689d6a; font-weight: bold; font-size: 13px;">💬 ESA INGESTION AI</span>
          <div style="display: flex; gap: 10px; align-items: center;">
            <select 
              id="esa-agent-select"
              style="background: #282828; color: #ebdbb2; border: 1px solid #3c3836; border-radius: 4px; padding: 4px 8px; font-size: 11px; outline: none;"
            >
              <option value="Ava007">Ava007</option>
              <option value="Core-Q2">Core-Q²</option>
              <option value="Agent-X">Agent-X</option>
            </select>
            
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #928374;"></div>
          </div>
        </div>
        
        <!-- Messages -->
        <div style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding-right: 8px;">
          ${() => state.messages.map(msg => html`
            <div style="margin: 8px 0; padding: 10px 14px; border-radius: 8px; background: #3c3836; color: #ebdbb2; font-size: 12px; line-height: 1.5;">
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
            id="esa-chat-input"
            placeholder="Chat with assigned agent..."
            style="flex: 1; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 10px 14px; border-radius: 6px; font-size: 12px; outline: none;"
          />
          <button
            id="esa-send-button"
            style="background: #98971a; color: #282828; border: none; padding: 0 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;"
          >
            SEND
          </button>
        </div>
        
        <!-- Status Bar -->
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #3c3836; display: flex; justify-content: space-between; font-size: 9px; color: #a89984;">
          <span>System: ${state.audioInitialized ? '✅ Ready' : '⏸ Standby'}</span>
          <span>${state.systemStatus.toUpperCase()}</span>
        </div>
      </div>
    </div>
  `
});

export default ESAIngestion;
