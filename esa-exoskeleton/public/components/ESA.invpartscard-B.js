/**
 * ESA.invpartscard-B.js (Arrow.js Compatible - HARDCODED STYLES)
 * ============================================
 * BROADCAST SERVICE PARTS CARD
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
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
      
      window.dispatchEvent(new CustomEvent('esa:broadcast-toggle', {
        detail: { open: state.isBroadcastOpen, component: 'InvPartsCard-B' }
      }));
    },
    
    switchTab: (state, tab) => {
      state.activeTab = tab;
    },
    
    orderPart: (state, part) => {
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
      <div style="background: #32302f; border: 2px solid #3c3836; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #458588, #b16286); color: #ebdbb2; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 32px;">📦</span>
            <div>
              <div style="font-size: 18px; font-weight: bold;">Seasons 9000 BTU PTAC</div>
              <div style="font-size: 12px; opacity: 0.9;">Part #223532 | HD Supply #223532</div>
            </div>
          </div>
          
          <button
            id="esa-broadcast-btn"
            style="background: #282828; color: #ebdbb2; border: 2px solid #3c3836; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px;"
          >
            <span style="font-size: 20px;">📡</span>
            <span>BROADCAST</span>
          </button>
        </div>
        
        <!-- Specs Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 24px; background: #282828;">
          <div style="background: #32302f; padding: 16px; border-radius: 8px; border: 1px solid #3c3836;">
            <div style="font-size: 11px; color: #a89984;">BTU Cooling</div>
            <div style="font-size: 20px; font-weight: bold; color: #98971a;">9,000</div>
          </div>
          <div style="background: #32302f; padding: 16px; border-radius: 8px; border: 1px solid #3c3836;">
            <div style="font-size: 11px; color: #a89984;">Voltage</div>
            <div style="font-size: 20px; font-weight: bold; color: #d79921;">230/208V</div>
          </div>
          <div style="background: #32302f; padding: 16px; border-radius: 8px; border: 1px solid #3c3836;">
            <div style="font-size: 11px; color: #a89984;">Refrigerant</div>
            <div style="font-size: 20px; font-weight: bold; color: #689d6a;">R-32</div>
          </div>
        </div>
        
        <!-- Tab Navigation -->
        <div style="display: flex; border-bottom: 2px solid #3c3836; background: #32302f;">
          <button id="esa-tab-parts" class="esa-tab-btn" data-tab="parts" style="flex: 1; padding: 16px; background: #32302f; color: #ebdbb2; border: none; border-bottom: 3px solid #98971a; cursor: pointer; font-weight: bold;">📦 Parts</button>
          <button id="ea-tab-manuals" class="esa-tab-btn" data-tab="manuals" style="flex: 1; padding: 16px; background: transparent; color: #ebdbb2; border: none; border-bottom: none; cursor: pointer; font-weight: normal;">📚 Manuals</button>
          <button id="esa-tab-features" class="esa-tab-btn" data-tab="features" style="flex: 1; padding: 16px; background: transparent; color: #ebdbb2; border: none; border-bottom: none; cursor: pointer; font-weight: normal;">⚙️ Features</button>
        </div>
        
        <!-- Tab Content -->
        <div id="esa-parts-tab-content" style="padding: 24px; min-height: 300px;">
          <h3 style="color: #d79921; margin-bottom: 16px;">Related Parts</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${PTAC_PARTS['SP09EA2-20'].relatedParts.map(part => html`
              <div style="background: #32302f; border: 1px solid #3c3836; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: bold;">Part ${part.part}</div>
                  <div style="font-size: 12px; color: #a89984;">${part.name}</div>
                  <div style="font-size: 10px; color: #928374;">${part.category}</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: #98971a; font-weight: bold;">${part.price}</div>
                  <button
                    class="esa-order-btn"
                    data-part="${part.part}"
                    style="margin-top: 8px; background: #458588; color: #ebdbb2; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;"
                  >ORDER</button>
                </div>
              </div>
            `)}
          </div>
          
          <!-- Inventory Summary -->
          <div style="margin-top: 24px; padding: 16px; background: #282828; border: 1px solid #3c3836; border-radius: 8px;">
            <div style="font-weight: bold; margin-bottom: 12px; color: #689d6a;">INVENTORY STATUS</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center;">
              <div>
                <div style="font-size: 20px; font-weight: bold; color: #98971a;">${state.inventoryQty.warranty}</div>
                <div style="font-size: 10px; color: #a89984;">Warranty Qty</div>
              </div>
              <div>
                <div style="font-size: 20px; font-weight: bold; color: #d79921;">${state.inventoryQty.processing}</div>
                <div style="font-size: 10px; color: #a89984;">Processing</div>
              </div>
              <div>
                <div style="font-size: 20px; font-weight: bold; color: #cc241d;">${state.inventoryQty.recycle}</div>
                <div style="font-size: 10px; color: #a89984;">Recycle</div>
              </div>
              <div>
                <div style="font-size: 20px; font-weight: bold; color: #b16286;">${() => methods.getInventoryTotal(state)}</div>
                <div style="font-size: 10px; color: #a89984;">Total Units</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sliding Broadcast Panel -->
      ${() => state.isBroadcastOpen ? html`
        <div style="position: fixed; top: 0; right: 0; width: 600px; height: 100vh; background: #32302f; border-left: 3px solid #b16286; box-shadow: -8px 0 40px rgba(0,0,0,0.5); z-index: 1000; overflow-y: auto;">
          <div style="background: linear-gradient(135deg, #b16286, #458588); color: #ebdbb2; padding: 24px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 28px;">📡</span>
              <div>
                <div style="font-weight: bold; font-size: 18px;">SERVICE BROADCAST</div>
                <div style="font-size: 11px;">Live HD Supply Integration</div>
              </div>
            </div>
            <button id="esa-close-broadcast" style="background: #282828; color: #ebdbb2; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
          </div>
          
          <div style="padding: 24px;">
            <div style="margin-top: 24px; padding: 16px; background: #264244; border-radius: 8px; border-left: 4px solid #458588;">
              <div style="font-size: 12px; color: #a89984;">HD SUPPLY PRODUCT PAGE</div>
              <a href="${PTAC_PARTS['SP09EA2-20'].hdSupplyUrl}" target="_blank" style="display: block; margin-top: 8px; font-size: 14px; font-weight: bold; color: #689d6a; text-decoration: none;">
                View Seasons 9000 BTU PTAC →
              </a>
            </div>
            
            <div style="margin-top: 24px; padding: 16px; background: #423b2f; border-radius: 8px; border-left: 4px solid #98971a;">
              <div style="font-size: 12px; color: #a89984;">TECH SUPPORT</div>
              <div style="font-size: 18px; font-weight: bold; color: #689d6a;">877-376-0214</div>
            </div>
          </div>
        </div>
        
        <div id="esa-broadcast-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 999;"></div>
      ` : ''}
    </div>
  `
});

// Setup event listeners after mount
const origPartsMount = ESAInvPartsCardB.mount;
ESAInvPartsCardB.mount = function(container) {
  const result = origPartsMount.call(this, container);
  
  setTimeout(() => {
    // Broadcast toggle
    const broadcastBtn = container.querySelector('#esa-broadcast-btn');
    if (broadcastBtn) {
      broadcastBtn.addEventListener('click', () => {
        methods.toggleBroadcast(this.state);
      });
    }
    
    // Close broadcast
    const closeBtn = container.querySelector('#esa-close-broadcast');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.state.isBroadcastOpen = false;
      });
    }
    
    // Overlay click
    const overlay = container.querySelector('#esa-broadcast-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.state.isBroadcastOpen = false;
      });
    }
    
    // Tab switching
    container.querySelectorAll('.esa-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.state.activeTab = tab;
        
        // Update button styles
        container.querySelectorAll('.esa-tab-btn').forEach(b => {
          b.style.background = 'transparent';
          b.style.borderBottom = 'none';
          b.style.fontWeight = 'normal';
        });
        e.target.style.background = '#32302f';
        e.target.style.borderBottom = '3px solid #98971a';
        e.target.style.fontWeight = 'bold';
      });
    });
    
    // Order buttons
    container.querySelectorAll('.esa-order-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const partNum = e.target.dataset.part;
        const part = PTAC_PARTS['SP09EA2-20'].relatedParts.find(p => p.part === partNum);
        if (part) methods.orderPart(this.state, part);
      });
    });
    
  }, 100);
  
  return result;
};

export default ESAInvPartsCardB;
