/**
 * ESA.GSAPTransport.js
 * 
 * GSAP TRANSPORT LAYER for ESA EXOSKELETON
 * 
 * This is NOT animation - this is the TRANSPORT MECHANISM:
 * 
 * 1. TWEEN ATOMS - Mathematical transition laws shared between nodes
 *    Instead of raw state streams, nodes share ~100 byte tween atoms
 *    Any node can deterministically reconstruct intermediate states
 * 
 * 2. TEMPORAL ORCHESTRATOR - State synchronization
 *    Reconstructs full timeline from Interaction Quanta
 *    Uses temporal_tween fields for deterministic state replay
 * 
 * 3. BANDWIDTH EFFICIENCY
 *    Drops from MB/s to bytes per second
 *    Raw state at 30fps: ~240 bytes/sec
 *    Tween atom: ~100 bytes ONE TIME
 * 
 * 4. SPATIAL MEMORY PALACE
 *    Maps RF angle-of-arrival and RSSI to coordinates
 *    ScrollTrigger-compatible coordinate system
 * 
 * Architecture Position:
 * ┌─────────────────────────────────┐
 * │      CYBERNETIC AVA007         │
 * └──────────────┬──────────────────┘
 *                │ intent
 *                ▼
 * ┌─────────────────────────────────┐
 * │   GSAP TRANSPORT LAYER (THIS)  │  ← WE ARE HERE
 * │   • Tween atoms                │
 * │   • Temporal orchestrator      │
 * │   • State synchronization      │
 * └──────────────┬──────────────────┘
 *                │
 *                ▼
 * ┌─────────────────────────────────┐
 * │   ARROW.JS SANDBOX (components) │
 * └─────────────────────────────────┘
 */

// ============================================
// EASING FUNCTIONS (Mathematical Transition Laws)
// ============================================

const EASING_FUNCTIONS = {
  linear: t => t,
  'ease-in': t => t * t,
  'ease-out': t => t * (2 - t),
  'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'power2.in': t => t * t,
  'power2.out': t => t * (2 - t),
  'power2.inOut': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  elastic: t => {
    if (t === 0 || t === 1) return t;
    return -(2 ** (10 * (t - 1))) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  bounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      t -= 1.5 / d1;
      return n1 * t * t + 0.75;
    } else if (t < 2.5 / d1) {
      t -= 2.25 / d1;
      return n1 * t * t + 0.9375;
    } else {
      t -= 2.625 / d1;
      return n1 * t * t + 0.984375;
    }
  },
  back: t => t * t * (2.70158 * t - 1.70158)
};

// ============================================
// TWEEN ATOM - The fundamental transport unit
// ============================================

