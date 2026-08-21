/**
 * ESA.invpartscard-B.js
 * ============================================
 * BROADCAST SERVICE PARTS CARD
 * ============================================
 * 
 * Features:
 * - HD Supply PTAC integration (Part #223532)
 * - Sliding broadcast panel (B-side)
 * - Tab navigation: Parts / Manuals / Features
 * - Related parts catalog
 * - Broadcast feature toggles
 * 
 * Connections:
 * → ESA.Ptac-B (HD Supply specific)
 * → ESA.workorder (parts ordering)
 * → ESA.duckDB (catalog lookup)
 * → GSAP Transport (inventory events)
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// HD Supply PTAC Parts Database
const PTAC_PARTS = {
  'SP09EA2-20': {
    brand: 'Seasons',
    model: '9000 BTU PTAC',
    partNumber: '223532',
    hdSupplyUrl: 'https://hdsupplysolutions.com/p/seasons-9000-btu-230-208-v-20-amp-electric-heat-cool-ptac-p223532#',
    specs: {
      btuCooling: 9000,
      btuHeating: 10900,
      voltage: '230/208V',
      amperage: '20A',
      refrigerant: 'R-32',
      eer: '9.4'
    },
    relatedParts: [
      { part: '203863', name: 'PTAC Subbase 20A', price: 'Sign in', category: 'Accessories' },
      { part: '203859', name: 'PTAC Drain Kit', price: 'Sign in', category: 'Installation' },
      { part: '364603', name: 'Wireless Thermostat', price: '$159.00', category: 'Controls' },
      { part: '203862', name: 'Double Packed Filter (2-pack)', price: '$24.99', category: 'Filters' },
      { part: '907253', name: 'Condensate Tablets (100ct)', price: '$34.99', category: 'Maintenance' }
    ],
    repairParts: [
      { part: 'THERM-001', name: 'Indoor Ambient Thermistor', price: '$45.00', warranty: true },
      { part: 'THERM-002', name: 'Outdoor Thermistor', price: '$42.00', warranty: true },
      { part: 'COIL-SENSOR', name: 'Coil Temperature Sensor', price: '$38.00', warranty: true }
    ],
    manuals: [
      { name: 'User Manual', url: '#', type: 'pdf', pages: 24 },
      { name: 'Installation Guide', url: '#', type: 'pdf', pages: 18 },
      { name: 'Warranty Information', url: '#', type: 'pdf', pages: 6 },
      { name: 'Parts Catalog', url: '#', type: 'pdf', pages: 12 }
    ]
  }
};

// Broadcast Features Configuration
const BROADCAST_FEATURES = {
  diagnostics: { name: 'AI Diagnostics', icon: '🔧', enabled: true, description: 'Real-time PTAC code analysis' },
  partsLookup: { name: 'Parts Database', icon: '📦', enabled: true, description: 'HD Supply catalog integration' },
  warrantyCheck: { name: 'Warranty Status', icon: '🛡️', enabled: true, description: 'Warranty verification system' },
  liveSupport: { name: 'Tech Support', icon: '📞', enabled: false, description: 'Connect to technician' },
  ordering: { name: 'Quick Order', icon: '🛒', enabled: true, description: 'One-click parts ordering' }
};

export const ESAInvPartsCardB = ESAVerifyComponent({
  name: 'invpartscard-B',
  version: '1.0.0',
  verified: true,
  
  state: {
    isBroadcastOpen: false,
    productModel: 'SP09EA2-20',
    activeTab: 'parts',
    selectedFeatures: ['diagnostics', 'partsLookup', 'warrantyCheck', 'ordering'],
    searchQuery: '',
    inventoryQty: {
      warranty: 2,
      processing: 5,
      recycle: 1,
      total: 8
    }
  },
  
  methods: {
    toggleBroadcast: (state) => {
      state.isBroadcastOpen = !state.isBroadcastOpen;
      
      // Dispatch broadcast event
      window.dispatchEvent(new CustomEvent('esa:broadcast-toggle', {
        detail: { open: state.isBroadcastOpen, component: 'InvPartsCard-B' }
      }));
    },
    
    toggleFeature: (state, featureKey) => {
      const index = state.selectedFeatures.indexOf(featureKey);
      if (index > -1) {
        state.selectedFeatures.splice(index, 1);
        BROADCAST_FEATURES[featureKey].enabled = false;
      } else {
        state.selectedFeatures.push(featureKey);
        BROADCAST_FEATURES[featureKey].enabled = true;
      }
    },
    
    switchTab: (state, tab) => {
      state.activeTab = tab;
    },
    
    orderPart: (state, part) => {
      console.log(`%c[ESA.InvPartsCard] Ordering part: ${part.part} - ${part.name}`, `color: ${activeTheme.green}`);
      
      window.dispatchEvent(new CustomEvent('esa:order-part', {
        detail: { part, source: 'InvPartsCard-B' }
      }));
    },
    
    getInventoryTotal: (state) => {
      return state.inventoryQty.warranty + 
             state.inventoryQty.processing + 
             state.inventoryQty.recycle;
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-invpartscard-b" style="position: relative; width: 100%; max-width: 900px; margin: 20px auto;">
      <div style="
        background: ${activeTheme.bg_soft};
        border: 2px solid ${activeTheme.border};
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 12px 40px ${activeTheme.shadow};
      ">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, ${activeTheme.blue}, ${activeTheme.purple});
          color: ${activeTheme.fg};
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 32px;">📦</span>
            <div>
              <div style="font-size: 18px; font-weight: bold;">
                ${(() => {
                  const product = PTAC_PARTS[state.productModel];
                  return `${product.brand} ${product.model}`;
                })()}
              </div>
              <div style="font-size: 12px; opacity: 0.9;">
                Part #${() => PTAC_PARTS[state.productModel].partNumber} | 
                HD Supply #223532
              </div>
            </div>
          </div>
          
          <!-- Broadcast Toggle Button -->
          <button
            @click=${() => methods.toggleBroadcast(state)}
            style="
              background: ${activeTheme.bg};
              color: ${activeTheme.fg};
              border: 2px solid ${activeTheme.border};
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;
            "
            onmouseenter=${(e) => e.target.style.background = activeTheme.bg_selection}
            onmouseleave=${(e) => e.target.style.background = activeTheme.bg}
          >
            <span style="font-size: 20px;">📡</span>
            <span>BROADCAST</span>
          </button>
        </div>
        
        <!-- Specs Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 24px; background: ${activeTheme.bg};">
          ${(() => {
            const product = PTAC_PARTS[state.productModel];
            return html`
              <div style="background: ${activeTheme.bg_soft}; padding: 16px; border-radius: 8px; border: 1px solid ${activeTheme.border};">
                <div style="font-size: 11px; color: ${activeTheme.fg_soft};">BTU Cooling</div>
                <div style="font-size: 20px; font-weight: bold; color: ${activeTheme.green};">${product.specs.btuCooling.toLocaleString()}</div>
              </div>
              <div style="background: ${activeTheme.bg_soft}; padding: 16px; border-radius: 8px; border: 1px solid ${activeTheme.border};">
                <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Voltage</div>
                <div style="font-size: 20px; font-weight: bold; color: ${activeTheme.yellow};">${product.specs.voltage}</div>
              </div>
              <div style="background: ${activeTheme.bg_soft}; padding: 16px; border-radius: 8px; border: 1px solid ${activeTheme.border};">
                <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Refrigerant</div>
                <div style="font-size: 20px; font-weight: bold; color: ${activeTheme.aqua};">${product.specs.refrigerant}</div>
              </div>
            `;
          })()}
        </div>
        
        <!-- Tab Navigation -->
        <div style="display: flex; border-bottom: 2px solid ${activeTheme.border}; background: ${activeTheme.bg_soft};">
          ${['parts', 'manuals', 'features'].map(tab => html`
            <button
              @click=${() => methods.switchTab(state, tab)}
              style="
                flex: 1;
                padding: 16px;
                background: ${state.activeTab === tab ? activeTheme.bg : 'transparent'};
                color: ${activeTheme.fg};
                border: none;
                border-bottom: ${state.activeTab === tab ? `3px solid ${activeTheme.green}` : 'none'};
                cursor: pointer;
                font-weight: ${state.activeTab === tab ? 'bold' : 'normal'};
                transition: all 0.2s;
              "
            >
              ${tab === 'parts' ? '📦 Parts' : tab === 'manuals' ? '📚 Manuals' : '⚙️ Features'}
            </button>
          `)}
        </div>
        
        <!-- Tab Content -->
        <div style="padding: 24px; min-height: 300px;">
          ${state.activeTab === 'parts' ? html`
            <div>
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 16px;">Related Parts</h3>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                ${(() => PTAC_PARTS[state.productModel].relatedParts.map(part => html`
                  <div style="
                    background: ${activeTheme.bg_soft};
                    border: 1px solid ${activeTheme.border};
                    border-radius: 8px;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <div>
                      <div style="font-weight: bold;">Part ${part.part}</div>
                      <div style="font-size: 12px; color: ${activeTheme.fg_soft};">${part.name}</div>
                      <div style="font-size: 10px; color: ${activeTheme.gray};">${part.category}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="color: ${activeTheme.green}; font-weight: bold;">${part.price}</div>
                      <button
                        @click=${() => methods.orderPart(state, part)}
                        style="
                          margin-top: 8px;
                          background: ${activeTheme.blue};
                          color: ${activeTheme.fg};
                          border: none;
                          padding: 4px 12px;
                          border-radius: 4px;
                          cursor: pointer;
                          font-size: 11px;
                        "
                      >ORDER</button>
                    </div>
                  </div>
                `))()}
              </div>
              
              <!-- Inventory Summary -->
              <div style="
                margin-top: 24px;
                padding: 16px;
                background: ${activeTheme.bg};
                border: 1px solid ${activeTheme.border};
                border-radius: 8px;
              ">
                <div style="font-weight: bold; margin-bottom: 12px; color: ${activeTheme.aqua};">INVENTORY STATUS</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center;">
                  <div>
                    <div style="font-size: 20px; font-weight: bold; color: ${activeTheme.green};">${state.inventoryQty.warranty}</div>
                    <div style="font-size: 10px; color: ${activeTheme.fg_soft};">Warranty Qty</div>
                  </div>
                  <div>
                    <div style="font-size: 20px; font-weight: bold; color: ${activeTheme.yellow};">${state.inventoryQty.processing}</div>
                    <div style="font-size: 10px; color: ${activeTheme.fg_soft};">Processing</div>
                  </div>
                  <div>
                    <div style="font-size: 20px; font-weight: bold; color: ${activeTheme.red};">${state.inventoryQty.recycle}</div>
                    <div style="font-size: 10px; color: ${activeTheme.fg_soft};">Recycle</div>
                  </div>
                  <div>
                    <div style="font-size: 20px; font-weight: bold; color: ${activeTheme.purple};">${() => methods.getInventoryTotal(state)}</div>
                    <div style="font-size: 10px; color: ${activeTheme.fg_soft};">Total Units</div>
                  </div>
                </div>
              </div>
            </div>
          ` : state.activeTab === 'features' ? html`
            <div>
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 16px;">Broadcast Features</h3>
              <div style="display: grid; gap: 12px;">
                ${Object.entries(BROADCAST_FEATURES).map(([key, feature]) => html`
                  <div style="
                    background: ${activeTheme.bg_soft};
                    border: 2px solid ${feature.enabled ? activeTheme.green : activeTheme.border};
                    border-radius: 8px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                  ">
                    <label style="position: relative; width: 24px; height: 24px; cursor: pointer;">
                      <input
                        type="checkbox"
                        checked=${feature.enabled}
                        @change=${() => methods.toggleFeature(state, key)}
                        style="position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;"
                      />
                      <div style="
                        width: 24px; height: 24px;
                        background: ${feature.enabled ? activeTheme.green : activeTheme.bg};
                        border: 2px solid ${feature.enabled ? activeTheme.green : activeTheme.fg_soft};
                        border-radius: 4px;
                        display: flex; align-items: center; justify-content: center;
                      ">
                        ${feature.enabled ? html`<span style="color: ${activeTheme.bg};">✓</span>` : ''}
                      </div>
                    </label>
                    <span style="font-size: 24px;">${feature.icon}</span>
                    <div style="flex: 1;">
                      <div style="font-weight: bold;">${feature.name}</div>
                      <div style="font-size: 11px; color: ${activeTheme.fg_soft};">${feature.description}</div>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
            <div>
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 16px;">Manuals & Documentation</h3>
              <div style="display: grid; gap: 12px;">
                ${PTAC_PARTS[state.productModel].manuals.map(manual => html`
                  <div style="
                    background: ${activeTheme.bg_soft};
                    border: 1px solid ${activeTheme.border};
                    border-radius: 8px;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <span style="font-size: 24px;">📄</span>
                      <div>
                        <div style="font-weight: bold;">${manual.name}</div>
                        <div style="font-size: 11px; color: ${activeTheme.fg_soft};">${manual.type.toUpperCase()} • ${manual.pages} pages</div>
                      </div>
                    </div>
                    <button style="
                      background: ${activeTheme.blue};
                      color: ${activeTheme.fg};
                      border: none;
                      padding: 8px 16px;
                      border-radius: 6px;
                      cursor: pointer;
                    ">DOWNLOAD</button>
                  </div>
                `)}
              </div>
            </div>
          `}
        </div>
      </div>
      
      <!-- Sliding Broadcast Panel -->
      <div style="
        position: fixed;
        top: 0;
        right: ${() => state.isBroadcastOpen ? '0' : '-600px'};
        width: 600px;
        height: 100vh;
        background: ${activeTheme.bg_soft};
        border-left: 3px solid ${activeTheme.purple};
        box-shadow: -8px 0 40px rgba(0,0,0,0.5);
        transition: right 0.4s ease;
        z-index: 1000;
        overflow-y: auto;
      ">
        <!-- Panel Header -->
        <div style="
          background: linear-gradient(135deg, ${activeTheme.purple}, ${activeTheme.blue});
          color: ${activeTheme.fg};
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 28px;">📡</span>
            <div>
              <div style="font-weight: bold; font-size: 18px;">SERVICE BROADCAST</div>
              <div style="font-size: 11px;">Live HD Supply Integration</div>
            </div>
          </div>
          <button
            @click=${() => methods.toggleBroadcast(state)}
            style="
              background: ${activeTheme.bg};
              color: ${activeTheme.fg};
              border: none;
              width: 40px; height: 40px;
              border-radius: 50%;
              cursor: pointer;
              font-size: 20px;
            "
          >
            ×
          </button>
        </div>
        
        <!-- Panel Content -->
        <div style="padding: 24px;">
          <!-- HD Supply Link -->
          <div style="
            margin-top: 24px;
            padding: 16px;
            background: ${activeTheme.bg_blue};
            border-radius: 8px;
            border-left: 4px solid ${activeTheme.blue};
          ">
            <div style="font-size: 12px; color: ${activeTheme.fg_soft};">HD SUPPLY PRODUCT PAGE</div>
            <a 
              href="${PTAC_PARTS[state.productModel].hdSupplyUrl}" 
              target="_blank"
              style="
                display: block;
                margin-top: 8px;
                font-size: 14px;
                font-weight: bold;
                color: ${activeTheme.aqua};
                text-decoration: none;
              "
            >
              View Seasons 9000 BTU PTAC →
            </a>
          </div>
          
          <!-- Tech Support -->
          <div style="
            margin-top: 24px;
            padding: 16px;
            background: ${activeTheme.bg_green};
            border-radius: 8px;
            border-left: 4px solid ${activeTheme.green};
          ">
            <div style="font-size: 12px; color: ${activeTheme.fg_soft};">TECH SUPPORT</div>
            <div style="font-size: 18px; font-weight: bold; color: ${activeTheme.aqua};">877-376-0214</div>
          </div>
          
          <!-- Quick Actions -->
          <div style="margin-top: 24px;">
            <div style="font-weight: bold; margin-bottom: 12px;">QUICK ACTIONS</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <button style="
                padding: 16px;
                background: ${activeTheme.blue};
                color: ${activeTheme.fg};
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
              ">Create Workorder</button>
              <button style="
                padding: 16px;
                background: ${activeTheme.green};
                color: ${activeTheme.bg};
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
              ">Check Warranty</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Overlay -->
      ${state.isBroadcastOpen ? html`
        <div
          @click=${() => methods.toggleBroadcast(state)}
          style="
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 999;
          "
        ></div>
      ` : ''}
    </div>
  `
}).component;

export default ESAInvPartsCardB;
