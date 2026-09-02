/**
 * ESA.GSAPTransport.js
 * 
 * GSAP TRANSPORT LAYER for ESA EXOSKELETON
 * 
 * This is NOT animation - this is the TRANSPORT MECHANISM.
 * Tween atoms, temporal reconstruction, and spatial mapping remain
 * substrate mechanics. Intent identifiers are opaque routing references.
 */

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
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
    if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
    t -= 2.625 / d1;
    return n1 * t * t + 0.984375;
  },
  back: t => t * t * (2.70158 * t - 1.70158)
};

class TweenAtom {
  constructor(config = {}) {
    this.start = config.start ?? 0;
    this.end = config.end ?? 1;
    this.duration_ms = config.duration_ms ?? 100;
    this.easing = config.easing ?? 'linear';
    this.delay_ms = config.delay_ms ?? 0;
    this.id = config.id || `atom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Opaque routing/capability reference. Never cognitive state.
    this.intent = config.intent_id ?? config.intent ?? 'default';
    this.metadata = config.metadata || {};
  }

  interpolate(elapsed_ms) {
    if (elapsed_ms < this.delay_ms) return this.start;
    let t = (elapsed_ms - this.delay_ms) / this.duration_ms;
    t = Math.max(0, Math.min(1, t));
    const easingFn = EASING_FUNCTIONS[this.easing] || EASING_FUNCTIONS.linear;
    return this.start + (this.end - this.start) * easingFn(t);
  }

  toJSON() {
    return { id: this.id, intent_id: this.intent, s: this.start, e: this.end, d: this.duration_ms,
      ease: this.easing[0], delay: this.delay_ms, m: this.metadata };
  }

  getBandwidthSavings(updatesPerSecond = 30) {
    const rawBytes = updatesPerSecond * 8 * (this.duration_ms / 1000);
    const atomBytes = JSON.stringify(this.toJSON()).length;
    return {
      rawBytesPerSecond: updatesPerSecond * 8,
      totalRawBytes: Math.round(rawBytes), atomBytes,
      savingsPercent: rawBytes > 0 ? Math.round((1 - atomBytes / rawBytes) * 100) : 0,
      compressionRatio: rawBytes > 0 ? (rawBytes / atomBytes).toFixed(1) : 0
    };
  }

  static fromJSON(data) {
    return new TweenAtom({
      id: data.id, intent_id: data.intent_id ?? data.intent,
      start: data.s ?? data.start, end: data.e ?? data.end,
      duration_ms: data.d ?? data.duration_ms,
      easing: data.ease ? Object.keys(EASING_FUNCTIONS).find(e => e[0] === data.ease) : (data.easing ?? 'linear'),
      delay_ms: data.delay ?? data.delay_ms, metadata: data.m ?? data.metadata
    });
  }
}

class TweenTimeline {
  constructor(name = 'default') {
    this.name = name; this.atoms = []; this.totalDurationMs = 0; this.createdAt = Date.now();
  }
  add(atom) {
    if (!(atom instanceof TweenAtom)) atom = new TweenAtom(atom);
    this.atoms.push(atom);
    this.totalDurationMs = Math.max(this.totalDurationMs, atom.delay_ms + atom.duration_ms);
    return this;
  }
  evaluate(elapsed_ms) {
    return this.atoms.map(atom => ({ id: atom.id, intent: atom.intent,
      value: atom.interpolate(elapsed_ms), progress: Math.min(1, Math.max(0, (elapsed_ms - atom.delay_ms) / atom.duration_ms)) }));
  }
  getState(elapsed_ms) {
    const state = {};
    this.evaluate(elapsed_ms).forEach(e => { state[e.intent] = e.value; });
    return state;
  }
  isComplete(elapsed_ms) { return elapsed_ms >= this.totalDurationMs; }
  getProgress(elapsed_ms) { return this.totalDurationMs === 0 ? 1 : Math.min(1, elapsed_ms / this.totalDurationMs); }
  toJSON() { return { name: this.name, atoms: this.atoms.map(a => a.toJSON()), totalDurationMs: this.totalDurationMs, createdAt: this.createdAt }; }
}

class TemporalOrchestrator {
  constructor(options = {}) {
    this.id = `orchestrator-${Date.now()}`;
    this.timelines = new Map(); this.quanta = []; this.startTime = null;
    this.options = { maxQuanta: options.maxQuanta || 1000, autoPrune: options.autoPrune !== false, ...options };
    this.stats = { quantaIngested: 0, timelinesCreated: 0, bytesTransported: 0, bytesSaved: 0, reconstructions: 0 };
    this.listeners = new Map();
  }

  ingest(quantum) {
    const q = typeof quantum === 'object' && quantum !== null ? quantum : { data: quantum };
    this.stats.bytesTransported += JSON.stringify(q).length;
    if (this.startTime === null) this.startTime = Date.now();
    this.quanta.push({ ...q, _ingestedAt: Date.now(), _index: this.quanta.length });
    this.stats.quantaIngested++;
    const tweenData = q.temporal_tween || q.tween || q.transition;
    if (tweenData) {
      const intent = q.intent_id || q.payload?.intent_id || q.payload?.capability || q.intent || 'default';
      const atom = new TweenAtom({
        start: tweenData.start ?? 0, end: tweenData.end ?? 1,
        duration_ms: tweenData.duration_ms ?? 100,
        easing: tweenData.type || tweenData.easing || 'linear',
        delay_ms: tweenData.delay_ms ?? 0, intent_id: intent, metadata: q.metadata || {}
      });
      if (!this.timelines.has(intent)) { this.timelines.set(intent, new TweenTimeline(intent)); this.stats.timelinesCreated++; }
      this.timelines.get(intent).add(atom);
      const savings = atom.getBandwidthSavings();
      this.stats.bytesSaved += savings.totalRawBytes - savings.atomBytes;
      this.emit('tween:created', { atom, intent, timeline: this.timelines.get(intent) });
    }
    if (this.options.autoPrune && this.quanta.length > this.options.maxQuanta) this.prune();
    return this;
  }

  reconstruct(elapsed_ms) {
    if (elapsed_ms === undefined) elapsed_ms = Date.now() - (this.startTime || Date.now());
    this.stats.reconstructions++;
    const state = {};
    this.timelines.forEach((timeline, intent) => {
      const values = timeline.evaluate(elapsed_ms);
      state[intent] = values.length > 0 ? values[values.length - 1].value : 0;
    });
    return { elapsed_ms, timestamp: (this.startTime || Date.now()) + elapsed_ms, state,
      timelines: Object.fromEntries(Array.from(this.timelines.entries()).map(([name, tl]) => [name,
        { progress: tl.getProgress(elapsed_ms), complete: tl.isComplete(elapsed_ms), state: tl.getState(elapsed_ms) }])) };
  }

  get currentState() { return this.reconstruct(Date.now() - (this.startTime || Date.now())); }
  createTween(config) { return new TweenAtom(config); }
  broadcast(elapsed_ms) { const state = this.reconstruct(elapsed_ms); this.emit('state:update', state); return state; }
  startBroadcast(intervalMs = 16) { if (this._broadcastInterval) this.stopBroadcast(); this._broadcastInterval = setInterval(() => this.broadcast(), intervalMs); return this; }
  stopBroadcast() { if (this._broadcastInterval) { clearInterval(this._broadcastInterval); this._broadcastInterval = null; } return this; }
  emit(event, data) { (this.listeners.get(event) || []).forEach(handler => { try { handler(data); } catch (e) { console.error(`[GSAP Transport] Error in handler for ${event}:`, e); } }); }
  on(event, handler) { if (!this.listeners.has(event)) this.listeners.set(event, []); this.listeners.get(event).push(handler); return () => this.off(event, handler); }
  off(event, handler) { const handlers = this.listeners.get(event); if (handlers) { const index = handlers.indexOf(handler); if (index > -1) handlers.splice(index, 1); } }
  prune(keepLast = 100) { if (this.quanta.length > keepLast) this.quanta.splice(0, this.quanta.length - keepLast); return this; }
  getBandwidthStats() { return { ...this.stats, efficiency: this.stats.bytesTransported > 0 ? Math.round((1 - (this.stats.bytesTransported - this.stats.bytesSaved) / this.stats.bytesTransported) * 100) : 0, activeTimelines: this.timelines.size, totalQuanta: this.quanta.length }; }
  destroy() { this.stopBroadcast(); this.timelines.clear(); this.quanta = []; this.listeners.clear(); this.startTime = null; }
  exportState() { return { id: this.id, startTime: this.startTime, stats: { ...this.stats }, timelines: Object.fromEntries(Array.from(this.timelines.entries()).map(([name, tl]) => [name, tl.toJSON()])), quantaCount: this.quanta.length }; }
}

class SpatialMemoryPalace {
  constructor(origin = { lat: 0, lon: 0 }) { this.origin = origin; this.points = []; this.bounds = { min: [0, 0, 0], max: [0, 0, 0] }; }
  addPoint(quantum) {
    const q = typeof quantum === 'object' ? quantum : {};
    const ti = q.signal_metadata?.temporal_index || q.spatial || {};
    const rssi = ti.rssi_dbm || -120, aoa = ti.angle_of_arrival_deg || 0, snr = ti.snr_db || 0;
    const distance = rssi < 22 ? 10 ** ((22 - rssi) / 20) : 0.1;
    const angleRad = (aoa * Math.PI) / 180;
    const point = {
      x: Math.round(distance * Math.cos(angleRad) * 100) / 100,
      y: Math.round(distance * Math.sin(angleRad) * 100) / 100,
      z: Math.round(Math.max(0, Math.min(10, snr / 3)) * 100) / 100,
      rssi, aoa, snr, quantumId: (q.quantum_id || '').substring(0, 16),
      intent: q.intent_id || q.payload?.intent_id || q.payload?.capability || q.intent || 'unknown',
      timestamp: Date.now()
    };
    this.points.push(point); this._updateBounds(point); return point;
  }
  toScrollTriggerData() { return { origin: this.origin, points: this.points, bounds: { ...this.bounds }, triggerPoints: this.points.map((p, i) => ({ id: i, position: { x: p.x, y: p.y, z: p.z }, trigger: { start: `top+=${Math.abs(p.y) * 10}%`, end: `top+=${Math.abs(p.y) * 10 + 20}%`, scrub: true }, data: p })) }; }
  _updateBounds(point) { this.bounds.min[0] = Math.min(this.bounds.min[0], point.x); this.bounds.min[1] = Math.min(this.bounds.min[1], point.y); this.bounds.min[2] = Math.min(this.bounds.min[2], point.z); this.bounds.max[0] = Math.max(this.bounds.max[0], point.x); this.bounds.max[1] = Math.max(this.bounds.max[1], point.y); this.bounds.max[2] = Math.max(this.bounds.max[2], point.z); }
  findNearest(x, y, z = 0) { let nearest = null, minDist = Infinity; this.points.forEach(p => { const dx = p.x - x, dy = p.y - y, dz = p.z - z, dist = dx * dx + dy * dy + dz * dz; if (dist < minDist) { minDist = dist; nearest = p; } }); return nearest ? { point: nearest, distance: Math.sqrt(minDist) } : null; }
  clear() { this.points = []; this.bounds = { min: [0, 0, 0], max: [0, 0, 0] }; }
}

export class ESAGSAPTransport {
  constructor(options = {}) {
    this.options = { enableBroadcast: options.enableBroadcast ?? false, broadcastInterval: options.broadcastInterval ?? 16, enableSpatial: options.enableSpatial ?? true, ...options };
    this.orchestrator = new TemporalOrchestrator(options.orchestrator);
    this.spatialMemory = this.options.enableSpatial ? new SpatialMemoryPalace(options.origin) : null;
    this.components = new Map(); this.intents = new Map(); this.gsapAvailable = typeof gsap !== 'undefined';
    this.initialized = false; this.startedAt = null;
  }

  async init() {
    if (this.initialized) return this;
    this._registerCoreIntents();
    if (this.options.enableBroadcast) this.orchestrator.startBroadcast(this.options.broadcastInterval);
    this.initialized = true; this.startedAt = Date.now();
    this.ingest({ intent_id: 'system:init', temporal_tween: { start: 0, end: 1, duration_ms: 500, easing: 'power2.out' }, metadata: { source: 'ESA.GSAPTransport', timestamp: this.startedAt, version: '2.1.0' } });
    return this;
  }

  _registerCoreIntents() {
    ['system:init','system:ready','component:mount','component:unmount','inventory:scan','inventory:update','diagnostic:code','diagnostic:result','workorder:create','workorder:update','workorder:complete','part:lookup','part:add','part:remove','capture:image','capture:file','voice:speak','voice:listen','theme:toggle','sandbox:message'].forEach(intent => { if (!this.intents.has(intent)) this.intents.set(intent, new Set()); });
  }
  ingest(quantum) { return this.orchestrator.ingest(quantum); }
  registerComponent(name, node, intents = []) {
    this.components.set(name, { node, intents: new Set(intents), registeredAt: Date.now() });
    intents.forEach(intent => { if (!this.intents.has(intent)) this.intents.set(intent, new Set()); this.intents.get(intent).add(name); });
    this.ingest({ intent_id: 'component:mount', temporal_tween: { start: 0, end: 1, duration_ms: 300, easing: 'power2.out' }, metadata: { component: name, intents } });
    return this;
  }
  unregisterComponent(name) {
    const component = this.components.get(name);
    if (component) {
      component.intents.forEach(intent => { const listeners = this.intents.get(intent); if (listeners) listeners.delete(name); });
      this.components.delete(name);
      this.ingest({ intent_id: 'component:unmount', temporal_tween: { start: 1, end: 0, duration_ms: 200, easing: 'power2.in' }, metadata: { component: name } });
    }
    return this;
  }
  send(intent, value, options = {}) {
    const tween = { start: options.from ?? 0, end: value, duration_ms: options.duration ?? 100, easing: options.easing ?? 'power2.out', delay_ms: options.delay ?? 0 };
    return this.ingest({ intent_id: intent, temporal_tween: tween, metadata: { source: options.source || 'unknown', targetIntent: intent, ...options.metadata } });
  }
  subscribe(intent, handler) { return this.orchestrator.on('state:update', data => { if (data.state && intent in data.state) handler({ intent, value: data.state[intent], timestamp: data.timestamp, elapsed: data.elapsed_ms }); }); }
  getState() { return { ...this.orchestrator.currentState, transport: { initialized: this.initialized, uptime: this.startedAt ? Date.now() - this.startedAt : 0, components: Array.from(this.components.keys()), activeIntents: Array.from(this.intents.keys()), stats: this.orchestrator.getBandwidthStats() } }; }
  addSpatialPoint(quantum) { return this.spatialMemory ? this.spatialMemory.addPoint(quantum) : null; }
  getSpatialData() { return this.spatialMemory ? this.spatialMemory.toScrollTriggerData() : null; }
  createTween(config) { return new TweenAtom(config); }
  createTimeline(name) { return new TweenTimeline(name); }
  async wrapSandbox(container) {
    if (!container) return null;
    container.setAttribute('data-gsap-transport', this.orchestrator.id); container.setAttribute('data-transport-version', '2.1.0');
    if (this.gsapAvailable) {
      const tl = gsap.timeline({ onComplete: () => this.ingest({ intent_id: 'system:ready', temporal_tween: { start: 0, end: 1, duration_ms: 800, easing: 'power2.out' }, metadata: { event: 'sandbox:animation-complete' } }) });
      tl.fromTo(container, { opacity: 0, y: 30, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' })
        .fromTo(container.querySelectorAll('[data-esa-component]'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, '-=0.4');
      return tl;
    }
    this.ingest({ intent_id: 'system:ready', temporal_tween: { start: 0, end: 1, duration_ms: 100, easing: 'linear' } });
    return null;
  }
  destroy() { this.orchestrator.destroy(); this.components.clear(); this.intents.clear(); this.initialized = false; this.startedAt = null; }
  export() { return { orchestrator: this.orchestrator.exportState(), components: Array.from(this.components.entries()).map(([name, c]) => ({ name, intents: Array.from(c.intents), registeredAt: c.registeredAt })), spatial: this.spatialMemory ? this.spatialMemory.toScrollTriggerData() : null, options: this.options }; }
}

export { TweenAtom, TweenTimeline, TemporalOrchestrator, SpatialMemoryPalace, EASING_FUNCTIONS };
export default ESAGSAPTransport;
