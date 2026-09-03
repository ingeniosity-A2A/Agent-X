/**
 * ESA.Calendar.js — SERVICE CALENDAR · GREEN SHIELD EDITION
 * ============================================
 * The ESA tab dropdown's calendar — its own full panel, NOT a bento card.
 * Stays as-is: same mount point (#esa-calendar), same dropdown entry,
 * same esa:calendar event. Updated with the important Green Shield dates.
 *
 * Green Shield rules are parity with the real backend
 * (platform/src/lib/green-shield.ts — /api/green-shield):
 *   - Inspection DUE every weekday except Sunday
 *   - Rotating daily template by day-of-month (d % 3):
 *       0 -> Daily facilities walk
 *       1 -> Guest room mechanical sample
 *       2 -> Kitchen / break & laundry
 *   - Rooms out of service (same ternary chain as the backend):
 *       d % 4 === 0 -> rooms 214 + 308 ; else d % 5 === 0 -> room 119
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

// Rotating Green Shield daily templates — same order as the backend lib.
const GS_TEMPLATES = [
  'Daily facilities walk',
  'Guest room mechanical sample',
  'Kitchen / break & laundry'
];

// Green Shield schedule for one day — parity with buildDay/dWeekdayDue.
function gsFor(year, month, d) {
  const dow = new Date(year, month, d).getDay();
  return {
    dow: dow,
    due: dow !== 0,
    template: GS_TEMPLATES[d % 3],
    rooms: d % 4 === 0 ? ['214', '308'] : (d % 5 === 0 ? ['119'] : [])
  };
}

// Module-scope methods binding (wrapper exposes .methods).
let methods = null;

export const ESACalendar = ESAVerifyComponent({
  name: 'Calendar',
  version: '2.0.0',
  verified: true,

  state: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selected: new Date().getDate()
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
      const rows = Math.ceil(cells.length / 7);
      while (cells.length < rows * 7) {
        cells.push({ d: next, inMonth: false, today: false });
        next++;
      }
      return cells;
    },

    renderGrid: (state, container) => {
      const grid = container.querySelector('#cal-grid');
      if (!grid) return;
      grid.innerHTML = '';
      methods.cells(state).forEach((c) => {
        const cell = document.createElement('span');
        let cls = 'bk-cal-cell' +
          (c.inMonth ? '' : ' bk-cal-dim') +
          (c.today ? ' bk-cal-today' : '');
        if (c.inMonth) {
          const gs = gsFor(state.year, state.month, c.d);
          if (gs.dow === 0) cls += ' esa-cal-sun';
          if (gs.due) cls += ' esa-cal-gs';
          if (gs.rooms.length) cls += ' esa-cal-oos';
          if (state.selected === c.d) cls += ' esa-cal-selected';
          cell.dataset.day = String(c.d);
          cell.title = 'Green Shield ' + (gs.due ? 'due' : 'no inspection (Sunday)') +
            (gs.rooms.length ? ' · rooms out: ' + gs.rooms.join(', ') : '');
          cell.addEventListener('click', () => {
            methods.selectDay(state, c.d, container);
          });
        }
        cell.className = cls;
        cell.textContent = c.d;
        grid.appendChild(cell);
      });
      const label = container.querySelector('#cal-label');
      if (label) label.textContent = methods.monthLabel(state);
    },

    renderDetail: (state, container) => {
      const el = container.querySelector('#cal-detail');
      if (!el) return;
      el.innerHTML = '';

      const now = new Date();
      const viewIsCurrent = state.year === now.getFullYear() && state.month === now.getMonth();
      const sel = state.selected != null ? state.selected : (viewIsCurrent ? now.getDate() : null);

      if (sel == null) {
        const hint = document.createElement('div');
        hint.textContent = 'Select a day for its Green Shield detail.';
        el.appendChild(hint);
        return;
      }

      const gs = gsFor(state.year, state.month, sel);
      const dateStr = new Date(state.year, state.month, sel)
        .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        .toUpperCase();

      const head = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = dateStr;
      head.appendChild(strong);
      head.appendChild(document.createTextNode(' — ' + (gs.due ? 'GREEN SHIELD DUE' : 'NO INSPECTION — SUNDAY')));
      el.appendChild(head);

      const tpl = document.createElement('div');
      tpl.textContent = 'Daily template: ' + gs.template;
      el.appendChild(tpl);

      const rooms = document.createElement('div');
      rooms.textContent = gs.rooms.length
        ? 'Rooms out of service: ' + gs.rooms.join(', ')
        : 'No rooms out of service.';
      el.appendChild(rooms);
    },

    selectDay: (state, d, container) => {
      state.selected = d;
      methods.renderGrid(state, container);
      methods.renderDetail(state, container);
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

  // Full calendar panel — not a bento card. Static style attributes only,
  // no HTML comments; dynamic content is post-mount DOM.
  template: (props, state, methods) => html`
    <div class="esa-cal-panel">
      <div class="esa-cal-head">
        <span class="bk-pill"><span class="bk-dot pulse"></span>ESA · GREEN SHIELD CALENDAR</span>
        <span id="cal-label" class="bk-meta">SEPTEMBER 2026</span>
        <div class="esa-cal-nav">
          <button id="cal-prev" class="bk-icon-btn" style="width:2rem;height:2rem;" aria-label="Previous month">
            <svg viewBox="0 0 24 24" style="width:0.9rem;height:0.9rem;" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button id="cal-next" class="bk-icon-btn" style="width:2rem;height:2rem;" aria-label="Next month">
            <svg viewBox="0 0 24 24" style="width:0.9rem;height:0.9rem;" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div class="esa-cal-dow">
        ${DOW_NAMES.map((d) => html`
          <span class="bk-meta">${d}</span>
        `)}
      </div>

      <div id="cal-grid" class="esa-cal-grid bk-cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:0.25rem;"></div>

      <div id="cal-detail" class="esa-cal-detail"></div>

      <div class="esa-cal-legend">
        <span><i class="lg lg-due"></i>GREEN SHIELD DUE</span>
        <span><i class="lg lg-oos"></i>ROOMS OUT OF SERVICE</span>
        <span><i class="lg lg-off"></i>NO INSPECTION (SUN)</span>
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
    const prevBtn = container.querySelector('#cal-prev');
    const nextBtn = container.querySelector('#cal-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        methods.shiftMonth(this.state, -1);
        methods.renderGrid(this.state, container);
        methods.renderDetail(this.state, container);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        methods.shiftMonth(this.state, 1);
        methods.renderGrid(this.state, container);
        methods.renderDetail(this.state, container);
      });
    }
    methods.renderGrid(this.state, container);
    methods.renderDetail(this.state, container);
  }, 100);

  return result;
};

export default ESACalendar;
