/**
 * ESA.MaintenanceChecklist.js (NO WRAPPER - Direct Arrow.js)
 * ============================================
 * DAILY MAINTENANCE CHECKLIST - 6 Tab Module
 */

import { html } from 'https://esm.sh/@arrow-js/core';

const CHECKLIST_SECTIONS = [
  { id: 'shift-start', label: 'Shift Start & Setup', color: '#cc241d', colorLight: '#fb4934', icon: '🌅',
    items: [
      { id: 'ss1', text: 'Review previous shift handoff notes and outstanding issues' },
      { id: 'ss2', text: 'Verify all tools and equipment are accounted for in toolkit' },
      { id: 'ss3', text: 'Check inventory levels of commonly used parts and consumables' },
      { id: 'ss4', text: 'Inspect personal protective equipment (PPE) - replace if damaged' },
      { id: 'ss5', text: 'Test communication devices (radio, phone, tablet)' },
      { id: 'ss6', text: 'Log into work order system and review assigned tasks' },
      { id: 'ss7', text: 'Confirm vehicle/fleet check complete (if applicable)' },
      { id: 'ss8', text: 'Review any safety bulletins or procedure updates' },
      { id: 'ss9', text: 'Check emergency exit routes are clear and unobstructed' },
      { id: 'ss10', text: 'Verify first aid kit is fully stocked and accessible' }
    ]
  },
  { id: 'walkthrough', label: 'Shift Walk-Through', color: '#d79921', colorLight: '#fabd2f', icon: '🚶',
    items: [
      { id: 'wt1', text: 'Walk assigned zone/area - note any visible damage or hazards' },
      { id: 'wt2', text: 'Check all HVAC units for unusual noises or vibrations' },
      { id: 'wt3', text: 'Inspect electrical panels - ensure no warning indicators active' },
      { id: 'wt4', text: 'Verify plumbing fixtures - check for leaks or drips' },
      { id: 'wt5', text: 'Test emergency lighting and exit signs in walkway' },
      { id: 'wt6', text: 'Inspect fire extinguisher locations - gauge in green zone' },
      { id: 'wt7', text: 'Check door closures and automatic door operations' },
      { id: 'wt8', text: 'Note any new work orders needed from observations' },
      { id: 'wt9', text: 'Verify security cameras are operational in area' },
      { id: 'wt10', text: 'Document any housekeeping or cleaning needs observed' }
    ]
  },
  { id: 'unit-maint', label: 'Unit Maintenance', color: '#98971a', colorLight: '#b8bb26', icon: '🔧',
    items: [
      { id: 'um1', text: 'Review PM schedule for due preventive maintenance tasks' },
      { id: 'um2', text: 'Complete filter replacements per schedule (document part #\'s)' },
      { id: 'um3', text: 'Check and tighten all electrical connections on serviced units' },
      { id: 'um4', text: 'Inspect belts, pulleys, and rotating components for wear' },
      { id: 'um5', text: 'Lubricate bearings and moving parts per OEM specifications' },
      { id: 'um6', text: 'Clean condenser coils - record before/after photos if required' },
      { id: 'um7', text: 'Check refrigerant levels and pressures on HVAC equipment' },
      { id: 'um8', text: 'Test safety switches and limit controls' },
      { id: 'um9', text: 'Calibrate thermostats and sensors as needed' },
      { id: 'um10', text: 'Document all readings (amps, volts, temps) in log' },
      { id: 'um11', text: 'Replace any worn or suspect components proactively' },
      { id: 'um12', text: 'Run test cycle after maintenance - verify normal operation' }
    ]
  },
  { id: 'end-of-day', label: 'End-of-Day Procedures', color: '#689d6a', colorLight: '#8ec07c', icon: '🌙',
    items: [
      { id: 'eod1', text: 'Complete all open work orders or document status for handoff' },
      { id: 'eod2', text: 'Return all borrowed tools to proper storage locations' },
      { id: 'eod3', text: 'Secure all access points and lock up sensitive areas' },
      { id: 'eod4', text: 'Submit parts requisition for any low-stock items noticed' },
      { id: 'eod5', text: 'Complete time sheet / labor hours documentation' },
      { id: 'eod6', text: 'Write shift handoff notes for incoming technician' },
      { id: 'eod7', text: 'Report any unresolved safety concerns to supervisor' },
      { id: 'eod8', text: 'Charge / dock all portable devices and battery equipment' },
      { id: 'eod9', text: 'Dispose of waste materials properly (recycle where applicable)' },
      { id: 'eod10', text: 'Sign out of all systems and turn over badge/keys' }
    ]
  },
  { id: 'safety', label: 'Safety & Green Shield', color: '#b16286', colorLight: '#d3869b', icon: '🛡️',
    items: [
      { id: 'sf1', text: 'Complete required safety observation / near-miss report' },
      { id: 'sf2', text: 'Verify LOTO (Lock Out Tag Out) procedures followed' },
      { id: 'sf3', text: 'Check that all hazard signage is visible and current' },
      { id: 'sf4', text: 'Confirm SDS (Safety Data Sheets) accessible for chemicals used' },
      { id: 'sf5', text: 'Report any PPE deficiencies or replacement needs' },
      { id: 'sf6', text: 'Document any environmental spills or containment actions' },
      { id: 'sf7', text: 'Verify Green Shield compliance for sustainable practices' },
      { id: 'sf8', text: 'Check energy conservation measures are being followed' },
      { id: 'sf9', text: 'Attend or complete required safety training module' },
      { id: 'sf10', text: 'Sign off on daily safety acknowledgment form' }
    ]
  },
  { id: 'notes', label: 'Shift Notes & Log', color: '#d65d0e', colorLight: '#fe8019', icon: '📝', isNotesTab: true, items: [] }
];