class TweenAtom {
  /**
   * A mathematical transition law that can be shared between nodes
   * instead of raw state streams.
   * 
   * Given start/end values and an easing function, any node can
   * deterministically reconstruct intermediate states at any time.
   */
  constructor(config = {}) {
    this.start = config.start ?? 0;
    this.end = config.end ?? 1;
    this.duration_ms = config.duration_ms ?? 100;
    this.easing = config.easing ?? 'linear';
    this.delay_ms = config.delay_ms ?? 0;
    this.id = config.id || `atom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.intent = config.intent || 'default';
    this.metadata = config.metadata || {};
  }

  /**
   * Compute the interpolated value at elapsed_ms
   * This is the CORE TRANSPORT FUNCTION - any node can call this
   */
  interpolate(elapsed_ms) {
    if (elapsed_ms < this.delay_ms) {
      return this.start;
    }

    let t = (elapsed_ms - this.delay_ms) / this.duration_ms;
    t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]

    const easingFn = EASING_FUNCTIONS[this.easing] || EASING_FUNCTIONS.linear;
    const easedT = easingFn(t);

    return this.start + (this.end - this.start) * easedT;
  }

  /**
   * Serialize for transport (~100 bytes)
   */
  toJSON() {
    return {
      id: this.id,
      intent: this.intent,
      s: this.start,           // Short keys for bandwidth
      e: this.end,
      d: this.duration_ms,
      ease: this.easing[0],    // First char of easing name
      delay: this.delay_ms,
      m: this.metadata
    };
  }

  /**
   * Calculate bandwidth savings vs raw state streaming
   */
  getBandwidthSavings(updatesPerSecond = 30) {
    const rawBytes = updatesPerSecond * 8 * (this.duration_ms / 1000); // 8 bytes per float64 update
    const atomBytes = JSON.stringify(this.toJSON()).length;
    
    return {
      rawBytesPerSecond: updatesPerSecond * 8,
      totalRawBytes: Math.round(rawBytes),
      atomBytes,
      savingsPercent: rawBytes > 0 ? Math.round((1 - atomBytes / rawBytes) * 100) : 0,
      compressionRatio: rawBytes > 0 ? (rawBytes / atomBytes).toFixed(1) : 0
    };
  }

  static fromJSON(data) {
    return new TweenAtom({
      id: data.id,
      intent: data.intent,
      start: data.s ?? data.start,
      end: data.e ?? data.end,
      duration_ms: data.d ?? data.duration_ms,
      easing: data.ease ? Object.keys(EASING_FUNCTIONS).find(e => e[0] === data.ease) : (data.easing ?? 'linear'),
      delay_ms: data.delay ?? data.delay_ms,
      metadata: data.m ?? data.metadata
    });
  }
}

// ============================================
// TWEEN TIMELINE - Sequenced/Parallel atoms
// ============================================

class TweenTimeline {
  /**
   * A collection of tween atoms that run in sequence or parallel.
   * Maps to GSAP timeline concept.
   */
  constructor(name = 'default') {
    this.name = name;
    this.atoms = [];
    this.totalDurationMs = 0;
    this.createdAt = Date.now();
  }

  /**
   * Add a tween atom to the timeline
   */
  add(atom) {
    if (!(atom instanceof TweenAtom)) {
      atom = new TweenAtom(atom);
    }
    this.atoms.push(atom);
    this.totalDurationMs = Math.max(
      this.totalDurationMs,
      atom.delay_ms + atom.duration_ms
    );
    return this; // Chainable
  }

  /**
   * Evaluate all atoms at given elapsed time
   * Returns array of current values
   */
  evaluate(elapsed_ms) {
    return this.atoms.map(atom => ({
      id: atom.id,
      intent: atom.intent,
      value: atom.interpolate(elapsed_ms),
      progress: Math.min(1, Math.max(0, (elapsed_ms - atom.delay_ms) / atom.duration_ms))
    }));
  }

  /**
   * Get state as object keyed by intent
   */
  getState(elapsed_ms) {
    const evaluation = this.evaluate(elapsed_ms);
    const state = {};
    evaluation.forEach(e => {
      state[e.intent] = e.value;
    });
    return state;
  }

  /**
   * Check if timeline is complete at given time
   */
  isComplete(elapsed_ms) {
    return elapsed_ms >= this.totalDurationMs;
  }

  /**
   * Get progress (0-1) for entire timeline
   */
  getProgress(elapsed_ms) {
    if (this.totalDurationMs === 0) return 1;
    return Math.min(1, elapsed_ms / this.totalDurationMs);
  }

  toJSON() {
    return {
      name: this.name,
      atoms: this.atoms.map(a => a.toJSON()),
      totalDurationMs: this.totalDurationMs,
      createdAt: this.createdAt
    };
  }
}

// ============================================
// TEMPORAL ORCHESTRATOR - Core Transport Engine
// ============================================

class TemporalOrchestrator {
  /**
   * Orchestrates temporal reconstruction from Interaction Quanta.
   * 
   * Instead of streaming raw audio/video/RF/data, nodes share
   * Interaction Quanta with temporal_tween fields.
   * The orchestrator reconstructs the full timeline deterministically.
   * 
   * THIS IS THE HEART OF THE GSAP TRANSPORT LAYER
   */
  constructor(options = {}) {
    this.id = `orchestrator-${Date.now()}`;
    this.timelines = new Map(); // intent -> TweenTimeline
    this.quanta = [];
    this.startTime = null;
    this.options = {
      maxQuanta: options.maxQuanta || 1000,
      autoPrune: options.autoPrune !== false,
      ...options
    };
    
    // Statistics
    this.stats = {
      quantaIngested: 0,
      timelinesCreated: 0,
      bytesTransported: 0,
      bytesSaved: 0,
      reconstructions: 0
    };

    // Event listeners
    this.listeners = new Map();
  }

  /**
   * Ingest an Interaction Quantum into the orchestrator
   * This is how data ENTERS the transport layer
   */
  ingest(quantum) {
    // Normalize quantum to object
    const q = typeof quantum === 'object' && quantum !== null ? quantum : { data: quantum };
    
    // Track bytes
    const quantumSize = JSON.stringify(q).length;
    this.stats.bytesTransported += quantumSize;

    if (this.startTime === null) {
      this.startTime = Date.now();
    }

    // Add to quanta history
    this.quanta.push({
      ...q,
      _ingestedAt: Date.now(),
      _index: this.quanta.length
    });
    this.stats.quantaIngested++;

    // Extract tween parameters and create/update timeline
    const tweenData = q.temporal_tween || q.tween || q.transition;
    if (tweenData) {
      const intent = q.cognitive_state?.intent || q.intent || 'default';
      
      const atom = new TweenAtom({
        start: tweenData.start ?? 0,
        end: tweenData.end ?? 1,
        duration_ms: tweenData.duration_ms ?? 100,
        easing: tweenData.type || tweenData.easing || 'linear',
        delay_ms: tweenData.delay_ms ?? 0,
        intent,
        metadata: q.metadata || {}
      });

      // Get or create timeline for this intent
      if (!this.timelines.has(intent)) {
        this.timelines.set(intent, new TweenTimeline(intent));
        this.stats.timelinesCreated++;
      }

      this.timelines.get(intent).add(atom);

      // Track savings
      const savings = atom.getBandwidthSavings();
      this.stats.bytesSaved += savings.totalRawBytes - savings.atomBytes;

      // Emit event
      this.emit('tween:created', { atom, intent, timeline: this.timelines.get(intent) });
    }

    // Auto-prune if needed
    if (this.options.autoPrune && this.quanta.length > this.options.maxQuanta) {
      this.prune();
    }

    return this;
  }

  /**
   * Reconstruct the state at a given elapsed time
   * THIS IS THE CORE TRANSPORT OPERATION
   * 
   * Any node can call this with any timestamp and get
   * deterministic state reconstruction
   */
  reconstruct(elapsed_ms) {
    if (elapsed_ms === undefined) {
      elapsed_ms = Date.now() - (this.startTime || Date.now());
    }

    this.stats.reconstructions++;

    const state = {};
    this.timelines.forEach((timeline, intent) => {
      const values = timeline.evaluate(elapsed_ms);
      // Use last value for each intent (or could aggregate)
      state[intent] = values.length > 0 ? values[values.length - 1].value : 0;
    });

    return {
      elapsed_ms,
      timestamp: (this.startTime || Date.now()) + elapsed_ms,
      state,
      timelines: Object.fromEntries(
        Array.from(this.timelines.entries()).map(([name, tl]) => [
          name,
          {
            progress: tl.getProgress(elapsed_ms),
            complete: tl.isComplete(elapsed_ms),
            state: tl.getState(elapsed_ms)
          }
        ])
      )
    };
  }

  /**
   * Get current state (reconstructs at now)
   */
  get currentState() {
    return this.reconstruct(Date.now() - (this.startTime || Date.now()));
  }

  /**
   * Create a tween atom for transport
   */
  createTween(config) {
    const atom = new TweenAtom(config);
    return atom;
  }

  /**
   * Broadcast state to all listeners
   */
  broadcast(elapsed_ms) {
    const state = this.reconstruct(elapsed_ms);
    this.emit('state:update', state);
    return state;
  }

  /**
   * Start continuous broadcasting (for real-time sync)
   */
  startBroadcast(intervalMs = 16) { // ~60fps
    if (this._broadcastInterval) {
      this.stopBroadcast();
    }
    
    this._broadcastInterval = setInterval(() => {
      this.broadcast();
    }, intervalMs);

    return this;
  }

  /**
   * Stop continuous broadcasting
   */
  stopBroadcast() {
    if (this._broadcastInterval) {
      clearInterval(this._broadcastInterval);
      this._broadcastInterval = null;
    }
    return this;
  }

  /**
   * Event emission
   */
  emit(event, data) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (e) {
        console.error(`[GSAP Transport] Error in handler for ${event}:`, e);
      }
    });
  }

  /**
   * Event listener
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return () => this.off(event, handler); // Return unsubscribe function
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Prune old quanta
   */
  prune(keepLast = 100) {
    if (this.quanta.length > keepLast) {
      const removed = this.quanta.splice(0, this.quanta.length - keepLast);
      console.log(`[GSAP Transport] Pruned ${removed.length} old quanta`);
    }
    return this;
  }

  /**
   * Get bandwidth statistics
   */
  getBandwidthStats() {
    return {
      ...this.stats,
      efficiency: this.stats.bytesTransported > 0 
        ? Math.round((1 - (this.stats.bytesTransported - this.stats.bytesSaved) / this.stats.bytesTransported) * 100)
        : 0,
      activeTimelines: this.timelines.size,
      totalQuanta: this.quanta.length
    };
  }

  /**
   * Destroy orchestrator and cleanup
   */
  destroy() {
    this.stopBroadcast();
    this.timelines.clear();
    this.quanta = [];
    this.listeners.clear();
    this.startTime = null;
    console.log(`[GSAP Transport] Orchestrator ${this.id} destroyed`);
  }

  /**
   * Export state for persistence/transfer
   */
  exportState() {
    return {
      id: this.id,
      startTime: this.startTime,
      stats: { ...this.stats },
      timelines: Object.fromEntries(
        Array.from(this.timelines.entries()).map(([name, tl]) => [name, tl.toJSON()])
      ),
      quantaCount: this.quanta.length
    };
  }
}

// ============================================
// SPATIAL MEMORY PALACE
// RF/Spatial coordinate mapping
// ============================================

class SpatialMemoryPalace {
  /**
   * Maps RF angle-of-arrival and RSSI to 3D coordinates,
   * allowing "walking through" digital footprint based on signal strength.
   * 
   * Uses GSAP ScrollTrigger-compatible coordinate system.
   */
  constructor(origin = { lat: 0, lon: 0 }) {
    this.origin = origin;
    this.points = [];
    this.bounds = { min: [0, 0, 0], max: [0, 0, 0] };
  }

  /**
   * Add a point from quantum spatial data
   */
  addPoint(quantum) {
    const q = typeof quantum === 'object' ? quantum : {};
    const ti = q.signal_metadata?.temporal_index || q.spatial || {};

    const rssi = ti.rssi_dbm || -120;
    const aoa = ti.angle_of_arrival_deg || 0;
    const snr = ti.snr_db || 0;

    // RSSI → distance (inverse square law approximation)
    // d = 10^((Tx_power - RSSI) / (10 * n)) where n=2 for free space
    const distance = rssi < 22 ? 10 ** ((22 - rssi) / 20) : 0.1;

    // AoA → 2D position
    const angleRad = (aoa * Math.PI) / 180;
    const x = distance * Math.cos(angleRad);
    const y = distance * Math.sin(angleRad);

    // SNR → elevation (normalized 0-10)
    const z = Math.max(0, Math.min(10, snr / 3));

    const point = {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      z: Math.round(z * 100) / 100,
      rssi,
      aoa,
      snr,
      quantumId: (q.quantum_id || '').substring(0, 16),
      intent: q.cognitive_state?.intent || 'unknown',
      timestamp: Date.now()
    };

    this.points.push(point);
    this._updateBounds(point);
    
    return point;
  }

  /**
   * Export as GSAP ScrollTrigger-compatible data
   */
  toScrollTriggerData() {
    return {
      origin: this.origin,
      points: this.points,
      bounds: { ...this.bounds },
      triggerPoints: this.points.map((p, i) => ({
        id: i,
        position: { x: p.x, y: p.y, z: p.z },
        trigger: {
          start: `top+=${Math.abs(p.y) * 10}%`,
          end: `top+=${Math.abs(p.y) * 10 + 20}%`,
          scrub: true
        },
        data: p
      }))
    };
  }

  _updateBounds(point) {
    this.bounds.min[0] = Math.min(this.bounds.min[0], point.x);
    this.bounds.min[1] = Math.min(this.bounds.min[1], point.y);
    this.bounds.min[2] = Math.min(this.bounds.min[2], point.z);
    this.bounds.max[0] = Math.max(this.bounds.max[0], point.x);
    this.bounds.max[1] = Math.max(this.bounds.max[1], point.y);
    this.bounds.max[2] = Math.max(this.bounds.max[2], point.z);
  }

  /**
   * Find nearest point to coordinates
   */
  findNearest(x, y, z = 0) {
    let nearest = null;
    let minDist = Infinity;

    this.points.forEach(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      const dz = p.z - z;
      const dist = dx * dx + dy * dy + dz * dz;
      
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    });

    return nearest ? { point: nearest, distance: Math.sqrt(minDist) } : null;
  }

  clear() {
    this.points = [];
    this.bounds = { min: [0, 0, 0], max: [0, 0, 0] };
  }
}

// ============================================
// ESA GSAP TRANSPORT - Main Export
// ============================================

export class ESAGSAPTransport {
  /**
   * Main GSAP Transport Layer for ESA EXOSKELETON
   * 
   * Wraps ALL component communication in efficient
   * tween-based transport protocol.
   */
  constructor(options = {}) {
    this.options = {
      enableBroadcast: options.enableBroadcast ?? false,
      broadcastInterval: options.broadcastInterval ?? 16,
      enableSpatial: options.enableSpatial ?? true,
      ...options
    };

    // Core transport engine
    this.orchestrator = new TemporalOrchestrator(options.orchestrator);
    
    // Spatial mapping (optional)
    this.spatialMemory = this.options.enableSpatial 
      ? new SpatialMemoryPalace(options.origin) 
      : null;

    // Component registries
    this.components = new Map(); // componentName -> { node, intents[] }
    this.intents = new Map(); // intent -> Set<componentNames>

    // GSAP integration (if available)
    this.gsapAvailable = typeof gsap !== 'undefined';
    
    // State
    this.initialized = false;
    this.startedAt = null;

    console.log('%c[ESA.GSAPTransport] 🚀 Transport layer initialized', 
      'color: #689d6a; font-weight: bold');
  }

  /**
   * Initialize transport layer
   */
  async init() {
    if (this.initialized) return this;

    console.log('%c[ESA.GSAPTransport] Starting transport engine...', 
      'color: #689d6a');

    // Register core ESA intents
    this._registerCoreIntents();

    // Start broadcast if enabled
    if (this.options.enableBroadcast) {
      this.orchestrator.startBroadcast(this.options.broadcastInterval);
    }

    this.initialized = true;
    this.startedAt = Date.now();

    // Log initialization
    this.ingest({
      intent: 'system:init',
      cognitive_state: { intent: 'system:init' },
      temporal_tween: {
        start: 0,
        end: 1,
        duration_ms: 500,
        easing: 'power2.out'
      },
      metadata: {
        source: 'ESA.GSAPTransport',
        timestamp: this.startedAt,
        version: '2.1.0'
      }
    });

    console.log('%c[ESA.GSAPTransport] ✅ Transport ready', 
      'color: #98971a; font-weight: bold');

    return this;
  }

  /**
   * Register core ESA intents
   */
  _registerCoreIntents() {
    const coreIntents = [
      'system:init',
      'system:ready',
      'component:mount',
      'component:unmount',
      'inventory:scan',
      'inventory:update',
      'diagnostic:code',
      'diagnostic:result',
      'workorder:create',
      'workorder:update',
      'workorder:complete',
      'part:lookup',
      'part:add',
      'part:remove',
      'capture:image',
      'capture:file',
      'voice:speak',
      'voice:listen',
      'theme:toggle',
      'sandbox:message'
    ];

    coreIntents.forEach(intent => {
      if (!this.intents.has(intent)) {
        this.intents.set(intent, new Set());
      }
    });
  }

  /**
   * Ingest data into transport (main API)
   */
  ingest(quantum) {
    return this.orchestrator.ingest(quantum);
  }

  /**
   * Register a component with the transport layer
   */
  registerComponent(name, node, intents = []) {
    this.components.set(name, { node, intents: new Set(intents), registeredAt: Date.now() });
    
    // Register intents
    intents.forEach(intent => {
      if (!this.intents.has(intent)) {
        this.intents.set(intent, new Set());
      }
      this.intents.get(intent).add(name);
    });

    console.log(`%c[ESA.GSAPTransport] Component registered: ${name}`, 'color: #98971a');

    // Ingest registration as quantum
    this.ingest({
      intent: 'component:mount',
      cognitive_state: { intent: 'component:mount', component: name },
      temporal_tween: {
        start: 0,
        end: 1,
        duration_ms: 300,
        easing: 'power2.out'
      },
      metadata: { component: name, intents }
    });

    return this;
  }

  /**
   * Unregister a component
   */
  unregisterComponent(name) {
    const component = this.components.get(name);
    if (component) {
      // Remove from intents
      component.intents.forEach(intent => {
        const listeners = this.intents.get(intent);
        if (listeners) {
          listeners.delete(name);
        }
      });
      
      this.components.delete(name);
      
      this.ingest({
        intent: 'component:unmount',
        cognitive_state: { intent: 'component:unmount', component: name },
        temporal_tween: { start: 1, end: 0, duration_ms: 200, easing: 'power2.in' },
        metadata: { component: name }
      });
    }
    return this;
  }

  /**
   * Send message to specific intent (creates tween automatically)
   */
  send(intent, value, options = {}) {
    const tween = {
      start: options.from ?? 0,
      end: value,
      duration_ms: options.duration ?? 100,
      easing: options.easing ?? 'power2.out',
      delay_ms: options.delay ?? 0
    };

    const quantum = {
      intent,
      cognitive_state: { intent },
      temporal_tween: tween,
      metadata: {
        source: options.source || 'unknown',
        targetIntent: intent,
        ...options.metadata
      }
    };

    return this.ingest(quantum);
  }

  /**
   * Subscribe to intent changes
   */
  subscribe(intent, handler) {
    return this.orchestrator.on(`state:update`, (data) => {
      if (data.state && intent in data.state) {
        handler({
          intent,
          value: data.state[intent],
          timestamp: data.timestamp,
          elapsed: data.elapsed_ms
        });
      }
    });
  }

  /**
   * Get current transport state
   */
  getState() {
    return {
      ...this.orchestrator.currentState,
      transport: {
        initialized: this.initialized,
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        components: Array.from(this.components.keys()),
        activeIntents: Array.from(this.intents.keys()),
        stats: this.orchestrator.getBandwidthStats()
      }
    };
  }

  /**
   * Add spatial point (if enabled)
   */
  addSpatialPoint(quantum) {
    if (this.spatialMemory) {
      return this.spatialMemory.addPoint(quantum);
    }
    return null;
  }

  /**
   * Get spatial data (if enabled)
   */
  getSpatialData() {
    if (this.spatialMemory) {
      return this.spatialMemory.toScrollTriggerData();
    }
    return null;
  }

  /**
   * Create a tween atom for manual use
   */
  createTween(config) {
    return new TweenAtom(config);
  }

  /**
   * Create a timeline for sequenced transitions
   */
  createTimeline(name) {
    return new TweenTimeline(name);
  }

  /**
   * Wrap sandbox container with GSAP transport
   * THIS IS THE KEY INTEGRATION POINT
   */
  async wrapSandbox(container) {
    if (!container) {
      console.warn('[ESA.GSAPTransport] No container provided');
      return null;
    }

    console.log('%c[ESA.GSAPTransport] 🎬 Wrapping sandbox with GSAP Transport...', 
      'color: #b16286; font-weight: bold');

    // Mark container as transport-managed
    container.setAttribute('data-gsap-transport', this.orchestrator.id);
    container.setAttribute('data-transport-version', '2.1.0');

    // If GSAP available, use it for physical animations
    // (This is VISUAL, the REAL transport is the tween atoms above)
    if (this.gsapAvailable) {
      const tl = gsap.timeline({
        onComplete: () => {
          this.ingest({
            intent: 'system:ready',
            cognitive_state: { intent: 'system:ready' },
            temporal_tween: { start: 0, end: 1, duration_ms: 800, easing: 'power2.out' },
            metadata: { event: 'sandbox:animation-complete' }
          });
        }
      });

      tl
        .fromTo(container, 
          { opacity: 0, y: 30, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
        )
        .fromTo(
          container.querySelectorAll('[data-esa-component]'),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
          '-=0.4'
        );

      return tl;
    }

    // Fallback: just mark as ready
    this.ingest({
      intent: 'system:ready',
      cognitive_state: { intent: 'system:ready' },
      temporal_tween: { start: 0, end: 1, duration_ms: 100, easing: 'linear' }
    });

    return null;
  }

  /**
   * Destroy transport layer
   */
  destroy() {
    this.orchestrator.destroy();
    this.components.clear();
    this.intents.clear();
    this.initialized = false;
    this.startedAt = null;
    console.log('%c[ESA.GSAPTransport] 💥 Transport destroyed', 'color: #cc241d');
  }

  /**
   * Export full state
   */
  export() {
    return {
      orchestrator: this.orchestrator.exportState(),
      components: Array.from(this.components.entries()).map(([name, c]) => ({
        name,
        intents: Array.from(c.intents),
        registeredAt: c.registeredAt
      })),
      spatial: this.spatialMemory ? this.spatialMemory.toScrollTriggerData() : null,
      options: this.options
    };
  }
}

// Export individual classes for advanced usage
export {
  TweenAtom,
  TweenTimeline,
  TemporalOrchestrator,
  SpatialMemoryPalace,
  EASING_FUNCTIONS
};

// Default export
export default ESAGSAPTransport;
