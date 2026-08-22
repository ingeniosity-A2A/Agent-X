/**
 * ESA.Ptac-B.js
 * SERVICE BROADCASTING CARD - Sliding Panel (B-Side)
 * 
 * Dedicated to HD Supply PTAC Unit:
 * https://hdsupplysolutions.com/p/seasons-9000-btu-230-208-v-20-amp-electric-heat-cool-ptac-p223532#
 * 
 * Features:
 * - Sliding card panel (B-side broadcast mode)
 * - Connected to ESA.InvPartsCard (parent)
 * - Real-time service broadcasting via GSAP Transport
 * - Ava007 voice announcements for service alerts
 * - HD Supply catalog integration (Part #223532)
 * - Workorder quick-create from this unit
 * - Diagnostic code shortcuts
 * - Service history timeline
 * 
 * Connections:
 * → ESA.InvPartsCard (parent card, inventory data)
 * → ESA.workorder (create workorders for this unit)
 * → ESA.DiagnosticCard (quick diagnostics)
 * → ESA.duckDB (parts catalog lookup)
 * → GSAP Transport (state synchronization)
 * → Ava007 Voice (service broadcasts)
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// HD Supply PTAC Unit Specific Data
const PTAC_UNIT_223532 = {
  // HD Supply Product Info
  hdSupply: {
    url: 'https://hdsupplysolutions.com/p/seasons-9000-btu-230-208-v-20-amp-electric-heat-cool-ptac-p223532#',
    partNumber: '223532',
    brand: 'Seasons',
    modelName: 'SP09EA2-20',
    fullTitle: 'Seasons 9000 BTU 230/208V 20 Amp Electric Heat/Cool PTAC',
    price: 899.00,
    inStock: true,
    category: 'PTAC Units'
  },
  
  // Technical Specifications
  specs: {
    btuCooling: 9000,
    btuHeating: 10900,
    voltage: '230/208V',
    amperage: '20A',
    refrigerant: 'R-32',
    eer: 12.8,
    weight: '95 lbs',
    dimensions: '16.06H x 13.94W x 21.38D in'
  },
  
  // Warranty Information
  warranty: {
    parts: '5 years',
    compressor: '7 years',
    refrigeration: '5 years',
    unit: '1 year'
  },
  
  // Common Parts for this unit (from HD Supply)
  commonParts: [
    { sku: '203862', name: 'Indoor Ambient Thermistor', price: 45.00, category: 'Sensors' },
    { sku: '203863', name: 'PTAC Subbase 20A', price: 89.99, category: 'Installation' },
    { sku: '203858', name: 'Exterior Grille', price: 45.00, category: 'Cosmetic' },
    { sku: '203859', name: 'PTAC Drain Kit', price: 32.50, category: 'Installation' },
    { sku: '261803', name: 'Air Filter 10x10x1', price: 6.25, category: 'Filters', frequency: 'Monthly' },
    { sku: '907253', name: 'Condensate Tablets (100pk)', price: 34.99, category: 'Chemicals', frequency: 'Quarterly' },
    { sku: '150606', name: 'Coil Cleaner', price: 11.99, category: 'Chemicals', frequency: 'Annual' }
  ],
  
  // Service Intervals
  serviceIntervals: {
    filterChange: { interval: '30 days', lastService: null, nextDue: null },
    coilCleaning: { interval: '180 days', lastService: null, nextDue: null },
    condensateTablets: { interval: '90 days', lastService: null, nextDue: null },
    fullInspection: { interval: '365 days', lastService: null, nextDue: null }
  }
};

// Sample Service Broadcast Messages
const BROADCAST_TEMPLATES = {
  scheduled: [
    'Scheduled maintenance due for Unit {unit}. Filter change recommended.',
    'Quarterly service reminder: Check condensate drain and add tablets.',
    'Annual inspection approaching for PTAC unit {unit}.'
  ],
  urgent: [
    'URGENT: Unit {unit} showing diagnostic code {code}. Immediate attention required.',
    'Alert: Temperature deviation detected on Unit {unit}.',
    'Warning: High amp draw on Unit {unit}. Possible compressor issue.'
  ],
  completed: [
    'Service complete on Unit {unit}. All systems nominal.',
    'Preventive maintenance finished. Next service due in {interval}.',
    'Repair completed: {part} replaced. Unit testing normal.'
  ]
};

export const ESAPtacB = ESAVerifyComponent({
  name: 'Ptac-B',
  version: '1.0.0',
  verified: true,
  
  state: {
    // Sliding panel state
    isOpen: false,
    slidePosition: 'closed', // 'closed', 'opening', 'open', 'closing'
    
    // Current view/tab
    activeTab: 'overview', // 'overview', 'parts', 'service', 'diagnostics', 'broadcast'
    
    // Unit data
    unit: PTAC_UNIT_223532,
    
    // Service broadcasting
    broadcastMode: false,
    currentBroadcast: null,
    broadcastHistory: [],
    broadcastVolume: 1,
    
    // Quick actions
    selectedDiagnosticCode: '',
    workorderNote: '',
    
    // Connection status
    connections: {
      invPartsCard: false,
      workorder: false,
      diagnosticCard: false,
      duckDB: false,
      transport: false
    },
    
    // Service history (sample)
    serviceHistory: [
      {
        date: '2026-08-15',
        type: 'inspection',
        technician: 'John Smith',
        notes: 'Quarterly inspection. Filter replaced, coils cleaned.',
        status: 'completed'
      },
      {
        date: '2026-07-20',
        type: 'repair',
        technician: 'Maria Garcia',
        notes: 'Replaced indoor thermistor per F1 diagnostic.',
        partsUsed: ['203862'],
        status: 'completed'
      },
      {
        date: '2026-06-10',
        type: 'maintenance',
        technician: 'David Chen',
        notes: 'Scheduled maintenance. Added condensate tablets.',
        status: 'completed'
      }
    ]
  },
  
  methods: {
    /**
     * Toggle sliding panel open/closed with animation
     */
    togglePanel(state) {
      if (state === undefined) {
        state.isOpen = !state.isOpen;
      } else {
        state.isOpen = state;
      }
      
      if (state.isOpen) {
        state.slidePosition = 'opening';
        // Animate open
        setTimeout(() => {
          state.slidePosition = 'open';
          methods.broadcastMessage(state, 'panel_opened');
        }, 300);
      } else {
        state.slidePosition = 'closing';
        setTimeout(() => {
          state.slidePosition = 'closed';
        }, 300);
      }
      
      // Send through GSAP Transport
      if (window.ESA?.transport) {
        window.ESA.transport.send('ptac-b:panel', state.isOpen ? 1 : 0, {
          source: 'ESA-Ptac-B',
          metadata: { position: state.slidePosition }
        });
      }
    },
    
    /**
     * Switch tabs within the panel
     */
    switchTab(state, tabName) {
      state.activeTab = tabName;
      
      // Send through transport
      if (window.ESA?.transport) {
        window.ESA.transport.send('ptac-b:tab', 1, {
          source: 'ESA-Ptac-B',
          metadata: { tab: tabName }
        });
      }
    },
    
    /**
     * Open HD Supply product page
     */
    openHDSupply(state) {
      window.open(state.unit.hdSupply.url, '_blank');
      
      // Log the action
      console.log(`%c[ESA-Ptac-B] Opening HD Supply: ${state.unit.hdSupply.partNumber}`, 
        `color: ${activeTheme.green}`);
      
      if (window.ESA?.transport) {
        window.ESA.transport.send('ptac-b:hd-supply', 1, {
          source: 'ESA-Ptac-B',
          metadata: { url: state.unit.hdSupply.url, partNumber: state.unit.hdSupply.partNumber }
        });
      }
    },
    
    /**
     * Create workorder for this unit
     */
    createWorkorder(state) {
      const workorderId = `WO-${Date.now().toString(36).toUpperCase()}`;
      
      const workorder = {
        workorderId,
        unitModel: state.unit.specs.modelName || 'SP09EA2-20',
        serialNumber: 'YYMMxxxxxx',
        location: 'TBD',
        technician: '',
        dateCreated: new Date().toISOString(),
        dateCompleted: null,
        status: 'open',
        diagnosticCode: state.selectedDiagnosticCode || null,
        partsUsed: [],
        laborHours: 0,
        laborRate: 85.00,
        partsCost: 0,
        totalCost: 0,
        notes: state.workorderNote || `Service for PTAC Unit ${state.unit.hdSupply.partNumber}`,
        warrantyClaim: false,
        priority: 'medium'
      };
      
      // Dispatch event for ESA.Workorder to pick up
      window.dispatchEvent(new CustomEvent('esa:create-workorder', {
        detail: { workorder, source: 'ESA-Ptac-B' }
      }));
      
      // Send through transport
      if (window.ESA?.transport) {
        window.ESA.transport.send('workorder:create', 1, {
          source: 'ESA-Ptac-B',
          metadata: workorder
        });
      }
      
      // Clear form
      state.selectedDiagnosticCode = '';
      state.workorderNote = '';
      
      // Voice confirmation
      methods.speak(state, `Work order ${workorderId} created for PTAC unit.`);
      
      console.log(`%c[ESA-Ptac-B] Workorder created: ${workorderId}`, `color: ${activeTheme.green}`);
    },
    
    /**
     * Quick diagnostic - sends to ESA.DiagnosticCard
     */
    runDiagnostic(state, code) {
      if (code) {
        state.selectedDiagnosticCode = code;
      }
      
      // Dispatch to DiagnosticCard
      window.dispatchEvent(new CustomEvent('esa:run-diagnostic', {
        detail: { 
          code: state.selectedDiagnosticCode,
          unit: state.unit.hdSupply.partNumber,
          source: 'ESA-Ptac-B'
        }
      }));
      
      // Send through transport
      if (window.ESA?.transport) {
        window.ESA.transport.send('diagnostic:code', 1, {
          source: 'ESA-Ptac-B',
          metadata: { code: state.selectedDiagnosticCode, unit: state.unit.hdSupply.partNumber }
        });
      }
      
      // Switch to diagnostics tab
      methods.switchTab(state, 'diagnostics');
    },
    
    /**
     * Look up part in DuckDB / HD Supply catalog
     */
    lookupPart(state, sku) {
      // Dispatch to InvPartsCard for lookup
      window.dispatchEvent(new CustomEvent('esa:lookup-part', {
        detail: { sku, source: 'ESA-Ptac-B' }
      }));
      
      // Send through transport
      if (window.ESA?.transport) {
        window.ESA.transport.send('part:lookup', 1, {
          source: 'ESA-Ptac-B',
          metadata: { sku }
        });
      }
    },
    
    /**
     * Add part to current workorder from this unit's parts list
     */
    addPartToWorkorder(state, part) {
      window.dispatchEvent(new CustomEvent('esa:add-part-to-workorder', {
        detail: { part, unit: state.unit.hdSupply.partNumber, source: 'ESA-Ptac-B' }
      }));
      
      if (window.ESA?.transport) {
        window.ESA.transport.send('part:add', 1, {
          source: 'ESA-Ptac-B',
          metadata: { part, unit: state.unit.hdSupply.partNumber }
        });
      }
      
      methods.speak(state, `Added ${part.name} to workorder.`);
    },
    
    /**
     * SERVICE BROADCASTING - Main function
     */
    startBroadcast(state) {
      state.broadcastMode = true;
      console.log(`%c[ESA-Ptac-B] 📢 Service Broadcasting ENABLED`, 
        `color: ${activeTheme.purple}; font-weight: bold`);
      
      if (window.ESA?.transport) {
        window.ESA.transport.send('broadcast:start', 1, {
          source: 'ESA-Ptac-B',
          metadata: { unit: state.unit.hdSupply.partNumber }
        });
      }
    },
    
    stopBroadcast(state) {
      state.broadcastMode = false;
      state.currentBroadcast = null;
      console.log(`%c[ESA-Ptac-B] 📢 Service Broadcasting DISABLED`, 
        `color: ${activeTheme.fg_soft}`);
      
      if (window.ESA?.transport) {
        window.ESA.transport.send('broadcast:stop', 0, {
          source: 'ESA-Ptac-B'
        });
      }
    },
    
    /**
     * Broadcast a message (with optional voice)
     */
    broadcastMessage(state, type, customMessage = null) {
      let message = customMessage;
      
      if (!message) {
        const templates = BROADCAST_TEMPLATES[type] || BROADCAST_TEMPLATES.scheduled;
        message = templates[Math.floor(Math.random() * templates.length)];
        
        // Replace placeholders
        message = message.replace('{unit}', state.unit.hdSupply.partNumber);
        message = message.replace('{code}', state.selectedDiagnosticCode || 'UNKNOWN');
        message = message.replace('{interval}', '30 days');
        message = message.replace('{part}', 'filter');
      }
      
      const broadcast = {
        id: `bc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type, // 'scheduled', 'urgent', 'completed', 'panel_opened', etc.
        message,
        unit: state.unit.hdSupply.partNumber,
        read: false
      };
      
      // Add to history
      state.broadcastHistory.unshift(broadcast);
      if (state.broadcastHistory.length > 50) {
        state.broadcastHistory.pop();
      }
      
      state.currentBroadcast = broadcast;
      
      // Send through GSAP Transport (THIS IS THE TRANSPORT!)
      if (window.ESA?.transport) {
        window.ESA.transport.ingest({
          intent: 'broadcast:message',
          cognitive_state: { intent: 'service:broadcast' },
          temporal_tween: {
            start: 0,
            end: 1,
            duration_ms: 500,
            easing: 'power2.out'
          },
          metadata: {
            ...broadcast,
            source: 'ESA-Ptac-B',
            transportType: 'tween-atom'
          }
        });
      }
      
      // Voice announcement if enabled
      if (state.broadcastMode || type === 'urgent') {
        methods.speak(state, message);
      }
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('esa:broadcast', {
        detail: { broadcast, source: 'ESA-Ptac-B' }
      }));
      
      return broadcast;
    },
    
    /**
     * Text-to-speech via Ava007 (Web Speech API)
     */
    speak(state, text) {
      if (!('speechSynthesis' in window)) {
        console.warn('[ESA-Ptac-B] Speech synthesis not supported');
        return;
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to get female voice (Zira/Samantha preference)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') || 
        v.name.includes('Microsoft Zira') ||
        (v.name.includes('Female') && v.lang.startsWith('en'))
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly higher (female preference)
      utterance.volume = state.broadcastVolume;
      
      utterance.onstart = () => {
        console.log(`%c[ESA-Ptac-B] 🎤 Speaking: "${text.substring(0, 50)}..."`, 
          `color: ${activeTheme.aqua}`);
      };
      
      utterance.onend = () => {
        console.log(`%c[ESA-Ptac-B] 🎤 Speech complete`, `color: ${activeTheme.fg_soft}`);
      };
      
      window.speechSynthesis.speak(utterance);
      
      // Send through transport
      if (window.ESA?.transport) {
        window.ESA.transport.send('voice:speak', 1, {
          source: 'ESA-Ptac-B',
          metadata: { text: text.substring(0, 100), voice: preferredVoice?.name || 'default' }
        });
      }
    },
    
    /**
     * Check connections to other ESA components
     */
    checkConnections(state) {
      state.connections = {
        invPartsCard: !!window.ESA?.components?.invPartsCard,
        workorder: !!window.ESA?.components?.workorder,
        diagnosticCard: !!window.ESA?.components?.diagnosticCard,
        duckDB: !!window.ESA?.duckDB,
        transport: !!window.ESA?.transport
      };
      
      return state.connections;
    },
    
    /**
     * Get service status for display
     */
    getServiceStatus(state) {
      const now = new Date();
      const statuses = {};
      
      Object.entries(state.unit.serviceIntervals).forEach(([key, interval]) => {
        const lastService = interval.lastService ? new Date(interval.lastService) : null;
        const intervalDays = parseInt(interval.interval) || 30;
        
        if (lastService) {
          const daysSinceLast = Math.floor((now - lastService) / (1000 * 60 * 60 * 24));
          const daysUntilDue = intervalDays - daysSinceLast;
          
          statuses[key] = {
            ...interval,
            daysSinceLast,
            daysUntilDue,
            status: daysUntilDue <= 0 ? 'overdue' : daysUntilDue <= 7 ? 'due-soon' : 'ok',
            lastServiceDate: lastService.toLocaleDateString(),
            nextDueDate: new Date(now.getTime() + daysUntilDue * 24 * 60 * 60 * 1000).toLocaleDateString()
          };
        } else {
          statuses[key] = {
            ...interval,
            daysSinceLast: null,
            daysUntilDue: 0,
            status: 'never',
            lastServiceDate: 'Never',
            nextDueDate: 'Due now'
          };
        }
      });
      
      return statuses;
    }
  },
  
  template: (props, state, methods) => {
    return html`
      <div style="
        position: fixed;
        right: ${state.isOpen ? '0' : '-420px'};
        top: 60px;
        width: 400px;
        max-height: calc(100vh - 80px);
        background: ${activeTheme.bg0};
        border: 1px solid ${activeTheme.border};
        border-right: none;
        border-radius: 8px 0 0 8px;
        box-shadow: -4px 0 20px var(--esa-shadow);
        transition: right 0.3s ease;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          background: ${activeTheme.bg1};
          padding: 12px 16px;
          border-bottom: 1px solid ${activeTheme.border};
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-weight: bold; color: ${activeTheme.yellow}; font-size: 14px;">
              📡 ESA-PTAC-B
            </div>
            <div style="font-size: 11px; color: ${activeTheme.fg_soft};">
              Service Broadcasting • ${state.unit.hdSupply.partNumber}
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <!-- Broadcast Toggle -->
            <button 
              @click=${() => state.broadcastMode ? methods.stopBroadcast(state) : methods.startBroadcast(state)}
              style="
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid ${state.broadcastMode ? activeTheme.red : activeTheme.border};
                background: ${state.broadcastMode ? `${activeTheme.red}20` : activeTheme.bg};
                color: ${state.broadcastMode ? activeTheme.red : activeTheme.fg};
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
              "
            >
              ${state.broadcastMode ? '🔴 LIVE' : '⚫ OFF'}
            </button>
            
            <!-- Close Button -->
            <button 
              @click=${() => methods.togglePanel(state, false)}
              style="
                width: 24px;
                height: 24px;
                border-radius: 4px;
                border: 1px solid ${activeTheme.border};
                background: ${activeTheme.bg};
                color: ${activeTheme.fg};
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >✕</button>
          </div>
        </div>
        
        <!-- Tabs -->
        <div style="
          display: flex;
          background: ${activeTheme.bg0};
          border-bottom: 1px solid ${activeTheme.border};
          padding: 0 8px;
          overflow-x: auto;
        ">
          ${['overview', 'parts', 'service', 'diagnostics', 'broadcast'].map(tab => html`
            <button
              @click=${() => methods.switchTab(state, tab)}
              style="
                padding: 8px 12px;
                border: none;
                border-bottom: 2px solid ${state.activeTab === tab ? activeTheme.aqua : 'transparent'};
                background: none;
                color: ${state.activeTab === tab ? activeTheme.aqua : activeTheme.fg_soft};
                font-size: 11px;
                font-weight: ${state.activeTab === tab ? 'bold' : 'normal'};
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s;
              "
            >${tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
          `)}
        </div>
        
        <!-- Content Area -->
        <div style="flex: 1; overflow-y: auto; padding: 12px;">
          
          ${state.activeTab === 'overview' ? html`
            <!-- OVERVIEW TAB -->
            <div style="margin-bottom: 16px;">
              <!-- HD Supply Link -->
              <div style="
                background: linear-gradient(135deg, ${activeTheme.bg1} 0%, ${activeTheme.bg0} 100%);
                border: 1px solid ${activeTheme.blue};
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
              ">
                <div style="font-size: 10px; color: ${activeTheme.blue}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                  HD Supply Product
                </div>
                <div style="font-weight: bold; color: ${activeTheme.fg}; font-size: 13px; margin-bottom: 8px;">
                  ${state.unit.hdSupply.fullTitle}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: ${activeTheme.green}; font-size: 18px; font-weight: bold;">
                    $${state.unit.hdSupply.price.toFixed(2)}
                  </span>
                  <button
                    @click=${() => methods.openHDSupply(state)}
                    style="
                      padding: 6px 12px;
                      background: ${activeTheme.blue};
                      color: ${activeTheme.bg0};
                      border: none;
                      border-radius: 4px;
                      font-size: 11px;
                      font-weight: bold;
                      cursor: pointer;
                      transition: all 0.2s;
                    "
                    onmouseenter=${(e) => e.target.style.opacity = '0.8'}
                    onmouseleave=${(e) => e.target.style.opacity = '1'}
                  >
                    View on HD Supply →
                  </button>
                </div>
              </div>
              
              <!-- Quick Specs -->
              <div style="margin-bottom: 12px;">
                <div style="font-size: 11px; color: ${activeTheme.purple}; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  Specifications
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                  ${Object.entries(state.unit.specs).map(([key, value]) => html`
                    <div style="
                      background: ${activeTheme.bg0};
                      padding: 6px 8px;
                      border-radius: 4px;
                      font-size: 11px;
                    ">
                      <span style="color: ${activeTheme.fg_soft};">${key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span style="color: ${activeTheme.fg}; font-weight: 500;">${value}</span>
                    </div>
                  `)}
                </div>
              </div>
              
              <!-- Quick Actions -->
              <div>
                <div style="font-size: 11px; color: ${activeTheme.purple}; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  Quick Actions
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <button
                    @click=${() => methods.createWorkorder(state)}
                    style="
                      padding: 8px 12px;
                      background: ${activeTheme.green}20;
                      border: 1px solid ${activeTheme.green};
                      color: ${activeTheme.green};
                      border-radius: 4px;
                      font-size: 12px;
                      cursor: pointer;
                      text-align: left;
                      transition: all 0.2s;
                    "
                    onmouseenter=${(e) => e.target.style.background = `${activeTheme.green}30`}
                    onmouseleave=${(e) => e.target.style.background = `${activeTheme.green}20`}
                  >
                    📋 Create Workorder
                  </button>
                  
                  <button
                    @click=${() => methods.runDiagnostic(state, 'FP')}
                    style="
                      padding: 8px 12px;
                      background: ${activeTheme.yellow}20;
                      border: 1px solid ${activeTheme.yellow};
                      color: ${activeTheme.yellow};
                      border-radius: 4px;
                      font-size: 12px;
                      cursor: pointer;
                      text-align: left;
                      transition: all 0.2s;
                    "
                    onmouseenter=${(e) => e.target.style.background = `${activeTheme.yellow}30`}
                    onmouseleave=${(e) => e.target.style.background = `${activeTheme.yellow}20`}
                  >
                    🔧 Run Diagnostics
                  </button>
                  
                  <button
                    @click=${() => methods.broadcastMessage(state, 'scheduled')}
                    style="
                      padding: 8px 12px;
                      background: ${activeTheme.purple}20;
                      border: 1px solid ${activeTheme.purple};
                      color: ${activeTheme.purple};
                      border-radius: 4px;
                      font-size: 12px;
                      cursor: pointer;
                      text-align: left;
                      transition: all 0.2s;
                    "
                    onmouseenter=${(e) => e.target.style.background = `${activeTheme.purple}30`}
                    onmouseleave=${(e) => e.target.style.background = `${activeTheme.purple}20`}
                  >
                    📢 Send Broadcast
                  </button>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${state.activeTab === 'parts' ? html`
            <!-- PARTS TAB -->
            <div>
              <div style="font-size: 11px; color: ${activeTheme.purple}; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                Common Parts for ${state.unit.hdSupply.partNumber}
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${state.unit.commonParts.map(part => html`
                  <div style="
                    background: ${activeTheme.bg0};
                    border: 1px solid ${activeTheme.border};
                    border-radius: 6px;
                    padding: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                  "
                  onmouseenter=${(e) => e.target.style.borderColor = activeTheme.blue}
                  onmouseleave=${(e) => e.target.style.borderColor = activeTheme.border}
                  >
                    <div>
                      <div style="font-weight: 500; color: ${activeTheme.fg}; font-size: 12px;">
                        ${part.name}
                      </div>
                      <div style="font-size: 10px; color: ${activeTheme.fg_soft};">
                        SKU: ${part.sku} • ${part.category}
                        ${part.frequency ? html`<span style="color: ${activeTheme.yellow};">• ${part.frequency}</span>` : ''}
                      </div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <span style="color: ${activeTheme.green}; font-weight: bold; font-size: 12px;">
                        $${part.price.toFixed(2)}
                      </span>
                      <button
                        @click=${() => methods.addPartToWorkorder(state, part)}
                        style="
                          padding: 4px 8px;
                          background: ${activeTheme.blue};
                          color: ${activeTheme.bg0};
                          border: none;
                          border-radius: 4px;
                          font-size: 10px;
                          cursor: pointer;
                        "
                      >+ WO</button>
                      <button
                        @click=${() => methods.lookupPart(state, part.sku)}
                        style="
                          padding: 4px 8px;
                          background: ${activeTheme.bg1};
                          color: ${activeTheme.fg};
                          border: 1px solid ${activeTheme.border};
                          border-radius: 4px;
                          font-size: 10px;
                          cursor: pointer;
                        "
                      >🔍</button>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          ` : ''}
          
          ${state.activeTab === 'service' ? html`
            <!-- SERVICE TAB -->
            <div>
              <div style="font-size: 11px; color: ${activeTheme.purple}; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                Service Schedule & History
              </div>
              
              <!-- Service Intervals -->
              <div style="margin-bottom: 16px;">
                <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 8px;">
                  Maintenance Intervals
                </div>
                ${Object.entries(methods.getServiceStatus(state)).map(([key, status]) => html`
                  <div style="
                    background: ${activeTheme.bg0};
                    border: 1px solid ${status.status === 'overdue' ? activeTheme.red : status.status === 'due-soon' ? activeTheme.yellow : activeTheme.border};
                    border-radius: 6px;
                    padding: 10px;
                    margin-bottom: 8px;
                  ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span style="font-weight: 500; color: ${activeTheme.fg}; font-size: 12px;">
                        ${key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span style="
                        font-size: 10px;
                        padding: 2px 6px;
                        border-radius: 10px;
                        background: ${status.status === 'overdue' ? `${activeTheme.red}20` : status.status === 'due-soon' ? `${activeTheme.yellow}20` : `${activeTheme.green}20`};
                        color: ${status.status === 'overdue' ? activeTheme.red : status.status === 'due-soon' ? activeTheme.yellow : activeTheme.green};
                      ">
                        ${status.status === 'overdue' ? 'OVERDUE' : status.status === 'due-soon' ? 'Due Soon' : 'OK'}
                      </span>
                    </div>
                    <div style="font-size: 10px; color: ${activeTheme.fg_soft};">
                      Interval: ${status.interval} • Last: ${status.lastServiceDate} • Due: ${status.nextDueDate}
                    </div>
                  </div>
                `)}
              </div>
              
              <!-- Service History -->
              <div>
                <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 8px;">
                  Recent Service History
                </div>
                ${state.serviceHistory.map(entry => html`
                  <div style="
                    background: ${activeTheme.bg0};
                    border-left: 3px solid ${entry.type === 'repair' ? activeTheme.red : entry.type === 'inspection' ? activeTheme.blue : activeTheme.green};
                    padding: 8px 10px;
                    margin-bottom: 6px;
                    border-radius: 0 4px 4px 0;
                  ">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                      <span style="font-weight: 500; color: ${activeTheme.fg}; font-size: 11px;">
                        ${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                      </span>
                      <span style="font-size: 10px; color: ${activeTheme.fg_soft};">
                        ${entry.date}
                      </span>
                    </div>
                    <div style="font-size: 10px; color: ${activeTheme.fg_soft};">
                      ${entry.technician} • ${entry.notes}
                    </div>
                  </div>
                `)}
              </div>
            </div>
          ` : ''}
          
          ${state.activeTab === 'diagnostics' ? html`
            <!-- DIAGNOSTICS TAB -->
            <div>
              <div style="font-size: 11px; color: ${activeTheme.purple}; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                Quick Diagnostics
              </div>
              
              <!-- Code Input -->
              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <input
                  value=${state.selectedDiagnosticCode}
                  @input=${(e) => state.selectedDiagnosticCode = e.target.value}
                  placeholder="Enter code (F1, C3, etc.)"
                  style="
                    flex: 1;
                    padding: 8px 10px;
                    background: ${activeTheme.bg0};
                    border: 1px solid ${activeTheme.border};
                    border-radius: 4px;
                    color: ${activeTheme.fg};
                    font-size: 12px;
                    font-family: monospace;
                  "
                />
                <button
                  @click=${() => methods.runDiagnostic(state)}
                  style="
                    padding: 8px 16px;
                    background: ${activeTheme.yellow};
                    color: ${activeTheme.bg0};
                    border: none;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 12px;
                    cursor: pointer;
                  "
                >Run</button>
              </div>
              
              <!-- Common Codes -->
              <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 8px;">
                Common Codes (click to run):
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                ${['F1', 'F2', 'F3', 'C3', 'C7', 'FP', 'Fd', 'Eo'].map(code => html`
                  <button
                    @click=${() => methods.runDiagnostic(state, code)}
                    style="
                      padding: 6px 10px;
                      background: ${state.selectedDiagnosticCode === code ? activeTheme.yellow : activeTheme.bg1};
                      border: 1px solid ${state.selectedDiagnosticCode === code ? activeTheme.yellow : activeTheme.border};
                      color: ${state.selectedDiagnosticCode === code ? activeTheme.bg0 : activeTheme.fg};
                      border-radius: 4px;
                      font-family: monospace;
                      font-size: 11px;
                      font-weight: bold;
                      cursor: pointer;
                      transition: all 0.2s;
                    "
                  >${code}</button>
                `)}
              </div>
              
              <!-- Link to Full Diagnostics -->
              <div style="
                background: ${activeTheme.bg0};
                border: 1px solid ${activeTheme.border};
                border-radius: 6px;
                padding: 10px;
                text-align: center;
              ">
                <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 6px;">
                  For full diagnostics with voice feedback
                </div>
                <button
                  @click=${() => {
                    window.dispatchEvent(new CustomEvent('esa:open-diagnostics', { detail: { source: 'ESA-Ptac-B' } }));
                    methods.switchTab(state, 'overview');
                  }}
                  style="
                    padding: 6px 16px;
                    background: transparent;
                    border: 1px solid ${activeTheme.aqua};
                    color: ${activeTheme.aqua};
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                  "
                >
                  Open ESA.DiagnosticCard →
                </button>
              </div>
            </div>
          ` : ''}
          
          ${state.activeTab === 'broadcast' ? html`
            <!-- BROADCAST TAB -->
            <div>
              <div style="font-size: 11px; color: ${activeTheme.purple}; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                Service Broadcasting Center
              </div>
              
              <!-- Broadcast Status -->
              <div style="
                background: ${state.broadcastMode ? `${activeTheme.green}15` : activeTheme.bg0};
                border: 1px solid ${state.broadcastMode ? activeTheme.green : activeTheme.border};
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                text-align: center;
              ">
                <div style="font-size: 24px; margin-bottom: 4px;">
                  ${state.broadcastMode ? '📡' : '📴'}
                </div>
                <div style="font-weight: bold; color: ${state.broadcastMode ? activeTheme.green : activeTheme.fg_soft};">
                  ${state.broadcastMode ? 'BROADCASTING ACTIVE' : 'BROADCASTING STANDBY'}
                </div>
                ${state.currentBroadcast ? html`
                  <div style="font-size: 10px; color: ${activeTheme.fg_soft}; margin-top: 4px;">
                    Last: ${state.currentBroadcast.message.substring(0, 50)}...
                  </div>
                ` : ''}
              </div>
              
              <!-- Quick Broadcast Templates -->
              <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 8px;">
                Quick Broadcast:
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
                <button
                  @click=${() => methods.broadcastMessage(state, 'scheduled')}
                  style="
                    padding: 10px;
                    background: ${activeTheme.blue}20;
                    border: 1px solid ${activeTheme.blue};
                    color: ${activeTheme.blue};
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                  "
                  onmouseenter=${(e) => e.target.style.background = `${activeTheme.blue}30`}
                  onmouseleave=${(e) => e.target.style.background = `${activeTheme.blue}20`}
                >
                  📅 Scheduled Maintenance Reminder
                </button>
                
                <button
                  @click=${() => methods.broadcastMessage(state, 'urgent')}
                  style="
                    padding: 10px;
                    background: ${activeTheme.red}20;
                    border: 1px solid ${activeTheme.red};
                    color: ${activeTheme.red};
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                  "
                  onmouseenter=${(e) => e.target.style.background = `${activeTheme.red}30`}
                  onmouseleave=${(e) => e.target.style.background = `${activeTheme.red}20`}
                >
                  ⚠️ Urgent Alert
                </button>
                
                <button
                  @click=${() => methods.broadcastMessage(state, 'completed')}
                  style="
                    padding: 10px;
                    background: ${activeTheme.green}20;
                    border: 1px solid ${activeTheme.green};
                    color: ${activeTheme.green};
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                  "
                  onmouseenter=${(e) => e.target.style.background = `${activeTheme.green}30`}
                  onmouseleave=${(e) => e.target.style.background = `${activeTheme.green}20`}
                >
                  ✅ Service Complete
                </button>
              </div>
              
              <!-- Custom Broadcast -->
              <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 8px;">
                Custom Message:
              </div>
              <textarea
                placeholder="Type custom broadcast message..."
                style="
                  width: 100%;
                  min-height: 60px;
                  padding: 8px 10px;
                  background: ${activeTheme.bg0};
                  border: 1px solid ${activeTheme.border};
                  border-radius: 4px;
                  color: ${activeTheme.fg};
                  font-size: 12px;
                  resize: vertical;
                  font-family: inherit;
                  margin-bottom: 8px;
                "
              ></textarea>
              
              <div style="display: flex; gap: 8px;">
                <button
                  @click=${(e) => {
                    const textarea = e.target.parentElement.previousElementSibling;
                    if (textarea.value.trim()) {
                      methods.broadcastMessage(state, 'custom', textarea.value);
                      textarea.value = '';
                    }
                  }}
                  style="
                    flex: 1;
                    padding: 8px;
                    background: ${activeTheme.purple};
                    color: ${activeTheme.bg0};
                    border: none;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 12px;
                    cursor: pointer;
                  "
                >📢 Send Broadcast</button>
                
                <button
                  @click=${(e) => {
                    const textarea = e.target.parentElement.previousElementSibling;
                    if (textarea.value.trim()) {
                      methods.speak(state, textarea.value);
                    }
                  }}
                  style="
                    padding: 8px 12px;
                    background: ${activeTheme.bg1};
                    border: 1px solid ${activeTheme.border};
                    color: ${activeTheme.fg};
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                  "
                >🎤 Speak Only</button>
              </div>
              
              <!-- Broadcast History -->
              ${state.broadcastHistory.length > 0 ? html`
                <div style="margin-top: 16px;">
                  <div style="font-size: 11px; color: ${activeTheme.fg_soft}; margin-bottom: 8px;">
                    Recent Broadcasts (${state.broadcastHistory.length})
                  </div>
                  ${state.broadcastHistory.slice(0, 5).map(bc => html`
                    <div style="
                      background: ${activeTheme.bg0};
                      border-left: 3px solid ${bc.type === 'urgent' ? activeTheme.red : bc.type === 'completed' ? activeTheme.green : activeTheme.blue};
                      padding: 6px 10px;
                      margin-bottom: 4px;
                      border-radius: 0 4px 4px 0;
                      font-size: 10px;
                    ">
                      <div style="color: ${activeTheme.fg};">${bc.message.substring(0, 60)}${bc.message.length > 60 ? '...' : ''}</div>
                      <div style="color: ${activeTheme.fg_soft}; margin-top: 2px;">
                        ${new Date(bc.timestamp).toLocaleTimeString()} • ${bc.type}
                      </div>
                    </div>
                  `)}
                </div>
              ` : ''}
            </div>
          ` : ''}
          
        </div>
        
        <!-- Footer Status Bar -->
        <div style="
          background: ${activeTheme.bg1};
          border-top: 1px solid ${activeTheme.border};
          padding: 6px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          color: ${activeTheme.fg_soft};
        ">
          <span>ESA-PTAC-B v1.0</span>
          <span>${state.connections.transport ? '🟢 Transport' : '🔴 No Transport'}</span>
        </div>
      </div>
      
      <!-- Toggle Button (when closed) -->
      ${!state.isOpen ? html`
        <button
          @click=${() => methods.togglePanel(state, true)}
          style="
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            background: ${activeTheme.purple};
            color: ${activeTheme.bg0};
            border: none;
            border-radius: 8px 0 0 8px;
            padding: 16px 8px;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            z-index: 999;
            box-shadow: -2px 0 10px rgba(0,0,0,0.3);
            transition: all 0.2s;
          "
          onmouseenter=${(e) => e.style.paddingLeft = '12px'}
          onmouseleave=${(e) => e.style.paddingLeft = '8px'}
        >📡 PTAC-B</button>
      ` : ''}
    `
  }
}).component;

// Initialize on import
if (typeof window !== 'undefined') {
  // Will be initialized by integration.js
}

export default ESAPtacB;