export const ESAMaintenanceChecklist = {
  name: 'MaintenanceChecklist',
  version: '3.0.0',
  
  mount(container) {
    if (!container) return null;
    
    try {
      container.innerHTML = '';
      
      const state = {
        activeTab: 'shift-start',
        headerData: { date: new Date().toISOString().split('T')[0], shift: 'Day', employeeName: '', managerSignoff: '' },
        checkedItems: {},
        notesEntries: [{ id: 1, targetArea: '', cycle: '', actions: '', partsUsed: '', timestamp: '' }],
        shiftNotes: ''
      };
      
      // STATIC TEMPLATE
      const view = html`
        <div style="display: flex; flex-direction: column; width: 100%; min-height: 500px; background: #282828; border-radius: 12px; overflow: hidden;">
          <!-- HEADER -->
          <div style="background: #32302f; border-bottom: 1px solid #3c3836; padding: 16px 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">📋</span>
                <span style="color: #d79921; font-weight: bold; font-size: 16px; letter-spacing: 1px;">DAILY MAINTENANCE CHECKLIST</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #a89984; font-size: 11px;">Overall:</span>
                <div style="width: 120px; height: 18px; background: #1d2021; border-radius: 9px; overflow: hidden; position: relative;">
                  <div id="mc-overall-progress-bar" style="height: 100%; background: linear-gradient(90deg, #98971a, #689d6a); border-radius: 9px; transition: width 0.3s ease; width: 0%;"></div>
                  <span id="mc-overall-progress-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 9px; color: #ebdbb2; font-weight: bold;">0%</span>
                </div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
              <div>
                <label style="display: block; color: #a89984; font-size: 10px; margin-bottom: 4px; text-transform: uppercase;">Date</label>
                <input type="date" id="mc-date-input" value="${state.headerData.date}" style="width: 100%; background: #282828; color: #ebdbb2; border: 1px solid #3c3836; border-radius: 6px; padding: 8px 10px; font-size: 12px;" />
              </div>
              <div>
                <label style="display: block; color: #a89984; font-size: 10px; margin-bottom: 4px; text-transform: uppercase;">Shift</label>
                <select id="mc-shift-select" style="width: 100%; background: #282828; color: #ebdbb2; border: 1px solid #3c3836; border-radius: 6px; padding: 8px 10px; font-size: 12px;">
                  <option value="Day">Day Shift</option><option value="Swing">Swing Shift</option><option value="Night">Night Shift</option>
                </select>
              </div>
              <div>
                <label style="display: block; color: #a89984; font-size: 10px; margin-bottom: 4px; text-transform: uppercase;">Employee Name</label>
                <input type="text" id="mc-employee-input" placeholder="Your name..." style="width: 100%; background: #282828; color: #ebdbb2; border: 1px solid #3c3836; border-radius: 6px; padding: 8px 10px; font-size: 12px;" />
              </div>
              <div>
                <label style="display: block; color: #a89984; font-size: 10px; margin-bottom: 4px; text-transform: uppercase;">Manager Sign-off</label>
                <input type="text" id="mc-manager-input" placeholder="Initials..." style="width: 100%; background: #282828; color: #ebdbb2; border: 1px solid #3c3836; border-radius: 6px; padding: 8px 10px; font-size: 12px;" />
              </div>
            </div>
          </div>
          
          <!-- MAIN CONTENT -->
          <div style="display: flex; flex: 1; min-height: 400px;">
            <!-- SIDEBAR -->
            <div style="width: 200px; background: #1d2021; border-right: 1px solid #3c3836; padding: 12px 0; display: flex; flex-direction: column; gap: 4px;">
              ${CHECKLIST_SECTIONS.map(s => !s.isNotesTab ? html`
                <button class="mc-tab-btn" data-tab="${s.id}" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:11px;text-align:left;cursor:pointer;">
                  <span style="width:10px;height:10px;border-radius:50%;background:${s.color};box-shadow:0 0 8px ${s.color}40;flex-shrink:0;"></span>
                  <div style="flex:1;"><span>${s.icon} ${s.label}</span><span data-progress-badge="${s.id}" style="font-size:9px;color:#665c54;margin-left:22px;">0/${s.items.length}</span></div>
                </button>
              ` : html`
                <button class="mc-tab-btn" data-tab="${s.id}" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:11px;text-align:left;cursor:pointer;">
                  <span style="width:10px;height:10px;border-radius:50%;background:${s.color};box-shadow:0 0 8px ${s.color}40;flex-shrink:0;"></span>
                  <span>${s.icon} ${s.label}</span>
                </button>
              `)}
            </div>
            
            <!-- CONTENT PANEL -->
            <div id="mc-content-panel" style="flex:1;padding:20px;overflow-y:auto;background:#282828;">
              ${CHECKLIST_SECTIONS.map(s => s.isNotesTab ? html`
                <div class="mc-tab-content" data-content="${s.id}" style="display:none;">
                  <h3 style="color:${s.color};font-size:14px;margin-bottom:16px;">${s.icon} ${s.label}</h3>
                  <div style="margin-bottom:20px;">
                    <label style="display:block;color:#a89984;font-size:11px;margin-bottom:8px;text-transform:uppercase;">General Shift Notes</label>
                    <textarea id="mc-shift-notes" rows="4" placeholder="Enter observations..." style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:8px;padding:12px;font-size:12px;resize:vertical;"></textarea>
                  </div>
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                      <label style="color:#a89984;font-size:11px;text-transform:uppercase;">Actions Logged & Parts Used</label>
                      <button id="mc-add-row-btn" style="background:${s.color};color:#282828;border:none;border-radius:6px;padding:6px 14px;font-size:11px;cursor:pointer;font-weight:bold;">+ Add Row</button>
                    </div>
                    <div style="overflow-x:auto;border:1px solid #3c3836;border-radius:8px;">
                      <table style="width:100%;border-collapse:collapse;font-size:11px;">
                        <thead><tr style="background:#32302f;">
                          <th style="padding:10px 12px;text-align:left;color:#d79921;border:1px solid #3c3836;">Target Area</th>
                          <th style="padding:10px 12px;text-align:left;color:#d79921;border:1px solid #3c3836;">Cycle #</th>
                          <th style="padding:10px 12px;text-align:left;color:#d79921;border:1px solid #3c3836;">Actions</th>
                          <th style="padding:10px 12px;text-align:left;color:#d79921;border:1px solid #3c3836;">Parts Used</th>
                          <th style="padding:10px 12px;text-align:center;color:#d79921;border:1px solid #3c3836;width:60px;"></th>
                        </tr></thead>
                        <tbody id="mc-notes-tbody"></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ` : html`
                <div class="mc-tab-content" data-content="${s.id}" style="display:none;">
                  <h3 style="color:${s.color};font-size:14px;margin-bottom:16px;">${s.icon} ${s.label}</h3>
                  <div style="width:100%;height:6px;background:#32302f;border-radius:3px;margin-bottom:20px;overflow:hidden;">
                    <div data-progress-bar="${s.id}" style="height:100%;background:linear-gradient(90deg,${s.color},${s.colorLight});border-radius:3px;transition:width 0.3s;width:0%;"></div>
                  </div>
                  <div data-items="${s.id}" style="display:flex;flex-direction:column;gap:8px;"></div>
                </div>
              `)}
            </div>
          </div>
          
          <!-- FOOTER -->
          <div style="background:#32302f;border-top:1px solid #3c3836;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
            <div id="mc-footer-info" style="display:flex;gap:20px;font-size:10px;color:#665c54;">
              <span>📅 ${state.headerData.date}</span><span>🕐 ${state.headerData.shift} Shift</span><span>👤 Not signed in</span>
            </div>
            <div style="font-size:10px;color:#689d6a;">✓ Auto-saved to session</div>
          </div>
        </div>
      `;
      
      if (typeof view === 'function') view(container);
      
      // Initialize DOM
      setTimeout(() => {
        try {
          // Tab switching
          container.querySelectorAll('.mc-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const tabId = btn.dataset.tab;
              state.activeTab = tabId;
              container.querySelectorAll('.mc-tab-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              container.querySelectorAll('.mc-tab-content').forEach(c => c.style.display = 'none');
              const content = container.querySelector(`[data-content="${tabId}"]`);
              if (content) content.style.display = 'block';
            });
          });
          
          // Render checklist items
          CHECKLIST_SECTIONS.filter(s => !s.isNotesTab).forEach(section => {
            const itemsContainer = container.querySelector(`[data-items="${section.id}"]`);
            if (!itemsContainer) return;
            
            section.items.forEach(item => {
              const div = document.createElement('div');
              div.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:12px 16px;background:#32302f;border:1px solid #3c3836;border-radius:8px;cursor:pointer;';
              div.innerHTML = `
                <input type="checkbox" class="mc-checkbox" id="cb-${item.id}" data-item-id="${item.id}"
                       style="appearance:none;width:18px;height:18px;background:#282828;border:2px solid ${section.color};border-radius:4px;cursor:pointer;margin-top:2px;" />
                <label for="cb-${item.id}" data-label-for="${item.id}" style="flex:1;font-size:12px;line-height:1.5;color:#ebdbb2;cursor:pointer;">${item.text}</label>`;
              
              const cb = div.querySelector('.mc-checkbox');
              const label = div.querySelector(`[data-label-for="${item.id}"]`);
              cb.addEventListener('change', () => {
                state.checkedItems[item.id] = cb.checked;
                label.style.textDecoration = cb.checked ? 'line-through' : 'none';
                label.style.opacity = cb.checked ? '0.6' : '1';
                updateProgress();
              });
              itemsContainer.appendChild(div);
            });
          });
          
          // Header inputs
          const dateInput = container.querySelector('#mc-date-input');
          if (dateInput) dateInput.addEventListener('change', e => { state.headerData.date = e.target.value; updateFooter(); });
          
          const shiftSelect = container.querySelector('#mc-shift-select');
          if (shiftSelect) shiftSelect.addEventListener('change', e => { state.headerData.shift = e.target.value; updateFooter(); });
          
          const empInput = container.querySelector('#mc-employee-input');
          if (empInput) empInput.addEventListener('input', e => { state.headerData.employeeName = e.target.value; updateFooter(); });
          
          // Notes
          const notesTA = container.querySelector('#mc-shift-notes');
          if (notesTA) notesTA.addEventListener('input', e => { state.shiftNotes = e.target.value; });
          
          const addRowBtn = container.querySelector('#mc-add-row-btn');
          if (addRowBtn) addRowBtn.addEventListener('click', () => {
            state.notesEntries.push({ id: Date.now(), targetArea: '', cycle: '', actions: '', partsUsed: '', timestamp: new Date().toLocaleTimeString() });
            renderNotesTable();
          });
          
          function updateProgress() {
            let total=0, checked=0;
            CHECKLIST_SECTIONS.filter(s=>!s.isNotesTab).forEach(s => {
              total += s.items.length;
              checked += s.items.filter(i => state.checkedItems[i.id]).length;
              const badge = container.querySelector(`[data-progress-badge="${s.id}"]`);
              const bar = container.querySelector(`[data-progress-bar="${s.id}"]`);
              if (badge) badge.textContent = `${s.items.filter(i=>state.checkedItems[i.id]).length}/${s.items.length}`;
              if (bar) bar.style.width = `${Math.round((s.items.filter(i=>state.checkedItems[i.id]).length/s.items.length)*100)}%`;
            });
            const overallBar = container.querySelector('#mc-overall-progress-bar');
            const overallText = container.querySelector('#mc-overall-progress-text');
            if (overallBar && overallText) { const pct = total>0 ? Math.round((checked/total)*100) : 0; overallBar.style.width = `${pct}%`; overallText.textContent = `${pct}% Complete`; }
          }
          
          function updateFooter() {
            const footer = container.querySelector('#mc-footer-info');
            if (footer) footer.innerHTML = `<span>📅 ${state.headerData.date||'No date'}</span><span>🕐 ${state.headerData.shift||'Day'} Shift</span><span>👤 ${state.headerData.employeeName||'Not signed in'}</span>`;
          }
          
          function renderNotesTable() {
            const tbody = container.querySelector('#mc-notes-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            state.notesEntries.forEach(entry => {
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;"><input type="text" data-field="targetArea" data-row-id="${entry.id}" value="${entry.targetArea}" placeholder="Area..." style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"></td>
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;"><input type="text" data-field="cycle" data-row-id="${entry.id}" value="${entry.cycle}" placeholder="Cycle..." style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"></td>
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;"><textarea data-field="actions" data-row-id="${entry.id}" placeholder="Actions..." style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;resize:vertical;min-height:40px;">${entry.actions}</textarea></td>
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;"><input type="text" data-field="partsUsed" data-row-id="${entry.id}" value="${entry.partsUsed}" placeholder="Parts..." style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"></td>
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;text-align:center;">${state.notesEntries.length>1?`<button data-delete-row="${entry.id}" style="background:#cc241d;color:#ebdbb2;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:10px;">✕</button>`:'-'}</td>`;
              tr.querySelectorAll('input,textarea').forEach(input => input.addEventListener('change', e => { const entry2 = state.notesEntries.find(en=>en.id==parseInt(e.target.dataset.rowId)); if(entry2) entry2[e.target.dataset.field]=e.target.value; }));
              const delBtn = tr.querySelector('[data-delete-row]');
              if(delBtn) delBtn.addEventListener('click',()=>{state.notesEntries=state.notesEntries.filter(e=>e.id!=parseInt(delBtn.dataset.rowId));renderNotesTable();});
              tbody.appendChild(tr);
            });
          }
          
          // Init
          const firstTab = container.querySelector('.mc-tab-btn[data-tab="shift-start"]');
          if(firstTab) firstTab.classList.add('active');
          const firstContent = container.querySelector('.mc-tab-content[data-content="shift-start"]');
          if(firstContent) firstContent.style.display='block';
          renderNotesTable();
          updateProgress();
          
          console.log('[ESA.MaintenanceChecklist] Mounted successfully');
        } catch(e) { console.error('[ESA.MaintenanceChecklist] Init error:', e); }
      }, 100);
      
      return { unmount: ()=>{container.innerHTML='';}, state };
    } catch(err) {
      console.error('[ESA.MaintenanceChecklist] Error:', err);
      return null;
    }
  }
};

export default ESAMaintenanceChecklist;
