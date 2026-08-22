/**
 * ESA.workorder.js (Arrow.js Compatible - FULLY FIXED)
 * ============================================
 * UNIFIED MAINTENANCE WORKORDER SYSTEM
 * 
 * CRITICAL FIX: All ${} removed from style attributes!
 * Dynamic styling now via post-mount DOM manipulation only.
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// Gruvbox Color Constants (HARDCODED for Arrow.js compatibility)
const G = {
  bg: '#282828',
  bg_soft: '#32302f',
  fg: '#ebdbb2',
  red: '#cc241d',
  green: '#98971a',
  yellow: '#d79921',
  blue: '#458588',
  purple: '#b16286',
  aqua: '#689d6a',
  orange: '#d65d0e',
  border: '#3c3836',
  fg_soft: '#a89984'
};

export const ESAWorkorder = ESAVerifyComponent({
  name: 'workorder',
  version: '2.0.1',
  verified: true,
  
  state: {
    activeSideTab: 'workorder',
    workorderId: 'WO-2026-001',
    workorderData: {
      unitModel: 'SP09EA2-20',
      serialNumber: 'YYMM080523',
      location: 'Room 304 - Building A',
      technician: 'John Smith',
      status: 'in_progress',
      diagnosticCode: 'F1',
      laborHours: 1.5,
      warrantyClaim: true,
      notes: '',
      createdAt: new Date().toISOString()
    },
    partsList: [
      { part: '203862', name: 'Indoor Ambient Thermistor', qty: 1, cost: 45.00 }
    ],
    maintenanceComplete: false,
    showPartsCatalog: false,
    
    // Available parts from catalog
    catalogParts: [
      { sku: 'HD-4421', name: 'Seasons 9000 BTU PTAC Unit', price: 899.00 },
      { sku: 'HD-1180', name: 'PTAC Subbase 20A', price: 45.00 },
      { sku: 'HD-9033', name: 'Double Packed Filter', price: 12.50 },
      { sku: 'HD-2205', name: 'Wireless Thermostat', price: 159.00 }
    ],
    
    // Workorder history
    history: [
      { id: 'WO-2026-000', date: '2026-08-15', unit: 'SP09EA2-20', status: 'completed', cost: 245.00 },
      { id: 'WO-2025-042', date: '2026-08-10', unit: 'SP09EA2-20', status: 'completed', cost: 89.00 }
    ]
  },
  
  methods: {
    addPart: (state, part) => {
      const existing = state.partsList.find(p => p.part === (part.sku || part.part));
      if (existing) {
        existing.qty += 1;
      } else {
        state.partsList.push({ 
          part: part.sku || part.part, 
          name: part.name, 
          qty: 1, 
          cost: part.price || 0 
        });
      }
      
      window.dispatchEvent(new CustomEvent('esa:part-added', {
        detail: { part, workorderId: state.workorderId }
      }));
      
      renderPartsList(state, container);
      updateCostDisplay(state, container);
    },
    
    removePart: (state, index) => {
      const removed = state.partsList[index];
      state.partsList.splice(index, 1);
      
      window.dispatchEvent(new CustomEvent('esa:part-removed', {
        detail: { part: removed, workorderId: state.workorderId }
      }));
      
      renderPartsList(state, container);
      updateCostDisplay(state, container);
    },
    
    completeMaintenance: (state) => {
      state.maintenanceComplete = true;
      state.workorderData.status = 'completed';
      
      const totalCost = state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0) + 
                       (state.workorderData.laborHours * 75);
      
      // Add to history
      state.history.unshift({
        id: state.workorderId,
        date: new Date().toISOString().split('T')[0],
        unit: state.workorderData.unitModel,
        status: 'completed',
        cost: totalCost
      });
      
      window.dispatchEvent(new CustomEvent('esa:workorder-completed', {
        detail: { 
          workorderId: state.workorderId, 
          totalCost,
          partsUsed: state.partsList.length
        }
      }));
      
      updateStatusBadge(state, container);
    },
    
    switchSideTab: (state, tab) => {
      state.activeSideTab = tab;
      updateTabUI(state, container);
    },
    
    getTotalPartsCost: (state) => {
      return state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0);
    },
    
    getLaborCost: (state) => {
      return (state.workorderData.laborHours || 0) * 75;
    },
    
    getTotalCost: (state) => {
      const partsCost = state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0);
      const laborCost = (state.workorderData.laborHours || 0) * 75;
      return partsCost + laborCost;
    }
  },
  
  // Template with ALL HARDCODED STYLES - no ${} in any style attribute!
  template: (props, state, methods) => html`
    <div class="esa-workorder-container" id="esa-workorder-main" style="
      display: flex;
      width: 100%;
      min-height: 600px;
      background: #282828;
      border: 2px solid #3c3836;
      border-radius: 12px;
      overflow: hidden;
    ">
      <!-- Side Navigation -->
      <div style="
        width: 220px;
        background: #32302f;
        border-right: 2px solid #3c3836;
        display: flex;
        flex-direction: column;
        padding: 20px 0;
      ">
        <div style="padding: 0 20px 20px; border-bottom: 2px solid #3c3836; margin-bottom: 20px;">
          <div style="font-weight: bold; color: #d79921;">ESA WORKORDER</div>
          <div id="wo-id-display" style="font-size: 11px; color: #a89984;">${() => state.workorderId}</div>
        </div>
        
        <!-- Side Tabs - HARDCODED styles, active state via DOM -->
        <button class="wo-side-tab" data-tab="workorder" style="
          width: 100%;
          padding: 14px 20px;
          background: #282828;
          color: #ebdbb2;
          border: none;
          border-left: 4px solid #98971a;
          text-align: left;
          cursor: pointer;
          font-weight: bold;
          font-size: 13px;
          transition: all 0.2s;
        ">📋 Workorder</button>
        
        <button class="wo-side-tab" data-tab="parts" style="
          width: 100%;
          padding: 14px 20px;
          background: transparent;
          color: #ebdbb2;
          border: none;
          border-left: 4px solid transparent;
          text-align: left;
          cursor: pointer;
          font-weight: normal;
          font-size: 13px;
          transition: all 0.2s;
        ">📦 Parts</button>
        
        <button class="wo-side-tab" data-tab="diagnostics" style="
          width: 100%;
          padding: 14px 20px;
          background: transparent;
          color: #ebdbb2;
          border: none;
          border-left: 4px solid transparent;
          text-align: left;
          cursor: pointer;
          font-weight: normal;
          font-size: 13px;
          transition: all 0.2s;
        ">🔍 Diagnostics</button>
        
        <button class="wo-side-tab" data-tab="history" style="
          width: 100%;
          padding: 14px 20px;
          background: transparent;
          color: #ebdbb2;
          border: none;
          border-left: 4px solid transparent;
          text-align: left;
          cursor: pointer;
          font-weight: normal;
          font-size: 13px;
          transition: all 0.2s;
        ">📜 History</button>
        
        <!-- Status Indicator -->
        <div style="margin-top: auto; padding: 20px;">
          <div id="wo-status-badge" style="
            padding: 12px;
            background: #d79921;
            color: #282828;
            border-radius: 6px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
          ">
            IN PROGRESS
          </div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div style="flex: 1; padding: 24px; overflow-y: auto;">
        
        <!-- WORKORDER TAB -->
        <div class="wo-tab-panel" data-panel="workorder" id="wo-panel-workorder" style="display: block;">
          <div style="max-width: 800px;">
            <h2 style="color: #d79921; margin-bottom: 24px;">Workorder Details</h2>
            
            <!-- Unit Information -->
            <div style="
              background: #32302f;
              border: 1px solid #3c3836;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <h3 style="color: #689d6a; margin-bottom: 16px;">UNIT INFORMATION</h3>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <div style="font-size: 11px; color: #a89984;">Model</div>
                  <div id="wo-unit-model" style="font-weight: bold;">SP09EA2-20</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #a89984;">Serial</div>
                  <div id="wo-serial" style="font-weight: bold;">YYMM080523</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #a89984;">Location</div>
                  <div id="wo-location" style="font-weight: bold;">Room 304 - Building A</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #a89984;">Status</div>
                  <div id="wo-status" style="font-weight: bold; color: #d79921;">IN PROGRESS</div>
                </div>
              </div>
            </div>
            
            <!-- Parts Used -->
            <div style="
              background: #32302f;
              border: 1px solid #3c3836;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: #689d6a; margin: 0;">PARTS USED</h3>
                <button
                  id="wo-add-part-btn"
                  style="
                    background: #458588;
                    color: #ebdbb2;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                  "
                >+ ADD PART</button>
              </div>
              
              <!-- Parts Catalog (toggleable) -->
              <div id="wo-parts-catalog" style="
                margin-bottom: 16px;
                padding: 16px;
                background: #282828;
                border: 1px solid #3c3836;
                border-radius: 6px;
                display: none;
              ">
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 12px;">SELECT PART FROM CATALOG:</div>
                <div id="wo-catalog-list" style="display: grid; gap: 8px;"></div>
              </div>
              
              <!-- Parts List Container -->
              <div id="wo-parts-list" style="display: grid; gap: 12px;"></div>
              
              <!-- Cost Summary -->
              <div style="
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #3c3836;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
              ">
                <div style="text-align: center;">
                  <div style="font-size: 11px; color: #a89984;">Parts Total</div>
                  <div id="wo-parts-total" style="font-size: 18px; font-weight: bold; color: #98971a;">$45.00</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 11px; color: #a89984;">Labor (@$75/hr)</div>
                  <div id="wo-labor-total" style="font-size: 18px; font-weight: bold; color: #d79921;">$112.50</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 11px; color: #a89984;">Grand Total</div>
                  <div id="wo-grand-total" style="font-size: 18px; font-weight: bold; color: #689d6a;">$157.50</div>
                </div>
              </div>
            </div>
            
            <!-- Notes & Completion -->
            <div style="
              background: #32302f;
              border: 1px solid #3c3836;
              border-radius: 8px;
              padding: 20px;
            ">
              <h3 style="color: #689d6a; margin-bottom: 16px;">NOTES & COMPLETION</h3>
              
              <div style="margin-bottom: 16px;">
                <label style="font-size: 11px; color: #a89984; display: block; margin-bottom: 8px;">Labor Hours</label>
                <input
                  id="wo-labor-input"
                  type="number"
                  step="0.5"
                  value="1.5"
                  style="
                    width: 120px;
                    background: #282828;
                    border: 1px solid #3c3836;
                    color: #ebdbb2;
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 14px;
                  "
                />
              </div>
              
              <div style="margin-bottom: 16px;">
                <label style="font-size: 11px; color: #a89984; display: block; margin-bottom: 8px;">Notes</label>
                <textarea
                  id="wo-notes-textarea"
                  rows="4"
                  placeholder="Enter work order notes..."
                  style="
                    width: 100%;
                    background: #282828;
                    border: 1px solid #3c3836;
                    color: #ebdbb2;
                    padding: 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    resize: vertical;
                  "></textarea>
              </div>
              
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" id="wo-warranty-check" checked style="width: 18px; height: 18px;" />
                  <span style="font-size: 13px;">Warranty Claim</span>
                </label>
              </div>
              
              <button
                id="wo-complete-btn"
                style="
                  width: 100%;
                  padding: 16px;
                  background: #98971a;
                  color: #282828;
                  border: none;
                  border-radius: 8px;
                  font-size: 14px;
                  font-weight: bold;
                  cursor: pointer;
                "
              >✓ COMPLETE MAINTENANCE</button>
              
              <div id="wo-completion-msg" style="
                margin-top: 12px;
                padding: 12px;
                background: #98971a;
                color: #282828;
                border-radius: 6px;
                text-align: center;
                font-weight: bold;
                display: none;
              "></div>
            </div>
          </div>
        </div>
        
        <!-- PARTS TAB -->
        <div class="wo-tab-panel" data-panel="parts" id="wo-panel-parts" style="display: none;">
          <h2 style="color: #d79921; margin-bottom: 24px;">Parts Inventory</h2>
          <div id="wo-parts-inventory" style="display: grid; gap: 12px;"></div>
        </div>
        
        <!-- DIAGNOSTICS TAB -->
        <div class="wo-tab-panel" data-panel="diagnostics" id="wo-panel-diagnostics" style="display: none;">
          <h2 style="color: #d79921; margin-bottom: 24px;">Diagnostic Codes</h2>
          <div style="
            background: #32302f;
            border: 1px solid #3c3836;
            border-radius: 8px;
            padding: 20px;
          ">
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
              <input
                id="wo-diag-input"
                type="text"
                maxlength="2"
                placeholder="Enter code..."
                style="
                  flex: 1;
                  background: #282828;
                  border: 1px solid #3c3836;
                  color: #ebdbb2;
                  padding: 12px;
                  border-radius: 6px;
                  font-family: monospace;
                  font-size: 18px;
                  text-transform: uppercase;
                  text-align: center;
                "
              />
              <button
                id="wo-diag-btn"
                style="
                  background: #458588;
                  color: #ebdbb2;
                  border: none;
                  padding: 0 24px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: bold;
                "
              >LOOKUP</button>
            </div>
            <div id="wo-diag-result" style="
              background: #282828;
              border: 1px solid #3c3836;
              border-radius: 8px;
              padding: 16px;
              min-height: 100px;
            ">
              <p style="color: #a89984; text-align: center;">Enter a diagnostic code to lookup</p>
            </div>
          </div>
        </div>
        
        <!-- HISTORY TAB -->
        <div class="wo-tab-panel" data-panel="history" id="wo-panel-history" style="display: none;">
          <h2 style="color: #d79921; margin-bottom: 24px;">Workorder History</h2>
          <div id="wo-history-list" style="display: grid; gap: 12px;"></div>
        </div>
        
      </div>
    `
});

// Global reference for DOM updates
let container = null;

// Helper functions for DOM updates (outside template)
function updateTabUI(state, container) {
  if (!container) return;
  
  // Update side tab buttons
  container.querySelectorAll('.wo-side-tab').forEach(btn => {
    const tabId = btn.getAttribute('data-tab');
    if (tabId === state.activeSideTab) {
      btn.style.background = G.bg;
      btn.style.borderLeftColor = G.green;
      btn.style.fontWeight = 'bold';
    } else {
      btn.style.background = 'transparent';
      btn.style.borderLeftColor = 'transparent';
      btn.style.fontWeight = 'normal';
    }
  });
  
  // Show/hide content panels
  container.querySelectorAll('.wo-tab-panel').forEach(panel => {
    panel.style.display = 'none';
  });
  const activePanel = container.querySelector(`#wo-panel-${state.activeSideTab}`);
  if (activePanel) {
    activePanel.style.display = 'block';
  }
}

function renderPartsList(state, container) {
  if (!container) return;
  
  const listEl = container.querySelector('#wo-parts-list');
  if (!listEl) return;
  
  if (state.partsList.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; padding: 40px; color: #a89984;">No parts added yet. Click "+ ADD PART" to add parts.</div>`;
    return;
  }
  
  listEl.innerHTML = state.partsList.map((part, index) => `
    <div style="
      background: #282828;
      border: 1px solid #3c3836;
      border-radius: 6px;
      padding: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          background: #98971a;
          color: #282828;
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold;
        ">${part.qty}</div>
        <div>
          <div style="font-weight: bold;">Part ${part.part}</div>
          <div style="font-size: 12px; color: #a89984;">${part.name}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="color: #98971a; font-weight: bold;">$${(part.cost * part.qty).toFixed(2)}</div>
        <button
          class="wo-remove-part-btn"
          data-part-index="${index}"
          style="
            background: #cc241d;
            color: #ebdbb2;
            border: none;
            width: 28px; height: 28px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
        ">×</button>
      </div>
    </div>
  `).join('');
  
  // Re-attach remove listeners
  listEl.querySelectorAll('.wo-remove-part-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-part-index'));
      if (!isNaN(index)) {
        methods.removePart(state, index);
      }
    });
  });
}

function renderCatalog(state, container) {
  if (!container) return;
  
  const catalogEl = container.querySelector('#wo-catalog-list');
  if (!catalogEl) return;
  
  catalogEl.innerHTML = state.catalogParts.map((part, idx) => `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: #32302f;
      border-radius: 4px;
    ">
      <div>
        <span style="font-weight: bold;">${part.sku}</span>
        <span style="margin-left: 8px; color: #a89984;">${part.name}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="color: #98971a;">$${part.price.toFixed(2)}</span>
        <button
          class="wo-catalog-add-btn"
          data-cat-index="${idx}"
          style="
            background: #98971a;
            color: #282828;
            border: none;
            padding: 4px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        ">ADD</button>
      </div>
    </div>
  `).join('');
  
  // Re-attach add listeners
  catalogEl.querySelectorAll('.wo-catalog-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-cat-index'));
      if (!isNaN(index) && state.catalogParts[index]) {
        methods.addPart(state, state.catalogParts[index]);
      }
    });
  });
}

function renderHistory(state, container) {
  if (!container) return;
  
  const historyEl = container.querySelector('#wo-history-list');
  if (!historyEl) return;
  
  historyEl.innerHTML = state.history.map(item => `
    <div style="
      background: #32302f;
      border: 1px solid #3c3836;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div>
        <div style="font-weight: bold; color: #d79921;">${item.id}</div>
        <div style="font-size: 12px; color: #a89984;">${item.date} | Unit: ${item.unit}</div>
      </div>
      <div style="text-align: right">
        <div style="color: #98971a; font-weight: bold;">$${item.cost.toFixed(2)}</div>
        <div style="font-size: 11px; color: #689d6a;">${item.status.toUpperCase()}</div>
      </div>
    </div>
  `).join('');
}

function updateCostDisplay(state, container) {
  if (!container) return;
  
  const partsTotalEl = container.querySelector('#wo-parts-total');
  const laborTotalEl = container.querySelector('#wo-labor-total');
  const grandTotalEl = container.querySelector('#wo-grand-total');
  
  if (partsTotalEl) partsTotalEl.textContent = `$${methods.getTotalPartsCost(state).toFixed(2)}`;
  if (laborTotalEl) laborTotalEl.textContent = `$${methods.getLaborCost(state).toFixed(2)}`;
  if (grandTotalEl) grandTotalEl.textContent = `$${methods.getTotalCost(state).toFixed(2)}`;
}

function updateStatusBadge(state, container) {
  if (!container) return;
  
  const badge = container.querySelector('#wo-status-badge');
  const statusText = container.querySelector('#wo-status');
  const completeBtn = container.querySelector('#wo-complete-btn');
  const completionMsg = container.querySelector('#wo-completion-msg');
  
  if (badge) {
    badge.style.background = '#98971a';
    badge.textContent = 'COMPLETED';
  }
  if (statusText) {
    statusText.textContent = 'COMPLETED';
    statusText.style.color = '#98971a';
  }
  if (completeBtn) {
    completeBtn.disabled = true;
    completeBtn.style.background = G.fg_soft;
    completeBtn.textContent = '✓ MAINTENANCE COMPLETED';
  }
  if (completionMsg) {
    completionMsg.style.display = 'block';
    completionMsg.textContent = `✓ Completed at ${new Date().toLocaleString()}`;
  }
}

// Setup event listeners after mount
const origWorkorderMount = ESAWorkorder.mount;
ESAWorkorder.mount = function(containerRef) {
  container = containerRef;
  const result = origWorkorderMount.call(this, containerRef);
  
  setTimeout(() => {
    // Store state/methods references for helper functions
    const state = this.state;
    
    // Side tab buttons
    container.querySelectorAll('.wo-side-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        methods.switchSideTab(state, tab);
      });
    });
    
    // Add Part button
    const addPartBtn = container.querySelector('#wo-add-part-btn');
    if (addPartBtn) {
      addPartBtn.addEventListener('click', () => {
        state.showPartsCatalog = !state.showPartsCatalog;
        const catalog = container.querySelector('#wo-parts-catalog');
        if (catalog) {
          catalog.style.display = state.showPartsCatalog ? 'block' : 'none';
          if (state.showPartsCatalog) {
            renderCatalog(state, container);
          }
        }
      });
    }
    
    // Complete Maintenance button
    const completeBtn = container.querySelector('#wo-complete-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        if (!state.maintenanceComplete) {
          methods.completeMaintenance(state);
        }
      });
    }
    
    // Notes textarea
    const notesTextarea = container.querySelector('#wo-notes-textarea');
    if (notesTextarea) {
      notesTextarea.value = state.workorderData.notes || '';
      notesTextarea.addEventListener('input', (e) => {
        state.workorderData.notes = e.target.value;
      });
    }
    
    // Labor hours input
    const laborInput = container.querySelector('#wo-labor-input');
    if (laborInput) {
      laborInput.value = state.workorderData.laborHours || 0;
      laborInput.addEventListener('input', (e) => {
        state.workorderData.laborHours = parseFloat(e.target.value) || 0;
        updateCostDisplay(state, container);
      });
    }
    
    // Warranty checkbox
    const warrantyCheck = container.querySelector('#wo-warranty-check');
    if (warrantyCheck) {
      warrantyCheck.checked = state.workorderData.warrantyClaim || false;
      warrantyCheck.addEventListener('change', (e) => {
        state.workorderData.warrantyClaim = e.target.checked;
      });
    }
    
    // Diagnostic lookup
    const diagBtn = container.querySelector('#wo-diag-btn');
    const diagInput = container.querySelector('#wo-diag-input');
    if (diagBtn && diagInput) {
      diagBtn.addEventListener('click', () => {
        const code = diagInput.value.toUpperCase();
        const resultEl = container.querySelector('#wo-diag-result');
        if (resultEl) {
          const diagnostics = {
            'F1': 'Indoor Thermistor Fault - Replace black thermistor',
            'F2': 'Outdoor Thermistor Fault - Replace outdoor sensor',
            'F3': 'Indoor Coil Sensor Fault - Check connection',
            'F6': 'Communication Error - Check wiring harness',
            'C1': 'Coil Freezing - Check refrigerant charge'
          };
          if (diagnostics[code]) {
            resultEl.innerHTML = `<div style="color: #98971a; font-weight: bold;">${code}: ${diagnostics[code]}</div>`;
          } else {
            resultEl.innerHTML = `<div style="color: #cc241d;">Unknown code: ${code}</div>`;
          }
        }
      });
    }
    
    // Initial renders
    renderPartsList(state, container);
    renderHistory(state, container);
    updateCostDisplay(state, container);
    
  }, 100);
  
  return result;
};

export default ESAWorkorder;
