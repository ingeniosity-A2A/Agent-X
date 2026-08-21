/**
 * ESA.Ingestion.js (Arrow.js Compatible - NO WRAPPER)
 * ============================================
 * AI INGESTION CHAT BOX - Direct Arrow.js, no wrapper
 */

import { html } from 'https://esm.sh/@arrow-js/core';

// Export both wrapped and unwrapped versions
const ESAIngestionRaw = {
  name: 'Ingestion',
  version: '5.0.0',
  
  state: {
    messages: [
      { role: 'assistant', content: '🛡️ **ESA System Online**\n\nWelcome, Operator.\n\nAll modules loaded and operational.' }
    ],
    inputValue: '',
    assignedAgent: 'Ava007',
    systemStatus: 'ready'
  },
  
  // Direct mount - NO wrapper
  mount(container) {
    if (!container) return null;
    
    try {
      container.innerHTML = '';
      
      // Create state
      const state = {
        messages: [...this.state.messages],
        inputValue: '',
        assignedAgent: this.state.assignedAgent,
        systemStatus: 'ready'
      };
      
      // STATIC TEMPLATE - No dynamic expressions!
      const view = html`
        <div style="display: flex; align-items: stretch; gap: 20px; width: 100%; padding: 10px;">
          <div style="flex: 1; display: flex; flex-direction: column; background: #32302f; border: 1px solid #3c3836; border-radius: 12px; padding: 16px; min-height: 320px;">
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
            
            <div id="esa-messages-container" style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding-right: 8px;"></div>
            
            <div style="display: flex; gap: 8px;">
              <input type="text" id="esa-chat-input" placeholder="Chat with assigned agent..."
                     style="flex: 1; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 10px 14px; border-radius: 6px; font-size: 12px; outline: none;" />
              <button id="esa-send-button"
                      style="background: #98971a; color: #282828; border: none; padding: 0 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">
                SEND
              </button>
            </div>
            
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #3c3836; display: flex; justify-content: space-between; font-size: 9px; color: #a89984;">
              <span id="esa-audio-status">System: ⏸ Standby</span>
              <span id="esa-system-status">READY</span>
            </div>
          </div>
        </div>
      `;
      
      // Mount the view
      if (typeof view === 'function') {
        view(container);
      }
      
      // Initialize DOM after mount
      setTimeout(() => {
        try {
          // Render initial messages
          const msgContainer = container.querySelector('#esa-messages-container');
          if (msgContainer) {
            state.messages.forEach(msg => {
              const div = document.createElement('div');
              div.style.cssText = 'margin: 8px 0; padding: 10px 14px; border-radius: 8px; background: #3c3836; color: #ebdbb2; font-size: 12px; line-height: 1.5;';
              div.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">${msg.role === 'user' ? '👤 OPERATOR' : '🤖 Ava007'}</div>
                <div>${msg.content}</div>
              `;
              msgContainer.appendChild(div);
            });
          }
          
          // Agent selector
          const agentSel = container.querySelector('#esa-agent-select');
          if (agentSel) {
            agentSel.addEventListener('change', e => { state.assignedAgent = e.target.value; });
          }
          
          // Chat input
          const chatInput = container.querySelector('#esa-chat-input');
          if (chatInput) {
            chatInput.addEventListener('input', e => { state.inputValue = e.target.value; });
            chatInput.addEventListener('keydown', e => {
              if (e.key === 'Enter') {
                // Add user message
                if (state.inputValue.trim() && msgContainer) {
                  const div = document.createElement('div');
                  div.style.cssText = 'margin: 8px 0; padding: 10px 14px; border-radius: 8px; background: #3c3836; color: #ebdbb2; font-size: 12px; line-height: 1.5;';
                  div.innerHTML = `<div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">👤 OPERATOR</div><div>${state.inputValue}</div>`;
                  msgContainer.appendChild(div);
                  msgContainer.scrollTop = msgContainer.scrollHeight;
                  
                  state.inputValue = '';
                  chatInput.value = '';
                  
                  // Simulate response
                  setTimeout(() => {
                    const responses = [
                      `Processing via ${state.assignedAgent}...`,
                      `Acknowledged. Routing through ${state.assignedAgent}.`,
                      `Received. Analyzing...`
                    ];
                    const respDiv = document.createElement('div');
                    respDiv.style.cssText = 'margin: 8px 0; padding: 10px 14px; border-radius: 8px; background: #3c3836; color: #ebdbb2; font-size: 12px; line-height: 1.5;';
                    respDiv.innerHTML = `<div style="font-weight: bold; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">🤖 ${state.assignedAgent}</div><div>${responses[Math.floor(Math.random() * responses.length)]}</div>`;
                    msgContainer.appendChild(respDiv);
                    msgContainer.scrollTop = msgContainer.scrollHeight;
                  }, 400 + Math.random() * 300);
                }
              }
            });
          }
          
          // Send button
          const sendBtn = container.querySelector('#esa-send-button');
          if (sendBtn) {
            sendBtn.addEventListener('click', () => {
              chatInput && chatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            });
          }
          
          console.log('[ESA.Ingestion] Mounted successfully (no wrapper)');
        } catch (e) {
          console.error('[ESA.Ingestion] DOM init error:', e);
        }
      }, 100);
      
      return {
        unmount: () => { container.innerHTML = ''; },
        state: state
      };
      
    } catch (err) {
      console.error('[ESA.Ingestion] Mount error:', err);
      container.innerHTML = `<div style="color: #cc241d; padding: 20px;">Error: ${err.message}</div>`;
      return null;
    }
  }
};

export const ESAIngestion = ESAIngestionRaw;
export default ESAIngestion;
