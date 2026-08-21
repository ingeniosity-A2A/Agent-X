/**
 * ESA.MaintenanceChecklist.js (100% STATIC - No dynamic expressions)
 * ============================================
 * DAILY MAINTENANCE CHECKLIST
 */

import { html } from 'https://esm.sh/@arrow-js/core';

export const ESAMaintenanceChecklist = {
  name: 'MaintenanceChecklist',
  version: '4.0.0',
  
  mount(container) {
    if (!container) return null;
    
    try {
      container.innerHTML = '';
      
      const state = {
        activeTab: 'shift-start',
        headerData: { date: new Date().toISOString().split('T')[0], shift: 'Day', employeeName: '', managerSignoff: '' },
        checkedItems: {},
        notesEntries: [{ id: 1, targetArea: '', cycle: '', actions: '', partsUsed: '' }],
        shiftNotes: ''
      };
      
      // COMPLETELY STATIC TEMPLATE - Zero ${} expressions!
      const view = html`
        <div style="display:flex;flex-direction:column;width:100%;min-height:500px;background:#282828;border-radius:12px;overflow:hidden;">
          <!-- HEADER -->
          <div style="background:#32302f;border-bottom:1px solid #3c3836;padding:16px 20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:24px;">📋</span>
                <span style="color:#d79921;font-weight:bold;font-size:16px;letter-spacing:1px;">DAILY MAINTENANCE CHECKLIST</span>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="color:#a89984;font-size:11px;">Overall:</span>
                <div style="width:120px;height:18px;background:#1d2021;border-radius:9px;overflow:hidden;position:relative;">
                  <div id="mc-overall-bar" style="height:100%;background:linear-gradient(90deg,#98971a,#689d6a);border-radius:9px;width:0%;"></div>
                  <span id="mc-overall-text" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;color:#ebdbb2;font-weight:bold;">0%</span>
                </div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
              <div><label style="display:block;color:#a89984;font-size:10px;margin-bottom:4px;text-transform:uppercase;">Date</label><input type="date" id="mc-date" style="width:100%;background:#282828;color:#ebdbb2;border:1px solid #3c3836;border-radius:6px;padding:8px 10px;font-size:12px;" /></div>
              <div><label style="display:block;color:#a89984;font-size:10px;margin-bottom:4px;text-transform:uppercase;">Shift</label><select id="mc-shift" style="width:100%;background:#282828;color:#ebdbb2;border:1px solid #3c3836;border-radius:6px;padding:8px 10px;font-size:12px;"><option>Day Shift</option><option>Swing Shift</option><option>Night Shift</option></select></div>
              <div><label style="display:block;color:#a89984;font-size:10px;margin-bottom:4px;text-transform:uppercase;">Employee Name</label><input type="text" id="mc-emp" placeholder="Your name..." style="width:100%;background:#282828;color:#ebdbb2;border:1px solid #3c3836;border-radius:6px;padding:8px 10px;font-size:12px;" /></div>
              <div><label style="display:block;color:#a89984;font-size:10px;margin-bottom:4px;text-transform:uppercase;">Manager Sign-off</label><input type="text" id="mc-mgr" placeholder="Initials..." style="width:100%;background:#282828;color:#ebdbb2;border:1px solid #3c3836;border-radius:6px;padding:8px 10px;font-size:12px;" /></div>
            </div>
          </div>
          
          <!-- MAIN -->
          <div style="display:flex;flex:1;min-height:400px;">
            <!-- SIDEBAR - All 6 tabs hardcoded -->
            <div style="width:200px;background:#1d2021;border-right:1px solid #3c3836;padding:12px 0;display:flex;flex-direction:column;gap:4px;">
              <button class="mc-tab" data-tab="shift-start" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:11px;text-align:left;cursor:pointer;"><span style="width:10px;height:10px;border-radius:50%;background:#cc241d;flex-shrink:0;"></span><span>🌅 Shift Start & Setup</span><span class="mc-badge" data-badge="shift-start" style="font-size:9px;color:#665c54;margin-left:auto;">0/10</span></button>
              <button class="mc-tab" data-tab="walkthrough" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:11px;text-align:left;cursor:pointer;"><span style="width:10px;height:10px;border-radius:50%;background:#d79921;flex-shrink:0;"></span><span>🚶 Walk-Through</span><span class="mc-badge" data-badge="walkthrough" style="font-size:9px;color:#665c54;margin-left:auto;">0/10</span></button>
              <button class="mc-tab" data-tab="unit-maint" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:11px;text-align:left;cursor:pointer;"><span style="width:10px;height:10px;border-radius:50%;background:#98971a;flex-shrink:0;"></span><span>🔧 Unit Maintenance</span><span class="mc-badge" data-badge="unit-maint" style="font-size:9px;color:#665c54;margin-left:auto;">0/12</span></button>
              <button class="mc-tab" data-tab="end-of-day" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:11px;text-align:left;cursor:pointer;"><span style="width:10px;height:10px;border-radius:50%;background:#689d6a;flex-shrink:0;"></span><span>🌙 End-of-Day</span><span class="mc-badge" data-badge="end-of-day" style="font-size:9px;color:#665c54;margin-left:auto;">0/10</span></button>
              <button class="mc-tab" data-tab="safety" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:11px;text-align:left;cursor:pointer;"><span style="width:10px;height:10px;border-radius:50%;background:#b16286;flex-shrink:0;"></span><span>🛡️ Safety & Green Shield</span><span class="mc-badge" data-badge="safety" style="font-size:9px;color:#665c54;margin-left:auto;">0/10</span></button>
              <button class="mc-tab" data-tab="notes" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:none;border-left:3px solid transparent;color:#a89984;font-size:11px;text-align:left;cursor:pointer;"><span style="width:10px;height:10px;border-radius:50%;background:#d65d0e;flex-shrink:0;"></span><span>📝 Notes & Log</span></button>
            </div>
            
            <!-- CONTENT PANELS - All 6 panels hardcoded -->
            <div style="flex:1;padding:20px;overflow-y:auto;background:#282828;">
              <!-- Tab 1: Shift Start -->
              <div class="mc-panel" data-panel="shift-start" style="display:none;">
                <h3 style="color:#cc241d;font-size:14px;margin-bottom:16px;">🌅 Shift Start & Setup</h3>
                <div style="width:100%;height:6px;background:#32302f;border-radius:3px;margin-bottom:20px;overflow:hidden;"><div class="mc-bar" data-bar="shift-start" style="height:100%;background:linear-gradient(90deg,#cc241d,#fb4934);width:0%;"></div></div>
                <div data-items="shift-start" class="mc-items" style="display:flex;flex-direction:column;gap:8px;"></div>
              </div>
              
              <!-- Tab 2: Walk-Through -->
              <div class="mc-panel" data-panel="walkthrough" style="display:none;">
                <h3 style="color:#d79921;font-size:14px;margin-bottom:16px;">🚶 Shift Walk-Through</h3>
                <div style="width:100%;height:6px;background:#32302f;border-radius:3px;margin-bottom:20px;overflow:hidden;"><div class="mc-bar" data-bar="walkthrough" style="height:100%;background:linear-gradient(90deg,#d79921,#fabd2f);width:0%;"></div></div>
                <div data-items="walkthrough" class="mc-items" style="display:flex;flex-direction:column;gap:8px;"></div>
              </div>
              
              <!-- Tab 3: Unit Maintenance -->
              <div class="mc-panel" data-panel="unit-maint" style="display:none;">
                <h3 style="color:#98971a;font-size:14px;margin-bottom:16px;">🔧 Unit Maintenance</h3>
                <div style="width:100%;height:6px;background:#32302f;border-radius:3px;margin-bottom:20px;overflow:hidden;"><div class="mc-bar" data-bar="unit-maint" style="height:100%;background:linear-gradient(90deg,#98971a,#b8bb26);width:0%;"></div></div>
                <div data-items="unit-maint" class="mc-items" style="display:flex;flex-direction:column;gap:8px;"></div>
              </div>
              
              <!-- Tab 4: End of Day -->
              <div class="mc-panel" data-panel="end-of-day" style="display:none;">
                <h3 style="color:#689d6a;font-size:14px;margin-bottom:16px;">🌙 End-of-Day Procedures</h3>
                <div style="width:100%;height:6px;background:#32302f;border-radius:3px;margin-bottom:20px;overflow:hidden;"><div class="mc-bar" data-bar="end-of-day" style="height:100%;background:linear-gradient(90deg,#689d6a,#8ec07c);width:0%;"></div></div>
                <div data-items="end-of-day" class="mc-items" style="display:flex;flex-direction:column;gap:8px;"></div>
              </div>
              
              <!-- Tab 5: Safety -->
              <div class="mc-panel" data-panel="safety" style="display:none;">
                <h3 style="color:#b16286;font-size:14px;margin-bottom:16px;">🛡️ Safety & Green Shield</h3>
                <div style="width:100%;height:6px;background:#32302f;border-radius:3px;margin-bottom:20px;overflow:hidden;"><div class="mc-bar" data-bar="safety" style="height:100%;background:linear-gradient(90deg,#b16286,#d3869b);width:0%;"></div></div>
                <div data-items="safety" class="mc-items" style="display:flex;flex-direction:column;gap:8px;"></div>
              </div>
              
              <!-- Tab 6: Notes -->
              <div class="mc-panel" data-panel="notes" style="display:none;">
                <h3 style="color:#d65d0e;font-size:14px;margin-bottom:16px;">📝 Shift Notes & Green Shield Log</h3>
                <div style="margin-bottom:20px;">
                  <label style="display:block;color:#a89984;font-size:11px;margin-bottom:8px;text-transform:uppercase;">General Shift Notes</label>
                  <textarea id="mc-notes" rows="4" placeholder="Enter observations..." style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:8px;padding:12px;font-size:12px;resize:vertical;"></textarea>
                </div>
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <label style="color:#a89984;font-size:11px;text-transform:uppercase;">Actions Logged & Parts Used</label>
                    <button id="mc-add-row" style="background:#d65d0e;color:#282828;border:none;border-radius:6px;padding:6px 14px;font-size:11px;cursor:pointer;font-weight:bold;">+ Add Row</button>
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
                      <tbody id="mc-tbody"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- FOOTER -->
          <div style="background:#32302f;border-top:1px solid #3c3836;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
            <div id="mc-footer" style="display:flex;gap:20px;font-size:10px;color:#665c54;">
              <span>📅 Select Date</span><span>🕐 Day Shift</span><span>👤 Not signed in</span>
            </div>
            <div style="font-size:10px;color:#689d6a;">✓ Auto-saved</div>
          </div>
        </div>
      `;
      
      if (typeof view === 'function') view(container);
      
      // Initialize via DOM after mount
      setTimeout(() => {
        try {
          // Checklist items data
          const items = {
            'shift-start': [
              {id:'ss1',t:'Review previous shift handoff notes and outstanding issues'},
              {id:'ss2',t:'Verify all tools and equipment are accounted for in toolkit'},
              {id:'ss3',t:'Check inventory levels of commonly used parts and consumables'},
              {id:'ss4',t:'Inspect personal protective equipment (PPE) - replace if damaged'},
              {id:'ss5',t:'Test communication devices (radio, phone, tablet)'},
              {id:'ss6',t:'Log into work order system and review assigned tasks'},
              {id:'ss7',t:'Confirm vehicle/fleet check complete (if applicable)'},
              {id:'ss8',t:'Review any safety bulletins or procedure updates'},
              {id:'ss9',t:'Check emergency exit routes are clear and unobstructed'},
              {id:'ss10',t:'Verify first aid kit is fully stocked and accessible'}
            ],
            'walkthrough': [
              {id:'wt1',t:'Walk assigned zone/area - note any visible damage or hazards'},
              {id:'wt2',t:'Check all HVAC units for unusual noises or vibrations'},
              {id:'wt3',t:'Inspect electrical panels - ensure no warning indicators active'},
              {id:'wt4',t:'Verify plumbing fixtures - check for leaks or drips'},
              {id:'wt5',t:'Test emergency lighting and exit signs in walkway'},
              {id:'wt6',t:'Inspect fire extinguisher locations - gauge in green zone'},
              {id:'wt7',t:'Check door closures and automatic door operations'},
              {id:'wt8',t:'Note any new work orders needed from observations'},
              {id:'wt9',t:'Verify security cameras are operational in area'},
              {id:'wt10',t:'Document any housekeeping or cleaning needs observed'}
            ],
            'unit-maint': [
              {id:'um1',t:'Review PM schedule for due preventive maintenance tasks'},
              {id:'um2',t:'Complete filter replacements per schedule (document part #\'s)'},
              {id:'um3',t:'Check and tighten all electrical connections on serviced units'},
              {id:'um4',t:'Inspect belts, pulleys, and rotating components for wear'},
              {id:'um5',t:'Lubricate bearings and moving parts per OEM specifications'},
              {id:'um6',t:'Clean condenser coils - record before/after photos if required'},
              {id:'um7',t:'Check refrigerant levels and pressures on HVAC equipment'},
              {id:'um8',t:'Test safety switches and limit controls'},
              {id:'um9',t:'Calibrate thermostats and sensors as needed'},
              {id:'um10',t:'Document all readings (amps, volts, temps) in log'},
              {id:'um11',t:'Replace any worn or suspect components proactively'},
              {id:'um12',t:'Run test cycle after maintenance - verify normal operation'}
            ],
            'end-of-day': [
              {id:'eod1',t:'Complete all open work orders or document status for handoff'},
              {id:'eod2',t:'Return all borrowed tools to proper storage locations'},
              {id:'eod3',t:'Secure all access points and lock up sensitive areas'},
              {id:'eod4',t:'Submit parts requisition for any low-stock items noticed'},
              {id:'eod5',t:'Complete time sheet / labor hours documentation'},
              {id:'eod6',t:'Write shift handoff notes for incoming technician'},
              {id:'eod7',t:'Report any unresolved safety concerns to supervisor'},
              {id:'eod8',t:'Charge / dock all portable devices and battery equipment'},
              {id:'eod9',t:'Dispose of waste materials properly (recycle where applicable)'},
              {id:'eod10',t:'Sign out of all systems and turn over badge/keys'}
            ],
            'safety': [
              {id:'sf1',t:'Complete required safety observation / near-miss report'},
              {id:'sf2',t:'Verify LOTO (Lock Out Tag Out) procedures followed'},
              {id:'sf3',t:'Check that all hazard signage is visible and current'},
              {id:'sf4',t:'Confirm SDS (Safety Data Sheets) accessible for chemicals used'},
              {id:'sf5',t:'Report any PPE deficiencies or replacement needs'},
              {id:'sf6',t:'Document any environmental spills or containment actions'},
              {id:'sf7',t:'Verify Green Shield compliance for sustainable practices'},
              {id:'sf8',t:'Check energy conservation measures are being followed'},
              {id:'sf9',t:'Attend or complete required safety training module'},
              {id:'sf10',t:'Sign off on daily safety acknowledgment form'}
            ]
          };
          
          const colors = {
            'shift-start':'#cc241d','walkthrough':'#d79921','unit-maint':'#98971a',
            'end-of-day':'#689d6a','safety':'#b16286'
          };
          
          // Render checklist items
          Object.keys(items).forEach(sectionId => {
            const container_el = container.querySelector(`[data-items="${sectionId}"]`);
            if (!container_el) return;
            
            items[sectionId].forEach(item => {
              const div = document.createElement('div');
              div.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:12px 16px;background:#32302f;border:1px solid #3c3836;border-radius:8px;cursor:pointer;';
              const color = colors[sectionId] || '#a89984';
              div.innerHTML = `
                <input type="checkbox" id="cb-${item.id}" data-id="${item.id}" data-section="${sectionId}"
                       style="appearance:none;width:18px;height:18px;background:#282828;border:2px solid ${color};border-radius:4px;cursor:pointer;margin-top:2px;" />
                <label for="cb-${item.id}" style="flex:1;font-size:12px;line-height:1.5;color:#ebdbb2;cursor:pointer;">${item.t}</label>`;
              
              const cb = div.querySelector('input');
              const label = div.querySelector('label');
              cb.addEventListener('change', () => {
                state.checkedItems[item.id] = cb.checked;
                label.style.textDecoration = cb.checked ? 'line-through' : 'none';
                label.style.opacity = cb.checked ? '0.6' : '1';
                updateProgress();
              });
              container_el.appendChild(div);
            });
          });
          
          // Tab switching
          container.querySelectorAll('.mc-tab').forEach(btn => {
            btn.addEventListener('click', () => {
              const tab = btn.dataset.tab;
              state.activeTab = tab;
              container.querySelectorAll('.mc-tab').forEach(b => { b.style.background='transparent'; b.style.borderLeftColor='transparent'; });
              btn.style.background='#282828';
              btn.style.borderLeftColor = btn.querySelector('span:first-child').style.background;
              container.querySelectorAll('.mc-panel').forEach(p => p.style.display='none');
              const panel = container.querySelector(`[data-panel="${tab}"]`);
              if (panel) panel.style.display='block';
            });
          });
          
          // Header inputs
          const dateInput = container.querySelector('#mc-date');
          if(dateInput) dateInput.value = state.headerData.date;
          dateInput?.addEventListener('change', e => { state.headerData.date=e.target.value; updateFooter(); });
          container.querySelector('#mc-shift')?.addEventListener('change', e => { state.headerData.shift=e.target.value; updateFooter(); });
          container.querySelector('#mc-emp')?.addEventListener('input', e => { state.headerData.employeeName=e.target.value; updateFooter(); });
          container.querySelector('#mc-notes')?.addEventListener('input', e => { state.shiftNotes=e.target.value; });
          
          // Add row button
          container.querySelector('#mc-add-row')?.addEventListener('click', () => {
            state.notesEntries.push({id:Date.now(),targetArea:'',cycle:'',actions:'',partsUsed:''});
            renderTable();
          });
          
          function updateProgress() {
            let total=0, checked=0;
            Object.keys(items).forEach(sid => {
              const sectionItems = items[sid];
              total += sectionItems.length;
              const sectionChecked = sectionItems.filter(i => state.checkedItems[i.id]).length;
              checked += sectionChecked;
              const badge = container.querySelector(`[data-badge="${sid}"]`);
              const bar = container.querySelector(`[data-bar="${sid}"]`);
              if(badge) badge.textContent = `${sectionChecked}/${sectionItems.length}`;
              if(bar) bar.style.width = `${Math.round((sectionChecked/sectionItems.length)*100)}%`;
            });
            const oBar = container.querySelector('#mc-overall-bar');
            const oText = container.querySelector('#mc-overall-text');
            if(oBar && oText) { const pct=total>0?Math.round((checked/total)*100):0; oBar.style.width=`${pct}%`; oText.textContent=`${pct}% Complete`; }
          }
          
          function updateFooter() {
            const f = container.querySelector('#mc-footer');
            if(f) f.innerHTML = `<span>📅 ${state.headerData.date||'No date'}</span><span>🕐 ${state.headerData.shift||'Day'} Shift</span><span>👤 ${state.headerData.employeeName||'Not signed in'}</span>`;
          }
          
          function renderTable() {
            const tbody = container.querySelector('#mc-tbody');
            if(!tbody) return;
            tbody.innerHTML='';
            state.notesEntries.forEach(entry => {
              const tr=document.createElement('tr');
              tr.innerHTML=`
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;"><input data-f="targetArea" data-rid="${entry.id}" value="${entry.targetArea}" style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"></td>
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;"><input data-f="cycle" data-rid="${entry.id}" value="${entry.cycle}" style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"></td>
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;"><textarea data-f="actions" data-rid="${entry.id}" style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;resize:vertical;min-height:40px;">${entry.actions}</textarea></td>
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;"><input data-f="partsUsed" data-rid="${entry.id}" value="${entry.partsUsed}" style="width:100%;background:#32302f;color:#ebdbb2;border:1px solid #3c3836;border-radius:4px;padding:6px 8px;font-size:11px;"></td>
                <td style="padding:8px;border:1px solid #3c3836;background:#282828;text-align:center;">${state.notesEntries.length>1?`<button data-del="${entry.id}" style="background:#cc241d;color:#ebdbb2;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:10px;">✕</button>`:'-'}</td>`;
              tr.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('change',e=>{const en=state.notesEntries.find(n=>n.id==parseInt(e.target.dataset.rid));if(en)en[e.target.dataset.f]=e.target.value;}));
              const delBtn=tr.querySelector('[data-del]');
              if(delBtn) delBtn.addEventListener('click',()=>{state.notesEntries=state.notesEntries.filter(n=>n.id!=parseInt(delBtn.dataset.del));renderTable();});
              tbody.appendChild(tr);
            });
          }
          
          // Init first tab
          const firstTab = container.querySelector('.mc-tab[data-tab="shift-start"]');
          if(firstTab) { firstTab.click(); }
          renderTable();
          console.log('[ESA.MaintenanceChecklist] Mounted successfully');
        } catch(e) { console.error('[ESA.MaintenanceChecklist] Error:', e); }
      }, 100);
      
      return { unmount:()=>{container.innerHTML='';}, state };
    } catch(err) {
      console.error('[ESA.MaintenanceChecklist] Error:', err);
      return null;
    }
  }
};

export default ESAMaintenanceChecklist;
