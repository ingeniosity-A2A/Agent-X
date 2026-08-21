/**
 * ESA.MaintenanceChecklist.js (Arrow.js Compatible - FULLY FEATURED)
 * ================================================================
 * DAILY MAINTENANCE CHECKLIST - 6 Tab Module
 * 
 * Features:
 * - 6 color-coded tabs (Gruvbox gradient)
 * - Checkbox items with strike-through on completion
 * - Live N/M done-count badge per tab
 * - Header fields: Date, Shift, Employee, Manager
 * - Notes tab with table for logging
 * 
 * ARROW.JS COMPATIBLE: All styles hardcoded!
 */

import { html } from 'https://esm.sh/@arrow-js/core';

// Checklist Data Structure
const CHECKLIST_DATA = {
  tabs: [
    {
      id: 'shift-start',
      name: 'Shift Start & Setup',
      icon: '🌅',
      color: '#cc241d',  // Gruvbox red
      items: [
        { id: 'ss1', text: 'Log into ESA system and verify credentials', checked: false },
        { id: 'ss2', text: 'Check uniform and PPE compliance', checked: false },
        { id: 'ss3', text: 'Test two-way radio / communication device', checked: false },
        { id: 'ss4', text: 'Verify maintenance cart fully stocked', checked: false },
        { id: 'ss5', text: 'Review daily work order queue', checked: false },
        { id: 'ss6', text: 'Check email for urgent notifications', checked: false },
        { id: 'ss7', text: 'Verify master key access', checked: false },
        { id: 'ss8', text: 'Review previous shift handoff notes', checked: false },
        { id: 'ss9', text: 'Test flashlight and backup batteries', checked: false },
        { id: 'ss10', text: 'Confirm emergency contact numbers accessible', checked: false },
        { id: 'ss11', text: 'Check vehicle/mobile unit fuel levels', checked: false },
        { id: 'ss12', text: 'Update digital task board status', checked: false }
      ]
    },
    {
      id: 'walkthrough',
      name: 'Shift Walk-Through',
      icon: '🚶',
      color: '#d79921',  // Gruvbox yellow
      items: [
        { id: 'wt1', text: 'Inspect lobby area - cleanliness & lighting', checked: false },
        { id: 'wt2', text: 'Check main hallway - floors, walls, fixtures', checked: false },
        { id: 'wt3', text: 'Inspect restrooms - supplies, fixtures, odor check', checked: false },
        { id: 'wt4', text: 'Verify elevator operation and cleanliness', checked: false },
        { id: 'wt5', text: 'Check pool/spa area - chemical levels, safety', checked: false },
        { id: 'wt6', text: 'Inspect gym equipment - function & sanitation', checked: false },
        { id: 'wt7', text: 'Check business center - computers, printer', checked: false },
        { id: 'wt8', text: 'Inspect laundry room - equipment operation', checked: false },
        { id: 'wt9', text: 'Check pet relief area - clean & stocked', checked: false },
        { id: 'wt10', text: 'Walk building perimeter - security lights, fences', checked: false },
        { id: 'wt11', text: 'Inspect parking lot - lighting, debris, lines', checked: false },
        { id: 'wt12', text: 'Check fire lanes clear of obstructions', checked: false },
        { id: 'wt13', text: 'Verify exit signs illuminated', checked: false },
        { id: 'wt14', text: 'Document any damage or maintenance needs', checked: false }
      ]
    },
    {
      id: 'unit-maint',
      name: 'Unit Maintenance',
      icon: '🔧',
      color: '#98971a',  // Gruvbox green
      items: [
        { id: 'um1', text: 'Review open work orders priority list', checked: false },
        { id: 'um2', text: 'Complete scheduled make-ready units', checked: false },
        { id: 'um3', text: 'Perform HVAC filter inspections', checked: false },
        { id: 'um4', text: 'Check smoke detector functionality in vacant units', checked: false },
        { id: 'um5', text: 'Inspect plumbing for leaks/drips', checked: false },
        { id: 'um6', text: 'Test all electrical outlets and switches', checked: false },
        { id: 'um7', text: 'Verify window locks and seals', checked: false },
        { id: 'um8', text: 'Check appliance operation (fridge, microwave, AC)', checked: false },
        { id: 'um9', text: 'Document unit condition for turnover report', checked: false },
        { id: 'um10', text: 'Update work order status in system', checked: false }
      ]
    },
    {
      id: 'eod',
      name: 'End-of-Day Procedures',
      icon: '🌙',
      color: '#689d6a',  // Gruvbox aqua
      items: [
        { id: 'eod1', text: 'Complete shift notes summary', checked: false },
        { id: 'eod2', text: 'Return all tools to maintenance cart', checked: false },
        { id: 'eod3', text: 'Restock consumables for next shift', checked: false },
        { id: 'eod4', text: 'Submit completed work orders', checked: false },
        { id: 'eod5', text: 'Log vehicle mileage and fuel status', checked: false },
        { id: 'eod6', text: 'Charge all battery-powered equipment', checked: false },
        { id: 'eod7', text: 'Prepare handoff notes for incoming shift', checked: false },
        { id: 'eod8', text: 'Log out of all systems securely', checked: false }
      ]
    },
    {
      id: 'safety',
      name: 'Safety & Green Shield',
      icon: '🛡️',
      color: '#b16286',  // Gruvbox purple
      items: [
        { id: 'sf1', text: 'Inspect fire extinguishers - pressure & accessibility', checked: false },
        { id: 'sf2', text: 'Check egress paths are clear and marked', checked: false },
        { id: 'sf3', text: 'Verify emergency lighting functional', checked: false },
        { id: 'sf4', text: 'Test fire alarm pull stations (visual only)', checked: false },
        { id: 'sf5', text: 'Inspect AED location and seal intact', checked: false },
        { id: 'sf6', text: 'Check first aid kit inventory', checked: false },
        { id: 'sf7', text: 'Verify MSDS sheets current and accessible', checked: false },
        { id: 'sf8', text: 'Inspect eye wash stations', checked: false },
        { id: 'sf9', text: 'Document Green Shield compliance check', checked: false },
        { id: 'sf10', text: 'Report any safety hazards immediately', checked: false }
      ]
    }
  ],
  
  // Notes tab is special - has a table instead of checkboxes
  notesTab: {
    id: 'notes',
    name: 'Shift Notes & Log',
    icon: '📝',
    color: '#d65d0e'  // Gruvbox orange
  }
};

