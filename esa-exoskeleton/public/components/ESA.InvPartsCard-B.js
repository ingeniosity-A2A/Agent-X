/**
 * ESA.InvPartsCard-B.js
 * Broadcast Service Parts Card - Version B
 * 
 * RENAMED FROM: ESA.PartsCard → ESA.InvParts (Inventory Parts)
 * 
 * Features:
 * - Part quantity display (Warranty, Processing, Recycle)
 * - Scanning + verbal inventory with Ava007
 * - Lens integration with Ingestion
 * - Renders from Console (not own page)
 * - Longer/taller card layout
 * - HD Supply parts catalog integration
 * - Audio broadcast capabilities
 * 
 * NO PRIORITY SECTION (removed per spec)
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// PTAC Parts Database with Inventory Quantities
const PTAC_PARTS_INVENTORY = {
  'SP09EA2-20': {
    brand: 'Seasons',
    model: '9000 BTU PTAC',
    partNumber: '223532',
    serial: 'YYMMxxxxxx',
    
    // Warranty Info
    warranty: {
      total: 1,        // years
      refrigeration: 5 // years
    },
    
    // Specs
    specs: {
      btuCooling: 9000,
      btuHeating: 10900,
      voltage: '230/208V',
      amperage: '20A',
      refrigerant: 'R-32',
      eer: 12.8
    },
    
    // INVENTORY QUANTITIES (NEW - replaces priority section)
    inventory: {
      warranty: 2,      // Under warranty units
      processing: 1,    // Being processed/repaired
      recycle: 0,       // Ready for recycling
      total: 3          // Auto-calculated
    },
    
    // Related parts from HD Supply
    relatedParts: [
      { part: '203863', name: 'PTAC Subbase 20A', price: 'Sign in', category: 'Installation' },
      { part: '203859', name: 'PTAC Drain Kit', price: 'Sign in', category: 'Installation' },
      { part: '203858', name: 'Exterior Grille', price: 'Sign in', category: 'Cosmetic' },
      { part: '364603', name: 'Wireless Thermostat', price: '$159.00', category: 'Controls' }
    ],
    
    // Repair/Maintenance parts
    repairParts: [
      { part: '203862', name: 'Double Packed Filter', price: 'Sign in', category: 'Filters' },
      { part: '907253', name: 'Condensate Tablets (100pk)', price: '$34.99', category: 'Maintenance' },
      { part: '150606', name: 'Coil Cleaner', price: '$11.99', category: 'Chemicals' }
    ],
    
    // Manuals & Documentation
    manuals: [
      { name: 'User Manual', url: '#', type: 'pdf' },
      { name: 'Warranty Info', url: '#', type: 'pdf' },
      { name: 'Exploded View Diagram', url: '#', type: 'diagram' },
      { name: 'Specifications Sheet', url: '#', type: 'pdf' }
    ]
  }
};

// Broadcast Service Features
const BROADCAST_FEATURES = {
  diagnostics: {
    name: 'AI Diagnostics',
    icon: '🔍',
    description: 'Voice-enabled diagnostic scanning with Ava007',
    enabled: true
  },
  partsLookup: {
    name: 'Parts Database',
    icon: '📦',
    description: 'HD Supply integrated parts catalog',
    enabled: true
  },
  warrantyCheck: {
    name: 'Warranty Verification',
    icon: '✅',
    description: 'Automatic warranty status detection',
    enabled: true
  },
  inventoryScan: {
    name: 'Verbal Inventory',
    icon: '🎤',
    description: 'Voice inventory with Ava007 + Lens',
    enabled: true
  },
  orderParts: {
    name: 'One-Click Ordering',
    icon: '🛒',
    description: 'Order replacement parts instantly',
    enabled: true
  }
};

export const ESAInvPartsCardB = ESAVerifyComponent({
  name: 'invpartscard-B',
  version: '1.0.0',
  verified: true,
  
  state: {
    isBroadcastOpen: false,
    productModel: 'SP09EA2-20',
    activeTab: 'inventory',
    selectedFeatures: ['diagnostics', 'partsLookup', 'warrantyCheck', 'inventoryScan'],
    isScanning: false,
    voiceEnabled: true,
    lastScanResult: null
  },
  
  methods: {
    speak: (state, text) => {
      if (!state.voiceEnabled) return;
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        const voices = speechSynthesis.getVoices();
        const avaVoice = voices.find(v => 
          v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha')
        );
        if (avaVoice) utterance.voice = avaVoice;
        
        speechSynthesis.speak(utterance);
        console.log(`%c[ESA.Ava007] ${text}`, `color: ${activeTheme.purple}`);
      }
    },
    
    toggleBroadcast: (state) => {
      state.isBroadcastOpen = !state.isBroadcastOpen;
      
      if (state.isBroadcastOpen) {
        console.log(`%c[ESA.InvParts] Broadcast panel opened`, `color: ${activeTheme.green}`);
        methods.speak(state, 'Inventory broadcast mode activated. Ready for verbal inventory scan.');
      }
    },
    
    switchTab: (state, tab) => {
      state.activeTab = tab;
      console.log(`%c[ESA.InvParts] Tab: ${tab}`, `color: ${activeTheme.blue}`);
    },
    
    startVerbalInventory: async (state) => {
      state.isScanning = true;
      state.lastScanResult = null;
      
      methods.speak(state, 'Starting verbal inventory scan. Please point the lens at the part label.');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const product = PTAC_PARTS_INVENTORY[state.productModel];
      state.lastScanResult = {
        timestamp: new Date().toISOString(),
        part: product.partNumber,
        model: product.model,
        inventory: { ...product.inventory }
      };
      
      state.isScanning = false;
      
      // Announce inventory status
      const inv = product.inventory;
      methods.speak(state, 
        `Inventory scan complete. ${product.model}. ` +
        `${inv.warranty} units under warranty. ` +
        `${inv.processing} units in processing. ` +
        `${inv.recycle} units marked for recycle. ` +
        `Total inventory: ${inv.total} units.`
      );
      
      // Dispatch event for Ingestion/Lens
      window.dispatchEvent(new CustomEvent('esa:inventory-scan', {
        detail: state.lastScanResult
      }));
    },
    
    updateQuantity: (state, field, delta) => {
      const product = PTAC_PARTS_INVENTORY[state.productModel];
      const current = product.inventory[field];
      const newValue = Math.max(0, current + delta);
      product.inventory[field] = newValue;
      product.inventory.total = product.inventory.warranty + product.inventory.processing + product.inventory.recycle;
      
      console.log(`%c[ESA.InvParts] Updated ${field}: ${current} → ${newValue}`, `color: ${activeTheme.yellow}`);
      
      methods.speak(state, `${field} quantity updated to ${newValue}`);
    },
    
    orderPart: (state, part) => {
      console.log(`%c[ESA.InvParts] Ordering: ${part.part} - ${part.name}`, `color: ${activeTheme.green}`);
      methods.speak(state, `Ordering ${part.name}, part number ${part.part}.`);
      
      window.dispatchEvent(new CustomEvent('esa:order-part', {
        detail: { part, timestamp: new Date().toISOString() }
      }));
    },
    
    openManual: (state, manual) => {
      console.log(`%c[ESA.InvParts] Opening: ${manual.name}`, `color: ${activeTheme.aqua}`);
      window.open(manual.url, '_blank');
    },
    
    toggleFeature: (state, featureKey) => {
      const index = state.selectedFeatures.indexOf(featureKey);
      if (index > -1) {
        state.selectedFeatures.splice(index, 1);
      } else {
        state.selectedFeatures.push(featureKey);
      }
    },
    
    getInventoryStatus: (state) => {
      const product = PTAC_PARTS_INVENTORY[state.productModel];
      return product.inventory;
    }
  },
  
  template: (props, state, methods) => html`
    <div class="esa-invparts-card-b" style="
      position: relative;
      width: 100%;
      max-width: 900px;
      margin: 16px auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <!-- Main Product Card (LONGER/TALLER) -->
      <div style="
        background: ${activeTheme.bg0_soft || '#32302f'};
        border: 2px solid ${activeTheme.border};
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 12px 40px ${activeTheme.shadow};
      ">
        
        <!-- Card Header -->
        <div style="
          background: linear-gradient(135deg, ${activeTheme.blue}, ${activeTheme.purple});
          color: ${activeTheme.fg};
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        ">
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 36px;">📦</span>
            <div>
              <div style="font-size: 20px; font-weight: bold;">
                ${(() => {
                  const product = PTAC_PARTS_INVENTORY[state.productModel];
                  return `${product.brand} ${product.model}`;
                })()}
              </div>
              <div style="font-size: 13px; opacity: 0.9;">
                ESA.INVPARTS • Part #${(() => PTAC_PARTS_INVENTORY[state.productModel].partNumber)()}
              </div>
            </div>
          </div>
          
          <!-- Broadcast Toggle -->
          <button
            @click=${() => methods.toggleBroadcast(state)}
            style="
              background: ${state.isBroadcastOpen ? activeTheme.green : activeTheme.bg};
              color: ${activeTheme.fg};
              border: 2px solid ${activeTheme.border};
              padding: 14px 28px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 10px;
              transition: all 0.3s;
              font-size: 14px;
            "
          >
            <span style="font-size: 20px;">📡</span>
            <span>${state.isBroadcastOpen ? 'BROADCAST ACTIVE' : 'BROADCAST'}</span>
          </button>
        </div>
        
        <!-- INVENTORY QUANTITIES SECTION (REPLACES PRIORITY) -->
        <div style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 24px;
          background: ${activeTheme.bg};
          border-bottom: 2px solid ${activeTheme.border};
        ">
          ${(() => {
            const inv = PTAC_PARTS_INVENTORY[state.productModel].inventory;
            
            return html`
              <!-- Warranty Qty -->
              <div style="
                background: ${activeTheme.green}22;
                border: 2px solid ${activeTheme.green};
                padding: 20px 16px;
                border-radius: 12px;
                text-align: center;
              ">
                <div style="font-size: 11px; color: ${activeTheme.green}; margin-bottom: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                  ✅ Warranty Qty
                </div>
                <div style="font-size: 36px; font-weight: bold; color: ${activeTheme.fg};">
                  ${inv.warranty}
                </div>
                <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-top: 4px;">
                  units covered
                </div>
              </div>
              
              <!-- Processing Qty -->
              <div style="
                background: ${activeTheme.yellow}22;
                border: 2px solid ${activeTheme.yellow};
                padding: 20px 16px;
                border-radius: 12px;
                text-align: center;
              ">
                <div style="font-size: 11px; color: ${activeTheme.yellow}; margin-bottom: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                  ⚙️ Processing Qty
                </div>
                <div style="font-size: 36px; font-weight: bold; color: ${activeTheme.fg};">
                  ${inv.processing}
                </div>
                <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-top: 4px;">
                  in repair/processing
                </div>
              </div>
              
              <!-- Recycle Qty -->
              <div style="
                background: ${activeTheme.red}22;
                border: 2px solid ${activeTheme.red};
                padding: 20px 16px;
                border-radius: 12px;
                text-align: center;
              ">
                <div style="font-size: 11px; color: ${activeTheme.red}; margin-bottom: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                  ♻️ Recycle Qty
                </div>
                <div style="font-size: 36px; font-weight: bold; color: ${activeTheme.fg};">
                  ${inv.recycle}
                </div>
                <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-top: 4px;">
                  ready for recycling
                </div>
              </div>
              
              <!-- Total -->
              <div style="
                background: ${activeTheme.blue}22;
                border: 2px solid ${activeTheme.blue};
                padding: 20px 16px;
                border-radius: 12px;
                text-align: center;
              ">
                <div style="font-size: 11px; color: ${activeTheme.blue}; margin-bottom: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                  📊 Total Units
                </div>
                <div style="font-size: 36px; font-weight: bold; color: ${activeTheme.fg};">
                  ${inv.total}
                </div>
                <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-top: 4px;">
                  total inventory
                </div>
              </div>
            `;
          })()}
        </div>
        
        <!-- Verbal Inventory Scan Button (Ava007 + Lens Integration) -->
        <div style="padding: 20px 24px; background: ${activeTheme.bg0_soft}; border-bottom: 2px solid ${activeTheme.border};">
          <button
            @click=${() => methods.startVerbalInventory(state)}
            disabled=${() => state.isScanning}
            style="
              width: 100%;
              padding: 18px;
              background: linear-gradient(135deg, ${activeTheme.purple}, ${activeTheme.blue});
              color: ${activeTheme.fg};
              border: none;
              border-radius: 10px;
              font-size: 15px;
              font-weight: bold;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              transition: all 0.3s;
            "
          >
            <span style="font-size: 24px;">🎤</span>
            <span>${() => state.isScanning ? '🔍 SCANNING WITH LENS...' : 'START VERBAL INVENTORY WITH AVA007'}</span>
          </button>
          
          ${() => state.lastScanResult ? html`
            <div style="
              margin-top: 12px;
              padding: 12px;
              background: ${activeTheme.bg};
              border: 1px solid ${activeTheme.green};
              border-radius: 8px;
              font-size: 12px;
              color: ${activeTheme.green};
            ">
              ✅ Last scan: ${new Date(state.lastScanResult.timestamp).toLocaleTimeString()} — 
              ${state.lastScanResult.model} (${state.lastScanResult.inventory.total} units)
            </div>
          ` : ''}
        </div>
        
        <!-- Tabs -->
        <div style="
          display: flex;
          border-bottom: 2px solid ${activeTheme.border};
          background: ${activeTheme.bg0_soft};
        ">
          ${['inventory', 'parts', 'manuals', 'features'].map(tab => html`
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
                font-size: 13px;
              "
            >
              ${tab === 'inventory' ? '📋 Inventory' : 
               tab === 'parts' ? '🔧 Parts' : 
               tab === 'manuals' ? '📚 Manuals' : '⚙️ Features'}
            </button>
          `)}
        </div>
        
        <!-- Tab Content (TALLER - more content area) -->
        <div style="padding: 24px; min-height: 400px;">
          
          <!-- Inventory Tab -->
          ${state.activeTab === 'inventory' ? html`
            <div>
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 20px; font-size: 16px;">
                📦 Inventory Management
              </h3>
              
              <!-- Quantity Adjusters -->
              <div style="display: grid; gap: 16px; margin-bottom: 24px;">
                ${(() => {
                  const fields = [
                    { key: 'warranty', label: 'Warranty Units', icon: '✅', color: activeTheme.green },
                    { key: 'processing', label: 'Processing Units', icon: '⚙️', color: activeTheme.yellow },
                    { key: 'recycle', label: 'Recycle Units', icon: '♻️', color: activeTheme.red }
                  ];
                  
                  return fields.map(field => html`
                    <div style="
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      background: ${activeTheme.bg};
                      padding: 16px 20px;
                      border-radius: 10px;
                      border: 1px solid ${activeTheme.border};
                    ">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 24px;">${field.icon}</span>
                        <div>
                          <div style="font-weight: bold; color: ${activeTheme.fg};">${field.label}</div>
                          <div style="font-size: 11px; color: ${activeTheme.fg_soft};">Adjust quantity</div>
                        </div>
                      </div>
                      
                      <div style="display: flex; align-items: center; gap: 16px;">
                        <button
                          @click=${() => methods.updateQuantity(state, field.key, -1)}
                          style="
                            width: 40px;
                            height: 40px;
                            background: ${activeTheme.red};
                            color: ${activeTheme.fg};
                            border: none;
                            border-radius: 8px;
                            font-size: 20px;
                            cursor: pointer;
                          "
                        >−</button>
                        
                        <span style="
                          font-size: 28px;
                          font-weight: bold;
                          color: ${field.color};
                          min-width: 50px;
                          text-align: center;
                        ">${PTAC_PARTS_INVENTORY[state.productModel].inventory[field.key]}</span>
                        
                        <button
                          @click=${() => methods.updateQuantity(state, field.key, 1)}
                          style="
                            width: 40px;
                            height: 40px;
                            background: ${activeTheme.green};
                            color: ${activeTheme.bg};
                            border: none;
                            border-radius: 8px;
                            font-size: 20px;
                            cursor: pointer;
                          "
                        >+</button>
                      </div>
                    </div>
                  `;
                })()}
              </div>
              
              <!-- Product Specs -->
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 16px; font-size: 16px;">
                🔧 Specifications
              </h3>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                ${(() => {
                  const specs = PTAC_PARTS_INVENTORY[state.productModel].specs;
                  return Object.entries(specs).map(([key, value]) => html`
                    <div style="
                      background: ${activeTheme.bg};
                      padding: 14px;
                      border-radius: 8px;
                      border: 1px solid ${activeTheme.border};
                    ">
                      <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 4px;">
                        ${key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style="font-size: 18px; font-weight: bold; color: ${activeTheme.fg};">
                        ${value}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ` : ''}
          
          <!-- Parts Tab -->
          ${state.activeTab === 'parts' ? html`
            <div>
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 16px; font-size: 16px;">
                🔧 Related Parts & Accessories
              </h3>
              
              <div style="display: grid; gap: 12px; margin-bottom: 24px;">
                ${(() => PTAC_PARTS_INVENTORY[state.productModel].relatedParts.map(part => html`
                  <div style="
                    background: ${activeTheme.bg};
                    border: 1px solid ${activeTheme.border};
                    border-radius: 10px;
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <div>
                      <div style="font-weight: bold; color: ${activeTheme.fg};">
                        ${part.part} — ${part.name}
                      </div>
                      <div style="font-size: 11px; color: ${activeTheme.fg_soft};">
                        ${part.category}
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="color: ${activeTheme.green}; font-weight: bold; margin-bottom: 6px;">
                        ${part.price}
                      </div>
                      <button
                        @click=${() => methods.orderPart(state, part)}
                        style="
                          background: ${activeTheme.green};
                          color: ${activeTheme.bg};
                          border: none;
                          padding: 8px 16px;
                          border-radius: 6px;
                          cursor: pointer;
                          font-size: 12px;
                          font-weight: bold;
                        "
                      >ORDER</button>
                    </div>
                  </div>
                ))())}
              </div>
              
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 16px; font-size: 16px;">
                🔧 Repair & Maintenance Parts
              </h3>
              <div style="display: grid; gap: 12px;">
                ${(() => PTAC_PARTS_INVENTORY[state.productModel].repairParts.map(part => html`
                  <div style="
                    background: ${activeTheme.bg};
                    border: 1px solid ${activeTheme.border};
                    border-radius: 10px;
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <div>
                      <div style="font-weight: bold; color: ${activeTheme.fg};">
                        ${part.part} — ${part.name}
                      </div>
                      <div style="font-size: 11px; color: ${activeTheme.fg_soft};">
                        ${part.category}
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="color: ${activeTheme.green}; font-weight: bold; margin-bottom: 6px;">
                        ${part.price}
                      </div>
                      <button
                        @click=${() => methods.orderPart(state, part)}
                        style="
                          background: ${activeTheme.green};
                          color: ${activeTheme.bg};
                          border: none;
                          padding: 8px 16px;
                          border-radius: 6px;
                          cursor: pointer;
                          font-size: 12px;
                          font-weight: bold;
                        "
                      >ORDER</button>
                    </div>
                  </div>
                ))())}
              </div>
            </div>
          ` : ''}
          
          <!-- Manuals Tab -->
          ${state.activeTab === 'manuals' ? html`
            <div>
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 16px; font-size: 16px;">
                📚 Product Documentation
              </h3>
              <div style="display: grid; gap: 12px;">
                ${(() => PTAC_PARTS_INVENTORY[state.productModel].manuals.map(manual => html`
                  <div
                    @click=${() => methods.openManual(state, manual)}
                    style="
                      background: ${activeTheme.bg};
                      border: 1px solid ${activeTheme.border};
                      border-radius: 10px;
                      padding: 16px 20px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      cursor: pointer;
                      transition: all 0.2s;
                    "
                    onmouseenter=${(e) => e.currentTarget.style.background = activeTheme.bg0_soft}
                    onmouseleave=${(e) => e.currentTarget.style.background = activeTheme.bg}
                  >
                    <div style="display: flex; align-items: center; gap: 16px;">
                      <span style="font-size: 28px;">
                        ${manual.type === 'pdf' ? '📄' : manual.type === 'diagram' ? '📐' : '📖'}
                      </span>
                      <div>
                        <div style="font-weight: bold; color: ${activeTheme.fg};">${manual.name}</div>
                        <div style="font-size: 11px; color: ${activeTheme.fg_soft}; text-transform: uppercase;">
                          ${manual.type}
                        </div>
                      </div>
                    </div>
                    <button style="
                      background: ${activeTheme.blue};
                      color: ${activeTheme.fg};
                      border: none;
                      padding: 10px 20px;
                      border-radius: 8px;
                      cursor: pointer;
                      font-weight: bold;
                    ">VIEW</button>
                  </div>
                ))())}
              </div>
            </div>
          ` : ''}
          
          <!-- Features Tab -->
          ${state.activeTab === 'features' ? html`
            <div>
              <h3 style="color: ${activeTheme.yellow}; margin-bottom: 16px; font-size: 16px;">
                ⚙️ Broadcast Service Features
              </h3>
              <div style="display: grid; gap: 12px;">
                ${Object.entries(BROADCAST_FEATURES).map(([key, feature]) => html`
                  <div style="
                    background: ${activeTheme.bg};
                    border: 2px solid ${feature.enabled ? activeTheme.green : activeTheme.border};
                    border-radius: 10px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                  ">
                    <div style="display: flex; align-items: center; gap: 16px;">
                      <span style="font-size: 28px;">${feature.icon}</span>
                      <div>
                        <div style="font-weight: bold; color: ${activeTheme.fg};">${feature.name}</div>
                        <div style="font-size: 12px; color: ${activeTheme.fg_soft};">${feature.description}</div>
                      </div>
                    </div>
                    <label style="
                      position: relative;
                      width: 52px;
                      height: 28px;
                      cursor: pointer;
                    ">
                      <input
                        type="checkbox"
                        checked=${feature.enabled}
                        @change=${() => methods.toggleFeature(state, key)}
                        style="
                          position: absolute;
                          opacity: 0;
                          width: 0;
                          height: 0;
                        "
                      />
                      <div style="
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: ${feature.enabled ? activeTheme.green : activeTheme.border};
                        border-radius: 14px;
                        transition: all 0.3s;
                      "></div>
                      <div style="
                        position: absolute;
                        top: 3px;
                        left: ${feature.enabled ? '27px' : '3px'};
                        width: 22px;
                        height: 22px;
                        background: ${activeTheme.fg};
                        border-radius: 50%;
                        transition: all 0.3s;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      "></div>
                    </label>
                  </div>
                `)}
              </div>
            </div>
          ` : ''}
          
        </div>
      </div>
    `
}).component;

export default ESAInvPartsCardB;
