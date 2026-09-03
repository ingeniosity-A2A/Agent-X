/**
 * ESA service shell navigator — OFFICIAL SIDEBAR (uploaded attachment)
 * ====================================================================
 * The agent browser's official sidebar is the responsive pinned sidebar
 * (sidebar/sidebar.css — byte-identical from the upload zip) with the
 * grid-transition tree. ESA is NOT its own sidebar anymore: ESA is ONE
 * TAB in that tree, and its dropdown lists the real ESA service cards
 * + Calendar (sidebar/sidebar-tree.js).
 *
 * This module keeps only the shell contract:
 *   - tag card containers as [data-esa-card] and mark the active one
 *   - showCard(id) — one card per viewport, grid-transition in
 *   - window.ESAShell API (builder.html + tree both use it)
 * Chat lives only in the bottom dock (speakers on both ends).
 */
(function () {
  const CARDS = [
    { id: 'esa-diagnostics',           label: 'Diagnostic' },
    { id: 'esa-parts-card',            label: 'Parts' },
    { id: 'esa-workorder',             label: 'Workorder' },
    { id: 'esa-maintenance-checklist', label: 'Checklist' },
    { id: 'esa-ptac',                  label: 'PTAC Broadcast' },
    { id: 'esa-calendar',              label: 'Calendar' }
  ];

  function tagCards() {
    const stage = document.querySelector('.esa-render-area');
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
      const active = el.id === id;
      el.classList.toggle('esa-card-active', active);
      if (active) {
        // Restart the grid-transition entrance on reselection
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      }
    });
    window.dispatchEvent(new CustomEvent('esa:card-selected', { detail: { id } }));
  }

  function boot() {
    tagCards();
    const current = document.querySelector('[data-esa-card].esa-card-active');
    showCard(current ? current.id : CARDS[0].id);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50));
  } else {
    setTimeout(boot, 50);
  }

  // After integration mounts late components
  window.addEventListener('esa:mounted', () => {
    tagCards();
    const current = document.querySelector('[data-esa-card].esa-card-active');
    showCard(current ? current.id : CARDS[0].id);
  });

  window.ESAShell = { showCard, CARDS };
})();
