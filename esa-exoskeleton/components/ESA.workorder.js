/**
 * ESA.Workorder.js
 * Unified Maintenance System
 * 
 * Features:
 * - Workorder CRUD operations
 * - Parts catalog integration (DuckDB)
 * - Labor hours & cost tracking
 * - Warranty claim management
 * - Side navigation tabs
 * - Maintenance completion workflow
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// Workorder Database Schema
const WORKORDER_SCHEMA = {
  workorderId: 'VARCHAR',
  unitModel: 'VARCHAR',
  serialNumber: 'VARCHAR',
  location: 'VARCHAR',
  technician: 'VARCHAR',
  dateCreated: 'TIMESTAMP',
  dateCompleted: 'TIMESTAMP',
  status: 'VARCHAR', // 'open', 'in_progress', 'completed', 'on_hold'
  diagnosticCode: 'VARCHAR',
  partsUsed: 'VARCHAR', // JSON array
  laborHours: 'DECIMAL',
  laborRate: 'DECIMAL',
  partsCost: 'DECIMAL',
  totalCost: 'DECIMAL',
  notes: 'VARCHAR',
  warrantyClaim: 'BOOLEAN',
  priority: 'VARCHAR' // 'low', 'medium', 'high', 'emergency'
};

// Sample Workorder Data
const SAMPLE_WORKORDERS = {
  'WO-2026-001': {
    workorderId: 'WO-2026-001',
    unitModel: 'SP09EA2-20',
    serialNumber: 'YYMM080523',
    location: 'Room 304 - Building A',
    technician: 'John Smith',
    dateCreated: '2026-08-20T09:00:00Z',
    dateCompleted: null,
    status: 'in_progress',
    diagnosticCode: 'F1',
    partsUsed: [
      { part: '203862', name: 'Indoor Ambient Thermistor', qty: 1, cost: 45.00 },
      { part: '261803', name: 'Air Filter 10x10x1', qty: 2, cost: 12.50 }
    ],
    laborHours: 1.5,
    laborRate: 85.00,
    partsCost: 70.00,
    totalCost: 197.50,
    notes: 'Replaced faulty thermistor per diagnostic code F1. Unit testing normal after repair.',
    warrantyClaim: true,
    priority: 'high'
  },
  'WO-2026-002': {
    workorderId: 'WO-2026-002',
    unitModel: 'SP09EA2-20',
    serialNumber: 'YYMM081112',
    location: 'Room 156 - Building B',
    technician: 'Maria Garcia',
    dateCreated: '2026-08-21T07:30:00Z',
    dateCompleted: null,
    status: 'open',
    diagnosticCode: 'C3',
    partsUsed: [],
    laborHours: 0,
    laborRate: 85.00,
    partsCost: 0,
    totalCost: 0,
    notes: 'Indoor coil freezing reported. Possible refrigerant leak. Needs diagnosis.',
    warrantyClaim: false,
    priority: 'emergency'
  },
  'WO-2026-003': {
    workorderId: 'WO-2026-003',
    unitModel: 'SP09EA2-20',
    serialNumber: 'YYMM072245',
    location: 'Lobby - Building A',
    technician: 'David Chen',
    dateCreated: '2026-08-19T14:00:00Z',
    dateCompleted: '2026-08-19T16:30:00Z',
    status: 'completed',
    diagnosticCode: 'L6',
    partsUsed: [
      { part: '203862', name: 'Double Packed Filter', qty: 1, cost: 18.99 }
    ],
    laborHours: 0.5,
    laborRate: 85.00,
    partsCost: 18.99,
    totalCost: 61.49,
    notes: 'Filter replacement complete. Discharge air temperature normalized.',
    warrantyClaim: false,
    priority: 'low'
  }
};

// HD Supply Parts Catalog (for search/add)
const PARTS_CATALOG = [
  { sku: '203862', name: 'Double Packed Filter', category: 'Filters', price: 18.99, inStock: true },
  { sku: '203863', name: 'PTAC Subbase 20A', category: 'Installation', price: 89.99, inStock: true },
  { sku: '203858', name: 'Exterior Grille', category: 'Cosmetic', price: 45.00, inStock: true },
  { sku: '203859', name: 'PTAC Drain Kit', category: 'Installation', price: 32.50, inStock: true },
  { sku: '364603', name: 'Wireless Thermostat', category: 'Controls', price: 159.00, inStock: true },
  { sku: '907253', name: 'Condensate Tablets (100pk)', category: 'Chemicals', price: 34.99, inStock: true },
  { sku: '150606', name: 'Coil Cleaner', category: 'Chemicals', price: 11.99, inStock: true },
  { sku: '223532', name: 'Seasons 9000 BTU PTAC Unit', category: 'Equipment', price: 899.00, inStock: true },
  { sku: '261803', name: 'Air Filter 10x10x1', category: 'Filters', price: 6.25, inStock: true },
  { sku: 'THERM-BLK', name: 'Indoor Ambient Thermistor (Black)', category: 'Sensors', price: 45.00, inStock: true },
  { sku: 'THERM-RED', name: 'Indoor Coil Thermistor (Red)', category: 'Sensors', price: 42.00, inStock: true },
  { sku: 'THERM-YEL', name: 'Indoor Discharge Thermistor (Yellow)', category: 'Sensors', price: 44.00, inStock: true }
];

export const ESAWorkorder = ESAVerifyComponent({
  name: 'workorder',
  version: '1.0.0',
  verified: true,
  
  state: {
    activeSideTab: 'workorder',
    workorders: {},
    currentWorkorderId: 'WO-2026-001',
    workorderData: null,
    partsList: [],
    maintenanceComplete: false,
    showPartsCatalog: false,
    searchQuery: '',
    catalogResults: [],
    showNewWorkorderForm: false,
    newWorkorder: {
      location: '',
      unitModel: 'SP09EA2-20',
      serialNumber: '',
      priority: 'medium',
      diagnosticCode: ''
    },
    filterStatus: 'all',
    isLoading: false
  },
  
  methods: {
    /**
     * Initialize workorder system with sample data
     */
    init: (state) => {
      state.workorders = { ...SAMPLE_WORKORDERS };
      state.workorderData = state.workorders[state.currentWorkorderId];
      state.partsList = state.workorderData ? [...state.workorderData.partsUsed] : [];
      console.log(`%c[ESA.Workorder] Initialized with ${Object.keys(state.workorders).length} workorders`, 
        `color: ${activeTheme.green}`);
    },

    /**
     * Load a specific workorder
     */
    loadWorkorder: (state, workorderId) => {
      if (state.workorders[workorderId]) {
        state.currentWorkorderId = workorderId;
        state.workorderData = { ...state.workorders[workorderId] };
        state.partsList = [...state.workorderData.partsUsed];
        state.maintenanceComplete = state.workorderData.status === 'completed';
        console.log(`%c[ESA.Workorder] Loaded ${workorderId}`, `color: ${activeTheme.aqua}`);
      }
    },

    /**
     * Add part to current workorder
     */
    addPart: (state, part) => {
      const existingPart = state.partsList.find(p => p.part === (part.sku || part.part));
      
      if (existingPart) {
        existingPart.qty += 1;
      } else {
        state.partsList.push({
          part: part.sku || part.part,
          name: part.name,
          qty: 1,
          cost: parseFloat(part.price || 0)
        });
      }
      
      // Recalculate costs
      methods.recalculateCosts(state);
      
      console.log(`%c[ESA.Workorder] Added part: ${part.name}`, `color: ${activeTheme.green}`);
    },

    /**
     * Remove part from workorder
     */
    removePart: (state, partIndex) => {
      if (partIndex >= 0 && partIndex < state.partsList.length) {
        const removed = state.partsList.splice(partIndex, 1)[0];
        methods.recalculateCosts(state);
        console.log(`%c[ESA.Workorder] Removed part: ${removed.name}`, `color: ${activeTheme.yellow}`);
      }
    },

    /**
     * Update part quantity
     */
    updatePartQty: (state, partIndex, delta) => {
      if (partIndex >= 0 && partIndex < state.partsList.length) {
        const newQty = state.partsList[partIndex].qty + delta;
        if (newQty > 0) {
          state.partsList[partIndex].qty = newQty;
          methods.recalculateCosts(state);
        }
      }
    },

    /**
     * Recalculate workorder costs
     */
    recalculateCosts: (state) => {
      if (!state.workorderData) return;
      
      const partsCost = state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0);
      const laborCost = (state.workorderData.laborHours || 0) * (state.workorderData.laborRate || 0);
      
      state.workorderData.partsCost = partsCost;
      state.workorderData.totalCost = partsCost + laborCost;
    },

    /**
     * Search parts catalog
     */
    searchParts: (state, query) => {
      if (!query || query.length < 2) {
        state.catalogResults = [];
        return;
      }
      
      const lowerQuery = query.toLowerCase();
      state.catalogResults = PARTS_CATALOG.filter(part => 
        part.name.toLowerCase().includes(lowerQuery) ||
        part.sku.toLowerCase().includes(lowerQuery) ||
        part.category.toLowerCase().includes(lowerQuery)
      );
      
      console.log(`%c[ESA.Workorder] Found ${state.catalogResults.length} parts for "${query}"`, 
        `color: ${activeTheme.blue}`);
    },

    /**
     * Complete maintenance/workorder
     */
    completeMaintenance: async (state) => {
      if (!state.workorderData) return;
      
      const now = new Date().toISOString();
      state.maintenanceComplete = true;
      state.workorderData.status = 'completed';
      state.workorderData.dateCompleted = now;
      state.workorderData.partsUsed = [...state.partsList];
      
      // Update in workorders collection
      state.workorders[state.currentWorkorderId] = { ...state.workorderData };
      
      console.log(`%c[ESA.Workorder] ✓ Completed: ${state.currentWorkorderId}`, 
        `color: ${activeTheme.green}; font-weight: bold`);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('esa:workorder-completed', {
        detail: { 
          workorderId: state.currentWorkorderId, 
          totalCost: state.workorderData.totalCost,
          timestamp: now
        }
      }));
    },

    /**
     * Create new workorder
     */
    createWorkorder: (state) => {
      const newId = `WO-${new Date().getFullYear()}-${String(Object.keys(state.workorders).length + 1).padStart(3, '0')}`;
      
      const newWorkorder = {
        workorderId: newId,
        unitModel: state.newWorkorder.unitModel,
        serialNumber: state.newWorkorder.serialNumber || 'TBD',
        location: state.newWorkorder.location,
        technician: 'Unassigned',
        dateCreated: new Date().toISOString(),
        dateCompleted: null,
        status: 'open',
        diagnosticCode: state.newWorkorder.diagnosticCode || null,
        partsUsed: [],
        laborHours: 0,
        laborRate: 85.00,
        partsCost: 0,
        totalCost: 0,
        notes: '',
        warrantyClaim: false,
        priority: state.newWorkorder.priority
      };
      
      state.workorders[newId] = newWorkorder;
      state.showNewWorkorderForm = false;
      state.currentWorkorderId = newId;
      state.workorderData = { ...newWorkorder };
      state.partsList = [];
      
      // Reset form
      state.newWorkorder = {
        location: '',
        unitModel: 'SP09EA2-20',
        serialNumber: '',
        priority: 'medium',
        diagnosticCode: ''
      };
      
      console.log(`%c[ESA.Workorder] Created: ${newId}`, `color: ${activeTheme.aqua}`);
    },

    /**
     * Update workorder status
     */
    updateStatus: (state, newStatus) => {
      if (!state.workorderData) return;
      
      state.workorderData.status = newStatus;
      state.workorders[state.currentWorkorderId] = { ...state.workorderData };
      
      if (newStatus === 'in_progress' && !state.workorderData.technician || 
          state.workorderData.technician === 'Unassigned') {
        // Auto-assign technician prompt could go here
      }
      
      console.log(`%c[ESA.Workorder] Status: ${state.currentWorkorderId} → ${newStatus}`, 
        `color: ${activeTheme.yellow}`);
    },

    /**
     * Update labor hours
     */
    updateLaborHours: (state, hours) => {
      if (!state.workorderData) return;
      state.workorderData.laborHours = Math.max(0, parseFloat(hours) || 0);
      methods.recalculateCosts(state);
    },

    /**
     * Switch side tab
     */
    switchSideTab: (state, tab) => {
      state.activeSideTab = tab;
      console.log(`%c[ESA.Workorder] Tab: ${tab}`, `color: ${activeTheme.blue}`);
    },

    /**
     * Get filtered workorders list
     */
    getFilteredWorkorders: (state) => {
      const all = Object.values(state.workorders);
      if (state.filterStatus === 'all') return all;
      return all.filter(wo => wo.status === state.filterStatus);
    },

    /**
     * Get status color
     */
    getStatusColor: (status) => {
      const colors = {
        'open': activeTheme.orange,
        'in_progress': activeTheme.yellow,
        'completed': activeTheme.green,
        'on_hold': activeTheme.red
      };
      return colors[status] || activeTheme.fg_soft;
    },

    /**
     * Get priority color
     */
    getPriorityColor: (priority) => {
      const colors = {
        'low': activeTheme.green,
        'medium': activeTheme.yellow,
        'high': '#ff6b35',
        'emergency': activeTheme.red
      };
      return colors[priority] || activeTheme.fg_soft;
    },

    /**
     * Export workorder as JSON
     */
    exportWorkorder: (state) => {
      if (!state.workorderData) return null;
      
      const exportData = {
        ...state.workorderData,
        partsUsed: state.partsList,
        exportedAt: new Date().toISOString(),
        exportedBy: 'ESA Workorder System'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.currentWorkorderId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log(`%c[ESA.Workorder] Exported: ${state.currentWorkorderId}`, `color: ${activeTheme.aqua}`);
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-workorder-container" style="
      display: flex;
      width: 100%;
      min-height: 650px;
      background: ${activeTheme.bg0_soft || '#32302f'};
      border: 2px solid ${activeTheme.border};
      border-radius: 12px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      
      <!-- Side Navigation Tabs -->
      <div style="
        width: 240px;
        background: ${activeTheme.bg};
        border-right: 2px solid ${activeTheme.border};
        display: flex;
        flex-direction: column;
        padding: 0;
        flex-shrink: 0;
      ">
        <!-- Header -->
        <div style="
          padding: 24px 20px;
          border-bottom: 2px solid ${activeTheme.border};
          background: linear-gradient(135deg, ${activeTheme.blue}, ${activeTheme.purple});
        ">
          <div style="font-weight: bold; color: ${activeTheme.fg}; font-size: 16px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">📋</span>
            ESA WORKORDER
          </div>
          <div style="font-size: 12px; color: ${activeTheme.fg}; opacity: 0.9; margin-top: 4px;">
            ${() => state.currentWorkorderId}
          </div>
        </div>
        
        <!-- Navigation Items -->
        <div style="flex: 1; padding: 16px 0;">
          ${['workorder', 'parts', 'diagnostics', 'history'].map(tab => html`
            <button
              @click=${() => methods.switchSideTab(state, tab)}
              style="
                width: 100%;
                padding: 14px 20px;
                background: ${state.activeSideTab === tab ? '${activeTheme.bg0_soft}' : 'transparent'};
                color: ${activeTheme.fg};
                border: none;
                border-left: ${state.activeSideTab === tab ? `4px solid ${activeTheme.green}` : '4px solid transparent'};
                text-align: left;
                cursor: pointer;
                font-weight: ${state.activeSideTab === tab ? 'bold' : 'normal'};
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
              "
            >
              <span style="font-size: 18px; width: 24px; text-align: center;">
                ${tab === 'workorder' ? '📋' : tab === 'parts' ? '🔧' : tab === 'diagnostics' ? '🔍' : '📜'}
              </span>
              <span style="text-transform: capitalize;">${tab.replace('_', ' ')}</span>
            </button>
          `)}
        </div>
        
        <!-- New Workorder Button -->
        <div style="padding: 16px; border-top: 2px solid ${activeTheme.border};">
          <button
            @click=${() => state.showNewWorkorderForm = !state.showNewWorkorderForm}
            style="
              width: 100%;
              padding: 12px;
              background: ${activeTheme.green};
              color: ${activeTheme.bg};
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              font-size: 13px;
            "
          >
            <span style="font-size: 18px;">+</span> NEW WORKORDER
          </button>
        </div>
        
        <!-- Status Indicator -->
        <div style="
          padding: 16px 20px;
          border-top: 2px solid ${activeTheme.border};
          background: ${activeTheme.bg};
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: ${activeTheme.fg_soft};
          ">
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${activeTheme.green};
              box-shadow: 0 0 8px ${activeTheme.green};
            "></div>
            <span>${Object.keys(state.workorders).length} Workorders</span>
          </div>
        </div>
      </div>
      
      <!-- Main Content Area -->
      <div style="flex: 1; overflow-y: auto; background: ${activeTheme.bg0_soft};">
        
        <!-- ==================== WORKORDER TAB ==================== -->
        ${state.activeSideTab === 'workorder' ? html`
          <div style="padding: 24px; max-width: 900px;">
            
            <!-- New Workorder Form (Inline) -->
            ${state.showNewWorkorderForm ? html`
              <div style="
                background: ${activeTheme.bg};
                border: 2px solid ${activeTheme.green};
                border-radius: 10px;
                padding: 24px;
                margin-bottom: 24px;
                animation: slideDown 0.3s ease;
              ">
                <h3 style="color: ${activeTheme.green}; margin-bottom: 20px; font-size: 16px;">
                  ➕ Create New Workorder
                </h3>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                  <div>
                    <label style="display: block; font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 6px;">
                      LOCATION *
                    </label>
                    <input
                      type="text"
                      value=${() => state.newWorkorder.location}
                      @input=${(e) => state.newWorkorder.location = e.target.value}
                      placeholder="e.g., Room 304 - Building A"
                      style="
                        width: 100%;
                        background: ${activeTheme.bg0_soft};
                        border: 1px solid ${activeTheme.border};
                        color: ${activeTheme.fg};
                        padding: 10px 12px;
                        border-radius: 6px;
                        font-size: 13px;
                      "
                    />
                  </div>
                  
                  <div>
                    <label style="display: block; font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 6px;">
                      SERIAL NUMBER
                    </label>
                    <input
                      type="text"
                      value=${() => state.newWorkorder.serialNumber}
                      @input=${(e) => state.newWorkorder.serialNumber = e.target.value}
                      placeholder="e.g., YYMM080523"
                      style="
                        width: 100%;
                        background: ${activeTheme.bg0_soft};
                        border: 1px solid ${activeTheme.border};
                        color: ${activeTheme.fg};
                        padding: 10px 12px;
                        border-radius: 6px;
                        font-size: 13px;
                      "
                    />
                  </div>
                  
                  <div>
                    <label style="display: block; font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 6px;">
                      PRIORITY
                    </label>
                    <select
                      value=${() => state.newWorkorder.priority}
                      @change=${(e) => state.newWorkorder.priority = e.target.value}
                      style="
                        width: 100%;
                        background: ${activeTheme.bg0_soft};
                        border: 1px solid ${activeTheme.border};
                        color: ${activeTheme.fg};
                        padding: 10px 12px;
                        border-radius: 6px;
                        font-size: 13px;
                      "
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style="display: block; font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 6px;">
                      DIAGNOSTIC CODE
                    </label>
                    <input
                      type="text"
                      value=${() => state.newWorkorder.diagnosticCode}
                      @input=${(e) => state.newWorkorder.diagnosticCode = e.target.value.toUpperCase()}
                      placeholder="e.g., F1, C3"
                      maxlength="2"
                      style="
                        width: 100%;
                        background: ${activeTheme.bg0_soft};
                        border: 1px solid ${activeTheme.border};
                        color: ${activeTheme.fg};
                        padding: 10px 12px;
                        border-radius: 6px;
                        font-size: 13px;
                        text-transform: uppercase;
                      "
                    />
                  </div>
                </div>
                
                <div style="display: flex; gap: 12px;">
                  <button
                    @click=${() => methods.createWorkorder(state)}
                    style="
                      flex: 1;
                      padding: 12px;
                      background: ${activeTheme.green};
                      color: ${activeTheme.bg};
                      border: none;
                      border-radius: 6px;
                      cursor: pointer;
                      font-weight: bold;
                      font-size: 14px;
                    "
                  >CREATE WORKORDER</button>
                  
                  <button
                    @click=${() => state.showNewWorkorderForm = false}
                    style="
                      padding: 12px 24px;
                      background: ${activeTheme.bg0_soft};
                      color: ${activeTheme.fg};
                      border: 1px solid ${activeTheme.border};
                      border-radius: 6px;
                      cursor: pointer;
                      font-size: 14px;
                    "
                  >CANCEL</button>
                </div>
              </div>
            ` : ''}
            
            <!-- Workorder Header -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px;">
              <div>
                <h2 style="color: ${activeTheme.yellow}; margin-bottom: 8px; font-size: 22px;">
                  Workorder Details
                </h2>
                <div style="font-size: 13px; color: ${activeTheme.fg_soft};">
                  Created: ${() => state.workorderData ? new Date(state.workorderData.dateCreated).toLocaleString() : '-'}
                </div>
              </div>
              
              <div style="display: flex; gap: 10px;">
                <!-- Status Badge -->
                <div style="
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-weight: bold;
                  font-size: 12px;
                  text-transform: uppercase;
                  background: ${() => methods.getStatusColor(state.workorderData?.status)}22;
                  color: ${() => methods.getStatusColor(state.workorderData?.status)};
                  border: 1px solid ${() => methods.getStatusColor(state.workorderData?.status)};
                ">
                  ${() => (state.workorderData?.status || 'open').replace('_', ' ')}
                </div>
                
                <!-- Priority Badge -->
                <div style="
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-weight: bold;
                  font-size: 12px;
                  text-transform: uppercase;
                  background: ${() => methods.getPriorityColor(state.workorderData?.priority)}22;
                  color: ${() => methods.getPriorityColor(state.workorderData?.priority)};
                  border: 1px solid ${() => methods.getPriorityColor(state.workorderData?.priority)};
                ">
                  ${() => state.workorderData?.priority || 'medium'}
                </div>
              </div>
            </div>
            
            <!-- Unit Information -->
            <div style="
              background: ${activeTheme.bg};
              border: 1px solid ${activeTheme.border};
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <h3 style="color: ${activeTheme.aqua}; margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <span>🏢</span> UNIT INFORMATION
              </h3>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 4px;">MODEL</div>
                  <div style="font-weight: bold; color: ${activeTheme.fg}; font-size: 14px;">
                    ${() => state.workorderData?.unitModel || '-'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 4px;">SERIAL NUMBER</div>
                  <div style="font-weight: bold; color: ${activeTheme.fg}; font-size: 14px;">
                    ${() => state.workorderData?.serialNumber || '-'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 4px;">LOCATION</div>
                  <div style="font-weight: bold; color: ${activeTheme.fg}; font-size: 14px;">
                    ${() => state.workorderData?.location || '-'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 4px;">TECHNICIAN</div>
                  <div style="font-weight: bold; color: ${activeTheme.fg}; font-size: 14px;">
                    ${() => state.workorderData?.technician || 'Unassigned'}
                  </div>
                </div>
              </div>
              
              ${state.workorderData?.diagnosticCode ? html`
                <div style="
                  margin-top: 16px;
                  padding: 12px;
                  background: ${activeTheme.purple}22;
                  border: 1px solid ${activeTheme.purple};
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  gap: 12px;
                ">
                  <span style="font-size: 18px;">🔧</span>
                  <div>
                    <div style="font-size: 11px; color: ${activeTheme.fg_soft};">DIAGNOSTIC CODE</div>
                    <div style="font-weight: bold; color: ${activeTheme.purple};">${state.workorderData.diagnosticCode}</div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <!-- Parts Used Section -->
            <div style="
              background: ${activeTheme.bg};
              border: 1px solid ${activeTheme.border};
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
              ">
                <h3 style="color: ${activeTheme.aqua}; font-size: 14px; margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span>🔧</span> PARTS USED (${() => state.partsList.length})
                </h3>
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
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                  "
                >
                  <span>+</span> ADD PART
                </button>
              </div>
              
              <!-- Parts Catalog Search (Expandable) -->
              ${state.showPartsCatalog ? html`
                <div style="
                  background: ${activeTheme.bg0_soft};
                  border: 2px solid ${activeTheme.blue};
                  border-radius: 8px;
                  padding: 16px;
                  margin-bottom: 16px;
                  animation: slideDown 0.2s ease;
                ">
                  <input
                    type="text"
                    placeholder="Search parts by SKU, name, or category..."
                    value=${() => state.searchQuery}
                    @input=${(e) => {
                      state.searchQuery = e.target.value;
                      methods.searchParts(state, e.target.value);
                    }}
                    style="
                      width: 100%;
                      background: ${activeTheme.bg};
                      border: 1px solid ${activeTheme.border};
                      color: ${activeTheme.fg};
                      padding: 12px;
                      border-radius: 6px;
                      font-size: 13px;
                      margin-bottom: 12px;
                    "
                  />
                  
                  ${state.searchQuery.length >= 2 ? html`
                    <div style="max-height: 250px; overflow-y: auto;">
                      ${state.catalogResults.length > 0 ? state.catalogResults.map(part => html`
                        <div
                          @click=${() => {
                            methods.addPart(state, part);
                            state.showPartsCatalog = false;
                            state.searchQuery = '';
                            state.catalogResults = [];
                          }}
                          style="
                            background: ${activeTheme.bg};
                            border: 1px solid ${activeTheme.border};
                            border-radius: 6px;
                            padding: 12px;
                            margin-bottom: 8px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            cursor: pointer;
                            transition: all 0.15s;
                          "
                          onmouseenter=${(e) => e.currentTarget.style.borderColor = activeTheme.blue}
                          onmouseleave=${(e) => e.currentTarget.style.borderColor = activeTheme.border}
                        >
                          <div>
                            <div style="font-weight: bold; color: ${activeTheme.fg}; font-size: 13px;">
                              ${part.sku} — ${part.name}
                            </div>
                            <div style="font-size: 11px; color: ${activeTheme.fg_soft};">
                              ${part.category} • ${part.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                            </div>
                          </div>
                          <div style="font-weight: bold; color: ${activeTheme.green};">
                            $${parseFloat(part.price).toFixed(2)}
                          </div>
                        </div>
                      `) : html`
                        <div style="text-align: center; padding: 20px; color: ${activeTheme.fg_soft};">
                          No parts found for "${state.searchQuery}"
                        </div>
                      `}
                    </div>
                  ` : ''}
                </div>
              ` : ''}
              
              <!-- Parts List -->
              ${state.partsList.length === 0 ? html`
                <div style="
                  text-align: center;
                  padding: 40px;
                  color: ${activeTheme.fg_soft};
                  font-size: 13px;
                  background: ${activeTheme.bg0_soft};
                  border-radius: 8px;
                  border: 1px dashed ${activeTheme.border};
                ">
                  <div style="font-size: 36px; margin-bottom: 12px;">📦</div>
                  No parts added yet.<br/>Click "ADD PART" to add from catalog.
                </div>
              ` : html`
                <div style="display: grid; gap: 10px;">
                  ${state.partsList.map((part, index) => html`
                    <div style="
                      background: ${activeTheme.bg0_soft};
                      border: 1px solid ${activeTheme.border};
                      border-radius: 8px;
                      padding: 14px 16px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    ">
                      <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="
                          background: ${activeTheme.green};
                          color: ${activeTheme.bg};
                          min-width: 32px;
                          height: 32px;
                          border-radius: 50%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-weight: bold;
                          font-size: 14px;
                        ">
                          ${part.qty}
                        </div>
                        <div>
                          <div style="font-weight: bold; color: ${activeTheme.fg}; font-size: 13px;">
                            ${part.part}
                          </div>
                          <div style="font-size: 12px; color: ${activeTheme.fg_soft};">
                            ${part.name}
                          </div>
                        </div>
                      </div>
                      
                      <div style="display: flex; align-items: center; gap: 16px;">
                        <!-- Qty Adjusters -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <button
                            @click=${() => methods.updatePartQty(state, index, -1)}
                            style="
                              width: 28px;
                              height: 28px;
                              background: ${activeTheme.red};
                              color: ${activeTheme.fg};
                              border: none;
                              border-radius: 6px;
                              cursor: pointer;
                              font-size: 16px;
                              font-weight: bold;
                            "
                          >−</button>
                          <span style="min-width: 24px; text-align: center; font-weight: bold;">${part.qty}</span>
                          <button
                            @click=${() => methods.updatePartQty(state, index, 1)}
                            style="
                              width: 28px;
                              height: 28px;
                              background: ${activeTheme.green};
                              color: ${activeTheme.bg};
                              border: none;
                              border-radius: 6px;
                              cursor: pointer;
                              font-size: 16px;
                              font-weight: bold;
                            "
                          >+</button>
                        </div>
                        
                        <div style="color: ${activeTheme.green}; font-weight: bold; min-width: 70px; text-align: right;">
                          $${(part.cost * part.qty).toFixed(2)}
                        </div>
                        
                        <button
                          @click=${() => methods.removePart(state, index)}
                          style="
                            background: transparent;
                            color: ${activeTheme.red};
                            border: 1px solid ${activeTheme.red};
                            width: 30px;
                            height: 30px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                          "
                        >×</button>
                      </div>
                    </div>
                  `)}
                </div>
                
                <!-- Parts Total -->
                <div style="
                  margin-top: 16px;
                  padding-top: 16px;
                  border-top: 2px solid ${activeTheme.border};
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                ">
                  <span style="font-size: 14px; color: ${activeTheme.fg_soft};">Total Parts Cost</span>
                  <span style="
                    font-size: 22px;
                    font-weight: bold;
                    color: ${activeTheme.green};
                  ">
                    $${state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0).toFixed(2)}
                  </span>
                </div>
              `}
            </div>
            
            <!-- Labor & Costs Section -->
            <div style="
              background: ${activeTheme.bg};
              border: 1px solid ${activeTheme.border};
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <h3 style="color: ${activeTheme.aqua}; margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <span>💰</span> LABOR & COSTS
              </h3>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
                <div>
                  <label style="display: block; font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 6px;">
                    LABOR HOURS
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value=${() => state.workorderData?.laborHours || 0}
                    @input=${(e) => methods.updateLaborHours(state, e.target.value)}
                    style="
                      width: 100%;
                      background: ${activeTheme.bg0_soft};
                      border: 1px solid ${activeTheme.border};
                      color: ${activeTheme.fg};
                      padding: 10px 12px;
                      border-radius: 6px;
                      font-size: 14px;
                      font-weight: bold;
                    "
                  />
                </div>
                
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 6px;">
                    LABOR RATE
                  </div>
                  <div style="
                    background: ${activeTheme.bg0_soft};
                    border: 1px solid ${activeTheme.border};
                    padding: 10px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                    color: ${activeTheme.fg};
                  ">
                    $${() => (state.workorderData?.laborRate || 85.00).toFixed(2)}/hr
                  </div>
                </div>
                
                <div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 6px;">
                    LABOR COST
                  </div>
                  <div style="
                    background: ${activeTheme.yellow}22;
                    border: 1px solid ${activeTheme.yellow};
                    padding: 10px 12px;
                    border-radius: 6px;
                    font-size: 18px;
                    font-weight: bold;
                    color: ${activeTheme.yellow};
                  ">
                    $${() => ((state.workorderData?.laborHours || 0) * (state.workorderData?.laborRate || 85.00)).toFixed(2)}
                  </div>
                </div>
              </div>
              
              <!-- Total Cost Summary -->
              <div style="
                background: linear-gradient(135deg, ${activeTheme.green}22, ${activeTheme.blue}22);
                border: 2px solid ${activeTheme.green};
                border-radius: 10px;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <div>
                  <div style="font-size: 12px; color: ${activeTheme.fg_soft}; margin-bottom: 4px;">TOTAL COST</div>
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft};">
                    Parts: $${() => state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0).toFixed(2)} + 
                    Labor: $${() => ((state.workorderData?.laborHours || 0) * (state.workorderData?.laborRate || 85.00)).toFixed(2)}
                  </div>
                </div>
                <div style="
                  font-size: 32px;
                  font-weight: bold;
                  color: ${activeTheme.green};
                ">
                  $${() => (state.workorderData?.totalCost || 0).toFixed(2)}
                </div>
              </div>
            </div>
            
            <!-- Notes Section -->
            <div style="
              background: ${activeTheme.bg};
              border: 1px solid ${activeTheme.border};
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <h3 style="color: ${activeTheme.aqua}; margin-bottom: 12px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <span>📝</span> NOTES / COMMENTS
              </h3>
              <textarea
                placeholder="Add notes about this workorder..."
                rows="3"
                style="
                  width: 100%;
                  background: ${activeTheme.bg0_soft};
                  border: 1px solid ${activeTheme.border};
                  color: ${activeTheme.fg};
                  padding: 12px;
                  border-radius: 6px;
                  font-size: 13px;
                  resize: vertical;
                  font-family: inherit;
                "
              >${() => state.workorderData?.notes || ''}</textarea>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              ${!state.maintenanceComplete ? html`
                <button
                  @click=${() => methods.completeMaintenance(state)}
                  style="
                    flex: 1;
                    min-width: 200px;
                    padding: 16px;
                    background: ${activeTheme.green};
                    color: ${activeTheme.bg};
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                  "
                >
                  <span style="font-size: 20px;">✅</span> COMPLETE MAINTENANCE
                </button>
              ` : html`
                <div style="
                  flex: 1;
                  padding: 16px;
                  background: ${activeTheme.green};
                  color: ${activeTheme.bg};
                  border-radius: 10px;
                  text-align: center;
                  font-weight: bold;
                  font-size: 15px;
                ">
                  ✅ MAINTENANCE COMPLETED<br/>
                  <span style="font-size: 12px; font-weight: normal; opacity: 0.9;">
                    ${new Date(state.workorderData?.dateCompleted).toLocaleString()}
                  </span>
                </div>
              `}
              
              <button
                @click=${() => methods.exportWorkorder(state)}
                style="
                  padding: 16px 24px;
                  background: ${activeTheme.blue};
                  color: ${activeTheme.fg};
                  border: none;
                  border-radius: 10px;
                  cursor: pointer;
                  font-weight: bold;
                  font-size: 14px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                "
              >
                📥 EXPORT
              </button>
              
              ${state.workorderData?.warrantyClaim ? html`
                <div style="
                  padding: 16px 20px;
                  background: ${activeTheme.purple}22;
                  border: 2px solid ${activeTheme.purple};
                  border-radius: 10px;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  font-weight: bold;
                  color: ${activeTheme.purple};
                ">
                  🔒 WARRANTY CLAIM
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <!-- ==================== PARTS TAB ==================== -->
        ${state.activeSideTab === 'parts' ? html`
          <div style="padding: 24px;">
            <h2 style="color: ${activeTheme.yellow}; margin-bottom: 24px; font-size: 20px;">
              🔧 Parts Catalog
            </h2>
            
            <div style="
              background: ${activeTheme.bg};
              border: 1px solid ${activeTheme.border};
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 20px;
            ">
              <input
                type="text"
                placeholder="Search all available parts..."
                style="
                  width: 100%;
                  background: ${activeTheme.bg0_soft};
                  border: 1px solid ${activeTheme.border};
                  color: ${activeTheme.fg};
                  padding: 14px;
                  border-radius: 8px;
                  font-size: 14px;
                "
              />
            </div>
            
            <div style="display: grid; gap: 12px;">
              ${PARTS_CATALOG.map(part => html`
                <div style="
                  background: ${activeTheme.bg};
                  border: 1px solid ${activeTheme.border};
                  border-radius: 8px;
                  padding: 16px 20px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                ">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="
                      width: 40px;
                      height: 40px;
                      background: ${activeTheme.blue}22;
                      border-radius: 8px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 18px;
                    ">📦</div>
                    <div>
                      <div style="font-weight: bold; color: ${activeTheme.fg};">${part.sku}</div>
                      <div style="color: ${activeTheme.fg}; font-size: 14px;">${part.name}</div>
                      <div style="font-size: 11px; color: ${activeTheme.fg_soft};">${part.category}</div>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="text-align: right;">
                      <div style="font-weight: bold; color: ${activeTheme.green}; font-size: 16px;">
                        $${parseFloat(part.price).toFixed(2)}
                      </div>
                      <div style="font-size: 11px; color: ${part.inStock ? activeTheme.green : activeTheme.red};">
                        ${part.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                      </div>
                    </div>
                    
                    <button
                      @click=${() => methods.addPart(state, part)}
                      style="
                        background: ${activeTheme.green};
                        color: ${activeTheme.bg};
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 13px;
                      "
                    >ADD TO WO</button>
                  </div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}
        
        <!-- ==================== DIAGNOSTICS TAB ==================== -->
        ${state.activeSideTab === 'diagnostics' ? html`
          <div style="padding: 24px;">
            <h2 style="color: ${activeTheme.yellow}; margin-bottom: 24px; font-size: 20px;">
              🔍 Diagnostics Reference
            </h2>
            
            <div style="
              background: ${activeTheme.bg};
              border: 1px solid ${activeTheme.border};
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <h3 style="color: ${activeTheme.aqua}; margin-bottom: 16px; font-size: 14px;">
                Current Diagnostic Code
              </h3>
              
              ${state.workorderData?.diagnosticCode ? html`
                <div style="
                  background: ${activeTheme.purple}22;
                  border: 2px solid ${activeTheme.purple};
                  border-radius: 10px;
                  padding: 24px;
                  text-align: center;
                ">
                  <div style="font-size: 48px; font-weight: bold; color: ${activeTheme.purple};">
                    ${state.workorderData.diagnosticCode}
                  </div>
                  <div style="margin-top: 8px; color: ${activeTheme.fg_soft};">
                    Code assigned to this workorder
                  </div>
                </div>
              ` : html`
                <div style="
                  text-align: center;
                  padding: 40px;
                  color: ${activeTheme.fg_soft};
                  border: 2px dashed ${activeTheme.border};
                  border-radius: 10px;
                ">
                  No diagnostic code assigned yet.
                </div>
              `}
            </div>
            
            <div style="
              background: ${activeTheme.bg};
              border: 1px solid ${activeTheme.border};
              border-radius: 8px;
              padding: 20px;
            ">
              <h3 style="color: ${activeTheme.aqua}; margin-bottom: 16px; font-size: 14px;">
                Common Diagnostic Codes
              </h3>
              
              <div style="display: grid; gap: 8px;">
                ${[
                  { code: 'F1', desc: 'Indoor Ambient Thermistor Fault', severity: 'critical' },
                  { code: 'F4', desc: 'Indoor Coil Thermistor Fault', severity: 'critical' },
                  { code: 'F5', desc: 'Wireless Thermostat Failure', severity: 'critical' },
                  { code: 'C1', desc: 'Indoor Coil Freezing', severity: 'critical' },
                  { code: 'C3', desc: 'Indoor Coil Freezing (Severe)', severity: 'critical' },
                  { code: 'L6', desc: 'Discharge Air Too Hot', severity: 'warning' },
                  { code: 'LC', desc: 'Outdoor Coil Thermistor High', severity: 'warning' },
                  { code: 'FP', desc: 'Freeze Protection Engaged', severity: 'info' }
                ].map(item => html`
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: ${activeTheme.bg0_soft};
                    border-radius: 6px;
                    border-left: 4px solid ${
                      item.severity === 'critical' ? activeTheme.red :
                      item.severity === 'warning' ? activeTheme.yellow : activeTheme.blue
                    };
                  ">
                    <div style="
                      font-weight: bold;
                      font-size: 16px;
                      color: ${
                        item.severity === 'critical' ? activeTheme.red :
                        item.severity === 'warning' ? activeTheme.yellow : activeTheme.blue
                      };
                      min-width: 40px;
                    ">${item.code}</div>
                    <div style="flex: 1; color: ${activeTheme.fg}; font-size: 13px;">${item.desc}</div>
                  </div>
                `)}
              </div>
            </div>
          </div>
        ` : ''}
        
        <!-- ==================== HISTORY TAB ==================== -->
        ${state.activeSideTab === 'history' ? html`
          <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
              <h2 style="color: ${activeTheme.yellow}; font-size: 20px; margin: 0;">
                📜 Workorder History
              </h2>
              
              <select
                value=${() => state.filterStatus}
                @change=${(e) => state.filterStatus = e.target.value}
                style="
                  background: ${activeTheme.bg};
                  border: 1px solid ${activeTheme.border};
                  color: ${activeTheme.fg};
                  padding: 10px 16px;
                  border-radius: 6px;
                  font-size: 13px;
                  cursor: pointer;
                "
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            
            <div style="display: grid; gap: 12px;">
              ${Object.values(state.workorders)
                .filter(wo => state.filterStatus === 'all' || wo.status === state.filterStatus)
                .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
                .map(wo => html`
                  <div
                    @click=${() => methods.loadWorkorder(state, wo.workorderId)}
                    style="
                      background: ${activeTheme.bg};
                      border: 2px solid ${wo.workorderId === state.currentWorkorderId ? activeTheme.green : activeTheme.border};
                      border-radius: 10px;
                      padding: 20px;
                      cursor: pointer;
                      transition: all 0.2s;
                    "
                    onmouseenter=${(e) => e.currentTarget.style.borderColor = activeTheme.blue}
                    onmouseleave=${(e) => {
                      if (wo.workorderId !== state.currentWorkorderId) {
                        e.currentTarget.style.borderColor = activeTheme.border;
                      }
                    }}
                  >
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                      <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                          <span style="font-weight: bold; font-size: 16px; color: ${activeTheme.fg};">
                            ${wo.workorderId}
                          </span>
                          <span style="
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: bold;
                            text-transform: uppercase;
                            background: ${methods.getStatusColor(wo.status)}22;
                            color: ${methods.getStatusColor(wo.status)};
                          ">${wo.status.replace('_', ' ')}</span>
                          <span style="
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 10px;
                            font-weight: bold;
                            text-transform: uppercase;
                            background: ${methods.getPriorityColor(wo.priority)}22;
                            color: ${methods.getPriorityColor(wo.priority)};
                          ">${wo.priority}</span>
                        </div>
                        
                        <div style="display: flex; gap: 24px; font-size: 13px; color: ${activeTheme.fg_soft};">
                          <span>📍 ${wo.location}</span>
                          <span>🔧 ${wo.unitModel}</span>
                          <span>👤 ${wo.technician}</span>
                        </div>
                        
                        ${wo.notes ? html`
                          <div style="
                            margin-top: 8px;
                            font-size: 12px;
                            color: ${activeTheme.fg};
                            padding: 8px 12px;
                            background: ${activeTheme.bg0_soft};
                            border-radius: 6px;
                          ">${wo.notes.substring(0, 100)}${wo.notes.length > 100 ? '...' : ''}</div>
                        ` : ''}
                      </div>
                      
                      <div style="text-align: right; margin-left: 20px;">
                        <div style="font-size: 20px; font-weight: bold; color: ${activeTheme.green};">
                          $${wo.totalCost.toFixed(2)}
                        </div>
                        <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-top: 4px;">
                          ${new Date(wo.dateCreated).toLocaleDateString()}
                        </div>
                        ${wo.dateCompleted ? html`
                          <div style="font-size: 11px; color: ${activeTheme.green}; margin-top: 2px;">
                            ✅ Completed ${new Date(wo.dateCompleted).toLocaleDateString()}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `)}
            </div>
            
            ${Object.values(state.workorders).filter(wo => state.filterStatus === 'all' || wo.status === state.filterStatus).length === 0 ? html`
              <div style="
                text-align: center;
                padding: 60px;
                color: ${activeTheme.fg_soft};
              ">
                <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                <div style="font-size: 16px;">No workorders found</div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
      </div>
    </div>
    
    <style>
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>
  `
}).component;

// Initialize on import
if (typeof window !== 'undefined') {
  // Will be initialized by integration.js
}

export default ESAWorkorder;