export const ESAMaintenanceChecklist = {
  name: 'MaintenanceChecklist',
  version: '2.0.0',
  
  // In-memory state
  state: {
    activeTab: 'shift-start',
    date: new Date().toISOString().split('T')[0],
    shift: 'Day',
    employeeName: '',
    managerSignoff: '',
    checklistData: JSON.parse(JSON.stringify(CHECKLIST_DATA)), // Deep copy
    notesRows: []
  },
  
  mount(container) {
    if (!container) return null;
    
    try {
      container.innerHTML = '';
      
      // Create view with ALL HARDCODED STYLES
      const view = html`
        <div id="mc-main" style="
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 500px;
          background: #32302f;
          border: 1px solid #3c3836;
          border-radius: 12px;
          padding: 20px;
        ">
          <!-- Header -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid #3c3836;
          ">
            <h2 style="color: #d79921; margin: 0; font-size: 20px;">📋 DAILY MAINTENANCE CHECKLIST</h2>
            <div id="mc-overall-progress" style="
              padding: 8px 16px;
              background: #282828;
              border-radius: 20px;
              font-size: 12px;
              color: #a89984;
            ">0/54 Complete</div>
          </div>
          
          <!-- Info Bar -->
          <div style="
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          ">
            <div>
              <label style="font-size: 10px; color: #a89984; display: block; margin-bottom: 4px;">DATE</label>
              <input type="date" id="mc-date" style="
                width: 100%;
                background: #282828;
                border: 1px solid #3c3836;
                color: #ebdbb2;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
              " />
            </div>
            <div>
              <label style="font-size: 10px; color: #a89984; display: block; margin-bottom: 4px;">SHIFT</label>
              <select id="mc-shift" style="
                width: 100%;
                background: #282828;
                border: 1px solid #3c3836;
                color: #ebdbb2;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
              ">
                <option value="Day">Day (6AM-2PM)</option>
                <option value="Swing">Swing (2PM-10PM)</option>
                <option value="Night">Night (10PM-6AM)</option>
              </select>
            </div>
            <div>
              <label style="font-size: 10px; color: #a89984; display: block; margin-bottom: 4px;">EMPLOYEE NAME</label>
              <input type="text" id="mc-employee" placeholder="Enter name..." style="
                width: 100%;
                background: #282828;
                border: 1px solid #3c3836;
                color: #ebdbb2;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
              " />
            </div>
            <div>
              <label style="font-size: 10px; color: #a89984; display: block; margin-bottom: 4px;">MANAGER SIGN-OFF</label>
              <input type="text" id="mc-manager" placeholder="Manager initials..." style="
                width: 100%;
                background: #282828;
                border: 1px solid #3c3836;
                color: #ebdbb2;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
              " />
            </div>
          </div>
          
          <!-- Tab Navigation -->
          <div id="mc-tabs" style="
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
            padding-bottom: 12px;
            border-bottom: 1px solid #3c3836;
          "></div>
          
          <!-- Content Panel -->
          <div id="mc-panel" style="
            flex: 1;
            min-height: 300px;
            background: #282828;
            border-radius: 8px;
            padding: 20px;
            overflow-y: auto;
          ">
            <p style="color: #a89984; text-align: center; padding: 40px;">Select a tab to view checklist items</p>
          </div>
          
          <!-- Footer Status -->
          <div style="
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #3c3836;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #665c54;
          ">
            <span id="mc-status">Ready</span>
            <span>✓ Auto-saved to session</span>
          </div>
        </div>
      `;
      
      if (typeof view === 'function') {
        view(container);
        
        setTimeout(() => {
          try {
            initMaintenanceChecklist(container);
          } catch(e) {
            console.error('[ESA.MaintenanceChecklist] Init error:', e);
          }
        }, 100);
      }
      
      return { 
        unmount: () => { container.innerHTML = ''; }, 
        state: this.state 
      };
      
    } catch(e) {
      console.error('[ESA.MaintenanceChecklist] Error:', e);
      return null;
    }
  }
};

