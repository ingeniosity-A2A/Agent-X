/**
 * ESA service shell navigator — UI8 dock (V6 attachment)
 * ======================================================
 * Visual: the uploaded ava007-console-patch-v6 dock is attached AS-IS
 * (floating glass rail, gradient orbs, utility stack, dock label) —
 * not redesigned. It is only RE-EDITED with the actual information:
 * every orb is a real ESA service card, the utility buttons do real
 * shell actions, and the dock label carries the ESA mark.
 *
 * Behavior (locked spec): ESA title → dropdown of ESA cards →
 * choose a card → card renders in the viewport. No individual
 * consoles. Chat lives only in the bottom dock.
 */
(function () {
  const CARDS = [
    { id: 'esa-diagnostics',           label: 'Diagnostic',      sub: 'Scan · severity · Ava007 voice',  glyph: 'D', theme: 'mint'   },
    { id: 'esa-parts-card',            label: 'Parts',           sub: 'Inventory · order · broadcast',   glyph: 'P', theme: 'orange' },
    { id: 'esa-workorder',             label: 'Workorder',       sub: 'Operator tabs · parts · totals',  glyph: 'W', theme: 'blue'   },
    { id: 'esa-maintenance-checklist', label: 'Checklist',       sub: '15 SOP tasks · shift sign-off',   glyph: 'T', theme: 'purple' },
    { id: 'esa-ptac',                  label: 'PTAC Broadcast',  sub: 'HD Supply 223532 · service calls', glyph: 'B', theme: 'coral' },
  ];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function orb(theme, glyph) {
    return `<span class="u8-orb-core u8-orb--${theme}" aria-hidden="true">${glyph}</span>`;
  }

  function ensureNav() {
    const aside = $('#esa-console');
    if (!aside) return null;

    aside.setAttribute('role', 'navigation');
    aside.setAttribute('aria-label', 'ESA service');
    aside.id = 'esa-service-nav';

    if ($('.u8-dock', aside)) return aside;

    aside.innerHTML = '';

    // ---- Floating dock (uploaded v6 design, as-is) ----
    const dock = document.createElement('div');
    dock.className = 'u8-dock';

    // ESA title orb — click opens the card dropdown (locked spec)
    const brand = document.createElement('button');
    brand.type = 'button';
    brand.className = 'u8-orb u8-brand';
    brand.title = 'ESA · service cards';
    brand.setAttribute('aria-label', 'ESA service cards menu');
    brand.setAttribute('aria-expanded', 'false');
    brand.innerHTML = orb('brand', '●');

    const sep1 = document.createElement('span');
    sep1.className = 'u8-dock-sep';

    // Card orbs — one per real ESA card ("tabs")
    const nav = document.createElement('nav');
    nav.className = 'u8-dock-nav';
    nav.setAttribute('aria-label', 'ESA cards');

    CARDS.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'u8-orb';
      b.dataset.cardId = c.id;
      b.title = c.label;
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.innerHTML = orb(c.theme, c.glyph);
      nav.appendChild(b);
    });

    const sep2 = document.createElement('span');
    sep2.className = 'u8-dock-sep';

    // Utility stack — real shell actions, design glyphs kept
    const utils = document.createElement('div');
    utils.className = 'u8-dock-utils';

    const utilMenu = document.createElement('button');
    utilMenu.type = 'button';
    utilMenu.className = 'u8-util';
    utilMenu.title = 'ESA service cards';
    utilMenu.setAttribute('aria-label', 'Open ESA service cards menu');
    utilMenu.textContent = '≡';

    const utilCycle = document.createElement('button');
    utilCycle.type = 'button';
    utilCycle.className = 'u8-util';
    utilCycle.title = 'Next card';
    utilCycle.setAttribute('aria-label', 'Cycle to next ESA card');
    utilCycle.textContent = '◯';

    const utilVoice = document.createElement('button');
    utilVoice.type = 'button';
    utilVoice.className = 'u8-util';
    utilVoice.title = 'Ava007 voice';
    utilVoice.setAttribute('aria-label', 'Toggle Ava007 voice');
    utilVoice.setAttribute('aria-pressed', 'true');
    utilVoice.textContent = '⧉';

    utils.appendChild(utilMenu);
    utils.appendChild(utilCycle);
    utils.appendChild(utilVoice);

    const label = document.createElement('span');
    label.className = 'u8-dock-label';
    // Re-edited with the actual information: this shell is ESA
    label.textContent = 'ESA';

    dock.appendChild(brand);
    dock.appendChild(sep1);
    dock.appendChild(nav);
    dock.appendChild(sep2);
    dock.appendChild(utils);
    dock.appendChild(label);
    aside.appendChild(dock);

    // ---- Flyout dropdown (ESA title → card list → viewport) ----
    const flyout = document.createElement('div');
    flyout.className = 'u8-flyout';
    flyout.setAttribute('role', 'listbox');
    flyout.setAttribute('aria-label', 'ESA card types');

    const head = document.createElement('div');
    head.className = 'u8-flyout-head';
    head.textContent = 'ESA · Service Cards';
    flyout.appendChild(head);

    CARDS.forEach((c, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'u8-flyout-item';
      item.dataset.cardId = c.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      item.innerHTML =
        `<span class="u8-orb-core u8-orb--${c.theme} u8-orb--mini" aria-hidden="true">${c.glyph}</span>` +
        `<span class="u8-flyout-text"><span class="u8-flyout-label">${c.label}</span>` +
        `<span class="u8-flyout-sub">${c.sub}</span></span>`;
      flyout.appendChild(item);
    });
    aside.appendChild(flyout);

    const setMenu = (open) => {
      flyout.classList.toggle('open', open);
      brand.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    const toggleMenu = () => setMenu(flyout.classList.contains('open') ? false : true);

    brand.addEventListener('click', toggleMenu);
    utilMenu.addEventListener('click', toggleMenu);

    utilCycle.addEventListener('click', () => {
      const current = document.querySelector('.u8-orb[aria-selected="true"]');
      const idx = Math.max(0, CARDS.findIndex((c) => c.id === current?.dataset.cardId));
      showCard(CARDS[(idx + 1) % CARDS.length].id);
    });

    // Ava007 voice toggle — wired to the Ingestion audio engine when present
    utilVoice.addEventListener('click', () => {
      const engine = window.ESA?.ingestion?.api?.audioEngine;
      const nextState = utilVoice.getAttribute('aria-pressed') !== 'true';
      utilVoice.setAttribute('aria-pressed', nextState ? 'true' : 'false');
      utilVoice.classList.toggle('active', nextState);
      let handled = false;
      if (engine && typeof engine === 'object') {
        for (const fn of ['setMuted', 'toggleMute', 'setEnabled']) {
          if (typeof engine[fn] === 'function') {
            try { engine[fn](fn === 'toggleMute' ? undefined : !nextState); handled = true; break; } catch (_) {}
          }
        }
      }
      if (!handled) {
        window.ESA = window.ESA || {};
        window.ESA.voiceMuted = !nextState;
      }
      window.dispatchEvent(new CustomEvent('esa:voice-mute', { detail: { muted: !nextState } }));
    });

    // Card selection from dock orbs
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-card-id]');
      if (!btn) return;
      showCard(btn.dataset.cardId);
      setMenu(false);
    });

    // Card selection from flyout dropdown
    flyout.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-card-id]');
      if (!btn) return;
      showCard(btn.dataset.cardId);
      setMenu(false);
    });

    // Click away closes the menu
    document.addEventListener('click', (e) => {
      if (!aside.contains(e.target)) setMenu(false);
    });

    return aside;
  }

  function tagCards() {
    const stage = $('.esa-render-area');
    if (!stage) return;
    CARDS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) el.setAttribute('data-esa-card', c.id);
    });
    // Chat card belongs in bottom dock — hide from stage
    const chatCard = document.getElementById('esa-ingestion-chat-card');
    if (chatCard) chatCard.classList.add('esa-merged-away');
  }

  function showCard(id) {
    document.querySelectorAll('[data-esa-card]').forEach((el) => {
      el.classList.toggle('esa-card-active', el.id === id);
    });
    // Sync dock orbs + flyout selection (class drives the conic ring)
    document.querySelectorAll('.u8-orb[data-card-id], .u8-flyout-item[data-card-id]').forEach((el) => {
      const sel = el.dataset.cardId === id;
      el.setAttribute('aria-selected', sel ? 'true' : 'false');
      if (el.classList.contains('u8-orb')) el.classList.toggle('active', sel);
    });
    window.dispatchEvent(new CustomEvent('esa:card-selected', { detail: { id } }));
  }

  function boot() {
    ensureNav();
    tagCards();
    // Default first card
    showCard(CARDS[0].id);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50));
  } else {
    setTimeout(boot, 50);
  }

  // After integration mounts late components
  window.addEventListener('esa:mounted', () => {
    ensureNav();
    tagCards();
    const sel = document.querySelector('.u8-orb[aria-selected="true"]');
    showCard(sel?.dataset.cardId || CARDS[0].id);
  });

  window.ESAShell = { showCard, CARDS };
})();
