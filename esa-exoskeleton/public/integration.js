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

// Decorate a module container as a "Rendering Card"
function decorateCard(container, title) {
  if (!container || container.querySelector('.esa-card-header')) return;
  const header = document.createElement('div');
  header.className = 'esa-card-header';
  header.textContent = title;
  header.style.cssText =
    'padding:14px 16px;font-weight:600;font-size:10px;letter-spacing:1.2px;' +
    'color:#cfcfcf;background:rgba(13,13,13,0.5);border-bottom:1px solid rgba(200,168,130,0.18);' +
    'border-radius:30px 30px 0 0;margin:-28px -28px 0;user-select:none;';
  container.insertBefore(header, container.firstChild);
}

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
  // 1. ESA CONSOLE (left sidebar — scene/layers panel style)
  // ============================================
  const consoleBox = document.getElementById('esa-console');
  const consoleOutput = document.getElementById('esa-console-output');
  if (consoleBox && consoleOutput) {
    // Header — icon + title + subtitle + chevron
    const header = document.createElement('div');
    header.className = 'esa-console-header';
    header.innerHTML =
      '<div class="esa-console-logo">✦</div>' +
      '<div><div class="esa-console-title">ESA Console</div>' +
      '<div class="esa-console-subtitle">Hotel maintenance · Ava007 voice</div></div>' +
      '<span class="esa-console-chevron">⌄</span>';

    // Segmented toggle — Console / Library
    const toggle = document.createElement('div');
    toggle.className = 'esa-console-toggle';
    const btnConsole = document.createElement('button');
    btnConsole.textContent = 'Console';
    const btnLibrary = document.createElement('button');
    btnLibrary.textContent = 'Library';
    toggle.appendChild(btnConsole);
    toggle.appendChild(btnLibrary);

    // Library pane (rendering cards), hidden until the Library tab is active
    const libPane = document.createElement('div');
    libPane.className = 'esa-lib-pane';
    const libList = document.createElement('div');
    libPane.appendChild(libList);

    // Search footer
    const search = document.createElement('div');
    search.className = 'esa-console-search';
    const searchIcon = document.createElement('span');
    searchIcon.textContent = '🔍';
    const searchInput = document.createElement('input');
    searchInput.placeholder = 'Search…';
    search.appendChild(searchIcon);
    search.appendChild(searchInput);

    consoleBox.appendChild(header);
    consoleBox.appendChild(toggle);
    consoleBox.appendChild(consoleOutput);
    consoleBox.appendChild(libPane);
    consoleBox.appendChild(search);

    // ---- log rendering ----
    const LOG_ICONS = { info: '·', success: '✓', error: '✕', warning: '▲' };
    const LOG_COLORS = {
      info: '#3a332b',
      success: '#5b8c5a',
      error: '#c0392b',
      warning: '#a8742a'
    };
    let logFilter = '';

    const applyFilter = () => {
      const term = logFilter;
      consoleOutput.querySelectorAll('.esa-log-row').forEach(row => {
        row.style.display = !term || row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
      libList.querySelectorAll('.esa-lib-row').forEach(row => {
        row.style.display = !term || row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    };

    const setView = (view) => {
      const isConsole = view === 'console';
      btnConsole.classList.toggle('active', isConsole);
      btnLibrary.classList.toggle('active', !isConsole);
      consoleOutput.style.display = isConsole ? '' : 'none';
      libPane.style.display = isConsole ? 'none' : '';
    };
    btnConsole.addEventListener('click', () => setView('console'));
    btnLibrary.addEventListener('click', () => setView('library'));
    setView('console');

    searchInput.addEventListener('input', () => {
      logFilter = searchInput.value.trim().toLowerCase();
      applyFilter();
    });

    window.ESA.log = (msg, type = 'info') => {
      const row = document.createElement('div');
      row.className = 'esa-log-row';
      const icon = document.createElement('span');
      icon.className = 'esa-log-icon';
      icon.textContent = LOG_ICONS[type] || LOG_ICONS.info;
      icon.style.color = LOG_COLORS[type] || LOG_COLORS.info;
      const time = document.createElement('span');
      time.className = 'esa-log-time';
      time.textContent = new Date().toLocaleTimeString([], { hour12: false });
      const text = document.createElement('span');
      text.className = 'esa-log-msg';
      text.textContent = msg;
      text.style.color = LOG_COLORS[type] || LOG_COLORS.info;
      row.appendChild(icon);
      row.appendChild(time);
      row.appendChild(text);
      consoleOutput.appendChild(row);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
      while (consoleOutput.children.length > 300) {
        consoleOutput.removeChild(consoleOutput.firstChild);
      }
      applyFilter();
    };

    // Library view — every rendering card is a scene item
    const MODULES = [
      { id: 'esa-ingestion-chat-card', badge: 'A', badgeBg: '#2a6f4e', name: 'AI Ingestion Chat', sub: 'React · communication hub' },
      { id: 'esa-diagnostics', badge: 'D', badgeBg: '#5b8def', name: 'Diagnostic', sub: 'Arrow · systems check' },
      { id: 'esa-parts-card', badge: 'P', badgeBg: '#c9a227', name: 'Broadcast Parts', sub: 'Arrow · HD Supply' },
      { id: 'esa-workorder', badge: 'W', badgeBg: '#b05a5a', name: 'Workorder System', sub: 'Arrow · dispatch' },
      { id: 'esa-maintenance-checklist', badge: 'T', badgeBg: '#3a9db8', name: 'Daily To-Do List', sub: 'React · SOP checklist' }
    ];

    const buildLibrary = () => {
      libList.innerHTML = '';
      MODULES.forEach(mod => {
        const el = document.getElementById(mod.id);
        const mounted = !!el && el.children.length > 0;
        const row = document.createElement('div');
        row.className = 'esa-lib-row';
        row.innerHTML =
          `<div class="esa-lib-badge" style="background:${mod.badgeBg}">${mod.badge}</div>` +
          `<div><div class="esa-lib-name">${mod.name}</div>` +
          `<div class="esa-lib-sub">${mounted ? '✓ mounted · ' : ''}${mod.sub}</div></div>`;
        row.addEventListener('click', () => {
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            libList.querySelectorAll('.esa-lib-row').forEach(r => r.classList.remove('active'));
            row.classList.add('active');
          }
        });
        libList.appendChild(row);
      });
      applyFilter();
    };

    // Exposed so the mount phase can refresh the library after components land
    window.ESA._console = { setView, buildLibrary, applyFilter };

    window.ESA.log('ESA EXOSKELETON v' + window.ESA.version + ' — console online', 'success');
  }

  // ============================================
  // LOAD COMPONENTS
  // ============================================
  let ESAIngestion, ESADiagnosticCard, ESAInvPartsCardB, ESAWorkorder, ESAMaintenanceChecklist, themeModule;

  try {
    const [
      ingestionModule,
      diagnosticModule,
      partsModule,
      workorderModule,
      checklistModule,
      themeMod
    ] = await Promise.allSettled([
      import('./components/ESA.Ingestion.js'),
      import('./components/ESA.DiagnosticCard.js'),
      import('./components/ESA.invpartscard-B.js'),
      import('./components/ESA.workorder.js'),
      import('./components/ESA.MaintenanceChecklist.js'),
      import('./config/gruvbox-colors.js')
    ]);

    ESAIngestion = ingestionModule.status === 'fulfilled' ? ingestionModule.value.ESAIngestion : null;
    ESADiagnosticCard = diagnosticModule.status === 'fulfilled' ? diagnosticModule.value.ESADiagnosticCard : null;
    ESAInvPartsCardB = partsModule.status === 'fulfilled' ? partsModule.value.ESAInvPartsCardB : null;
    ESAWorkorder = workorderModule.status === 'fulfilled' ? workorderModule.value.ESAWorkorder : null;
    ESAMaintenanceChecklist = checklistModule.status === 'fulfilled' ? checklistModule.value.ESAMaintenanceChecklist : null;
    themeModule = themeMod.status === 'fulfilled' ? themeMod.value : null;

    if (ingestionModule.status === 'rejected') window.ESA.errors.push({ component: 'Ingestion', error: ingestionModule.reason });
    if (diagnosticModule.status === 'rejected') window.ESA.errors.push({ component: 'DiagnosticCard', error: diagnosticModule.reason });
    if (partsModule.status === 'rejected') window.ESA.errors.push({ component: 'InvPartsCard', error: partsModule.reason });
    if (workorderModule.status === 'rejected') window.ESA.errors.push({ component: 'Workorder', error: workorderModule.reason });
    if (checklistModule.status === 'rejected') window.ESA.errors.push({ component: 'MaintenanceChecklist', error: checklistModule.reason });
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
        decorateCard(diagnosticContainer, '🩺 DIAGNOSTIC CARD');
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
        decorateCard(partsCardContainer, '📦 BROADCAST PARTS');
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
        decorateCard(workorderContainer, '📋 WORKORDER SYSTEM');
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

  // ============================================
  // 5b. VIEWPORT TOOLBAR + LIBRARY REFRESH
  // ============================================
  const renderArea = document.querySelector('.esa-render-area');
  const CARD_IDS = ['esa-ingestion-chat-card', 'esa-diagnostics', 'esa-parts-card', 'esa-workorder', 'esa-maintenance-checklist'];
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
    const cards = () => CARD_IDS.map(id => document.getElementById(id)).filter(el => el && el.children.length > 0);
    const jump = dir => {
      const list = cards();
      if (!list.length) return;
      cursor = (cursor + dir + list.length) % list.length;
      list[cursor].scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    prev.addEventListener('click', () => jump(-1));
    next.addEventListener('click', () => jump(1));

    renderArea.insertBefore(bar, renderArea.firstChild);
    window.ESA._toolbar = {
      refresh: () => { label.textContent = `${cards().length} MODULES · RENDERING VIEW`; }
    };
    window.ESA._toolbar.refresh();
  }

  if (window.ESA._console && typeof window.ESA._console.buildLibrary === 'function') {
    window.ESA._console.buildLibrary();
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
      gsap.from('#esa-console', { duration: 0.5, opacity: 0, x: -16, ease: 'power2.out' });
      gsap.from('#esa-ingestion-chat-card', { duration: 0.5, opacity: 0, y: 20, ease: 'power2.out' });
      gsap.from('#esa-diagnostics', { duration: 0.5, opacity: 0, y: 20, delay: 0.1, ease: 'power2.out' });
      gsap.from('#esa-parts-card', { duration: 0.5, opacity: 0, y: 20, delay: 0.15, ease: 'power2.out' });
      gsap.from('#esa-workorder', { duration: 0.5, opacity: 0, y: 20, delay: 0.2, ease: 'power2.out' });
      gsap.from('#esa-maintenance-checklist', { duration: 0.5, opacity: 0, y: 20, delay: 0.25, ease: 'power2.out' });
      gsap.from('#esa-ingestion', { duration: 0.5, opacity: 0, y: 20, delay: 0.3, ease: 'power2.out' });
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
        maintenanceChecklist: !!window.ESA.components.maintenanceChecklist
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
