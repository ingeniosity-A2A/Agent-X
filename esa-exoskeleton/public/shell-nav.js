/**
 * ESA service shell navigator
 * Left: service title ESA → card types
 * Center: one active card above chat
 * Bottom: single chatbot (existing #esa-ingestion mount)
 */
(function () {
  const CARDS = [
    { id: 'esa-diagnostics', label: 'Diagnostic', badge: 'D' },
    { id: 'esa-parts-card', label: 'Parts', badge: 'P' },
    { id: 'esa-workorder', label: 'Workorder', badge: 'W' },
    { id: 'esa-maintenance-checklist', label: 'Checklist', badge: 'T' },
  ];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function ensureNav() {
    let aside = $('#esa-console');
    if (!aside) return null;

    // Rename role: service nav, not product "console"
    aside.setAttribute('role', 'navigation');
    aside.setAttribute('aria-label', 'ESA service');
    aside.id = 'esa-service-nav';

    if ($('.esa-service-head', aside)) return aside;

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'esa-service-head';
    head.setAttribute('aria-expanded', 'false');
    head.innerHTML = '<span>ESA</span><span aria-hidden="true">▾</span>';

    const tree = document.createElement('div');
    tree.className = 'esa-card-tree';
    tree.setAttribute('role', 'listbox');
    tree.setAttribute('aria-label', 'Card types');

    CARDS.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'option');
      btn.dataset.cardId = c.id;
      btn.textContent = c.label;
      if (i === 0) btn.setAttribute('aria-selected', 'true');
      tree.appendChild(btn);
    });

    // The console sidebar is gone — this nav IS the left rail:
    // ESA title (click → dropdown) → card renders in the viewport.
    aside.innerHTML = '';
    aside.appendChild(head);
    aside.appendChild(tree);

    head.addEventListener('click', () => {
      const open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', open ? 'false' : 'true');
      tree.classList.toggle('open', !open);
    });

    tree.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-card-id]');
      if (!btn) return;
      const id = btn.dataset.cardId;
      showCard(id);
      tree.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      // Dropdown collapses once a card is chosen
      head.setAttribute('aria-expanded', 'false');
      tree.classList.remove('open');
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
    window.dispatchEvent(
      new CustomEvent('esa:card-selected', { detail: { id } }),
    );
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
    tagCards();
    const sel = document.querySelector('.esa-card-tree button[aria-selected="true"]');
    showCard(sel?.dataset.cardId || CARDS[0].id);
  });

  window.ESAShell = { showCard, CARDS };
})();
