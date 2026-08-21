/**
 * ESA.Ingestion.js (Arrow.js Compatible - 100% STATIC TEMPLATE)
 * ============================================
 * AI INGESTION CHAT BOX (PARENT COMPONENT)
 * 
 * CRITICAL: Template must contain ZERO dynamic expressions!
 * All ${} patterns cause "Invalid HTML position" error in Arrow.js.
 * 
 * Pattern: Static HTML template → Post-mount DOM manipulation
 */

import { html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

export const ESAIngestion = ESAVerifyComponent({
  name: 'Ingestion',
  version: '4.0.0',
  verified: true,
  
  state: {
    messages: [
      { role: 'assistant', content: '🛡️ **ESA System Online**\n\nWelcome, Operator.\n\nAll modules loaded and operational.' }
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
          // Dynamic import to avoid errors if module unavailable
          import('./ESA.SoundPanel.js').then(({ DynamicAudioBroadcaster }) => {
            state.audioEngine = new DynamicAudioBroadcaster();
            state.audioInitialized = true;
          }).catch(() => {
            state.systemStatus = 'error';
          });
        } catch (err) {
          state.systemStatus = 'error';
        }
      }
      return state.audioEngine;
    },
    
    sendMessage: (state, text, container) => {
      if (!text.trim()) return;
      
      methods.initAudio(state);
      
      // Add user message via DOM
      const messagesContainer = container.querySelector('#esa-messages-container');
      if (messagesContainer) {
        const userMsgDiv = document.createElement('div');
        userMsgDiv.style.cssText = 'margin: 8px 0; padding: 10px 14px; border-radius: 8px; background: #3c3836; color: #ebdbb2; font-size: 12px; line-height: 1.5;';
        userMsgDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">👤 OPERATOR</div>
          <div>${text}</div>
        `;
        messagesContainer.appendChild(userMsgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      state.inputValue = '';
      state.systemStatus = 'processing';
      methods.updateStatus(container, 'processing');
      
      // Simulate AI response
      setTimeout(() => {
        const responses = [
          `Processing "${text}" via ${state.assignedAgent}...`,
          `Acknowledged. Routing through ${state.assignedAgent}.`,
          `Received: "${text}". Analyzing...`
        ];
        
        const responseText = responses[Math.floor(Math.random() * responses.length)];
        
        if (messagesContainer) {
          const assistantMsgDiv = document.createElement('div');
          assistantMsgDiv.style.cssText = 'margin: 8px 0; padding: 10px 14px; border-radius: 8px; background: #3c3836; color: #ebdbb2; font-size: 12px; line-height: 1.5;';
          assistantMsgDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">🤖 ${state.assignedAgent}</div>
            <div>${responseText}</div>
          `;
          messagesContainer.appendChild(assistantMsgDiv);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        state.systemStatus = 'ready';
        methods.updateStatus(container, 'ready');
      }, 400 + Math.random() * 300);
    },
    
    updateStatus: (container, status) => {
      const statusSpan = container.querySelector('#esa-system-status');
      if (statusSpan) {
        statusSpan.textContent = status.toUpperCase();
      }
      const systemSpan = container.querySelector('#esa-audio-status');
      if (systemSpan) {
        // Will be updated by initAudio callback
      }
    },
    
    initDOM: (state, container) => {
      // Agent selector
      const agentSelect = container.querySelector('#esa-agent-select');
      if (agentSelect) {
        agentSelect.value = state.assignedAgent;
        agentSelect.addEventListener('change', (e) => {
          state.assignedAgent = e.target.value;
        });
      }
      
      // Chat input
      const chatInput = container.querySelector('#esa-chat-input');
      if (chatInput) {
        chatInput.addEventListener('input', (e) => {
          state.inputValue = e.target.value;
        });
        chatInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') methods.sendMessage(state, state.inputValue, container);
        });
        chatInput.addEventListener('focus', () => {
          methods.initAudio(state);
        });
      }
      
      // Send button
      const sendButton = container.querySelector('#esa-send-button');
      if (sendButton) {
        sendButton.addEventListener('click', () => {
          methods.sendMessage(state, state.inputValue, container);
        });
      }
      
      // Render initial messages
      const messagesContainer = container.querySelector('#esa-messages-container');
      if (messagesContainer && state.messages) {
        state.messages.forEach(msg => {
          const msgDiv = document.createElement('div');
          msgDiv.style.cssText = 'margin: 8px 0; padding: 10px 14px; border-radius: 8px; background: #3c3836; color: #ebdbb2; font-size: 12px; line-height: 1.5;';
          msgDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">
              ${msg.role === 'user' ? '👤 OPERATOR' : '🤖 ' + (state.assignedAgent || 'Ava007')}
            </div>
            <div>${msg.content}</div>
          `;
          messagesContainer.appendChild(msgDiv);
        });
      }
    }
  },
  
  // 100% STATIC TEMPLATE - No dynamic expressions!
  template: () => html`
    <div class="esa-ingestion-layout" style="display: flex; align-items: stretch; gap: 20px; width: 100%; padding: 10px;">
      <!-- Chat Core -->
      <div class="esa-ingestion-core" style="flex: 1; display: flex; flex-direction: column; background: #32302f; border: 1px solid #3c3836; border-radius: 12px; padding: 16px; min-height: 320px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #3c3836;">
          <span style="color: #689d6a; font-weight: bold; font-size: 13px;">💬 ESA INGESTION AI</span>
          <div style="display: flex; gap: 10px; align-items: center;">
            <select id="esa-agent-select" style="background: #282828; color: #ebdbb2; border: 1px solid #3c3836; border-radius: 4px; padding: 4px 8px; font-size: 11px; outline: none;">
              <option value="Ava007">Ava007</option>
              <option value="Core-Q2">Core-Q²</option>
              <option value="Agent-X">Agent-X</option>
            </select>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #928374;"></div>
          </div>
        </div>
        
        <!-- Messages Container (populated dynamically) -->
        <div id="esa-messages-container" style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding-right: 8px;">
          <!-- Messages will be inserted here via DOM -->
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
          <span id="esa-audio-status">System: ⏸ Standby</span>
          <span id="esa-system-status">READY</span>
        </div>
      </div>
    </div>
  `,
  
  mounted: (props, state, methods, container) => {
    setTimeout(() => {
      try {
        methods.initDOM(state, container);
      } catch (err) {
        console.error('[ESA.Ingestion] Init error:', err);
      }
    }, 100);
  }
});

export default ESAIngestion;