// Initialization function
function initMaintenanceChecklist(container) {
  const state = ESAMaintenanceChecklist.state;
  
  // Set default date
  const dateInput = container.querySelector('#mc-date');
  if (dateInput) {
    dateInput.value = state.date;
    dateInput.addEventListener('change', (e) => {
      state.date = e.target.value;
    });
  }
  
  // Shift select
  const shiftSelect = container.querySelector('#mc-shift');
  if (shiftSelect) {
    shiftSelect.value = state.shift;
    shiftSelect.addEventListener('change', (e) => {
      state.shift = e.target.value;
    });
  }
  
  // Employee input
  const empInput = container.querySelector('#mc-employee');
  if (empInput) {
    empInput.addEventListener('input', (e) => {
      state.employeeName = e.target.value;
    });
  }
  
  // Manager input
  const mgrInput = container.querySelector('#mc-manager');
  if (mgrInput) {
    mgrInput.addEventListener('input', (e) => {
      state.managerSignoff = e.target.value;
    });
  }
  
  // Render tabs
  renderTabs(container);
  
  // Set initial active tab
  switchTab(container, 'shift-start');
}

// Render tab buttons
function renderTabs(container) {
  const tabsContainer = container.querySelector('#mc-tabs');
  if (!tabsContainer) return;
  
  const state = ESAMaintenanceChecklist.state;
  const allTabs = [...state.checklistData.tabs, state.checklistData.notesTab];
  
  tabsContainer.innerHTML = allTabs.map(tab => `
    <button
      class="mc-tab-btn"
      data-tab-id="${tab.id}"
      style="
        padding: 10px 16px;
        background: ${tab.color}20;
        color: ${tab.color};
        border: 2px solid ${tab.color}40;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      "
    >
      <span>${tab.icon}</span>
      <span>${tab.name}</span>
      <span class="mc-tab-badge" data-tab-badge="${tab.id}" style="
        background: ${tab.color};
        color: #282828;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;
        display: none;
      ">0/0</span>
    </button>
  `).join('');
  
  // Attach click listeners
  tabsContainer.querySelectorAll('.mc-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab-id');
      switchTab(container, tabId);
    });
  });
}

// Switch active tab
function switchTab(container, tabId) {
  const state = ESAMaintenanceChecklist.state;
  state.activeTab = tabId;
  
  // Update tab button styles
  container.querySelectorAll('.mc-tab-btn').forEach(btn => {
    const btnTabId = btn.getAttribute('data-tab-id');
    if (btnTabId === tabId) {
      btn.style.background = btn.style.color + '40';
      btn.style.borderStyle = 'solid';
      btn.style.borderWidth = '2px';
    } else {
      btn.style.background = btn.style.color + '20';
      btn.style.borderStyle = 'solid';
      btn.style.borderWidth = '2px';
      btn.style.opacity = '0.7';
    }
  });
  
  // Render content based on tab type
  if (tabId === 'notes') {
    renderNotesPanel(container);
  } else {
    renderChecklistPanel(container, tabId);
  }
  
  // Update status
  const statusEl = container.querySelector('#mc-status');
  if (statusEl) {
    const tab = [...state.checklistData.tabs, state.checklistData.notesTab].find(t => t.id === tabId);
    statusEl.textContent = `Viewing: ${tab ? tab.name : tabId}`;
  }
}

