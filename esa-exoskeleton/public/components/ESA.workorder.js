/**
 * ESA.workorder.js
 * ============================================
 * UNIFIED MAINTENANCE WORKORDER SYSTEM
 * ============================================
 * 
 * Features:
 * - Side tab navigation (Workorder/Parts/Diagnostics/History)
 * - Parts management with inline catalog
 * - DuckDB real-time sync
 * - Warranty claim tracking
 * - Labor hours tracking
 * - Maintenance completion workflow
 * 
 * Connections:
 * → ESA.duckDB (parts catalog, data persistence)
 * → ESA.InvPartsCard-B (parts ordering)
 * → ESA.DiagnosticCode (diagnostic codes)
 * → GSAP Transport (workorder events)
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

export const ESAWorkorder = ESAVerifyComponent({
  name: 'workorder',
  version: '1.0.0',
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
    duckDBConn: null,
    
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
    },
    
    getTotalPartsCost: (state) => {
      return state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0);
    },
    
    getLaborCost: (state) => {
      return (state.workorderData.laborHours || 0) * 75;
    },
    
    getTotalCost: (state) => {
      return methods.getTotalPartsCost(state) + methods.getLaborCost(state);
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-workorder-container" style="
      display: flex;
      width: 100%;
      min-height: 600px;
      background: ${activeTheme.bg};
      border: 2px solid ${activeTheme.border};
      border-radius: 12px;
      overflow: hidden;
    ">
      <!-- Side Navigation -->
      <div style="
        width: 220px;
        background: ${activeTheme.bg_soft};
        border-right: 2px solid ${activeTheme.border};
        display: flex;
        flex-direction: column;
        padding: 20px 0;
      ">
        <div style="padding: 0 20px 20px; border-bottom: 2px solid ${activeTheme.border}; margin-bottom: 20px;">
          <div style="font-weight: bold; color: ${activeTheme.yellow};">ESA WORKORDER</div>
          <div style="font-size: 11px; color: ${activeTheme.fg_soft};">${() => state.workorderId}</div>
        </div>
        
        ${['workorder', 'parts', 'diagnostics', 'history'].map(tab => html`
          <button
            @click=${() => methods.switchSideTab(state, tab)}
            style="
              width: 100%;
              padding: 14px 20px;
              background: ${state.activeSideTab === tab ? activeTheme.bg : 'transparent'};
              color: ${activeTheme.fg};
              border: none;
              border-left: ${state.activeSideTab === tab ? `4px solid ${activeTheme.green}` : '4px solid transparent'};
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
          <div style="
            padding: 12px;
            background: ${state.workorderData.status === 'completed' ? activeTheme.green : activeTheme.yellow};
            color: ${activeTheme.bg};
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
        ${state.activeSideTab === 'workorder' ? html`
          <div style="max-width: 800px;">
            <h2 style="color: ${activeTheme.yellow}; margin-bottom: 24px;">Workorder Details</h2>
            
            <!-- Unit Information -->
            <div style="
              background: ${activeTheme.bg_soft};
              border: 1px solid ${activeTheme.border};
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <h3 style="color: ${activeTheme.aqua}; margin-bottom: 16px;">UNIT INFORMATION</h3>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Model</div>
                  <div style="font-weight: bold;">${() => state.workorderData?.unitModel}</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Serial</div>
                  <div style="font-weight: bold;">${() => state.workorderData?.serialNumber}</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Location</div>
                  <div style="font-weight: bold;">${() => state.workorderData?.location}</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Status</div>
                  <div style="font-weight: bold; color: ${activeTheme.yellow};">
                    ${() => (state.workorderData?.status || 'open').replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Parts Used -->
            <div style="
              background: ${activeTheme.bg_soft};
              border: 1px solid ${activeTheme.border};
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: ${activeTheme.aqua}; margin: 0;">PARTS USED</h3>
                <button
                  @click=${() => state.showPartsCatalog = !state.showPartsCatalog}
                  style="
                    background: ${activeTheme.blue};
                    color: ${activeTheme.fg};
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
              ${state.showPartsCatalog ? html`
                <div style="
                  margin-bottom: 16px;
                  padding: 16px;
                  background: ${activeTheme.bg};
                  border: 1px solid ${activeTheme.border};
                  border-radius: 6px;
                ">
                  <div style="font-size: 12px; font-weight: bold; margin-bottom: 12px;">SELECT PART FROM CATALOG:</div>
                  <div style="display: grid; gap: 8px;">
                    ${state.catalogParts.map(part => html`
                      <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px;
                        background: ${activeTheme.bg_soft};
                        border-radius: 4px;
                      ">
                        <div>
                          <span style="font-weight: bold;">${part.sku}</span>
                          <span style="margin-left: 8px; color: ${activeTheme.fg_soft};">${part.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                          <span style="color: ${activeTheme.green};">$${part.price.toFixed(2)}</span>
                          <button
                            @click=${() => methods.addPart(state, part)}
                            style="
                              background: ${activeTheme.green};
                              color: ${activeTheme.bg};
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
              ` : ''}
              
              ${state.partsList.length === 0 ? html`
                <div style="text-align: center; padding: 40px; color: ${activeTheme.fg_soft};">
                  No parts added yet. Click "+ ADD PART" to add parts.
                </div>
              ` : html`
                <div style="display: grid; gap: 12px;">
                  ${state.partsList.map((part, index) => html`
                    <div style="
                      background: ${activeTheme.bg};
                      border: 1px solid ${activeTheme.border};
                      border-radius: 6px;
                      padding: 14px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    ">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="
                          background: ${activeTheme.green};
                          color: ${activeTheme.bg};
                          width: 28px; height: 28px;
                          border-radius: 50%;
                          display: flex; align-items: center; justify-content: center;
                          font-weight: bold;
                        ">
                          ${part.qty}
                        </div>
                        <div>
                          <div style="font-weight: bold;">Part ${part.part}</div>
                          <div style="font-size: 12px; color: ${activeTheme.fg_soft};">${part.name}</div>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="color: ${activeTheme.green}; font-weight: bold;">
                          $${(part.cost * part.qty).toFixed(2)}
                        </div>
                        <button
                          @click=${() => methods.removePart(state, index)}
                          style="
                            background: ${activeTheme.red};
                            color: ${activeTheme.fg};
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
                  border-top: 2px solid ${activeTheme.border};
                ">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Parts Total</span>
                    <span style="font-weight: bold;">$${methods.getTotalPartsCost(state).toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Labor (${state.workorderData?.laborHours || 0} hrs × $75)</span>
                    <span style="font-weight: bold;">$${methods.getLaborCost(state).toFixed(2)}</span>
                  </div>
                  <div style="
                    display: flex; justify-content: space-between;
                    padding-top: 12px;
                    border-top: 2px solid ${activeTheme.border};
                    font-size: 18px;
                  ">
                    <span style="font-weight: bold;">TOTAL</span>
                    <span style="font-weight: bold; color: ${activeTheme.green};">$${methods.getTotalCost(state).toFixed(2)}</span>
                  </div>
                </div>
              `}
            </div>
            
            <!-- Maintenance Card -->
            <div style="
              background: ${activeTheme.bg_soft};
              border: 2px solid ${activeTheme.border};
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <h3 style="color: ${activeTheme.purple}; margin-bottom: 16px;">MAINTENANCE COMPLETED</h3>
              
              <!-- Notes -->
              <div style="margin-bottom: 16px;">
                <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 8px;">
                  Technician Notes
                </div>
                <textarea
                  value=${() => state.workorderData?.notes || ''}
                  @input=${(e) => { if (state.workorderData) state.workorderData.notes = e.target.value; }}
                  placeholder="Describe work performed..."
                  style="
                    width: 100%;
                    min-height: 120px;
                    background: ${activeTheme.bg};
                    border: 1px solid ${activeTheme.border};
                    color: ${activeTheme.fg};
                    padding: 12px;
                    border-radius: 6px;
                    resize: vertical;
                    font-family: inherit;
                  "
                ></textarea>
              </div>
              
              <!-- Labor & Warranty -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 8px;">Labor Hours</div>
                  <input
                    type="number"
                    step="0.5"
                    value=${() => state.workorderData?.laborHours || 0}
                    @input=${(e) => { if (state.workorderData) state.workorderData.laborHours = parseFloat(e.target.value) || 0; }}
                    style="
                      width: 100%;
                      background: ${activeTheme.bg};
                      border: 1px solid ${activeTheme.border};
                      color: ${activeTheme.fg};
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
                      checked=${() => state.workorderData?.warrantyClaim || false}
                      @change=${(e) => { if (state.workorderData) state.workorderData.warrantyClaim = e.target.checked; }}
                      style="width: 18px; height: 18px;"
                    />
                    <span>Warranty Claim</span>
                  </label>
                </div>
              </div>
              
              <!-- Complete Button -->
              <button
                @click=${() => methods.completeMaintenance(state)}
                disabled=${() => state.maintenanceComplete}
                style="
                  width: 100%;
                  padding: 18px;
                  background: ${() => state.maintenanceComplete ? activeTheme.fg_disabled : activeTheme.green};
                  color: ${activeTheme.bg};
                  border: none;
                  border-radius: 8px;
                  cursor: ${() => state.maintenanceComplete ? 'not-allowed' : 'pointer'};
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
                <span>${() => state.maintenanceComplete ? 'MAINTENANCE COMPLETED' : 'COMPLETE MAINTENANCE'}</span>
              </button>
              
              ${state.maintenanceComplete ? html`
                <div style="
                  margin-top: 16px;
                  padding: 16px;
                  background: ${activeTheme.bg_green};
                  border-radius: 6px;
                  text-align: center;
                  color: ${activeTheme.green};
                  font-weight: bold;
                ">
                  ✓ Completed at ${new Date().toLocaleString()}
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        ${state.activeSideTab === 'parts' ? html`
          <div>
            <h2 style="color: ${activeTheme.yellow}; margin-bottom: 24px;">Parts Catalog</h2>
            <div style="background: ${activeTheme.bg_soft}; border: 1px solid ${activeTheme.border}; border-radius: 8px; padding: 20px;">
              <input
                type="text"
                placeholder="Search HD Supply catalog..."
                style="
                  width: 100%;
                  background: ${activeTheme.bg};
                  border: 1px solid ${activeTheme.border};
                  color: ${activeTheme.fg};
                  padding: 12px;
                  border-radius: 6px;
                  margin-bottom: 16px;
                  font-size: 14px;
                "
              />
              <div style="display: grid; gap: 12px;">
                ${state.catalogParts.map(part => html`
                  <div style="
                    background: ${activeTheme.bg};
                    border: 1px solid ${activeTheme.border};
                    border-radius: 6px;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <div>
                      <div style="font-weight: bold;">${part.sku}</div>
                      <div style="color: ${activeTheme.fg_soft};">${part.name}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="color: ${activeTheme.green}; font-weight: bold;">$${part.price.toFixed(2)}</div>
                      <button
                        @click=${() => methods.addPart(state, part)}
                        style="
                          margin-top: 8px;
                          background: ${activeTheme.blue};
                          color: ${activeTheme.fg};
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
        ` : ''}
        
        ${state.activeSideTab === 'diagnostics' ? html`
          <div>
            <h2 style="color: ${activeTheme.yellow}; margin-bottom: 24px;">Diagnostics</h2>
            <div style="background: ${activeTheme.bg_soft}; border: 1px solid ${activeTheme.border}; border-radius: 8px; padding: 20px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Diagnostic Code</div>
                  <div style="font-size: 24px; font-weight: bold; color: ${activeTheme.red};">
                    ${() => state.workorderData?.diagnosticCode || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Status</div>
                  <div style="font-weight: bold; color: ${activeTheme.yellow};">
                    ${() => (state.workorderData?.diagnosticCode ? 'Code Detected' : 'No Code')}
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 16px; background: ${activeTheme.bg}; border-radius: 6px;">
                <div style="font-size: 12px; color: ${activeTheme.fg_soft};">Note:</div>
                <div>Run full diagnostics using the ESA Diagnostic Card above to detect and analyze PTAC error codes.</div>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${state.activeSideTab === 'history' ? html`
          <div>
            <h2 style="color: ${activeTheme.yellow}; margin-bottom: 24px;">Workorder History</h2>
            <div style="background: ${activeTheme.bg_soft}; border: 1px solid ${activeTheme.border}; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: ${activeTheme.bg};">
                    <th style="padding: 12px; text-align: left; font-size: 11px; color: ${activeTheme.fg_soft};">ID</th>
                    <th style="padding: 12px; text-align: left; font-size: 11px; color: ${activeTheme.fg_soft};">Date</th>
                    <th style="padding: 12px; text-align: left; font-size: 11px; color: ${activeTheme.fg_soft};">Unit</th>
                    <th style="padding: 12px; text-align: left; font-size: 11px; color: ${activeTheme.fg_soft};">Status</th>
                    <th style="padding: 12px; text-align: right; font-size: 11px; color: ${activeTheme.fg_soft};">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.history.map(item => html`
                    <tr style="border-top: 1px solid ${activeTheme.border};">
                      <td style="padding: 12px; font-weight: bold;">${item.id}</td>
                      <td style="padding: 12px;">${item.date}</td>
                      <td style="padding: 12px;">${item.unit}</td>
                      <td style="padding: 12px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 11px;
                          font-weight: bold;
                          background: ${item.status === 'completed' ? activeTheme.green : activeTheme.yellow};
                          color: ${activeTheme.bg};
                        ">${item.status.toUpperCase()}</span>
                      </td>
                      <td style="padding: 12px; text-align: right; font-weight: bold; color: ${activeTheme.green};">$${item.cost.toFixed(2)}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `
}).component;

export default ESAWorkorder;
