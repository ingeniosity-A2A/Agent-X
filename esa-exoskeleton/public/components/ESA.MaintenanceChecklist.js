/**
 * ESA.MaintenanceChecklist.js - FULL VERSION (Static Template + DOM)
 * ============================================
 * 6-Tab Daily Maintenance Checklist with all features
 */

import { html } from 'https://esm.sh/@arrow-js/core';

// Checklist data definitions
const SECTIONS = [
  {id:'ss', name:'Shift Start & Setup', color:'#cc241d', icon:'🌅',
   items:['Review previous shift handoff notes','Verify tools/equipment accounted for','Check inventory levels','Inspect PPE - replace if damaged','Test communication devices','Log into work order system','Confirm vehicle/fleet check complete','Review safety bulletins','Check emergency exits clear','Verify first aid kit stocked']},
  {id:'wt', name:'Walk-Through', color:'#d79921', icon:'🚶',
   items:['Walk zone - note damage/hazards','Check HVAC units for noises/vibrations','Inspect electrical panels','Verify plumbing fixtures','Test emergency lighting','Check fire extinguishers','Check door closures','Note new work orders needed','Verify security cameras','Document housekeeping needs']},
  {id:'um', name:'Unit Maintenance', color:'#98971a', icon:'🔧',
   items:['Review PM schedule','Complete filter replacements','Tighten electrical connections','Inspect belts/pulleys','Lubricate bearings per OEM','Clean condenser coils','Check refrigerant levels/pressures','Test safety switches/limits','Calibrate thermostats/sensors','Document all readings','Replace worn components','Run test cycle after maintenance']},
  {id:'eod', name:'End-of-Day', color:'#689d6a', icon:'🌙',
   items:['Complete/open work orders','Return tools to storage','Secure access points','Submit parts requisitions','Complete time sheet documentation','Write shift handoff notes','Report unresolved safety concerns','Charge/dock portable devices','Dispose of waste properly','Sign out of systems']},
  {id:'sf', name:'Safety & Green Shield', color:'#b16286', icon:'🛡️',
   items:['Complete safety observation report','Verify LOTO procedures followed','Check hazard signage current','Confirm SDS accessible','Report PPE deficiencies','Document environmental spills','Verify Green Shield compliance','Check energy conservation','Attend required training','Sign off on safety acknowledgment']}
];

