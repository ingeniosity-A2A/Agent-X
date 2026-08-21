/**
 * ESA.workorder.js (Arrow.js Compatible - HARDCODED STYLES)
 * ============================================
 * UNIFIED MAINTENANCE WORKORDER SYSTEM
 * 
 * Features:
 * - Side tab navigation (Workorder/Parts/Diagnostics/History)
 * - Parts management with inline catalog
 * - Warranty claim tracking
 * - Labor hours tracking
 * - Maintenance completion workflow
 * 
 * ARROW.JS COMPATIBILITY: All styles MUST be hardcoded!
 * No ${} in style attributes. Event listeners via post-mount DOM.
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
  version: '2.0.0',
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
    },
    
    removePart: (state, index) => {
      const removed = state.partsList[index];
      state.partsList.splice(index, 1);
      
      window.dispatchEvent(new CustomEvent('esa:part-removed', {
        detail: { part: removed, workorderId: state.workorderId }
      }));
    },
    
    completeMaintenance: (state) => {
      state.maintenanceComplete = true;
      state.workorderData.status = 'completed';
      
      const totalCost = state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0) + 
                       (state.workorderData.laborHours * 75); // $75/hr labor rate
      
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
    },
    
    switchSideTab: (state, tab) => {
      state.activeSideTab = tab;
      methods.updateTabUI(state, tab);
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
    },
    
    updateTabUI: (state, activeTab) => {
      // This will be called after mount via DOM queries
      if (typeof document === 'undefined') return;
      
      const container = document.querySelector('#esa-workorder');
      if (!container) return;
      
      // Update side tab buttons
      container.querySelectorAll('.wo-side-tab').forEach(btn => {
        const tabId = btn.getAttribute('data-tab');
        if (tabId === activeTab) {
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
      const activePanel = container.querySelector(`[data-panel="${activeTab}"]`);
      if (activePanel) {
        activePanel.style.display = 'block';
      }
    },
    
    initEventListeners: (state, container) => {
      // Side tab buttons
      container.querySelectorAll('.wo-side-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          methods.switchSideTab(state, tab);
        });
      });
      
      // Add Part button (in workorder tab)
      const addPartBtn = container.querySelector('#wo-add-part-btn');
      if (addPartBtn) {
        addPartBtn.addEventListener('click', () => {
          state.showPartsCatalog = !state.showPartsCatalog;
          const catalog = container.querySelector('#wo-parts-catalog');
          if (catalog) {
            catalog.style.display = state.showPartsCatalog ? 'block' : 'none';
          }
        });
      }
      
      // Catalog "ADD" buttons
      container.querySelectorAll('.wo-catalog-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.getAttribute('data-part-index'));
          if (!isNaN(index) && state.catalogParts[index]) {
            methods.addPart(state, state.catalogParts[index]);
          }
        });
      });
      
      // Parts list remove buttons
      container.querySelectorAll('.wo-remove-part-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.getAttribute('data-part-index'));
          if (!isNaN(index)) {
            methods.removePart(state, index);
          }
        });
      });
      
      // Complete Maintenance button
      const completeBtn = container.querySelector('#wo-complete-btn');
      if (completeBtn) {
        completeBtn.addEventListener('click', () => {
          if (!state.maintenanceComplete) {
            methods.completeMaintenance(state);
            // Update UI
            completeBtn.disabled = true;
            completeBtn.style.background = G.fg_soft;
            completeBtn.textContent = '✓ MAINTENANCE COMPLETED';
            
            const completionMsg = container.querySelector('#wo-completion-msg');
            if (completionMsg) {
              completionMsg.style.display = 'block';
              completionMsg.innerHTML = `✓ Completed at ${new Date().toLocaleString()}`;
            }
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
          methods.updateCostDisplay(state, container);
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
      
      // Parts catalog "Add to Workorder" buttons
      container.querySelectorAll('.wo-cat-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.getAttribute('data-cat-index'));
          if (!isNaN(index) && state.catalogParts[index]) {
            methods.addPart(state, state.catalogParts[index]);
          }
        });
      });
      
      // Initialize first tab as active
      methods.updateTabUI(state, state.activeSideTab);
    },
    
    updateCostDisplay: (state, container) => {
      const partsTotalEl = container.querySelector('#wo-parts-total');
      const laborTotalEl = container.querySelector('#wo-labor-total');
      const grandTotalEl = container.querySelector('#wo-grand-total');
      
      if (partsTotalEl) partsTotalEl.textContent = `$${methods.getTotalPartsCost(state).toFixed(2)}`;
      if (laborTotalEl) laborTotalEl.textContent = `$${methods.getLaborCost(state).toFixed(2)}`;
      if (grandTotalEl) grandTotalEl.textContent = `$${methods.getTotalCost(state).toFixed(2)}`;
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-workorder-container" style="
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
          <div style="font-size: 11px; color: #a89984;">${() => state.workorderId}</div>
        </div>
        
        ${['workorder', 'parts', 'diagnostics', 'history'].map(tab => html`
          <button
            class="wo-side-tab"
            data-tab="${tab}"
            style="
              width: 100%;
              padding: 14px 20px;
              background: ${state.activeSideTab === tab ? '#282828' : 'transparent'};
              color: #ebdbb2;
              border: none;
              border-left: ${state.activeSideTab === tab ? '4px solid #98971a' : '4px solid transparent'};
              text-align: left;
              cursor: pointer;
              font-weight: ${state.activeSideTab === tab ? 'bold' : 'normal'};
              font-size: 13px;
              transition: all 0.2s;
            "
          >
            ${tab === 'workorder' ? '📋' : tab === 'parts' ? '📦' : tab === 'diagnostics' ? '🔍' : '📜'} ${tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        `)}
        
        <!-- Status Indicator -->
        <div style="margin-top: auto; padding: 20px;">
          <div id="wo-status-badge" style="
            padding: 12px;
            background: ${state.workorderData.status === 'completed' ? '#98971a' : '#d79921'};
            color: #282828;
            border-radius: 6px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
          ">
            ${() => state.workorderData.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div style="flex: 1; padding: 24px; overflow-y: auto;">
        
        <!-- WORKORDER TAB -->
        <div class="wo-tab-panel" data-panel="workorder" style="display: ${state.activeSideTab === 'workorder' ? 'block' : 'none'};">
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
                  <div style="font-weight: bold;">${() => state.workorderData?.unitModel}</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #a89984;">Serial</div>
                  <div style="font-weight: bold;">${() => state.workorderData?.serialNumber}</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #a89984;">Location</div>
                  <div style="font-weight: bold;">${() => state.workorderData?.location}</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #a89984;">Status</div>
                  <div style="font-weight: bold; color: #d79921;">
                    ${() => (state.workorderData?.status || 'open').replace('_', ' ').toUpperCase()}
                  </div>
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
                >
                  + ADD PART
                </button>
              </div>
              
              <!-- Parts Catalog (toggleable) -->
              <div id="wo-parts-catalog" style="
                margin-bottom: 16px;
                padding: 16px;
                background: #282828;
                border: 1px solid #3c3836;
                border-radius: 6px;
                display: ${state.showPartsCatalog ? 'block' : 'none'};
              ">
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 12px;">SELECT PART FROM CATALOG:</div>
                <div style="display: grid; gap: 8px;">
                  ${state.catalogParts.map((part, idx) => html`
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
                          data-part-index="${idx}"
                          style="
                            background: #98971a;
                            color: #282828;
                            border: none;
                            padding: 4px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 11px;
                          "
                        >ADD</button>
                      </div>
                    </div>
                  `)}
                </div>
              </div>
              
              ${state.partsList.length === 0 ? html`
                <div style="text-align: center; padding: 40px; color: #a89984;">
                  No parts added yet. Click "+ ADD PART" to add parts.
                </div>
              ` : html`
                <div style="display: grid; gap: 12px;">
                  ${state.partsList.map((part, index) => html`
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
                        ">
                          ${part.qty}
                        </div>
                        <div>
                          <div style="font-weight: bold;">Part ${part.part}</div>
                          <div style="font-size: 12px; color: #a89984;">${part.name}</div>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="color: #98971a; font-weight: bold;">
                          $${(part.cost * part.qty).toFixed(2)}
                        </div>
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
                          "
                        >×</button>
                      </div>
                    </div>
                  `)}
                </div>
                
                <!-- Cost Summary -->
                <div style="
                  margin-top: 16px;
                  padding-top: 16px;
                  border-top: 2px solid #3c3836;
                >
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Parts Total</span>
                    <span id="wo-parts-total" style="font-weight: bold;">$${methods.getTotalPartsCost(state).toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Labor (${state.workorderData?.laborHours || 0} hrs × $75)</span>
                    <span id="wo-labor-total" style="font-weight: bold;">$${methods.getLaborCost(state).toFixed(2)}</span>
                  </div>
                  <div style="
                    display: flex; justify-content: space-between;
                    padding-top: 12px;
                    border-top: 2px solid #3c3836;
                    font-size: 18px;
                  ">
                    <span style="font-weight: bold;">TOTAL</span>
                    <span id="wo-grand-total" style="font-weight: bold; color: #98971a;">$${methods.getTotalCost(state).toFixed(2)}</span>
                  </div>
                </div>
              `}
            </div>
            
            <!-- Maintenance Card -->
            <div style="
              background: #32302f;
              border: 2px solid #3c3836;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <h3 style="color: #b16286; margin-bottom: 16px;">MAINTENANCE COMPLETED</h3>
              
              <!-- Notes -->
              <div style="margin-bottom: 16px;">
                <div style="font-size: 11px; color: #a89984; margin-bottom: 8px;">
                  Technician Notes
                </div>
                <textarea
                  id="wo-notes-textarea"
                  placeholder="Describe work performed..."
                  style="
                    width: 100%;
                    min-height: 120px;
                    background: #282828;
                    border: 1px solid #3c3836;
                    color: #ebdbb2;
                    padding: 12px;
                    border-radius: 6px;
                    resize: vertical;
                    font-family: inherit;
                  "
                >${() => state.workorderData?.notes || ''}</textarea>
              </div>
              
              <!-- Labor & Warranty -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                <div>
                  <div style="font-size: 11px; color: #a89984; margin-bottom: 8px;">Labor Hours</div>
                  <input
                    type="number"
                    id="wo-labor-input"
                    step="0.5"
                    value="${() => state.workorderData?.laborHours || 0}"
                    style="
                      width: 100%;
                      background: #282828;
                      border: 1px solid #3c3836;
                      color: #ebdbb2;
                      padding: 10px;
                      border-radius: 6px;
                      font-size: 14px;
                    "
                  />
                </div>
                <div style="display: flex; align-items: end; padding-bottom: 8px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input
                      type="checkbox"
                      id="wo-warranty-check"
                      checked="${() => state.workorderData?.warrantyClaim || false}"
                      style="width: 18px; height: 18px;"
                    />
                    <span>Warranty Claim</span>
                  </label>
                </div>
              </div>
              
              <!-- Complete Button -->
              <button
                id="wo-complete-btn"
                style="
                  width: 100%;
                  padding: 18px;
                  background: ${state.maintenanceComplete ? '#a89984' : '#98971a'};
                  color: #282828;
                  border: none;
                  border-radius: 8px;
                  cursor: ${state.maintenanceComplete ? 'not-allowed' : 'pointer'};
                  font-size: 16px;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 12px;
                  transition: all 0.2s;
                "
              >
                <span>✓</span>
                <span>${state.maintenanceComplete ? 'MAINTENANCE COMPLETED' : 'COMPLETE MAINTENANCE'}</span>
              </button>
              
              <div id="wo-completion-msg" style="
                margin-top: 16px;
                padding: 16px;
                background: #32302f;
                border-radius: 6px;
                text-align: center;
                color: #98971a;
                font-weight: bold;
                display: ${state.maintenanceComplete ? 'block' : 'none'};
              ">
                ✓ Completed at ${new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <!-- PARTS TAB -->
        <div class="wo-tab-panel" data-panel="parts" style="display: ${state.activeSideTab === 'parts' ? 'block' : 'none'};">
          <div>
            <h2 style="color: #d79921; margin-bottom: 24px;">Parts Catalog</h2>
            <div style="background: #32302f; border: 1px solid #3c3836; border-radius: 8px; padding: 20px;">
              <input
                type="text"
                placeholder="Search HD Supply catalog..."
                style="
                  width: 100%;
                  background: #282828;
                  border: 1px solid #3c3836;
                  color: #ebdbb2;
                  padding: 12px;
                  border-radius: 6px;
                  margin-bottom: 16px;
                  font-size: 14px;
                "
              />
              <div style="display: grid; gap: 12px;">
                ${state.catalogParts.map((part, idx) => html`
                  <div style="
                    background: #282828;
                    border: 1px solid #3c3836;
                    border-radius: 6px;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <div>
                      <div style="font-weight: bold;">${part.sku}</div>
                      <div style="color: #a89984;">${part.name}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="color: #98971a; font-weight: bold;">$${part.price.toFixed(2)}</div>
                      <button
                        class="wo-cat-add-btn"
                        data-cat-index="${idx}"
                        style="
                          margin-top: 8px;
                          background: #458588;
                          color: #ebdbb2;
                          border: none;
                          padding: 6px 16px;
                          border-radius: 4px;
                          cursor: pointer;
                        "
                      >Add to Workorder</button>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          </div>
        </div>
        
        <!-- DIAGNOSTICS TAB -->
        <div class="wo-tab-panel" data-panel="diagnostics" style="display: ${state.activeSideTab === 'diagnostics' ? 'block' : 'none'};">
          <div>
            <h2 style="color: #d79921; margin-bottom: 24px;">Diagnostics</h2>
            <div style="background: #32302f; border: 1px solid #3c3836; border-radius: 8px; padding: 20px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <div style="font-size: 11px; color: #a89984;">Diagnostic Code</div>
                  <div style="font-size: 24px; font-weight: bold; color: #cc241d;">
                    ${() => state.workorderData?.diagnosticCode || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #a89984;">Status</div>
                  <div style="font-weight: bold; color: #d79921;">
                    ${() => (state.workorderData?.diagnosticCode ? 'Code Detected' : 'No Code')}
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 16px; background: #282828; border-radius: 6px;">
                <div style="font-size: 12px; color: #a89984;">Note:</div>
                <div>Run full diagnostics using the ESA Diagnostic Card above to detect and analyze PTAC error codes.</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- HISTORY TAB -->
        <div class="wo-tab-panel" data-panel="history" style="display: ${state.activeSideTab === 'history' ? 'block' : 'none'};">
          <div>
            <h2 style="color: #d79921; margin-bottom: 24px;">Workorder History</h2>
            <div style="background: #32302f; border: 1px solid #3c3836; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #282828;">
                    <th style="padding: 12px; text-align: left; font-size: 11px; color: #a89984;">ID</th>
                    <th style="padding: 12px; text-align: left; font-size: 11px; color: #a89984;">Date</th>
                    <th style="padding: 12px; text-align: left; font-size: 11px; color: #a89984;">Unit</th>
                    <th style="padding: 12px; text-align: left; font-size: 11px; color: #a89984;">Status</th>
                    <th style="padding: 12px; text-align: right; font-size: 11px; color: #a89984;">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.history.map(item => html`
                    <tr style="border-top: 1px solid #3c3836;">
                      <td style="padding: 12px; font-weight: bold;">${item.id}</td>
                      <td style="padding: 12px;">${item.date}</td>
                      <td style="padding: 12px;">${item.unit}</td>
                      <td style="padding: 12px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 11px;
                          font-weight: bold;
                          background: ${item.status === 'completed' ? '#98971a' : '#d79921'};
                          color: #282828;
                        ">${item.status.toUpperCase()}</span>
                      </td>
                      <td style="padding: 12px; text-align: right; font-weight: bold; color: #98971a;">$${item.cost.toFixed(2)}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  `,
  
  mounted: (props, state, methods, container) => {
    // Initialize event listeners after DOM is ready
    setTimeout(() => {
      try {
        methods.initEventListeners(state, container);
      } catch (err) {
        console.error('[ESA.Workorder] Init error:', err);
        window.ESA?.errors?.push({ component: 'Workorder', phase: 'init', error: err });
      }
    }, 100);
  }
});

export default ESAWorkorder;