// Render checklist panel with checkboxes
function renderChecklistPanel(container, tabId) {
  const state = ESAMaintenanceChecklist.state;
  const panel = container.querySelector('#mc-panel');
  if (!panel) return;
  
  const tab = state.checklistData.tabs.find(t => t.id === tabId);
  if (!tab) return;
  
  const checkedCount = tab.items.filter(item => item.checked).length;
  const totalCount = tab.items.length;
  
  panel.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="color: ${tab.color}; margin: 0 0 8px 0; font-size: 16px;">
        ${tab.icon} ${tab.name}
      </h3>
      <div style="font-size: 12px; color: #a89984;">
        Progress: <span style="color: ${tab.color}; font-weight: bold;">${checkedCount}/${totalCount}</span> items complete
      </div>
      <div style="
        margin-top: 8px;
        height: 6px;
        background: #3c3836;
        border-radius: 3px;
        overflow: hidden;
      ">
        <div style="
          height: 100%;
          width: ${(checkedCount / totalCount) * 100}%;
          background: ${tab.color};
          border-radius: 3px;
          transition: width 0.3s ease;
        "></div>
      </div>
    </div>
    
    <div class="mc-checklist-items" style="display: grid; gap: 8px;">
      ${tab.items.map((item, idx) => `
        <label
          class="mc-checklist-item"
          data-item-id="${item.id}"
          style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: #32302f;
            border: 1px solid #3c3836;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            ${item.checked ? 'opacity: 0.7;' : ''}
          "
        >
          <input
            type="checkbox"
            class="mc-checkbox"
            data-item-index="${idx}"
            ${item.checked ? 'checked' : ''}
            style="
              width: 20px;
              height: 20px;
              accent-color: ${tab.color};
              cursor: pointer;
              flex-shrink: 0;
            "
          />
          <span
            class="mc-item-text"
            style="
              font-size: 13px;
              color: #ebdbb2;
              ${item.checked ? 'text-decoration: line-through; color: #a89984;' : ''}
            "
          >${item.text}</span>
        </label>
      `).join('')}
    </div>
  `;
  
  // Attach checkbox listeners
  panel.querySelectorAll('.mc-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-item-index'));
      if (!isNaN(idx)) {
        tab.items[idx].checked = e.target.checked;
        
        // Update item styling
        const label = e.target.closest('.mc-checklist-item');
        const textSpan = label.querySelector('.mc-item-text');
        if (e.target.checked) {
          label.style.opacity = '0.7';
          textSpan.style.textDecoration = 'line-through';
          textSpan.style.color = '#a89984';
        } else {
          label.style.opacity = '1';
          textSpan.style.textDecoration = 'none';
          textSpan.style.color = '#ebdbb2';
        }
        
        // Update badge and progress
        updateTabBadge(container, tabId);
        updateOverallProgress(container);
      }
    });
  });
  
  // Update badge for this tab
  updateTabBadge(container, tabId);
}

// Render notes panel with table
function renderNotesPanel(container) {
  const state = ESAMaintenanceChecklist.state;
  const panel = container.querySelector('#mc-panel');
  if (!panel) return;
  
  const tab = state.checklistData.notesTab;
  
  panel.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="color: ${tab.color}; margin: 0 0 8px 0; font-size: 16px;">
        ${tab.icon} ${tab.name}
      </h3>
      <p style="font-size: 12px; color: #a89984; margin: 0;">
        Log actions taken, parts used, and observations during this shift.
      </p>
    </div>
    
    <!-- Add Row Button -->
    <button
      id="mc-add-row-btn"
      style="
        margin-bottom: 16px;
        padding: 10px 20px;
        background: ${tab.color};
        color: #282828;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
      "
    >+ ADD LOG ENTRY</button>
    
    <!-- Table -->
    <div style="overflow-x: auto;">
      <table style="
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      ">
        <thead>
          <tr style="background: #32302f;">
            <th style="
              padding: 12px;
              text-align: left;
              color: #d79921;
              border-bottom: 2px solid #3c3836;
              font-weight: bold;
            ">Target Area / Cycle</th>
            <th style="
              padding: 12px;
              text-align: left;
              color: #d79921;
              border-bottom: 2px solid #3c3836;
              font-weight: bold;
            ">Actions Logged</th>
            <th style="
              padding: 12px;
              text-align: left;
              color: #d79921;
              border-bottom: 2px solid #3c3836;
              font-weight: bold;
            ">Parts Used</th>
            <th style="
              padding: 12px;
              text-align: center;
              color: #d79921;
              border-bottom: 2px solid #3c3836;
              font-weight: bold;
              width: 60px;
            "></th>
          </tr>
        </thead>
        <tbody id="mc-notes-body">
          ${state.notesRows.map((row, idx) => `
            <tr style="border-bottom: 1px solid #3c3836;">
              <td style="padding: 12px;">
                <input
                  type="text"
                  value="${row.area}"
                  data-row-idx="${idx}"
                  data-field="area"
                  class="mc-note-input"
                  style="
                    width: 100%;
                    background: #282828;
                    border: 1px solid #3c3836;
                    color: #ebdbb2;
                    padding: 8px;
                    border-radius: 4px;
                  "
                />
              </td>
              <td style="padding: 12px;">
                <input
                  type="text"
                  value="${row.actions}"
                  data-row-idx="${idx}"
                  data-field="actions"
                  class="mc-note-input"
                  style="
                    width: 100%;
                    background: #282828;
                    border: 1px solid #3c3836;
                    color: #ebdbb2;
                    padding: 8px;
                    border-radius: 4px;
                  "
                />
              </td>
              <td style="padding: 12px;">
                <input
                  type="text"
                  value="${row.parts}"
                  data-row-idx="${idx}"
                  data-field="parts"
                  class="mc-note-input"
                  style="
                    width: 100%;
                    background: #282828;
                    border: 1px solid #3c3836;
                    color: #ebdbb2;
                    padding: 8px;
                    border-radius: 4px;
                  "
                />
              </td>
              <td style="padding: 12px; text-align: center;">
                <button
                  class="mc-delete-row-btn"
                  data-row-idx="${idx}"
                  style="
                    background: #cc241d;
                    color: #ebdbb2;
                    border: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 14px;
                  "
                >×</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    ${state.notesRows.length === 0 ? `
      <div style="
        text-align: center;
        padding: 40px;
        color: #a89984;
        background: #32302f;
        border-radius: 8px;
        margin-top: 16px;
      ">
        No log entries yet. Click "+ ADD LOG ENTRY" to document your shift activities.
      </div>
    ` : ''}
  `;
  
  // Attach add row button listener
  const addBtn = container.querySelector('#mc-add-row-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      state.notesRows.push({
        area: '',
        actions: '',
        parts: ''
      });
      renderNotesPanel(container);
    });
  }
  
  // Attach delete row listeners
  container.querySelectorAll('.mc-delete-row-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-row-idx'));
      if (!isNaN(idx)) {
        state.notesRows.splice(idx, 1);
        renderNotesPanel(container);
      }
    });
  });
  
  // Attach input change listeners
  container.querySelectorAll('.mc-note-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-row-idx'));
      const field = e.target.getAttribute('data-field');
      if (!isNaN(idx) && state.notesRows[idx]) {
        state.notesRows[idx][field] = e.target.value;
      }
    });
  });
}

// Update individual tab badge
function updateTabBadge(container, tabId) {
  const state = ESAMaintenanceChecklist.state;
  const tab = state.checklistData.tabs.find(t => t.id === tabId);
  if (!tab) return;
  
  const checkedCount = tab.items.filter(item => item.checked).length;
  const totalCount = tab.items.length;
  
  const badge = container.querySelector(`[data-tab-badge="${tabId}"]`);
  if (badge && checkedCount > 0) {
    badge.style.display = 'inline';
    badge.textContent = `${checkedCount}/${totalCount}`;
  } else if (badge) {
    badge.style.display = 'none';
  }
}

// Update overall progress counter
function updateOverallProgress(container) {
  const state = ESAMaintenanceChecklist.state;
  
  let totalItems = 0;
  let totalChecked = 0;
  
  state.checklistData.tabs.forEach(tab => {
    totalItems += tab.items.length;
    totalChecked += tab.items.filter(item => item.checked).length;
  });
  
  const progressEl = container.querySelector('#mc-overall-progress');
  if (progressEl) {
    progressEl.textContent = `${totalChecked}/${totalItems} Complete`;
  }
}

export default ESAMaintenanceChecklist;
