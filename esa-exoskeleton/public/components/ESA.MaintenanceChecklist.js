/**
 * ESA.MaintenanceChecklist.js (Arrow.js Compatible - HARDCODED STYLES)
 * ============================================
 * DAILY MAINTENANCE CHECKLIST MODULE
 * 
 * Features:
 * - 6 tabs matching paper checklist sections
 * - Gruvbox gradient sidebar (red, yellow, green, aqua, purple, orange)
 * - Interactive checkboxes with strike-through
 * - Live progress counts per tab and header
 * - Header fields: Date/Shift/Employee/Manager
 * - Notes tab with Green Shield tracking table
 * 
 * All styles hardcoded for Arrow.js compatibility
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// ============================================
// CHECKLIST DATA - Transcribed from paper form
// ============================================
const CHECKLIST_SECTIONS = [
  {
    id: 'shift-start',
    label: 'Shift Start & Setup',
    icon: '🌅',
    color: '#cc241d', // Gruvbox red
    colorLight: '#fb4934',
    tasks: [
      { id: 'ss-1', text: 'Review previous shift handoff notes', sop: 'Read logbook entries from outgoing technician' },
      { id: 'ss-2', text: 'Verify tool kit completeness', sop: 'Count all tools against inventory sheet' },
      { id: 'ss-3', text: 'Check PPE availability and condition', sop: 'Inspect gloves, safety glasses, hard hat' },
      { id: 'ss-4', text: 'Review scheduled work orders for shift', sop: 'Prioritize by urgency and location' },
      { id: 'ss-5', text: 'Confirm radio/communication device charged', sop: 'Test transmit/receive function' },
      { id: 'ss-6', text: 'Sign in on time clock / digital log', sop: 'Record actual start time' },
      { id: 'ss-7', text: 'Brief with supervisor on priority items', sop: 'Note any safety concerns or alerts' },
      { id: 'ss-8', text: 'Review any open Green Shield tickets', sop: 'Check ticket status and updates' }
    ]
  },
  {
    id: 'equipment-inspect',
    label: 'Equipment Inspection',
    icon: '🔧',
    color: '#d79921', // Gruvbox yellow
    colorLight: '#fabd2f',
    tasks: [
      { id: 'ei-1', text: 'Inspect PTAC units in assigned area', sop: 'Visual check for damage, leaks, debris' },
      { id: 'ei-2', text: 'Check filter condition on all units', sop: 'Replace if dirty (>30% blocked)' },
      { id: 'ei-3', text: 'Verify thermostat calibration', sop: 'Compare to reference thermometer ±2°F' },
      { id: 'ei-4', text: 'Inspect electrical connections', sop: 'Look for discoloration, loose wires' },
      { id: 'ei-5', text: 'Check refrigerant lines for oil stains', sop: 'Indicates potential leak point' },
      { id: 'ei-6', text: 'Test unit startup/shutdown sequence', sop: 'Verify smooth operation, no errors' },
      { id: 'ei-7', text: 'Document serial numbers of new units', sop: 'Add to asset database' },
      { id: 'ei-8', text: 'Photograph any damage found', sop: 'Upload to workorder with timestamp' }
    ]
  },
  {
    id: 'safety-checks',
    label: 'Safety Checks',
    icon: '⚠️',
    color: '#98971a', // Gruvbox green
    colorLight: '#b8bb26',
    tasks: [
      { id: 'sc-1', text: 'Verify lockout/tagout procedures followed', sop: 'Check LOTO log for active locks' },
      { id: 'sc-2', text: 'Inspect fire extinguisher locations', sop: 'Ensure accessible, gauge in green' },
      { id: 'sc-3', text: 'Check emergency exit pathways clear', sop: 'No obstructions, signage visible' },
      { id: 'sc-4', text: 'Verify chemical storage compliance', sop: 'MSDS sheets posted, containers labeled' },
      { id: 'sc-5', text: 'Inspect ladder and fall protection gear', sop: 'No cracks, straps intact' },
      { id: 'sc-6', text: 'Confirm first aid kit stocked', sop: 'Check expiration dates on supplies' },
      { id: 'sc-7', text: 'Review area for slip/trip hazards', sop: 'Cords secured, floors dry' },
      { id: 'sc-8', text: 'Report any near-miss incidents', sop: 'Complete incident report form' }
    ]
  },
  {
    id: 'preventive-maint',
    label: 'Preventive Maintenance',
    icon: '🛠️',
    color: '#689d6a', // Gruvbox aqua
    colorLight: '#8ec07c',
    tasks: [
      { id: 'pm-1', text: 'Clean condenser coils on schedule', sop: 'Use coil cleaner, rinse thoroughly' },
      { id: 'pm-2', text: 'Check and tighten electrical panels', sop: 'Torque to spec, note any hot spots' },
      { id: 'pm-3', text: 'Lubricate fan motors as required', sop: 'Use specified lubricant type' },
      { id: 'pm-4', text: 'Test safety switches and cutouts', sop: 'Verify proper trip points' },
      { id: 'pm-5', text: 'Inspect drain pans and clear clogs', sop: 'Use approved cleaner, flush line' },
      { id: 'pm-6', text: 'Check belt tension and alignment', sop: 'Deflect ½" per foot of span' },
      { id: 'pm-7', text: 'Record amp draw on compressors', sop: 'Compare to nameplate rating' },
      { id: 'pm-8', text: 'Replace filters per PM schedule', sop: 'Log replacement date and tech ID' }
    ]
  },
  {
    id: 'documentation',
    label: 'Documentation',
    icon: '📋',
    color: '#b16286', // Gruvbox purple
    colorLight: '#d3869b',
    tasks: [
      { id: 'doc-1', text: 'Complete work order paperwork', sop: 'All fields filled, signatures obtained' },
      { id: 'doc-2', text: 'Update equipment history logs', sop: 'Record repairs, parts used, hours' },
      { id: 'doc-3', text: 'Submit parts requisition forms', sop: 'Include part numbers and quantities' },
      { id: 'doc-4', text: 'Photograph completed work', sop: 'Before/after shots for warranty' },
      { id: 'doc-5', text: 'File customer signature on completion', sop: 'Explain work performed, get sign-off' },
      { id: 'doc-6', text: 'Enter time against correct cost codes', sop: 'Work order #, task code, hours' },
      { id: 'doc-7', text: 'Submit expense receipts', op: 'Mileage, materials, parking' },
      { id: 'doc-8', text: 'Prepare shift handoff notes', sop: 'Outstanding issues, pending orders' }
    ]
  },
  {
    id: 'shift-notes',
    label: 'Shift Notes & Log',
    icon: '📝',
    color: '#d65d0e', // Gruvbox orange
    colorLight: '#fe8019',
    tasks: [] // This tab uses the notes table instead
  }
];

export const ESAMaintenanceChecklist = ESAVerifyComponent({
  name: 'MaintenanceChecklist',
  version: '1.0.0',
  verified: true,
  
  state: {
    activeTab: 'shift-start',
    date: new Date().toISOString().split('T')[0],
    shift: 'Day',
    employeeName: '',
    managerSignoff: '',
    completedTasks: {},
    notes: [],
    currentNote: { targetArea: '', cycle: '', actions: '', partsUsed: '' }
  },
  
  methods: {
    toggleTask: (state, sectionId, taskId) => {
      const key = `${sectionId}-${taskId}`;
      state.completedTasks[key] = !state.completedTasks[key];
    },
    
    isTaskCompleted: (state, sectionId, taskId) => {
      const key = `${sectionId}-${taskId}`;
      return !!state.completedTasks[key];
    },
    
    getSectionProgress: (state, sectionId) => {
      const section = CHECKLIST_SECTIONS.find(s => s.id === sectionId);
      if (!section || section.tasks.length === 0) return { done: 0, total: 0, percent: 0 };
      
      const done = section.tasks.filter(t => 
        state.completedTasks[`${sectionId}-${t.id}`]
      ).length;
      
      return {
        done,
        total: section.tasks.length,
        percent: Math.round((done / section.tasks.length) * 100)
      };
    },
    
    getTotalProgress: (state) => {
      let totalDone = 0;
      let totalTasks = 0;
      
      CHECKLIST_SECTIONS.forEach(section => {
        totalTasks += section.tasks.length;
        totalDone += section.tasks.filter(t => 
          state.completedTasks[`${section.id}-${t.id}`]
        ).length;
      });
      
      return {
        done: totalDone,
        total: totalTasks,
        percent: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
      };
    },
    
    addNote: (state) => {
      if (state.currentNote.targetArea || state.currentNote.actions) {
        state.notes.push({
          ...state.currentNote,
          timestamp: new Date().toISOString()
        });
        state.currentNote = { targetArea: '', cycle: '', actions: '', partsUsed: '' };
      }
    },
    
    clearNote: (state) => {
      state.currentNote = { targetArea: '', cycle: '', actions: '', partsUsed: '' };
    },
    
    removeNote: (state, index) => {
      state.notes.splice(index, 1);
    },
    
    switchTab: (state, tabId) => {
      state.activeTab = tabId;
    }
  },
  
  template: (props, state, methods) => {
    const totalProgress = methods.getTotalProgress(state);
    const activeSection = CHECKLIST_SECTIONS.find(s => s.id === state.activeTab);
    
    return html`
      <div class="esa-maintenance-checklist" style="display: flex; gap: 0; background: #282828; border: 2px solid #3c3836; border-radius: 16px; overflow: hidden; min-height: 500px;">
        
        <!-- SIDEBAR TABS -->
        <div style="width: 200px; background: #1d2021; border-right: 1px solid #3c3836; display: flex; flex-direction: column;">
          
          <!-- Gradient Rail -->
          <div style="height: 4px; background: linear-gradient(180deg, #cc241d 0%, #d79921 20%, #98971a 40%, #689d6a 60%, #b16286 80%, #d65d0e 100%);"></div>
          
          <!-- Tab Buttons -->
          <div style="flex: 1; padding: 12px 0; display: flex; flex-direction: column; gap: 4px;">
            ${CHECKLIST_SECTIONS.map(section => {
              const isActive = state.activeTab === section.id;
              const progress = methods.getSectionProgress(state, section.id);
              
              return html`
                <button
                  class="esa-checklist-tab"
                  data-tab="${section.id}"
                  style="
                    display: flex; align-items: center; gap: 10px;
                    padding: 12px 16px;
                    background: ${isActive ? '#32302f' : 'transparent'};
                    border: none;
                    border-left: 3px solid ${isActive ? section.color : 'transparent'};
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                  "
                >
                  <span style="font-size: 18px;">${section.icon}</span>
                  <span style="flex: 1; font-size: 11px; font-weight: ${isActive ? 'bold' : 'normal'}; color: #ebdbb2; line-height: 1.3;">
                    ${section.label}
                  </span>
                  ${section.tasks.length > 0 ? html`
                    <span style="
                      font-size: 9px; padding: 2px 6px; border-radius: 10px;
                      background: ${progress.done === progress.total ? '#98971a' : '#3c3836'};
                      color: ${progress.done === progress.total ? '#282828' : '#a89984'};
                      font-weight: bold;
                      min-width: 28px; text-align: center;
                    ">
                      ${progress.done}/${progress.total}
                    </span>
                  ` : ''}
                </button>
              `;
            })}
          </div>
          
          <!-- Total Progress -->
          <div style="padding: 16px; border-top: 1px solid #3c3836; background: #282828;">
            <div style="font-size: 10px; color: #a89984; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Total Progress</div>
            <div style="height: 8px; background: #3c3836; border-radius: 4px; overflow: hidden;">
              <div style="width: ${totalProgress.percent}%; height: 100%; background: linear-gradient(90deg, #98971a, #689d6a); border-radius: 4px; transition: width 0.3s;"></div>
            </div>
            <div style="font-size: 12px; color: #ebdbb2; margin-top: 6px; font-weight: bold;">
              ${totalProgress.done} / ${totalProgress.total} tasks (${totalProgress.percent}%)
            </div>
          </div>
        </div>
        
        <!-- MAIN CONTENT AREA -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          
          <!-- HEADER SECTION -->
          <div style="padding: 20px 24px; background: #32302f; border-bottom: 1px solid #3c3836;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h2 style="color: #d79921; font-size: 18px; margin: 0; display: flex; align-items: center; gap: 10px;">
                <span>📋</span>
                <span>DAILY MAINTENANCE CHECKLIST</span>
              </h2>
              <div style="font-size: 11px; color: #a89984; background: #282828; padding: 4px 12px; border-radius: 12px;">
                ${activeSection?.icon || ''} ${activeSection?.label || ''}
              </div>
            </div>
            
            <!-- Header Fields -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
              <div>
                <label style="font-size: 10px; color: #a89984; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Date</label>
                <input
                  type="date"
                  id="esa-cl-date"
                  value="${state.date}"
                  style="width: 100%; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none;"
                />
              </div>
              <div>
                <label style="font-size: 10px; color: #a89984; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Shift</label>
                <select
                  id="esa-cl-shift"
                  style="width: 100%; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none;"
                >
                  <option value="Day" ${state.shift === 'Day' ? 'selected' : ''}>Day Shift</option>
                  <option value="Swing" ${state.shift === 'Swing' ? 'selected' : ''}>Swing Shift</option>
                  <option value="Night" ${state.shift === 'Night' ? 'selected' : ''}>Night Shift</option>
                </select>
              </div>
              <div>
                <label style="font-size: 10px; color: #a89984; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Employee Name</label>
                <input
                  type="text"
                  id="esa-cl-employee"
                  placeholder="Enter name..."
                  value="${state.employeeName}"
                  style="width: 100%; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none;"
                />
              </div>
              <div>
                <label style="font-size: 10px; color: #a89984; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Manager Sign-off</label>
                <input
                  type="text"
                  id="esa-cl-manager"
                  placeholder="Signature..."
                  value="${state.managerSignoff}"
                  style="width: 100%; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none;"
                />
              </div>
            </div>
          </div>
          
          <!-- TAB CONTENT -->
          <div style="flex: 1; overflow-y: auto; padding: 24px;">
            
            ${state.activeTab === 'shift-notes' ? html`
              <!-- NOTES TAB CONTENT -->
              <div>
                <h3 style="color: #d65d0e; font-size: 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                  <span>📝</span> Shift Notes & Green Shield Tracking Log
                </h3>
                
                <!-- Add Note Form -->
                <div style="background: #32302f; border: 1px solid #3c3836; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <div style="font-size: 12px; font-weight: bold; color: #ebdbb2; margin-bottom: 12px;">Log New Entry</div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                      <label style="font-size: 10px; color: #a89984; display: block; margin-bottom: 4px;">Target Area / Cycle</label>
                      <input
                        type="text"
                        id="esa-note-area"
                        placeholder="e.g., Building A - Floor 3"
                        value="${state.currentNote.targetArea}"
                        style="width: 100%; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none;"
                      />
                    </div>
                    <div>
                      <label style="font-size: 10px; color: #a89984; display: block; margin-bottom: 4px;">Cycle #</label>
                      <input
                        type="text"
                        id="esa-note-cycle"
                        placeholder="e.g., CYCLE-001"
                        value="${state.currentNote.cycle}"
                        style="width: 100%; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none;"
                      />
                    </div>
                  </div>
                  
                  <div style="margin-bottom: 12px;">
                    <label style="font-size: 10px; color: #a89984; display: block; margin-bottom: 4px;">Actions Logged</label>
                    <textarea
                      id="esa-note-actions"
                      placeholder="Describe actions taken..."
                      rows="3"
                      style="width: 100%; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none; resize: vertical; font-family: inherit;"
                    >${state.currentNote.actions}</textarea>
                  </div>
                  
                  <div style="margin-bottom: 12px;">
                    <label style="font-size: 10px; color: #a89984; display: block; margin-bottom: 4px;">Parts Used</label>
                    <input
                      type="text"
                      id="esa-note-parts"
                      placeholder="List parts consumed..."
                      value="${state.currentNote.partsUsed}"
                      style="width: 100%; background: #282828; border: 1px solid #3c3836; color: #ebdbb2; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none;"
                    />
                  </div>
                  
                  <div style="display: flex; gap: 8px;">
                    <button
                      id="esa-add-note-btn"
                      style="background: #d65d0e; color: #282828; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;"
                    >
                      ➕ Add Entry
                    </button>
                    <button
                      id="esa-clear-note-btn"
                      style="background: transparent; color: #a89984; border: 1px solid #3c3836; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 12px;"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                <!-- Notes List -->
                <div>
                  <div style="font-size: 12px; font-weight: bold; color: #ebdbb2; margin-bottom: 12px;">
                    Logged Entries (${state.notes.length})
                  </div>
                  
                  ${state.notes.length === 0 ? html`
                    <div style="text-align: center; padding: 40px; color: #a89984; font-size: 13px; background: #32302f; border-radius: 8px; border: 1px dashed #3c3836;">
                      No entries logged yet.<br/>Use the form above to add your first entry.
                    </div>
                  ` : html`
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                      ${state.notes.map((note, index) => html`
                        <div style="background: #32302f; border: 1px solid #3c3836; border-left: 3px solid #d65d0e; border-radius: 8px; padding: 16px; position: relative;">
                          <button
                            class="esa-delete-note-btn"
                            data-index="${index}"
                            style="position: absolute; top: 12px; right: 12px; background: transparent; color: #cc241d; border: none; cursor: pointer; font-size: 16px; padding: 4px;"
                          >✕</button>
                          
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                              <span style="font-size: 10px; color: #a89984;">Target Area:</span>
                              <div style="color: #ebdbb2; font-weight: bold;">${note.targetArea || '-'}</div>
                            </div>
                            <div>
                              <span style="font-size: 10px; color: #a89984;">Cycle:</span>
                              <div style="color: #ebdbb2; font-weight: bold;">${note.cycle || '-'}</div>
                            </div>
                          </div>
                          
                          ${note.actions ? html`
                            <div style="margin-bottom: 8px;">
                              <span style="font-size: 10px; color: #a89984;">Actions:</span>
                              <div style="color: #ebdbb2; font-size: 13px; margin-top: 4px;">${note.actions}</div>
                            </div>
                          ` : ''}
                          
                          ${note.partsUsed ? html`
                            <div>
                              <span style="font-size: 10px; color: #a89984;">Parts Used:</span>
                              <div style="color: #689d6a; font-size: 13px; margin-top: 4px;">${note.partsUsed}</div>
                            </div>
                          ` : ''}
                          
                          <div style="margin-top: 8px; font-size: 10px; color: #504945;">
                            ${new Date(note.timestamp).toLocaleString()}
                          </div>
                        </div>
                      `)}
                    </div>
                  `}
                </div>
              </div>
            ` : html`
              <!-- CHECKLIST TAB CONTENT -->
              <div>
                ${activeSection && activeSection.tasks.length > 0 ? html`
                  <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                    <div style="flex: 1; height: 4px; background: #3c3836; border-radius: 2px; overflow: hidden;">
                      <div style="width: ${methods.getSectionProgress(state, state.activeTab).percent}%; height: 100%; background: ${activeSection.color}; border-radius: 2px; transition: width 0.3s;"></div>
                    </div>
                    <span style="font-size: 12px; font-weight: bold; color: ${activeSection.color};">
                      ${methods.getSectionProgress(state, state.activeTab).percent}% Complete
                    </span>
                  </div>
                  
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${activeSection.tasks.map(task => {
                      const isDone = methods.isTaskCompleted(state, state.activeTab, task.id);
                      
                      return html`
                        <div
                          class="esa-task-item"
                          data-task="${task.id}"
                          style="
                            display: flex; align-items: flex-start; gap: 12px;
                            padding: 14px 16px;
                            background: #32302f;
                            border: 1px solid #3c3836;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            ${isDone ? 'opacity: 0.7;' : ''}
                          "
                        >
                          <!-- Checkbox -->
                          <div
                            class="esa-checkbox"
                            data-task="${task.id}"
                            style="
                              width: 22px; height: 22px; min-width: 22px;
                              border: 2px solid ${isDone ? activeSection.color : '#504945'};
                              border-radius: 4px;
                              display: flex; align-items: center; justify-content: center;
                              background: ${isDone ? activeSection.color : 'transparent'};
                              transition: all 0.2s;
                              margin-top: 2px;
                            "
                          >
                            ${isDone ? html`<span style="color: #282828; font-size: 14px; font-weight: bold;">✓</span>` : ''}
                          </div>
                          
                          <!-- Task Content -->
                          <div style="flex: 1;">
                            <div style="
                              font-size: 13px; color: #ebdbb2; font-weight: 500;
                              ${isDone ? 'text-decoration: line-through; color: #a89984;' : ''}
                            ">
                              ${task.text}
                            </div>
                            <div style="font-size: 11px; color: #504945; margin-top: 4px; font-style: italic;">
                              📌 ${task.sop}
                            </div>
                          </div>
                        </div>
                      `;
                    })}
                  </div>
                ` : html`
                  <div style="text-align: center; padding: 60px 20px; color: #a89984;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                    <div>Select a section from the sidebar to view checklist items.</div>
                  </div>
                `}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }
});

// Setup event listeners after mount (Arrow.js compatibility)
const origChecklistMount = ESAMaintenanceChecklist.mount;
ESAMaintenanceChecklist.mount = function(container) {
  const result = origChecklistMount.call(this, container);
  
  setTimeout(() => {
    const componentState = this.state;
    
    // Tab switching
    container.querySelectorAll('.esa-checklist-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        methods.switchTab(componentState, tabId);
        
        // Update active tab styling
        container.querySelectorAll('.esa-checklist-tab').forEach(t => {
          const isActive = t.dataset.tab === tabId;
          t.style.background = isActive ? '#32302f' : 'transparent';
          t.style.borderLeftColor = isActive ? 
            (CHECKLIST_SECTIONS.find(s => s.id === tabId)?.color || '#98971a') : 
            'transparent';
        });
      });
    });
    
    // Task checkbox clicks
    container.querySelectorAll('.esa-task-item').forEach(item => {
      item.addEventListener('click', () => {
        const taskId = item.dataset.task;
        methods.toggleTask(componentState, componentState.activeTab, taskId);
      });
    });
    
    // Header field updates
    const dateInput = container.querySelector('#esa-cl-date');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        componentState.date = e.target.value;
      });
    }
    
    const shiftSelect = container.querySelector('#esa-cl-shift');
    if (shiftSelect) {
      shiftSelect.addEventListener('change', (e) => {
        componentState.shift = e.target.value;
      });
    }
    
    const employeeInput = container.querySelector('#esa-cl-employee');
    if (employeeInput) {
      employeeInput.addEventListener('input', (e) => {
        componentState.employeeName = e.target.value;
      });
    }
    
    const managerInput = container.querySelector('#esa-cl-manager');
    if (managerInput) {
      managerInput.addEventListener('input', (e) => {
        componentState.managerSignoff = e.target.value;
      });
    }
    
    // Notes tab functionality
    const addNoteBtn = container.querySelector('#esa-add-note-btn');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        // Gather form values
        const areaInput = container.querySelector('#esa-note-area');
        const cycleInput = container.querySelector('#esa-note-cycle');
        const actionsInput = container.querySelector('#esa-note-actions');
        const partsInput = container.querySelector('#esa-note-parts');
        
        if (areaInput) componentState.currentNote.targetArea = areaInput.value;
        if (cycleInput) componentState.currentNote.cycle = cycleInput.value;
        if (actionsInput) componentState.currentNote.actions = actionsInput.value;
        if (partsInput) componentState.currentNote.partsUsed = partsInput.value;
        
        methods.addNote(componentState);
        
        // Clear inputs
        if (areaInput) areaInput.value = '';
        if (cycleInput) cycleInput.value = '';
        if (actionsInput) actionsInput.value = '';
        if (partsInput) partsInput.value = '';
      });
    }
    
    const clearNoteBtn = container.querySelector('#esa-clear-note-btn');
    if (clearNoteBtn) {
      clearNoteBtn.addEventListener('click', () => {
        methods.clearNote(componentState);
        const inputs = ['esa-note-area', 'esa-note-cycle', 'esa-note-actions', 'esa-note-parts'];
        inputs.forEach(id => {
          const input = container.querySelector(`#${id}`);
          if (input) input.value = '';
        });
      });
    }
    
    // Delete note buttons
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('esa-delete-note-btn')) {
        const index = parseInt(e.target.dataset.index);
        methods.removeNote(componentState, index);
      }
    });
    
  }, 150);
  
  return result;
};

export default ESAMaintenanceChecklist;
