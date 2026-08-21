/**
 * ESA.MaintenanceChecklist.js (Arrow.js Compatible - HARDCODED STYLES)
 * ============================================
 * DAILY MAINTENANCE CHECKLIST MODULE
 * 
 * 6-Tab Digitized Paper Form:
 * 1. Shift Start & Setup (Red)
 * 2. Shift Walk-Through (Yellow)
 * 3. Unit Maintenance (Green)
 * 4. End-of-Day Procedures (Aqua)
 * 5. Safety & Green Shield (Purple)
 * 6. Shift Notes & Log (Orange)
 * 
 * ARROW.JS COMPATIBILITY: All styles MUST be hardcoded!
 * No ${} in style attributes. Event listeners via post-mount DOM.
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// ============================================
// CHECKLIST DATA DEFINITION
// ============================================
const CHECKLIST_SECTIONS = [
  {
    id: 'shift-start',
    label: 'Shift Start & Setup',
    color: '#cc241d',      // Gruvbox red
    colorLight: '#fb4934',
    icon: '🌅',
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
  {
    id: 'walkthrough',
    label: 'Shift Walk-Through',
    color: '#d79921',      // Gruvbox yellow
    colorLight: '#fabd2f',
    icon: '🚶',
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
  {
    id: 'unit-maint',
    label: 'Unit Maintenance',
    color: '#98971a',      // Gruvbox green
    colorLight: '#b8bb26',
    icon: '🔧',
    items: [
      { id: 'um1', text: 'Review PM schedule for due preventive maintenance tasks' },
      { id: 'um2', text: 'Complete filter replacements per schedule (document part #'s)' },
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
  {
    id: 'end-of-day',
    label: 'End-of-Day Procedures',
    color: '#689d6a',      // Gruvbox aqua
    colorLight: '#8ec07c',
    icon: '🌙',
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
  {
    id: 'safety',
    label: 'Safety & Green Shield',
    color: '#b16286',      // Gruvbox purple
    colorLight: '#d3869b',
    icon: '🛡️',
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
  {
    id: 'notes',
    label: 'Shift Notes & Log',
    color: '#d65d0e',      // Gruvbox orange
    colorLight: '#fe8019',
    icon: '📝',
    isNotesTab: true,
    items: []  // Notes tab uses custom table UI instead of checkboxes
  }
];

export const ESAMaintenanceChecklist = ESAVerifyComponent({
  name: 'MaintenanceChecklist',
  version: '1.0.0',
  verified: true,
  
  state: {
    activeTab: 'shift-start',
    headerData: {
      date: '',
      shift: 'Day',
      employeeName: '',
      managerSignoff: ''
    },
    checkedItems: {},       // { 'ss1': true, 'ss2': false, ... }
    notesEntries: [         // For the notes tab table
      { id: 1, targetArea: '', cycle: '', actions: '', partsUsed: '', timestamp: '' }
    ],
    shiftNotes: ''
  },
  
  methods: {
    toggleItem: (state, itemId) => {
      state.checkedItems[itemId] = !state.checkedItems[itemId];
    },
    
    getCheckedCount: (state, sectionId) => {
      const section = CHECKLIST_SECTIONS.find(s => s.id === sectionId);
      if (!section || section.isNotesTab) return '-';
      return section.items.filter(item => state.checkedItems[item.id]).length;
    },
    
    getTotalCount: (state, sectionId) => {
      const section = CHECKLIST_SECTIONS.find(s => s.id === sectionId);
      if (!section || section.isNotesTab) return '-';
      return section.items.length;
    },
    
    getSectionProgress: (state, sectionId) => {
      const section = CHECKLIST_SECTIONS.find(s => s.id === sectionId);
      if (!section || section.isNotesTab) return 0;
      const checked = section.items.filter(item => state.checkedItems[item.id]).length;
      return Math.round((checked / section.items.length) * 100);
    },
    
    getOverallProgress: (state) => {
      let total = 0;
      let checked = 0;
      CHECKLIST_SECTIONS.forEach(section => {
        if (!section.isNotesTab) {
          total += section.items.length;
          checked += section.items.filter(item => state.checkedItems[item.id]).length;
        }
      });
      return total > 0 ? Math.round((checked / total) * 100) : 0;
    },
    
    addNoteRow: (state) => {
      const newId = state.notesEntries.length + 1;
      state.notesEntries.push({
        id: newId,
        targetArea: '',
        cycle: '',
        actions: '',
        partsUsed: '',
        timestamp: new Date().toLocaleTimeString()
      });
    },
    
    removeNoteRow: (state, rowId) => {
      state.notesEntries = state.notesEntries.filter(entry => entry.id !== rowId);
    },
    
    updateNoteField: (state, rowId, field, value) => {
      const entry = state.notesEntries.find(e => e.id === rowId);
      if (entry) {
        entry[field] = value;
      }
    },
    
    initEventListeners: (state, container) => {
      // Tab switching
      const tabButtons = container.querySelectorAll('.mc-tab-btn');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          state.activeTab = tabId;
          
          // Update active states visually
          tabButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Show/hide tab content
          container.querySelectorAll('.mc-tab-content').forEach(content => {
            content.style.display = 'none';
          });
          const activeContent = container.querySelector(`[data-content="${tabId}"]`);
          if (activeContent) {
            activeContent.style.display = 'block';
          }
        });
      });
      
      // Checkbox toggling
      container.querySelectorAll('.mc-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const itemId = e.target.getAttribute('data-item-id');
          if (itemId) {
            state.checkedItems[itemId] = e.target.checked;
            
            // Toggle strikethrough on label
            const label = container.querySelector(`[data-label-for="${itemId}"]`);
            if (label) {
              label.style.textDecoration = e.target.checked ? 'line-through' : 'none';
              label.style.opacity = e.target.checked ? '0.6' : '1';
            }
            
            // Update progress badges
            methods.updateProgressBadges(state, container);
          }
        });
      });
      
      // Header input fields
      const dateInput = container.querySelector('#mc-date-input');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        state.headerData.date = dateInput.value;
        dateInput.addEventListener('change', (e) => {
          state.headerData.date = e.target.value;
        });
      }
      
      const shiftSelect = container.querySelector('#mc-shift-select');
      if (shiftSelect) {
        shiftSelect.value = state.headerData.shift;
        shiftSelect.addEventListener('change', (e) => {
          state.headerData.shift = e.target.value;
        });
      }
      
      const empInput = container.querySelector('#mc-employee-input');
      if (empInput) {
        empInput.addEventListener('input', (e) => {
          state.headerData.employeeName = e.target.value;
        });
      }
      
      const mgrInput = container.querySelector('#mc-manager-input');
      if (mgrInput) {
        mgrInput.addEventListener('input', (e) => {
          state.headerData.managerSignoff = e.target.value;
        });
      }
      
      // Notes textarea
      const notesTextarea = container.querySelector('#mc-shift-notes');
      if (notesTextarea) {
        notesTextarea.addEventListener('input', (e) => {
          state.shiftNotes = e.target.value;
        });
      }
      
      // Add note row button
      const addRowBtn = container.querySelector('#mc-add-row-btn');
      if (addRowBtn) {
        addRowBtn.addEventListener('click', () => {
          methods.addNoteRow(state);
          methods.renderNotesTable(state, container);
        });
      }
      
      // Initialize first tab as active
      const firstTab = container.querySelector('.mc-tab-btn[data-tab="shift-start"]');
      if (firstTab) firstTab.classList.add('active');
      
      const firstContent = container.querySelector('.mc-tab-content[data-content="shift-start"]');
      if (firstContent) firstContent.style.display = 'block';
    },
    
    updateProgressBadges: (state, container) => {
      CHECKLIST_SECTIONS.forEach(section => {
        if (!section.isNotesTab) {
          const badge = container.querySelector(`[data-progress-badge="${section.id}"]`);
          if (badge) {
            const checked = section.items.filter(item => state.checkedItems[item.id]).length;
            badge.textContent = `${checked}/${section.items.length}`;
          }
        }
      });
      
      // Update overall progress bar
      const overallBar = container.querySelector('#mc-overall-progress-bar');
      const overallText = container.querySelector('#mc-overall-progress-text');
      if (overallBar && overallText) {
        const progress = methods.getOverallProgress(state);
        overallBar.style.width = `${progress}%`;
        overallText.textContent = `${progress}% Complete`;
      }
    },
    
    renderNotesTable: (state, container) => {
      const tbody = container.querySelector('#mc-notes-tbody');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      
      state.notesEntries.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="padding: 8px; border: 1px solid #3c3836; background: #282828;">
            <input type="text" data-field="targetArea" data-row-id="${entry.id}" 
                   value="${entry.targetArea}" placeholder="Area name..."
                   style="width: 100%; background: #32302f; color: #ebdbb2; border: 1px solid #3c3836; 
                          border-radius: 4px; padding: 6px 8px; font-size: 11px; outline: none;" />
          </td>
          <td style="padding: 8px; border: 1px solid #3c3836; background: #282828;">
            <input type="text" data-field="cycle" data-row-id="${entry.id}" 
                   value="${entry.cycle}" placeholder="Cycle #..."
                   style="width: 100%; background: #32302f; color: #ebdbb2; border: 1px solid #3c3836; 
                          border-radius: 4px; padding: 6px 8px; font-size: 11px; outline: none;" />
          </td>
          <td style="padding: 8px; border: 1px solid #3c3836; background: #282828;">
            <textarea data-field="actions" data-row-id="${entry.id}" 
                      placeholder="Actions taken..."
                      style="width: 100%; background: #32302f; color: #ebdbb2; border: 1px solid #3c3836; 
                             border-radius: 4px; padding: 6px 8px; font-size: 11px; outline: none; 
                             resize: vertical; min-height: 40px;">${entry.actions}</textarea>
          </td>
          <td style="padding: 8px; border: 1px solid #3c3836; background: #282828;">
            <input type="text" data-field="partsUsed" data-row-id="${entry.id}" 
                   value="${entry.partsUsed}" placeholder="Part #s used..."
                   style="width: 100%; background: #32302f; color: #ebdbb2; border: 1px solid #3c3836; 
                          border-radius: 4px; padding: 6px 8px; font-size: 11px; outline: none;" />
          </td>
          <td style="padding: 8px; border: 1px solid #3c3836; background: #282828; text-align: center;">
            ${state.notesEntries.length > 1 ? `
              <button data-delete-row="${entry.id}" 
                      style="background: #cc241d; color: #ebdbb2; border: none; border-radius: 4px; 
                             padding: 4px 10px; cursor: pointer; font-size: 10px;">
                ✕
              </button>
            ` : '-'}
          </td>
        `;
        tbody.appendChild(tr);
        
        // Attach event listeners to new inputs
        tr.querySelectorAll('input, textarea').forEach(input => {
          input.addEventListener('input', (e) => {
            const rowId = parseInt(e.target.getAttribute('data-row-id'));
            const field = e.target.getAttribute('data-field');
            methods.updateNoteField(state, rowId, field, e.target.value);
          });
        });
        
        // Delete button
        const deleteBtn = tr.querySelector('[data-delete-row]');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            const rowId = parseInt(deleteBtn.getAttribute('data-delete-row'));
            methods.removeNoteRow(state, rowId);
            methods.renderNotesTable(state, container);
          });
        }
      });
    }
  },
  
  template: (props, state, methods) => html`
    <div class="mc-container" style="display: flex; flex-direction: column; width: 100%; min-height: 500px; background: #282828; border-radius: 12px; overflow: hidden;">
      
      <!-- HEADER SECTION -->
      <div style="background: #32302f; border-bottom: 1px solid #3c3836; padding: 16px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">📋</span>
            <span style="color: #d79921; font-weight: bold; font-size: 16px; letter-spacing: 1px;">DAILY MAINTENANCE CHECKLIST</span>
          </div>
          <!-- Overall Progress -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #a89984; font-size: 11px;">Overall:</span>
            <div style="width: 120px; height: 18px; background: #1d2021; border-radius: 9px; overflow: hidden; position: relative;">
              <div id="mc-overall-progress-bar" style="height: 100%; background: linear-gradient(90deg, #98971a, #689d6a); border-radius: 9px; transition: width 0.3s ease; width: 0%;"></div>
              <span id="mc-overall-progress-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 9px; color: #ebdbb2; font-weight: bold;">0%</span>
            </div>
          </div>
        </div>
        
        <!-- Header Fields -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          <div>
            <label style="display: block; color: #a89984; font-size: 10px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Date</label>
            <input type="date" id="mc-date-input" 
                   style="width: 100%; background: #282828; color: #ebdbb2; border: 1px solid #3c3836; 
                          border-radius: 6px; padding: 8px 10px; font-size: 12px; outline: none;" />
          </div>
          <div>
            <label style="display: block; color: #a89984; font-size: 10px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Shift</label>
            <select id="mc-select" 
                    style="width: 100%; background: #282828; color: #ebdbb2; border: 1px solid #3c3836; 
                           border-radius: 6px; padding: 8px 10px; font-size: 12px; outline: none;">
              <option value="Day">Day Shift (6AM-2PM)</option>
              <option value="Swing">Swing Shift (2PM-10PM)</option>
              <option value="Night">Night Shift (10PM-6AM)</option>
            </select>
          </div>
          <div>
            <label style="display: block; color: #a89984; font-size: 10px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Employee Name</label>
            <input type="text" id="mc-employee-input" placeholder="Enter your name..." 
                   style="width: 100%; background: #282828; color: #ebdbb2; border: 1px solid #3c3836; 
                          border-radius: 6px; padding: 8px 10px; font-size: 12px; outline: none;" />
          </div>
          <div>
            <label style="display: block; color: #a89984; font-size: 10px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Manager Sign-off</label>
            <input type="text" id="mc-manager-input" placeholder="Manager initials..." 
                   style="width: 100%; background: #282828; color: #ebdbb2; border: 1px solid #3c3836; 
                          border-radius: 6px; padding: 8px 10px; font-size: 12px; outline: none;" />
          </div>
        </div>
      </div>
      
      <!-- MAIN CONTENT: TAB SIDEBAR + PANEL -->
      <div style="display: flex; flex: 1; min-height: 400px;">
        
        <!-- TAB SIDEBAR -->
        <div style="width: 200px; background: #1d2021; border-right: 1px solid #3c3836; padding: 12px 0; display: flex; flex-direction: column; gap: 4px;">
          ${() => CHECKLIST_SECTIONS.map(section => html`
            <button class="mc-tab-btn" data-tab="${section.id}"
                    style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; 
                           background: transparent; border: none; border-left: 3px solid transparent; 
                           color: #a89984; font-size: 11px; font-weight: 500; text-align: left; 
                           cursor: pointer; transition: all 0.2s ease;">
              <!-- Color Dot -->
              <span style="width: 10px; height: 10px; border-radius: 50%; background: ${section.color}; 
                           box-shadow: 0 0 8px ${section.color}40; flex-shrink: 0;"></span>
              
              <!-- Label + Badge -->
              <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span>${section.icon}</span>
                  <span>${section.label}</span>
                </span>
                ${!section.isNotesTab ? html`
                  <span data-progress-badge="${section.id}" 
                        style="font-size: 9px; color: #665c54; margin-left: 22px;">
                    ${methods.getCheckedCount(state, section.id)}/${methods.getTotalCount(state, section.id)}
                  </span>
                ` : ''}
              </div>
            </button>
          `)}
        </div>
        
        <!-- TAB CONTENT PANEL -->
        <div style="flex: 1; padding: 20px; overflow-y: auto; background: #282828;">
          
          ${() => CHECKLIST_SECTIONS.map(section => html`
            <div class="mc-tab-content" data-content="${section.id}" 
                 style="display: none;">
              
              ${section.isNotesTab ? html`
                <!-- NOTES TAB CONTENT -->
                <div style="margin-bottom: 16px;">
                  <h3 style="color: ${section.color}; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <span>${section.icon}</span>
                    <span>Shift Notes & Green Shield Log</span>
                  </h3>
                  
                  <!-- Freeform Notes Textarea -->
                  <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #a89984; font-size: 11px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                      General Shift Notes
                    </label>
                    <textarea id="mc-shift-notes" rows="4" placeholder="Enter general shift observations, issues, or notes here..."
                              style="width: 100%; background: #32302f; color: #ebdbb2; border: 1px solid #3c3836; 
                                     border-radius: 8px; padding: 12px; font-size: 12px; outline: none; 
                                     resize: vertical; line-height: 1.5;"></textarea>
                  </div>
                  
                  <!-- Actions Logged Table -->
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                      <label style="color: #a89984; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                        Actions Logged & Parts Used
                      </label>
                      <button id="mc-add-row-btn"
                              style="background: ${section.color}; color: #282828; border: none; 
                                     border-radius: 6px; padding: 6px 14px; font-size: 11px; 
                                     cursor: pointer; font-weight: bold;">
                        + Add Row
                      </button>
                    </div>
                    
                    <div style="overflow-x: auto; border: 1px solid #3c3836; border-radius: 8px;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <thead>
                          <tr style="background: #32302f;">
                            <th style="padding: 10px 12px; text-align: left; color: #d79921; border: 1px solid #3c3836; font-weight: 600;">Target Area / Location</th>
                            <th style="padding: 10px 12px; text-align: left; color: #d79921; border: 1px solid #3c3836; font-weight: 600;">Cycle / Run #</th>
                            <th style="padding: 10px 12px; text-align: left; color: #d79921; border: 1px solid #3c3836; font-weight: 600;">Actions Logged</th>
                            <th style="padding: 10px 12px; text-align: left; color: #d79921; border: 1px solid #3c3836; font-weight: 600;">Parts Used</th>
                            <th style="padding: 10px 12px; text-align: center; color: #d79921; border: 1px solid #3c3836; font-weight: 600; width: 60px;"></th>
                          </tr>
                        </thead>
                        <tbody id="mc-notes-tbody">
                          <!-- Rows rendered dynamically by renderNotesTable() -->
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ` : html`
                <!-- CHECKLIST TAB CONTENT -->
                <div>
                  <h3 style="color: ${section.color}; font-size: 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    <span>${section.icon}</span>
                    <span>${section.label}</span>
                    <span style="margin-left: auto; font-size: 11px; color: #665c54; font-weight: normal;">
                      ${methods.getCheckedCount(state, section.id)} / ${methods.getTotalCount(state, section.id)} completed
                    </span>
                  </h3>
                  
                  <!-- Progress Bar for Section -->
                  <div style="width: 100%; height: 6px; background: #32302f; border-radius: 3px; margin-bottom: 20px; overflow: hidden;">
                    <div style="width: ${methods.getSectionProgress(state, section.id)}%; height: 100%; 
                                background: linear-gradient(90deg, ${section.color}, ${section.colorLight}); 
                                border-radius: 3px; transition: width 0.3s ease;"></div>
                  </div>
                  
                  <!-- Checklist Items -->
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${() => section.items.map(item => html`
                      <div class="mc-checklist-item" 
                           style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; 
                                  background: #32302f; border: 1px solid #3c3836; border-radius: 8px; 
                                  cursor: pointer; transition: all 0.15s ease;"
                           data-item-container="${item.id}">
                        
                        <!-- Custom Checkbox -->
                        <div style="position: relative; flex-shrink: 0; margin-top: 2px;">
                          <input type="checkbox" 
                                 class="mc-checkbox" 
                                 id="mc-cb-${item.id}" 
                                 data-item-id="${item.id}"
                                 ${state.checkedItems[item.id] ? 'checked' : ''}
                                 style="appearance: none; -webkit-appearance: none; width: 18px; height: 18px; 
                                        background: #282828; border: 2px solid ${section.color}; border-radius: 4px; 
                                        cursor: pointer; position: relative; transition: all 0.15s ease;" />
                          
                          <!-- Checkmark overlay (CSS only) -->
                          <style>
                            #mc-cb-${item.id}:checked::after {
                              content: '';
                              position: absolute;
                              top: 2px; left: 2px;
                              width: 10px; height: 10px;
                              background: ${section.color};
                              border-radius: 2px;
                            }
                          </style>
                        </div>
                        
                        <!-- Item Text -->
                        <label for="mc-cb-${item.id}" 
                               data-label-for="${item.id}"
                               style="flex: 1; font-size: 12px; line-height: 1.5; color: #ebdbb2; 
                                      cursor: pointer; ${state.checkedItems[item.id] ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                          ${item.text}
                        </label>
                      </div>
                    `)}
                  </div>
                </div>
              `}
            </div>
          `)}
          
        </div>
      </div>
      
      <!-- FOOTER STATUS BAR -->
      <div style="background: #32302f; border-top: 1px solid #3c3836; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; gap: 20px; font-size: 10px; color: #665c54;">
          <span>📅 ${state.headerData.date || 'No date selected'}</span>
          <span>🕐 ${state.headerData.shift || 'Day'} Shift</span>
          <span>👤 ${state.headerData.employeeName || 'Not signed in'}</span>
        </div>
        <div style="font-size: 10px; color: #689d6a;">
          ✓ Auto-saved to session
        </div>
      </div>
    </div>
  `,
  
  mounted: (props, state, methods, container) => {
    // Initialize event listeners after DOM is ready
    setTimeout(() => {
      try {
        methods.initEventListeners(state, container);
        methods.renderNotesTable(state, container);
        methods.updateProgressBadges(state, container);
        
        // Set default date
        const dateInput = container.querySelector('#mc-date-input');
        if (dateInput) {
          dateInput.value = new Date().toISOString().split('T')[0];
          state.headerData.date = dateInput.value;
        }
        
        // Fix the select ID mismatch
        const shiftSelect = container.querySelector('#mc-select');
        if (shiftSelect) {
          shiftSelect.id = 'mc-shift-select';
          shiftSelect.addEventListener('change', (e) => {
            state.headerData.shift = e.target.value;
          });
        }
        
      } catch (err) {
        console.error('[ESA.MaintenanceChecklist] Init error:', err);
        window.ESA?.errors?.push({ component: 'MaintenanceChecklist', phase: 'init', error: err });
      }
    }, 100);
  }
});

export default ESAMaintenanceChecklist;
