/**
 * ESA.MaintenanceChecklist.js - Minimal Working Version
 */
import { html } from 'https://esm.sh/@arrow-js/core';

export const ESAMaintenanceChecklist = {
  name: 'MaintenanceChecklist',
  version: '7.0.0',
  
  mount(container) {
    if (!container) return null;
    
    try {
      container.innerHTML = '';
      
      // Exact same pattern as working Ingestion
      const view = html`
        <div style="display:flex;flex-direction:column;width:100%;min-height:400px;background:#32302f;border:1px solid #3c3836;border-radius:12px;padding:16px;">
          <h3 style="color:#d65d0e;margin-bottom:16px;">📋 DAILY MAINTENANCE CHECKLIST</h3>
          
          <div id="mc-tabs" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;"></div>
          
          <div id="mc-panel" style="flex:1;min-height:200px;background:#282828;border-radius:8px;padding:16px;">
            <p style="color:#a89984;">Select a tab to view checklist items</p>
          </div>
          
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #3c3836;display:flex;justify-content:space-between;font-size:10px;color:#665c54;">
            <span id="mc-status">Ready</span>
            <span>✓ Auto-saved</span>
          </div>
        </div>
      `;
      
      if (typeof view === 'function') {
        view(container);
        
        setTimeout(() => {
          try {
            const tabsContainer = container.querySelector('#mc-tabs');
            const panel = container.querySelector('#mc-panel');
            if (!tabsContainer || !panel) return;
            
            const tabs = [
              {id:'ss', name:'Shift Start', color:'#cc241d', icon:'🌅'},
              {id:'wt', name:'Walk-Through', color:'#d79921', icon:'🚶'},
              {id:'um', name:'Unit Maintenance', color:'#98971a', icon:'🔧'},
              {id:'eod', name:'End of Day', color:'#689d6a', icon:'🌙'},
              {id:'sf', name:'Safety', color:'#b16286', icon:'🛡️'},
              {id:'notes', name:'Notes', color:'#d65d0e', icon:'📝'}
            ];
            
            tabs.forEach(tab => {
              const btn = document.createElement('button');
              btn.style.cssText = `padding:8px 14px;background:${tab.color}20;color:${tab.color};border:1px solid ${tab.color};border-radius:6px;cursor:pointer;font-size:11px;font-weight:500;`;
              btn.textContent = `${tab.icon} ${tab.name}`;
              btn.addEventListener('click', () => {
                panel.innerHTML = `<h4 style="color:${tab.color};margin-bottom:12px;">${tab.icon} ${tab.name}</h4><p style="color:#ebdbb2;">Content for ${tab.name} tab</p>`;
                container.querySelector('#mc-status').textContent = `Viewing: ${tab.name}`;
              });
              tabsContainer.appendChild(btn);
            });
            
            console.log('[ESA.MaintenanceChecklist] ✓ Mounted');
          } catch(e) { console.error('[ESA.MC] Error:', e); }
        }, 100);
      }
      
      return { unmount:()=>{container.innerHTML='';}, state: {} };
    } catch(e) {
      console.error('[ESA.MaintenanceChecklist] Error:', e);
      return null;
    }
  }
};

export default ESAMaintenanceChecklist;
