/**
 * integration.js
 * ESA EXOSKELETON - Production Component Wiring
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ LEFT SIDEBAR: web console (logs)                        │
 *   │ RENDERING AREA: every module is a rendering card        │
 *   │   [AI INGESTION CHAT] [DIAGNOSTIC] [PARTS] [TO-DO LIST] │
 *   │ INGESTION DOCK (bottom): lens / PDF / email / audio     │
 *   └─────────────────────────────────────────────────────────┘
 *
 * The Ingestion Interface is a React module; Arrow.js sandboxes the rest.
 */

// ============================================
// UTILITY: Show/Hide Loading & Error States
// ============================================
function hideLoading() {
  const loading = document.getElementById('esa-loading');
  const app = document.getElementById('esa-exoskeleton');
  if (loading) loading.classList.add('hidden');
  if (app) app.classList.add('visible');
}

function showError(message) {
  const errorScreen = document.getElementById('esa-error');
  const errorMessage = document.getElementById('esa-error-message');
  const loading = document.getElementById('esa-loading');

  if (loading) loading.classList.add('hidden');
  if (errorMessage) errorMessage.textContent = message;
  if (errorScreen) errorScreen.classList.add('visible');

  const app = document.getElementById('esa-exoskeleton');
  if (app) app.classList.add('visible');
}

// Summarize an ESA event detail for the Ingestion chat hub feed
function hubSummary(detail) {
  if (!detail) return 'event';
  const picks = ['workorderId', 'workorder_id', 'id', 'sku', 'part', 'code', 'status', 'message', 'type', 'name'];
  for (const key of picks) {
    if (detail[key] !== undefined && detail[key] !== null && detail[key] !== '') {
      const value = String(detail[key]);
      return value.length > 80 ? value.slice(0, 77) + '…' : value;
    }
  }
  try {
    const json = JSON.stringify(detail);
    return json.length > 80 ? json.slice(0, 77) + '…' : json;
  } catch (_) {
    return 'event';
  }
}

// Bento cards bring their own structure (bento-title / bento-desc),
// so module containers are NOT decorated with legacy card headers anymore.