export const ESAMaintenanceChecklist = {
  name: 'MaintenanceChecklist',
  version: '6.0.0',
  
  mount(container) {
    if (!container) return null;
    
    try {
      container.innerHTML = '';
      
      const state = {
        activeTab: 'ss',
        date: new Date().toISOString().split('T')[0],
        shift: 'Day',
        employee: '',
        manager: '',
        checked: {},
        notes: '',
        entries: [{id:1, area:'', cycle:'', actions:'', parts:''}]
      };
      
      // STATIC TEMPLATE - Must have ZERO ${} expressions!
      const view = html`
        <div id="mc-root" style="display:flex;flex-direction:column;width:100%;min-height:500px;background:#282828;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <div style="background:#32302f;border-bottom:1px solid #3c3836;padding:16px 20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <span style="color:#d79921;font-weight:bold;font-size:16px;">📋 DAILY MAINTENANCE CHECKLIST</span>
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="color:#a89984;font-size:11px;">Overall:</span>
                <div style="width:100px;height:16px;background:#1d2021;border-radius:8px;position:relative;overflow:hidden;">
                  <div id="mc-total-bar" style="height:100%;background:linear-gradient(90deg,#98971a,#689d6a);width:0%;"></div>
                  <span id="mc-total-pct" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:8px;color:#ebdbb2;">0%</span>
                </div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
              <div><label style="display:block;color:#a89984;font-size:9px;margin-bottom:4px;text-transform:uppercase;">Date</label><input type="date" id="mc-date" style="width:100%;background:#282828;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"></div>
              <div><label style="display:block;color:#a89984;font-size:9px;margin-bottom:4px;text-transform:uppercase;">Shift</label><select id="mc-shift" style="width:100%;background:#282828;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"><option>Day</option><option>Swing</option><option>Night</option></select></div>
              <div><label style="display:block;color:#a89984;font-size:9px;margin-bottom:4px;text-transform:uppercase;">Employee</label><input type="text" id="mc-emp" placeholder="Name..." style="width:100%;background:#282828;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8pxfont-size:11px;"></div>
              <div><label style="display:block;color:#a89984;font-size:9px;margin-bottom:4px;text-transform:uppercase;">Manager</label><input type="text" id="mc-mgr" placeholder="Initials..." style="width:100%;background:#282828;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"></div>
            </div>
          </div>
          
          <!-- Body -->
          <div style="display:flex;flex:1;">
            <!-- Sidebar -->
            <div id="mc-sidebar" style="width:180px;background:#1d2021;border-right:1px solid #3c3836;padding:10px 0;display:flex;flex-direction:column;gap:2px;"></div>
            
            <!-- Content -->
            <div id="mc-content" style="flex:1;padding:16px;overflow-y:auto;background:#282828;"></div>
          </div>
          
          <!-- Footer -->
          <div style="background:#32302f;border-top:1px solid #3c3836;padding:8px 20px;display:flex;justify-content:space-between;font-size:9px;color:#665c54;">
            <span id="mc-footer-left">📅 Select Date | 🕐 Day Shift | 👤 Not signed in</span>
            <span>✓ Auto-saved</span>
          </div>
        </div>
      `;
      
      if (typeof view === 'function') view(container);
      
      // Build UI via DOM after mount
      setTimeout(() => {
        try {
          const sidebar = container.querySelector('#mc-sidebar');
          const content = container.querySelector('#mc-content');
          if (!sidebar || !content) return;
          
          // Set date
          const dateInput = container.querySelector('#mc-date');
          if (dateInput) { dateInput.value = state.date; dateInput.addEventListener('change', e => { state.date = e.target.value; updateFooter(); }); }
          
          // Other header inputs
          container.querySelector('#mc-shift')?.addEventListener('change', e => { state.shift = e.target.value; updateFooter(); });
          container.querySelector('#mc-emp')?.addEventListener('input', e => { state.employee = e.target.value; updateFooter(); });
          
          // Create sidebar tabs
          SECTIONS.forEach((sec, idx) => {
            const btn = document.createElement('button');
            btn.className = 'mc-tab-btn';
            btn.dataset.tab = sec.id;
            btn.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;padding:10px 12px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:10px;text-align:left;cursor:pointer;';
            btn.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${sec.color};flex-shrink:0;"></span><span>${sec.icon} ${sec.name}</span><span class="mc-badge" data-badge="${sec.id}" style="margin-left:auto;font-size:8px;color:#665c54;">0/${sec.items.length}</span>`;
            btn.addEventListener('click', () => switchTab(sec.id));
            sidebar.appendChild(btn);
          });
          
          // Notes tab button
          const notesBtn = document.createElement('button');
          notesBtn.className = 'mc-tab-btn';
          notesBtn.dataset.tab = 'notes';
          notesBtn.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;padding:10px 12px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:10px;text-align:left;cursor:pointer;';
          notesBtn.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#d65d0e;flex-shrink:0;"></span><span>📝 Notes & Log</span>`;
          notesBtn.addEventListener('click', () => switchTab('notes'));
          sidebar.appendChild(notesBtn);
          
          // Create content panels
          SECTIONS.forEach(sec => {
            const panel = document.createElement('div');
            panel.className = 'mc-panel';
            panel.dataset.panel = sec.id;
            panel.style.display = 'none';
            panel.innerHTML = `
              <h3 style="color:${sec.color};font-size:14px;margin-bottom:12px;">${sec.icon} ${sec.name}</h3>
              <div style="width:100%;height:5px;background:#32302f;border-radius:2px;margin-bottom:16px;overflow:hidden;">
                <div class="mc-section-bar" data-sbar="${sec.id}" style="height:100%;background:${sec.color};width:0%;transition:width 0.3s;"></div>
              </div>
              <div class="mc-items" data-items="${sec.id}" style="display:flex;flex-direction:column;gap:6px;"></div>`;
            content.appendChild(panel);
            
            // Add items
            const itemsContainer = panel.querySelector('.mc-items');
            sec.items.forEach((itemText, itemIdx) => {
              const itemId = `${sec.id}_${itemIdx}`;
              const itemDiv = document.createElement('div');
              itemDiv.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#32302f;border:1px solid #3c3836;border-radius:6px;cursor:pointer;';
              itemDiv.innerHTML = `
                <input type="checkbox" id="cb_${itemId}" data-cbid="${itemId}" data-sec="${sec.id}"
                       style="appearance:none;width:16px;height:16px;background:#282828;border:2px solid ${sec.color};border-radius:3px;cursor:pointer;margin-top:2px;" />
                <label for="cb_${itemId}" style="flex:1;font-size:11px;line-height:1.5;color:#ebdbb2;cursor:pointer;">${itemText}</label>`;
              
              const cb = itemDiv.querySelector('input');
              const label = itemDiv.querySelector('label');
              cb.addEventListener('change', () => {
                state.checked[itemId] = cb.checked;
                label.style.textDecoration = cb.checked ? 'line-through' : 'none';
                label.style.opacity = cb.checked ? '0.6' : '1';
                updateProgress();
              });
              itemsContainer.appendChild(itemDiv);
            });
          });
          
          // Notes panel
          const notesPanel = document.createElement('div');
          notesPanel.className = 'mc-panel';
          notesPanel.dataset.panel = 'notes';
          notesPanel.style.display = 'none';
          notesPanel.innerHTML = `
            <h3 style="color:#d65d0e;font-size:14px;margin-bottom:12px;">📝 Shift Notes & Green Shield Log</h3>
            <div style="margin-bottom:16px;"><label style="display:block;color:#a89984;font-size:10px;margin-bottom:6px;">General Notes</label>
              <textarea id="mc-notes-text" rows="3" placeholder="Enter observations..." style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:6px;padding:10px;font-size:11px;resize:vertical;"></textarea></div>
            <div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <label style="color:#a89984;font-size:10px;">Actions Logged & Parts Used</label>
              <button id="mc-add-entry" style="background:#d65d0e;color:#282828;border:none;border-radius:4px;padding:5px 12px;font-size:10px;cursor:pointer;">+ Add Row</button></div>
              <div style="border:1px solid #3c3836;border-radius:6px;overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:10px;">
                  <thead><tr style="background:#32302f;"><th style="padding:8px;text-align:left;color:#d79921;border:1px solid #3c3836;">Area</th><th style="padding:8px;text-align:left;color:#d79921;border:1px solid #3c3836;">Cycle</th><th style="padding:8px;text-align:left;color:#d79921;border:1px solid #3c3836;">Actions</th><th style="padding:8px;text-align:left;color:#d79921;border:1px solid #3c3836;">Parts</th><th style="padding:8px;width:40px;"></th></tr></thead>
                  <tbody id="mc-tbody"></tbody></table></div></div>`;
          content.appendChild(notesPanel);
          
          // Notes events
          container.querySelector('#mc-notes-text')?.addEventListener('input', e => { state.notes = e.target.value; });
          container.querySelector('#mc-add-entry')?.addEventListener('click', addEntry);
          
          function switchTab(tabId) {
            state.activeTab = tabId;
            container.querySelectorAll('.mc-tab-btn').forEach(b => { b.style.background='transparent'; b.style.borderLeftColor='transparent'; });
            const activeBtn = container.querySelector(`[data-tab="${tabId}"]`);
            if (activeBtn) { activeBtn.style.background='#282828'; activeBtn.style.borderLeftColor = activeBtn.querySelector('span').style.background; }
            container.querySelectorAll('.mc-panel').forEach(p => p.style.display = 'none');
            const activePanel = container.querySelector(`[data-panel="${tabId}"]`);
            if (activePanel) activePanel.style.display = 'block';
          }
          
          function updateProgress() {
            let total=0, done=0;
            SECTIONS.forEach(sec => {
              total += sec.items.length;
              const secDone = sec.items.filter((_,i) => state.checked[`${sec.id}_${i}`]).length;
              done += secDone;
              const badge = container.querySelector(`[data-badge="${sec.id}"]`);
              const bar = container.querySelector(`[data-sbar="${sec.id}"]`);
              if (badge) badge.textContent = `${secDone}/${sec.items.length}`;
              if (bar) bar.style.width = `${Math.round((secDone/sec.items.length)*100)}%`;
            });
            const tBar = container.querySelector('#mc-total-bar');
            const tPct = container.querySelector('#mc-total-pct');
            if (tBar && tPct) { const p = total>0 ? Math.round((done/total)*100) : 0; tBar.style.width = `${p}%`; tPct.textContent = `${p}%`; }
          }
          
          function updateFooter() {
            const f = container.querySelector('#mc-footer-left');
            if (f) f.textContent = `📅 ${state.date||'?'} | 🕐 ${state.shift} Shift | 👤 ${state.employee||'Not signed in'}`;
          }
          
          function renderEntries() {
            const tbody = container.querySelector('#mc-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            state.entries.forEach(entry => {
              const tr = document.createElement('tr');
              tr.innerHTML = `<td style="padding:6px;border:1px solid #3c3836;background:#282828;"><input data-f="area" data-eid="${entry.id}" value="${entry.area}" style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:3px;padding:4px 6px;font-size:10px;"></td>
                <td style="padding:6px;border:1px solid #3c3836;background:#282828;"><input data-f="cycle" data-eid="${entry.id}" value="${entry.cycle}" style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:3px;padding:4px 6px;font-size:10px;"></td>
                <td style="padding:6px;border:1px solid #3c3836;background:#282828;"><textarea data-f="actions" data-eid="${entry.id}" style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:3px;padding:4px 6px;font-size:10px;resize:vertical;min-height:30px;">${entry.actions}</textarea></td>
                <td style="padding:6px;border:1px solid #3c3836;background:#282828;"><input data-f="parts" data-eid="${entry.id}" value="${entry.parts}" style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:3px;padding:4px 6px;font-size:10px;"></td>
                <td style="padding:6px;border:1px solid #3c3836;background:#282828;text-align:center;">${state.entries.length>1?`<button data-del="${entry.id}" style="background:#cc241d;color:#ebdbb2;border:none;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:9px;">✕</button>`:'-'}</td>`;
              tr.querySelectorAll('input,textarea').forEach(el => el.addEventListener('change', e => { const en = state.entries.find(x=>x.id==parseInt(e.target.dataset.eid)); if(en) en[e.target.dataset.f]=e.target.value; }));
              tr.querySelector('[data-del]')?.addEventListener('click', e => { state.entries = state.entries.filter(x=>x.id!=parseInt(e.target.dataset.del)); renderEntries(); });
              tbody.appendChild(tr);
            });
          }
          
          function addEntry() {
            state.entries.push({id:Date.now(), area:'', cycle:'', actions:'', parts:''});
            renderEntries();
          }
          
          // Initialize
          switchTab('ss');
          renderEntries();
          updateProgress();
          console.log('[ESA.MaintenanceChecklist] ✓ Fully mounted with', SECTIONS.length + 1, 'tabs');
          
        } catch(e) { console.error('[ESA.MaintenanceChecklist] Init error:', e); }
      }, 100);
      
      return { unmount:()=>{container.innerHTML='';}, state };
    } catch(e) {
      console.error('[ESA.MaintenanceChecklist] Error:', e);
      return null;
    }
  }
};

export default ESAMaintenanceChecklist;
