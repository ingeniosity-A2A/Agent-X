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

// Module-scope handle so methods.* can call each other (assigned after export).
let methods = null;

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
      <style>
        /* PTAC-B service broadcast card — V6 UI8 palette via ava-shell.css
           tokens. Static classes ONLY: this Arrow build forbids dollar-brace
           interpolation inside attribute positions (style/class/events), and
           its reactive updates are broken across CDNs, so this card renders
           ONCE and a post-mount wrapper (see below) syncs DOM from state
           after every action. */
        .ptac-card { color: var(--bk-text); }
        .ptac-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--bk-border-soft); background: rgba(0,0,0,0.25); }
        .ptac-live { padding: 4px 12px; border-radius: 999px; border: 1px solid var(--bk-border); background: var(--bk-panel-2); color: var(--bk-text-2); font-size: 10.5px; font-weight: 600; letter-spacing: 0.06em; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .ptac-live:hover { background: #232323; color: var(--bk-text); }
        .ptac-card[data-broadcast="on"] .ptac-live { border-color: rgba(229,72,77,0.5); color: var(--bk-danger); background: rgba(229,72,77,0.12); }
        .ptac-tabs { display: flex; gap: 2px; padding: 6px 10px 0; border-bottom: 1px solid var(--bk-border-soft); background: var(--bk-panel-2); overflow-x: auto; }
        .ptac-tab { padding: 8px 12px; border: none; border-bottom: 2px solid transparent; background: none; color: var(--bk-text-3); font-size: 11px; cursor: pointer; white-space: nowrap; transition: color 0.15s; font-family: inherit; }
        .ptac-tab:hover { color: var(--bk-text); }
        .ptac-tab.active { color: var(--bk-accent); border-bottom-color: var(--bk-accent); font-weight: 600; }
        .ptac-panel[hidden] { display: none; }
        .ptac-body { flex: 1; overflow-y: auto; padding: 14px; max-height: 430px; }
        .ptac-panel-h { font-size: 11px; color: var(--bk-accent-3); font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .ptac-hero { background: linear-gradient(135deg, var(--bk-panel) 0%, var(--bk-panel-2) 100%); border: 1px solid rgba(91,141,239,0.35); border-radius: 10px; padding: 12px; margin-bottom: 12px; }
        .ptac-kicker { font-size: 10px; color: var(--bk-info); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .ptac-product { font-weight: 700; color: var(--bk-text); font-size: 13px; margin-bottom: 8px; }
        .ptac-price { color: var(--bk-accent); font-size: 18px; font-weight: 700; }
        .ptac-row-between { display: flex; justify-content: space-between; align-items: center; }
        .ptac-btn { padding: 6px 12px; background: var(--bk-info); color: #0a0a0a; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; font-family: inherit; }
        .ptac-btn:hover { opacity: 0.85; }
        .ptac-btn--ghost { background: var(--bk-panel-2); color: var(--bk-text); border: 1px solid var(--bk-border); font-weight: 500; }
        .ptac-btn--ghost:hover { border-color: rgba(91,141,239,0.45); opacity: 1; color: #fff; }
        .ptac-spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .ptac-spec { background: var(--bk-panel-2); border: 1px solid var(--bk-border-soft); padding: 6px 8px; border-radius: 6px; font-size: 11px; }
        .ptac-spec-k { color: var(--bk-text-3); }
        .ptac-spec-v { color: var(--bk-text); font-weight: 500; }
        .ptact-quick { display: flex; flex-direction: column; gap: 6px; }
        .ptac-qa { padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; text-align: left; transition: filter 0.2s; font-family: inherit; border: 1px solid; background: rgba(0,0,0,0.2); }
        .ptac-qa:hover { filter: brightness(1.25); }
        .ptac-qa--ok { border-color: rgba(126,200,160,0.4); color: var(--bk-accent); }
        .ptac-qa--warn { border-color: rgba(224,161,62,0.4); color: var(--bk-warn); }
        .ptac-qa--info { border-color: rgba(139,92,246,0.4); color: #b39bff; }
        .ptac-part { background: var(--bk-panel-2); border: 1px solid var(--bk-border-soft); border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; transition: border-color 0.2s; }
        .ptac-part:hover { border-color: rgba(91,141,239,0.45); }
        .ptac-part-name { font-weight: 500; color: var(--bk-text); font-size: 12px; }
        .ptac-part-meta { font-size: 10px; color: var(--bk-text-3); margin-top: 2px; }
        .ptac-freq { color: var(--bk-warn); }
        .ptac-price-s { color: var(--bk-accent); font-weight: 700; font-size: 12px; }
        .ptac-mini { padding: 4px 8px; border-radius: 6px; font-size: 10px; cursor: pointer; font-family: inherit; transition: opacity 0.2s; }
        .ptac-mini:hover { opacity: 0.85; }
        .ptac-mini--primary { background: var(--bk-info); color: #0a0a0a; border: none; font-weight: 700; }
        .ptac-mini--ghost { background: var(--bk-panel); color: var(--bk-text); border: 1px solid var(--bk-border); }
        .ptac-svc-row { background: var(--bk-panel-2); border: 1px solid var(--bk-border-soft); border-radius: 8px; padding: 10px; margin-bottom: 8px; }
        .ptac-svc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .ptac-svc-name { font-weight: 500; color: var(--bk-text); font-size: 12px; }
        .ptac-pill-s { font-size: 10px; padding: 2px 8px; border-radius: 999px; font-weight: 700; letter-spacing: 0.05em; }
        .ptac-pill-danger { background: rgba(229,72,77,0.14); color: var(--bk-danger); border: 1px solid rgba(229,72,77,0.35); }
        .ptac-pill-warn { background: rgba(224,161,62,0.14); color: var(--bk-warn); border: 1px solid rgba(224,161,62,0.35); }
        .ptac-pill-ok { background: rgba(126,200,160,0.14); color: var(--bk-accent); border: 1px solid rgba(126,200,160,0.35); }
        .ptac-meta { font-size: 10px; color: var(--bk-text-3); }
        .ptac-hist-row { background: var(--bk-panel-2); padding: 8px 10px; margin-bottom: 6px; border-radius: 0 6px 6px 0; display: flex; gap: 8px; }
        .ptac-bar { width: 3px; border-radius: 2px; flex-shrink: 0; }
        .ptac-bar-danger { background: var(--bk-danger); }
        .ptac-bar-info { background: var(--bk-info); }
        .ptac-bar-ok { background: var(--bk-accent); }
        .ptac-input { flex: 1; padding: 8px 10px; background: var(--bk-panel-2); border: 1px solid var(--bk-border); border-radius: 6px; color: var(--bk-text); font-size: 12px; font-family: ui-monospace, monospace; outline: none; }
        .ptac-input:focus { border-color: rgba(126,200,160,0.45); }
        .ptac-codes { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .ptac-code { padding: 6px 10px; background: var(--bk-panel); border: 1px solid var(--bk-border); color: var(--bk-text); border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .ptac-code:hover { border-color: rgba(224,161,62,0.5); color: var(--bk-warn); }
        .ptac-status { background: var(--bk-panel-2); border: 1px solid var(--bk-border-soft); border-radius: 10px; padding: 14px; margin-bottom: 12px; text-align: center; transition: border-color 0.3s; }
        .ptac-card[data-broadcast="on"] .ptac-status { border-color: rgba(126,200,160,0.45); background: rgba(126,200,160,0.06); }
        .ptac-status-icon { font-size: 24px; margin-bottom: 4px; }
        .ptac-status-label { font-weight: 700; color: var(--bk-text-3); }
        .ptac-card[data-broadcast="on"] .ptac-status-label { color: var(--bk-accent); }
        .ptac-quick-b { padding: 10px; border-radius: 8px; font-size: 12px; cursor: pointer; text-align: left; border: 1px solid; background: rgba(0,0,0,0.2); transition: filter 0.2s; font-family: inherit; }
        .ptac-quick-b:hover { filter: brightness(1.25); }
        .ptac-custom { width: 100%; min-height: 60px; padding: 8px 10px; background: var(--bk-panel-2); border: 1px solid var(--bk-border); border-radius: 6px; color: var(--bk-text); font-size: 12px; resize: vertical; font-family: inherit; margin-bottom: 8px; outline: none; box-sizing: border-box; }
        .ptac-custom:focus { border-color: rgba(139,92,246,0.5); }
        .ptac-footer { background: rgba(0,0,0,0.25); border-top: 1px solid var(--bk-border-soft); padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: var(--bk-text-3); }
        .ptac-hidden-v { display: none; }
      </style>
      <div class="bento-card ptac-card" data-broadcast="off">
        <div class="bento-demo">
          <div class="ptac-head">
            <div>
              <div style="font-weight: 700; font-size: 13px; color: var(--bk-text);">📡 PTAC Service Broadcast</div>
              <div style="font-size: 10.5px; color: var(--bk-text-3); margin-top: 2px;">HD Supply <span class="mono">#${state.unit.hdSupply.partNumber}</span> · live unit feed</div>
            </div>
            <button class="ptac-live" data-click="liveToggle">⚫ OFF</button>
          </div>

          <div class="ptac-tabs">
            <button class="ptac-tab active" data-tab="overview">Overview</button>
            <button class="ptac-tab" data-tab="parts">Parts</button>
            <button class="ptac-tab" data-tab="service">Service</button>
            <button class="ptac-tab" data-tab="diagnostics">Diagnostics</button>
            <button class="ptac-tab" data-tab="broadcast">Broadcast</button>
          </div>

          <div class="ptac-body">
            <div class="ptac-panel" data-panel="overview">
              <div class="ptac-panel-h">HD Supply Product</div>
              <div class="ptac-hero">
                <div class="ptac-kicker">Seasons 9000 BTU PTAC</div>
                <div class="ptac-product">${state.unit.hdSupply.fullTitle}</div>
                <div class="ptac-row-between">
                  <span class="ptac-price">$${state.unit.hdSupply.price.toFixed(2)}</span>
                  <button class="ptac-btn" data-click="openHDSupply">View on HD Supply →</button>
                </div>
              </div>

              <div class="ptac-panel-h">Specifications</div>
              <div class="ptac-spec-grid">
                ${Object.entries(state.unit.specs).map(([key, value]) => html`
                  <div class="ptac-spec">
                    <span class="ptac-spec-k">${key.replace(/([A-Z])/g, ' $1')}: </span>
                    <span class="ptac-spec-v">${value}</span>
                  </div>
                `)}
              </div>

              <div class="ptac-panel-h" style="margin-top: 14px;">Quick Actions</div>
              <div class="ptact-quick">
                <button class="ptac-qa ptac-qa--ok" data-click="createWorkorder">📋 Create Workorder</button>
                <button class="ptac-qa ptac-qa--warn" data-click="runCode"><i class="ptac-hidden-v">FP</i>🔧 Run Diagnostics</button>
                <button class="ptac-qa ptac-qa--info" data-click="broadcast" data-arg="scheduled">📢 Send Broadcast</button>
              </div>
            </div>

            <div class="ptac-panel" data-panel="parts" hidden>
              <div class="ptac-panel-h">Common Parts for ${state.unit.hdSupply.partNumber}</div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${state.unit.commonParts.map(part => html`
                  <div class="ptac-part">
                    <div>
                      <div class="ptac-part-name">${part.name}</div>
                      <div class="ptac-part-meta">SKU: ${part.sku} • ${part.category}${part.frequency ? html`<span class="ptac-freq"> • ${part.frequency}</span>` : ''}</div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                      <span class="ptac-price-s">$${part.price.toFixed(2)}</span>
                      <button class="ptac-mini ptac-mini--primary" data-click="addPart"><i class="ptac-hidden-v">${part.sku}</i>+ WO</button>
                      <button class="ptac-mini ptac-mini--ghost" data-click="lookupPart" title="Lookup part"><i class="ptac-hidden-v">${part.sku}</i>🔍</button>
                    </div>
                  </div>
                `)}
              </div>
            </div>

            <div class="ptac-panel" data-panel="service" hidden>
              <div class="ptac-panel-h">Service Schedule & History</div>
              <div class="ptac-meta" style="margin-bottom: 8px;">Maintenance Intervals</div>
              ${Object.entries(methods.getServiceStatus(state)).map(([key, status]) => html`
                <div class="ptac-svc-row">
                  <div class="ptac-svc-top">
                    <span class="ptac-svc-name">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    ${status.status === 'overdue' ? html`<span class="ptac-pill-s ptac-pill-danger">OVERDUE</span>` : status.status === 'due-soon' ? html`<span class="ptac-pill-s ptac-pill-warn">Due Soon</span>` : html`<span class="ptac-pill-s ptac-pill-ok">OK</span>`}
                  </div>
                  <div class="ptac-meta">Interval: ${status.interval} • Last: ${status.lastServiceDate} • Due: ${status.nextDueDate}</div>
                </div>
              `)}
              <div class="ptac-meta" style="margin: 12px 0 8px;">Recent Service History</div>
              ${state.serviceHistory.map(entry => html`
                <div class="ptac-hist-row">
                  ${entry.type === 'repair' ? html`<i class="ptac-bar ptac-bar-danger"></i>` : entry.type === 'inspection' ? html`<i class="ptac-bar ptac-bar-info"></i>` : html`<i class="ptac-bar ptac-bar-ok"></i>`}
                  <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                      <span style="font-weight: 500; color: var(--bk-text); font-size: 11px;">${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</span>
                      <span class="ptac-meta">${entry.date}</span>
                    </div>
                    <div class="ptac-meta">${entry.technician} • ${entry.notes}</div>
                  </div>
                </div>
              `)}
            </div>

            <div class="ptac-panel" data-panel="diagnostics" hidden>
              <div class="ptac-panel-h">Quick Diagnostics</div>
              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <input class="ptac-input" data-ptac-input="selectedDiagnosticCode" placeholder="Enter code (F1, C3, etc.)" />
                <button class="ptac-btn" style="background: var(--bk-warn);" data-click="runInput">Run</button>
              </div>
              <div class="ptac-meta" style="margin-bottom: 8px;">Common Codes (click to run):</div>
              <div class="ptac-codes">
                ${['F1', 'F2', 'F3', 'C3', 'C7', 'FP', 'Fd', 'Eo'].map(code => html`
                  <button class="ptac-code" data-click="runCode"><i class="ptac-hidden-v">${code}</i>${code}</button>
                `)}
              </div>
              <div style="background: var(--bk-panel-2); border: 1px solid var(--bk-border-soft); border-radius: 8px; padding: 10px; text-align: center;">
                <div class="ptac-meta" style="margin-bottom: 6px;">For full diagnostics with voice feedback</div>
                <button class="ptac-btn ptac-btn--ghost" data-click="openDiagnostics">Open ESA.DiagnosticCard →</button>
              </div>
            </div>

            <div class="ptac-panel" data-panel="broadcast" hidden>
              <div class="ptac-panel-h">Service Broadcasting Center</div>
              <div class="ptac-status">
                <div class="ptac-status-icon">📴</div>
                <div class="ptac-status-label">BROADCASTING STANDBY</div>
                <div class="ptac-meta ptac-status-last" style="margin-top: 4px; display: none;"></div>
              </div>
              <div class="ptac-meta" style="margin-bottom: 8px;">Quick Broadcast:</div>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
                <button class="ptac-quick-b ptac-qa--info" data-click="broadcast" data-arg="scheduled">📅 Scheduled Maintenance Reminder</button>
                <button class="ptac-quick-b ptac-qa--warn" data-click="broadcast" data-arg="urgent">⚠️ Urgent Alert</button>
                <button class="ptac-quick-b ptac-qa--ok" data-click="broadcast" data-arg="completed">✅ Service Complete</button>
              </div>
              <div class="ptac-meta" style="margin-bottom: 8px;">Custom Message:</div>
              <textarea class="ptac-custom" placeholder="Type custom broadcast message..."></textarea>
              <div style="display: flex; gap: 8px;">
                <button class="ptac-btn" style="flex: 1; background: #8b5cf6;" data-click="customBroadcast">📢 Send Broadcast</button>
                <button class="ptac-btn ptac-btn--ghost" data-click="speakCustom">🎤 Speak Only</button>
              </div>
              <div style="margin-top: 16px;">
                <div class="ptac-meta ptac-hist-head" style="margin-bottom: 8px; display: none;"></div>
                <div class="ptac-hist-list"></div>
              </div>
            </div>
          </div>

          <div class="ptac-footer">
            <span>ESA-PTAC-B v1.0</span>
            <span class="ptac-transport">${state.connections.transport ? '🟢 Transport' : '🔴 No Transport'}</span>
          </div>
        </div>

        <div class="bento-text">
          <div class="bento-title">PTAC Service <em>Broadcast</em></div>
          <p class="bento-desc">Seasons 9000 BTU PTAC · HD Supply #${state.unit.hdSupply.partNumber}. Parts, service schedule, diagnostic codes and Ava007 voice broadcasts for this unit — wired to the workorder and diagnostic cards.</p>
          <button class="bk-btn primary" data-click="openHDSupply">HD Supply Catalog ↗</button>
        </div>
      </div>
    `;
  }
});

// ---------------------------------------------------------------------------
// Post-mount wiring (Arrow 1.0.6-safe): the template renders ONCE — this
// Arrow build's reactive updates are broken on every CDN — so this wrapper
// binds delegated listeners and re-syncs the DOM from state after each
// action. Same architecture as ESA.DiagnosticCard 3.0 / ESA.workorder 3.0.
// ---------------------------------------------------------------------------
const origPtacMount = ESAPtacB.mount.bind(ESAPtacB);
methods = ESAPtacB.methods; // bind module-scope handle: methods.* call each other
ESAPtacB.mount = function (container) {
  const handle = origPtacMount(container);
  if (!handle) return handle;
  const cnt = handle.container || container;
  const pState = ESAPtacB.state;
  const pMethods = ESAPtacB.methods;

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function syncTabs() {
    cnt.querySelectorAll('.ptac-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === pState.activeTab));
    cnt.querySelectorAll('.ptac-panel').forEach((p) => {
      if (p.dataset.panel === pState.activeTab) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    });
  }

  function syncLive() {
    const on = !!pState.broadcastMode;
    cnt.dataset.broadcast = on ? 'on' : 'off';
    const live = cnt.querySelector('.ptac-live');
    if (live) live.textContent = on ? '\u{1F534} LIVE' : '\u26AB OFF';
    const icon = cnt.querySelector('.ptac-status-icon');
    if (icon) icon.textContent = on ? '\u{1F4E1}' : '\u{1F4E4}';
    const label = cnt.querySelector('.ptac-status-label');
    if (label) label.textContent = on ? 'BROADCASTING ACTIVE' : 'BROADCASTING STANDBY';
    const last = cnt.querySelector('.ptac-status-last');
    if (last) {
      const msg = pState.currentBroadcast && pState.currentBroadcast.message;
      if (msg) {
        last.style.display = '';
        last.textContent = 'Last: ' + String(msg).substring(0, 50) + '...';
      } else {
        last.style.display = 'none';
      }
    }
  }

  function syncHistory() {
    const head = cnt.querySelector('.ptac-hist-head');
    const list = cnt.querySelector('.ptac-hist-list');
    if (!head || !list) return;
    const hist = pState.broadcastHistory || [];
    if (!hist.length) {
      head.style.display = 'none';
      list.innerHTML = '';
      return;
    }
    head.style.display = '';
    head.textContent = 'Recent Broadcasts (' + hist.length + ')';
    list.innerHTML = '';
    hist.slice(0, 5).forEach((bc) => {
      const row = document.createElement('div');
      row.className = 'ptac-hist-row';
      row.style.fontSize = '10px';
      const bar = document.createElement('i');
      bar.className = 'ptac-bar ' + (bc.type === 'urgent' ? 'ptac-bar-danger' : bc.type === 'completed' ? 'ptac-bar-ok' : 'ptac-bar-info');
      const body = document.createElement('div');
      const line1 = document.createElement('div');
      line1.style.color = 'var(--bk-text)';
      line1.textContent = String(bc.message || '').substring(0, 60) + (String(bc.message || '').length > 60 ? '...' : '');
      const line2 = document.createElement('div');
      line2.className = 'ptac-meta';
      line2.style.marginTop = '2px';
      line2.textContent = new Date(bc.timestamp).toLocaleTimeString() + ' \u2022 ' + bc.type;
      body.appendChild(line1);
      body.appendChild(line2);
      row.appendChild(bar);
      row.appendChild(body);
      list.appendChild(row);
    });
  }

  function syncAll() { syncTabs(); syncLive(); syncHistory(); }

  cnt.addEventListener('click', (e) => {
    const tab = e.target.closest('.ptac-tab');
    if (tab) {
      pMethods.switchTab(pState, tab.dataset.tab);
      syncTabs();
      return;
    }

    const btn = e.target.closest('[data-click]');
    if (!btn) return;
    const action = btn.dataset.click;
    const hiddenV = btn.querySelector('i.ptac-hidden-v');
    const val = hiddenV ? hiddenV.textContent.trim() : btn.dataset.arg;

    switch (action) {
      case 'liveToggle':
        if (pState.broadcastMode) pMethods.stopBroadcast(pState);
        else pMethods.startBroadcast(pState);
        break;
      case 'broadcast':
        pMethods.broadcastMessage(pState, val || 'scheduled');
        break;
      case 'runCode':
        pMethods.runDiagnostic(pState, val);
        break;
      case 'runInput':
        pMethods.runDiagnostic(pState, pState.selectedDiagnosticCode);
        break;
      case 'addPart': {
        const part = pState.unit.commonParts.find((p) => String(p.sku) === val);
        if (part) pMethods.addPartToWorkorder(pState, part);
        break;
      }
      case 'lookupPart':
        pMethods.lookupPart(pState, val);
        break;
      case 'openDiagnostics':
        window.dispatchEvent(new CustomEvent('esa:open-diagnostics', { detail: { source: 'ESA-Ptac-B' } }));
        pMethods.switchTab(pState, 'overview');
        break;
      case 'customBroadcast': {
        const ta = cnt.querySelector('.ptac-custom');
        if (ta && ta.value.trim()) {
          pMethods.broadcastMessage(pState, 'custom', ta.value);
          ta.value = '';
        }
        break;
      }
      case 'speakCustom': {
        const ta = cnt.querySelector('.ptac-custom');
        if (ta && ta.value.trim()) pMethods.speak(pState, ta.value);
        break;
      }
      default:
        if (typeof pMethods[action] === 'function') pMethods[action](pState, val);
    }
    syncAll();
  });

  cnt.addEventListener('input', (e) => {
    const el = e.target.closest('[data-ptac-input]');
    if (el) pState[el.dataset.ptacInput] = e.target.value;
  });

  syncAll();
  console.log('[ESA.Verify] Ptac-B post-mount delegation + render-sync wired');
  return handle;
};

// ESAVerifyComponent returns the wrapper itself ({ mount, view, state, methods })
// - there is no `.component` property; exporting the wrapper keeps the .mount()
// contract that integration.js calls.

export default ESAPtacB;