// ============================================
// MAIN INITIALIZATION
// ============================================
async function initESAExoskeleton() {
  // Initialize ESA namespace
  window.ESA = window.ESA || {
    version: '3.6.0',
    initialized: false,
    errors: [],
    ingestion: { instance: null, components: {}, api: null },
    components: {},
    mountedComponents: [],
    log: null
  };

  // ============================================
  // 1. LOG — the console sidebar is gone (agent-browser shell:
  //    left nav | viewport | bottom chat). ESA.log stays API-compatible
  //    as an in-memory ring buffer so every component can keep calling it.
  // ============================================
  window.ESA.log = (msg, type = 'info') => {
    window.ESA.logBuffer = window.ESA.logBuffer || [];
    window.ESA.logBuffer.push({ msg, type, t: Date.now() });
    if (window.ESA.logBuffer.length > 300) window.ESA.logBuffer.shift();
  };

  // ============================================
  // LOAD COMPONENTS
  // ============================================
  let ESAIngestion, ESADiagnosticCard, ESAInvPartsCardB, ESAWorkorder, ESAMaintenanceChecklist, ESAPtacB, themeModule;

  try {
    const [
      ingestionModule,
      diagnosticModule,
      partsModule,
      workorderModule,
      checklistModule,
      ptacModule,
      themeMod
    ] = await Promise.allSettled([
      import('./components/ESA.Ingestion.js?v=407'),
      import('./components/ESA.DiagnosticCard.js?v=407'),
      import('./components/ESA.invpartscard-B.js?v=407'),
      import('./components/ESA.workorder.js?v=407'),
      import('./components/ESA.MaintenanceChecklist.js?v=407'),
      import('./components/ESA.Ptac-B.js?v=407'),
      import('./config/gruvbox-colors.js?v=407')
    ]);

    ESAIngestion = ingestionModule.status === 'fulfilled' ? ingestionModule.value.ESAIngestion : null;
    ESADiagnosticCard = diagnosticModule.status === 'fulfilled' ? diagnosticModule.value.ESADiagnosticCard : null;
    ESAInvPartsCardB = partsModule.status === 'fulfilled' ? partsModule.value.ESAInvPartsCardB : null;
    ESAWorkorder = workorderModule.status === 'fulfilled' ? workorderModule.value.ESAWorkorder : null;
    ESAMaintenanceChecklist = checklistModule.status === 'fulfilled' ? checklistModule.value.ESAMaintenanceChecklist : null;
    ESAPtacB = ptacModule.status === 'fulfilled' ? (ptacModule.value.ESAPtacB || ptacModule.value.default) : null;
    themeModule = themeMod.status === 'fulfilled' ? themeMod.value : null;

    if (ingestionModule.status === 'rejected') window.ESA.errors.push({ component: 'Ingestion', error: ingestionModule.reason });
    if (diagnosticModule.status === 'rejected') window.ESA.errors.push({ component: 'DiagnosticCard', error: diagnosticModule.reason });
    if (partsModule.status === 'rejected') window.ESA.errors.push({ component: 'InvPartsCard', error: partsModule.reason });
    if (workorderModule.status === 'rejected') window.ESA.errors.push({ component: 'Workorder', error: workorderModule.reason });
    if (checklistModule.status === 'rejected') window.ESA.errors.push({ component: 'MaintenanceChecklist', error: checklistModule.reason });
    if (ptacModule.status === 'rejected') window.ESA.errors.push({ component: 'PtacB', error: ptacModule.reason });
  } catch (err) {
    window.ESA.errors.push({ phase: 'import', error: err });
  }

  // ============================================
  // MOUNT COMPONENTS — every module is a rendering card
  // ============================================

  // 1. AI INGESTION (React module — chat card + bottom dock)
  if (ESAIngestion && typeof ESAIngestion.mount === 'function') {
    try {
      const ingestionContainer = document.getElementById('esa-ingestion');
      if (ingestionContainer) {
        ingestionContainer.innerHTML = '';
        const mountResult = ESAIngestion.mount(ingestionContainer);

        if (mountResult) {
          window.ESA.ingestion.instance = mountResult;
          window.ESA.mountedComponents.push(mountResult);

          // The React Ingestion module registers its public API on mount:
          //   window.ESA.ingestion.api = { audioEngine, chat, sendMessage, handleFile, pushSystem }
          window.ESA.ingestion.handleFile = (file, type) => {
            window.dispatchEvent(new CustomEvent('esa:ingestion-file', { detail: { file, type } }));
          };

          // Pick up the React module's audio engine once it is mounted
          setTimeout(() => {
            window.ESA.ingestion.components.voice =
              window.ESA.ingestion.api?.audioEngine || null;
          }, 50);

          if (window.ESA.log) window.ESA.log('✓ Ingestion interface mounted (React dock + chat card)', 'success');
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'Ingestion', phase: 'mount', error: err });
    }
  }

  // 2. DIAGNOSTIC CARD
  if (ESADiagnosticCard && typeof ESADiagnosticCard.mount === 'function') {
    try {
      const diagnosticContainer = document.getElementById('esa-diagnostics');
      if (diagnosticContainer) {
        diagnosticContainer.innerHTML = '';
        const mountResult = ESADiagnosticCard.mount(diagnosticContainer);
        if (mountResult) {
          window.ESA.components.diagnosticCard = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          if (window.ESA.log) window.ESA.log('✓ Diagnostic card mounted', 'success');
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'DiagnosticCard', phase: 'mount', error: err });
    }
  }

  // 3. BROADCAST PARTS CARD
  if (ESAInvPartsCardB && typeof ESAInvPartsCardB.mount === 'function') {
    try {
      const partsCardContainer = document.getElementById('esa-parts-card');
      if (partsCardContainer) {
        partsCardContainer.innerHTML = '';
        const mountResult = ESAInvPartsCardB.mount(partsCardContainer);
        if (mountResult) {
          window.ESA.components.invPartsCard = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          if (window.ESA.log) window.ESA.log('✓ Broadcast parts card mounted', 'success');
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'InvPartsCard', phase: 'mount', error: err });
    }
  }

  // 4. WORKORDER SYSTEM
  if (ESAWorkorder && typeof ESAWorkorder.mount === 'function') {
    try {
      const workorderContainer = document.getElementById('esa-workorder');
      if (workorderContainer) {
        workorderContainer.innerHTML = '';
        const mountResult = ESAWorkorder.mount(workorderContainer);
        if (mountResult) {
          window.ESA.components.workorder = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          if (window.ESA.log) window.ESA.log('✓ Workorder system mounted', 'success');
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'Workorder', phase: 'mount', error: err });
    }
  }

  // 5. MAINTENANCE CHECKLIST — the to-do list card
  if (ESAMaintenanceChecklist && typeof ESAMaintenanceChecklist.mount === 'function') {
    try {
      const checklistContainer = document.getElementById('esa-maintenance-checklist');
      if (checklistContainer) {
        checklistContainer.innerHTML = '';
        // React module renders its own card header (Checklist style)
        const mountResult = ESAMaintenanceChecklist.mount(checklistContainer);
        if (mountResult) {
          window.ESA.components.maintenanceChecklist = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          if (window.ESA.log) window.ESA.log('✓ Daily maintenance checklist mounted (React)', 'success');
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'MaintenanceChecklist', phase: 'mount', error: err });
    }
  }

  // 6. PTAC-B — HD Supply service broadcasting card (B-side sliding panel)
  if (ESAPtacB && typeof ESAPtacB.mount === 'function') {
    try {
      const ptacContainer = document.getElementById('esa-ptac');
      if (ptacContainer) {
        ptacContainer.innerHTML = '';
        const mountResult = ESAPtacB.mount(ptacContainer);
        if (mountResult) {
          window.ESA.components.ptacB = mountResult;
          window.ESA.mountedComponents.push(mountResult);
          if (window.ESA.log) window.ESA.log('✓ PTAC-B service broadcast card mounted', 'success');
        }
      }
    } catch (err) {
      window.ESA.errors.push({ component: 'PtacB', phase: 'mount', error: err });
    }
  }

  // ============================================
  // 5b. VIEWPORT TOOLBAR + LIBRARY REFRESH
  // ============================================
  const renderArea = document.querySelector('.esa-render-area');
  const CARD_IDS = ['esa-ingestion-chat-card', 'esa-diagnostics', 'esa-parts-card', 'esa-workorder', 'esa-maintenance-checklist', 'esa-ptac'];
  if (renderArea) {
    const bar = document.createElement('div');
    bar.className = 'esa-view-toolbar';

    const toolGlyphs = ['▱', '▢', '⌖', 'T'];
    toolGlyphs.forEach(g => {
      const t = document.createElement('span');
      t.className = 'esa-tb-tool';
      t.textContent = g;
      bar.appendChild(t);
    });

    const sep = document.createElement('span');
    sep.className = 'esa-tb-sep';
    bar.appendChild(sep);

    const zoom = document.createElement('span');
    zoom.className = 'esa-tb-zoom';
    zoom.textContent = '100% ⌄';
    bar.appendChild(zoom);

    const sep2 = document.createElement('span');
    sep2.className = 'esa-tb-sep';
    bar.appendChild(sep2);

    const prev = document.createElement('span');
    prev.className = 'esa-tb-nav';
    prev.textContent = '‹';
    prev.title = 'Previous card';
    const next = document.createElement('span');
    next.className = 'esa-tb-nav';
    next.textContent = '›';
    next.title = 'Next card';
    const label = document.createElement('span');
    label.className = 'esa-tb-label';
    bar.appendChild(prev);
    bar.appendChild(next);
    bar.appendChild(label);

    let cursor = 0;
    // Cards live one-per-viewport in the agent-browser shell; the merged-away
    // chat card (dock owns chat) is not part of the cycle.
    const cards = () => CARD_IDS
      .filter(id => id !== 'esa-ingestion-chat-card')
      .map(id => document.getElementById(id))
      .filter(el => el && el.children.length > 0);
    const jump = dir => {
      const list = cards();
      if (!list.length) return;
      cursor = (cursor + dir + list.length) % list.length;
      const target = list[cursor];
      if (window.ESAShell && typeof window.ESAShell.showCard === 'function') {
        window.ESAShell.showCard(target.id);
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    prev.addEventListener('click', () => jump(-1));
    next.addEventListener('click', () => jump(1));

    renderArea.insertBefore(bar, renderArea.firstChild);
    window.ESA._toolbar = {
      refresh: () => { label.textContent = `${cards().length} CARDS · BENTO VIEW`; }
    };
    window.ESA._toolbar.refresh();
  }

  // Tell the shell navigator (shell-nav.js) all cards are mounted, so it can
  // tag them with data-esa-card and activate the default card.
  window.dispatchEvent(new CustomEvent('esa:mounted'));

  // Re-count modules once async mounts have fully settled
  setTimeout(() => { if (window.ESA._toolbar) window.ESA._toolbar.refresh(); }, 400);

  // ============================================
  // 6. COMMUNICATION HUB — surface ESA component events into the Ingestion chat
  const HUB_EVENTS = {
    'esa:diagnostic': ['🩺', 'Diagnostic'],
    'esa:inventory-scan': ['📦', 'Inventory scan'],
    'esa:order-part': ['🛒', 'Part order'],
    'esa:create-workorder': ['📋', 'Workorder created'],
    'esa:workorder-completed': ['✅', 'Workorder completed'],
    'esa:part-added': ['➕', 'Part added'],
    'esa:part-removed': ['➖', 'Part removed'],
    'esa:lookup-part': ['🔎', 'Part lookup'],
    'esa:run-diagnostic': ['🩺', 'Diagnostic run'],
    'esa:add-part-to-workorder': ['➕', 'Workorder part'],
    'esa:broadcast': ['📡', 'Broadcast'],
    'esa:broadcast-toggle': ['📡', 'Broadcast toggle'],
    'esa:checklist': ['✅', 'Checklist']
  };
  Object.entries(HUB_EVENTS).forEach(([eventName, [icon, label]]) => {
    window.addEventListener(eventName, (e) => {
      const api = window.ESA?.ingestion?.api;
      if (api && typeof api.pushSystem === 'function') {
        api.pushSystem(`${icon} ${label} — ${hubSummary(e.detail)}`);
      }
      if (window.ESA.log) window.ESA.log(`${icon} ${label} — ${hubSummary(e.detail)}`, 'warning');
    });
  });

  // 7. GSAP ANIMATIONS (subtle entrance)
  try {
    if (typeof gsap !== 'undefined') {
      gsap.from('#esa-service-nav', { duration: 0.5, opacity: 0, x: -16, ease: 'power2.out' });
      gsap.from('#esa-ingestion-chat-card', { duration: 0.5, opacity: 0, y: 20, ease: 'power2.out' });
      gsap.from('#esa-diagnostics', { duration: 0.5, opacity: 0, y: 20, delay: 0.1, ease: 'power2.out' });
      gsap.from('#esa-parts-card', { duration: 0.5, opacity: 0, y: 20, delay: 0.15, ease: 'power2.out' });
      gsap.from('#esa-workorder', { duration: 0.5, opacity: 0, y: 20, delay: 0.2, ease: 'power2.out' });
      gsap.from('#esa-maintenance-checklist', { duration: 0.5, opacity: 0, y: 20, delay: 0.25, ease: 'power2.out' });
      gsap.from('#esa-ptac', { duration: 0.5, opacity: 0, y: 20, delay: 0.3, ease: 'power2.out' });
      gsap.from('#esa-ingestion', { duration: 0.5, opacity: 0, y: 20, delay: 0.35, ease: 'power2.out' });
    }
  } catch (err) {
    // Animations non-critical
  }

  // ============================================
  // COMPLETE
  // ============================================
  window.ESA.initialized = true;

  if (window.ESA.log) {
    window.ESA.log('╔════════════════════════════════════════════════════╗', 'success');
    window.ESA.log(`║ ESA EXOSKELETON v${window.ESA.version} — READY`, 'success');
    window.ESA.log('║ Ingestion dock + chat card (React)', 'success');
    window.ESA.log('╚════════════════════════════════════════════════════╝', 'success');
  }

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('esa:ready', {
    detail: {
      version: window.ESA.version,
      mountedCount: window.ESA.mountedComponents.length,
      components: {
        ingestion: !!window.ESA.ingestion?.instance,
        diagnosticCard: !!window.ESA.components.diagnosticCard,
        invPartsCard: !!window.ESA.components.invPartsCard,
        workorder: !!window.ESA.components.workorder,
        maintenanceChecklist: !!window.ESA.components.maintenanceChecklist,
        ptacB: !!window.ESA.components.ptacB
      }
    }
  }));

  hideLoading();
  return window.ESA;
}

// ============================================
// START
// ============================================
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initESAExoskeleton().catch(err => {
        console.error('[ESA] Fatal:', err);
        showError(`System initialization failed: ${err.message}`);
      });
    });
  } else {
    initESAExoskeleton().catch(err => {
      console.error('[ESA] Fatal:', err);
      showError(`System initialization failed: ${err.message}`);
    });
  }
} catch (err) {
  console.error('[ESA] Startup:', err);
  showError(`Startup error: ${err.message}`);
}

export { initESAExoskeleton };
export default { initESAExoskeleton };
