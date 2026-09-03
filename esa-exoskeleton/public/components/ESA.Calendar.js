/**
 * ESA.Calendar.js — BENTO EDITION
 * ============================================
 * SERVICE CALENDAR — official Bento card (ESA tab dropdown).
 *
 * One framework: Bento (docs/BENTO-OFFICIAL-UI.md).
 * Structure:  .bento-card > .bento-demo (month grid) + .bento-text
 * Tokens:     --bk-* (bento-tokens.css) — Beige · Green · Black.
 *
 * Arrow.js rules honored: no HTML comments inside html`` templates,
 * no ${} inside style attributes (static classes + post-mount DOM only).
 * Real information: live system date, real month grids, today marked.
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DOW_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Module-scope methods binding (wrapper exposes .methods).
let methods = null;

export const ESACalendar = ESAVerifyComponent({
  name: 'Calendar',
  version: '1.0.0',
  verified: true,

  state: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    todayIso: new Date().toDateString()
  },

  methods: {
    monthLabel: (state) => {
      return (MONTH_NAMES[state.month] + ' ' + state.year).toUpperCase();
    },

    cells: (state) => {
      const first = new Date(state.year, state.month, 1);
      const startDow = first.getDay();
      const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
      const daysPrev = new Date(state.year, state.month, 0).getDate();
      const now = new Date();
      const cells = [];

      for (let i = startDow - 1; i >= 0; i--) {
        cells.push({ d: daysPrev - i, inMonth: false, today: false });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const isToday = now.getFullYear() === state.year &&
          now.getMonth() === state.month && now.getDate() === d;
        cells.push({ d: d, inMonth: true, today: isToday });
      }
      let next = 1;
      while (cells.length % 7 !== 0 || cells.length < 42) {
        cells.push({ d: next, inMonth: false, today: false });
        next++;
        if (cells.length >= 42) break;
      }
      return cells;
    },

    renderGrid: (state, container) => {
      const grid = container.querySelector('#esa-cal-grid');
      if (!grid) return;
      grid.innerHTML = '';
      methods.cells(state).forEach((c) => {
        const cell = document.createElement('span');
        cell.className = 'bk-cal-cell' +
          (c.inMonth ? '' : ' bk-cal-dim') +
          (c.today ? ' bk-cal-today' : '');
        cell.textContent = c.d;
        grid.appendChild(cell);
      });
      const label = container.querySelector('#esa-cal-label');
      if (label) label.textContent = methods.monthLabel(state);
    },

    shiftMonth: (state, delta) => {
      let m = state.month + delta;
      let y = state.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      state.month = m;
      state.year = y;
      window.dispatchEvent(new CustomEvent('esa:calendar', {
        detail: { year: y, month: m + 1 }
      }));
    }
  },

  // Bento template — static style attributes only, no HTML comments.
  template: (props, state, methods) => html`
    <div class="bento-card punch-border" style="width:100%;max-width:600px;margin:0 auto;">
      <div class="bento-demo" style="padding:1.25rem;display:flex;flex-direction:column;gap:0.85rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
          <span class="bk-pill"><span class="bk-dot pulse"></span>SERVICE CALENDAR</span>
          <span id="esa-cal-label" class="bk-meta">SEPTEMBER 2026</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
          <button id="esa-cal-prev" class="bk-icon-btn" style="width:2rem;height:2rem;" aria-label="Previous month">
            <svg viewBox="0 0 24 24" style="width:0.9rem;height:0.9rem;" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <div style="display:flex;gap:0.4rem;width:100%;justify-content:space-between;padding:0 0.25rem;">
            ${DOW_NAMES.map((d) => html`
              <span class="bk-meta" style="width:2rem;text-align:center;">${d}</span>
            `)}
          </div>
          <button id="esa-cal-next" class="bk-icon-btn" style="width:2rem;height:2rem;" aria-label="Next month">
            <svg viewBox="0 0 24 24" style="width:0.9rem;height:0.9rem;" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div id="esa-cal-grid" class="bk-cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:0.3rem;justify-items:center;"></div>
      </div>

      <div class="bento-text">
        <h3 class="bento-title">Service <em>calendar</em></h3>
        <p class="bento-desc">Real month grids with today marked — the ESA tab dropdown drops down to the cards and this calendar. Flip months to plan service windows around the workorder schedule.</p>
        <div class="bk-row" style="margin-top:0.75rem;">
          <span class="bk-meta">TODAY</span>
          <span class="bk-pill"><span class="bk-dot"></span>${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
    `
});

methods = ESACalendar.methods;

// Setup after mount
const origCalMount = ESACalendar.mount;
ESACalendar.mount = function (container) {
  const result = origCalMount.call(this, container);

  setTimeout(() => {
    const prevBtn = container.querySelector('#esa-cal-prev');
    const nextBtn = container.querySelector('#esa-cal-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        methods.shiftMonth(this.state, -1);
        methods.renderGrid(this.state, container);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        methods.shiftMonth(this.state, 1);
        methods.renderGrid(this.state, container);
      });
    }
    methods.renderGrid(this.state, container);
  }, 100);

  return result;
};

export default ESACalendar;
