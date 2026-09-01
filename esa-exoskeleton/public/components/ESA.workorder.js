/**
 * ESA.workorder.js — BENTO EDITION
 * ============================================
 * UNIFIED MAINTENANCE WORKORDER SYSTEM — official Bento card.
 *
 * One framework: Bento (docs/BENTO-OFFICIAL-UI.md).
 * Structure:  .bento-card > .bento-text (header) + .bento-demo (operator tabs)
 * Tokens:     --bk-* (bento-tokens.css) — Beige · Green · Black.
 * Polish:     punch-border + gradient-mask-btn (v6-exoskel-polish.css).
 *
 * Contract kept identical for integration.js + shell-nav.js:
 *   - .mount(container)  (ESAVerifyComponent wrapper)
 *   - esa:part-added / esa:part-removed / esa:workorder-completed events
 *   - All wo-* element ids used by post-mount wiring
 *
 * Arrow.js rules honored: no HTML comments inside html`` templates,
 * no ${} inside style attributes (static classes + post-mount DOM only).
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

// Module-scope methods binding (wrapper exposes .methods). Lets the
// module-scope helpers reach the methods without an import cycle.
let methods = null;

export const ESAWorkorder = ESAVerifyComponent({
  name: 'workorder',
  version: '3.0.0',
  verified: true,

  state: {
    activeSideTab: 'workorder',
    workorderId: 'WO-2026-001',
    workorderData: {
      unitModel: 'SP09EA2-20',
      serialNumber: 'YYMM080523',
      location: 'Room 304 - Building A',
      technician: 'John Smith',
      status: 'in_progress',
      diagnosticCode: 'F1',
      laborHours: 1.5,
      warrantyClaim: true,
      notes: '',
      createdAt: new Date().toISOString()
    },
    partsList: [
      { part: '203862', name: 'Indoor Ambient Thermistor', qty: 1, cost: 45.00 }
    ],
    maintenanceComplete: false,
    showPartsCatalog: false,

    // Available parts from catalog
    catalogParts: [
      { sku: 'HD-4421', name: 'Seasons 9000 BTU PTAC Unit', price: 899.00 },
      { sku: 'HD-1180', name: 'PTAC Subbase 20A', price: 45.00 },
      { sku: 'HD-9033', name: 'Double Packed Filter', price: 12.50 },
      { sku: 'HD-2205', name: 'Wireless Thermostat', price: 159.00 }
    ],

    // Workorder history
    history: [
      { id: 'WO-2026-000', date: '2026-08-15', unit: 'SP09EA2-20', status: 'completed', cost: 245.00 },
      { id: 'WO-2025-042', date: '2026-08-10', unit: 'SP09EA2-20', status: 'completed', cost: 89.00 }
    ]
  },

  methods: {
    addPart: (state, part) => {
      const existing = state.partsList.find(p => p.part === (part.sku || part.part));
      if (existing) {
        existing.qty += 1;
      } else {
        state.partsList.push({
          part: part.sku || part.part,
          name: part.name,
          qty: 1,
          cost: part.price || 0
        });
      }

      window.dispatchEvent(new CustomEvent('esa:part-added', {
        detail: { part, workorderId: state.workorderId }
      }));

      renderPartsList(state, container);
      updateCostDisplay(state, container);
      renderPartsInventory(state, container);
    },

    removePart: (state, index) => {
      const removed = state.partsList[index];
      state.partsList.splice(index, 1);

      window.dispatchEvent(new CustomEvent('esa:part-removed', {
        detail: { part: removed, workorderId: state.workorderId }
      }));

      renderPartsList(state, container);
      updateCostDisplay(state, container);
      renderPartsInventory(state, container);
    },

    completeMaintenance: (state) => {
      state.maintenanceComplete = true;
      state.workorderData.status = 'completed';

      const totalCost = state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0) +
                       (state.workorderData.laborHours * 75);

      // Add to history
      state.history.unshift({
        id: state.workorderId,
        date: new Date().toISOString().split('T')[0],
        unit: state.workorderData.unitModel,
        status: 'completed',
        cost: totalCost
      });

      window.dispatchEvent(new CustomEvent('esa:workorder-completed', {
        detail: {
          workorderId: state.workorderId,
          totalCost,
          partsUsed: state.partsList.length
        }
      }));

      updateStatusBadge(state, container);
      renderHistory(state, container);
    },

    switchSideTab: (state, tab) => {
      state.activeSideTab = tab;
      updateTabUI(state, container);
    },

    getTotalPartsCost: (state) => {
      return state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0);
    },

    getLaborCost: (state) => {
      return (state.workorderData.laborHours || 0) * 75;
    },

    getTotalCost: (state) => {
      const partsCost = state.partsList.reduce((sum, p) => sum + (p.cost * p.qty), 0);
      const laborCost = (state.workorderData.laborHours || 0) * 75;
      return partsCost + laborCost;
    }
  },

  // Bento template — static style attributes only, no HTML comments.
  template: (props, state, methods) => html`
    <div class="bento-card punch-border" style="width:100%;margin:0 auto;">
      <div class="bento-text" style="padding-bottom:0.6rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.6rem;flex-wrap:wrap;">
          <div>
            <h3 class="bento-title" style="margin:0;">Workorder <em>details</em></h3>
            <p class="bento-desc" style="margin-top:0.2rem;">Unit service record — parts, labor, diagnostics and history.</p>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span id="wo-id-display" class="bk-meta">${() => state.workorderId}</span>
            <span id="wo-status-badge" class="bk-pill warn" style="padding:0.28rem 0.7rem;"><span class="bk-dot pulse"></span>IN PROGRESS</span>
          </div>
        </div>
      </div>

      <div class="bento-demo" style="background:var(--bk-panel);min-height:0;">
        <div style="display:flex;gap:0.25rem;padding:0.5rem 1rem 0;border-bottom:1px solid var(--bk-border);">
          <button class="wo-side-tab" data-tab="workorder">Workorder</button>
          <button class="wo-side-tab" data-tab="parts">Parts</button>
          <button class="wo-side-tab" data-tab="diagnostics">Diagnostics</button>
          <button class="wo-side-tab" data-tab="history">History</button>
        </div>

        <div style="padding:1.1rem 1.25rem 1.25rem;">

          <div class="wo-tab-panel" data-panel="workorder" id="wo-panel-workorder" style="display:block;">
            <div style="border:1px solid var(--bk-border);background:var(--bk-card);border-radius:0.85rem;padding:1rem;margin-bottom:0.9rem;">
              <div class="bk-meta" style="margin-bottom:0.7rem;">UNIT INFORMATION</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.8rem;">
                <div class="bk-field">
                  <span class="bk-field-label">Model</span>
                  <div id="wo-unit-model" style="font-weight:600;color:var(--bk-text);font-size:0.8rem;">SP09EA2-20</div>
                </div>
                <div class="bk-field">
                  <span class="bk-field-label">Serial</span>
                  <div id="wo-serial" style="font-weight:600;color:var(--bk-text);font-size:0.8rem;">YYMM080523</div>
                </div>
                <div class="bk-field">
                  <span class="bk-field-label">Location</span>
                  <div id="wo-location" style="font-weight:600;color:var(--bk-text);font-size:0.8rem;">Room 304 - Building A</div>
                </div>
                <div class="bk-field">
                  <span class="bk-field-label">Status</span>
                  <div id="wo-status" style="font-weight:600;color:var(--bk-warn);font-size:0.8rem;">IN PROGRESS</div>
                </div>
              </div>
            </div>

            <div style="border:1px solid var(--bk-border);background:var(--bk-card);border-radius:0.85rem;padding:1rem;margin-bottom:0.9rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.6rem;margin-bottom:0.8rem;">
                <div class="bk-meta">PARTS USED</div>
                <button id="wo-add-part-btn" class="bk-btn" style="margin-top:0;">+ Add part</button>
              </div>

              <div id="wo-parts-catalog" style="margin-bottom:0.9rem;padding:0.8rem;border:1px solid var(--bk-border);background:var(--bk-panel-2);border-radius:0.7rem;display:none;">
                <div class="bk-meta" style="margin-bottom:0.6rem;">SELECT PART FROM CATALOG</div>
                <div id="wo-catalog-list" style="display:grid;gap:0.45rem;"></div>
              </div>

              <div id="wo-parts-list" style="display:grid;gap:0.55rem;"></div>

              <div style="margin-top:1rem;padding-top:0.9rem;border-top:1px solid var(--bk-border);display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem;">
                <div class="bk-field" style="align-items:center;text-align:center;">
                  <span class="bk-field-label">Parts Total</span>
                  <div id="wo-parts-total" style="font-size:1.05rem;font-weight:700;color:var(--bk-text);">$45.00</div>
                </div>
                <div class="bk-field" style="align-items:center;text-align:center;">
                  <span class="bk-field-label">Labor (@$75/hr)</span>
                  <div id="wo-labor-total" style="font-size:1.05rem;font-weight:700;color:var(--bk-warn);">$112.50</div>
                </div>
                <div class="bk-field" style="align-items:center;text-align:center;">
                  <span class="bk-field-label">Grand Total</span>
                  <div id="wo-grand-total" style="font-size:1.05rem;font-weight:700;color:var(--bk-accent);">$157.50</div>
                </div>
              </div>
            </div>

            <div style="border:1px solid var(--bk-border);background:var(--bk-card);border-radius:0.85rem;padding:1rem;">
              <div class="bk-meta" style="margin-bottom:0.7rem;">NOTES AND COMPLETION</div>

              <div class="bk-field" style="margin-bottom:0.8rem;">
                <span class="bk-field-label">Labor Hours</span>
                <input id="wo-labor-input" type="number" step="0.5" value="1.5" class="bk-input" style="width:140px;" />
              </div>

              <div class="bk-field" style="margin-bottom:0.8rem;">
                <span class="bk-field-label">Notes</span>
                <textarea id="wo-notes-textarea" rows="4" placeholder="Enter work order notes..." class="bk-input" style="resize:vertical;"></textarea>
              </div>

              <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;margin-bottom:0.9rem;">
                <input type="checkbox" id="wo-warranty-check" checked style="width:1rem;height:1rem;accent-color:var(--bk-accent);" />
                <span style="font-size:0.8rem;color:var(--bk-text-2);">Warranty Claim</span>
              </label>

              <button id="wo-complete-btn" class="gradient-mask-btn" style="width:100%;padding:0.9rem;border:none;border-radius:999px;background:linear-gradient(135deg,var(--bk-accent),var(--bk-accent-2));color:var(--bk-on-accent);font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:700;letter-spacing:0.06rem;text-transform:uppercase;cursor:pointer;">Complete maintenance</button>

              <div id="wo-completion-msg" class="bk-pill" style="margin-top:0.7rem;padding:0.5rem 0.7rem;width:100%;justify-content:center;display:none;"><span class="bk-dot"></span><span id="wo-completion-text"></span></div>
            </div>
          </div>

          <div class="wo-tab-panel" data-panel="parts" id="wo-panel-parts" style="display:none;">
            <div class="bk-meta" style="margin-bottom:0.7rem;">PARTS INVENTORY</div>
            <div id="wo-parts-inventory" style="display:grid;gap:0.55rem;"></div>
          </div>

          <div class="wo-tab-panel" data-panel="diagnostics" id="wo-panel-diagnostics" style="display:none;">
            <div class="bk-meta" style="margin-bottom:0.7rem;">DIAGNOSTIC CODES</div>
            <div style="border:1px solid var(--bk-border);background:var(--bk-card);border-radius:0.85rem;padding:1rem;">
              <div style="display:flex;gap:0.5rem;margin-bottom:0.7rem;">
                <input id="wo-diag-input" type="text" maxlength="2" placeholder="Enter code..." class="bk-input" style="flex:1;font-family:monospace;font-size:1rem;text-transform:uppercase;text-align:center;letter-spacing:0.2rem;" />
                <button id="wo-diag-btn" class="bk-btn" style="margin-top:0;">Lookup</button>
              </div>
              <div id="wo-diag-result" style="border:1px solid var(--bk-border-soft);background:var(--bk-panel-2);border-radius:0.7rem;padding:0.9rem;min-height:3.5rem;">
                <p style="color:var(--bk-text-3);text-align:center;margin:0;font-size:0.78rem;">Enter a diagnostic code to lookup</p>
              </div>
            </div>
          </div>

          <div class="wo-tab-panel" data-panel="history" id="wo-panel-history" style="display:none;">
            <div class="bk-meta" style="margin-bottom:0.7rem;">WORKORDER HISTORY</div>
            <div id="wo-history-list" style="display:grid;gap:0.55rem;"></div>
          </div>

        </div>
      </div>
    </div>
    `
});

// Bind the component's methods for the helpers + post-mount block below
methods = ESAWorkorder.methods;

// Global reference for DOM updates
let container = null;

// Helper functions for DOM updates (outside template)
function updateTabUI(state, cnt) {
  if (!cnt) return;

  cnt.querySelectorAll('.wo-side-tab').forEach(btn => {
    const active = btn.getAttribute('data-tab') === state.activeSideTab;
    btn.style.color = active ? 'var(--bk-text)' : 'var(--bk-text-3)';
    btn.style.borderBottomColor = active ? 'var(--bk-accent)' : 'transparent';
    btn.style.fontWeight = active ? '700' : '500';
  });

  cnt.querySelectorAll('.wo-tab-panel').forEach(panel => {
    panel.style.display = 'none';
  });
  const activePanel = cnt.querySelector('#wo-panel-' + state.activeSideTab);
  if (activePanel) {
    activePanel.style.display = 'block';
  }
}

function renderPartsList(state, cnt) {
  if (!cnt) return;

  const listEl = cnt.querySelector('#wo-parts-list');
  if (!listEl) return;

  if (state.partsList.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--bk-text-3);font-size:0.78rem;">No parts added yet. Click "+ Add part" to add parts.</div>';
    return;
  }

  listEl.innerHTML = state.partsList.map((part, index) => `
    <div class="bk-row">
      <div style="display:flex;align-items:center;gap:0.7rem;min-width:0;">
        <div style="background:var(--bk-accent);color:var(--bk-on-accent);width:1.7rem;height:1.7rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.72rem;flex-shrink:0;">${part.qty}</div>
        <div style="min-width:0;">
          <div style="font-weight:600;color:var(--bk-text);font-size:0.78rem;">Part ${part.part}</div>
          <div style="font-size:0.7rem;color:var(--bk-text-3);">${part.name}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.8rem;flex-shrink:0;">
        <div style="color:var(--bk-accent);font-weight:700;font-size:0.8rem;">$${(part.cost * part.qty).toFixed(2)}</div>
        <button class="wo-remove-part-btn" data-part-index="${index}" title="Remove part"
          style="background:transparent;border:1px solid var(--bk-border);width:1.6rem;height:1.6rem;border-radius:50%;cursor:pointer;font-size:0.85rem;color:var(--bk-danger);line-height:1;">×</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.wo-remove-part-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-part-index'));
      if (!isNaN(index)) {
        methods.removePart(state, index);
      }
    });
  });
}

function renderPartsInventory(state, cnt) {
  if (!cnt) return;

  const invEl = cnt.querySelector('#wo-parts-inventory');
  if (!invEl) return;

  if (state.partsList.length === 0) {
    invEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--bk-text-3);font-size:0.78rem;">No parts on this workorder yet.</div>';
    return;
  }

  invEl.innerHTML = state.partsList.map(part => `
    <div class="bk-row">
      <div style="display:flex;align-items:center;gap:0.7rem;min-width:0;">
        <span class="bk-pill" style="padding:0.15rem 0.5rem;">${part.part}</span>
        <span style="font-size:0.78rem;color:var(--bk-text-2);">${part.name}</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.8rem;flex-shrink:0;">
        <span class="bk-meta">QTY ${part.qty}</span>
        <span style="color:var(--bk-accent);font-weight:700;font-size:0.8rem;">$${(part.cost * part.qty).toFixed(2)}</span>
      </div>
    </div>
  `).join('');
}

function renderCatalog(state, cnt) {
  if (!cnt) return;

  const catalogEl = cnt.querySelector('#wo-catalog-list');
  if (!catalogEl) return;

  catalogEl.innerHTML = state.catalogParts.map((part, idx) => `
    <div class="bk-row" style="padding:0.45rem 0.6rem;">
      <div style="min-width:0;">
        <span style="font-weight:700;color:var(--bk-text);font-size:0.75rem;">${part.sku}</span>
        <span style="margin-left:0.5rem;color:var(--bk-text-3);font-size:0.72rem;">${part.name}</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.7rem;flex-shrink:0;">
        <span style="color:var(--bk-accent);font-weight:600;font-size:0.75rem;">$${part.price.toFixed(2)}</span>
        <button class="wo-catalog-add-btn" data-cat-index="${idx}"
          style="background:var(--bk-chip);border:1px solid var(--bk-border);color:var(--bk-text);padding:0.25rem 0.7rem;border-radius:999px;cursor:pointer;font-size:0.65rem;font-weight:600;">ADD</button>
      </div>
    </div>
  `).join('');

  catalogEl.querySelectorAll('.wo-catalog-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-cat-index'));
      if (!isNaN(index) && state.catalogParts[index]) {
        methods.addPart(state, state.catalogParts[index]);
      }
    });
  });
}

function renderHistory(state, cnt) {
  if (!cnt) return;

  const historyEl = cnt.querySelector('#wo-history-list');
  if (!historyEl) return;

  historyEl.innerHTML = state.history.map(item => `
    <div class="bk-row" style="padding:0.8rem 0.9rem;">
      <div style="min-width:0;">
        <div style="font-weight:700;color:var(--bk-text);font-size:0.8rem;">${item.id}</div>
        <div style="font-size:0.7rem;color:var(--bk-text-3);">${item.date} · Unit: ${item.unit}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="color:var(--bk-accent);font-weight:700;font-size:0.8rem;">$${item.cost.toFixed(2)}</div>
        <div style="font-size:0.62rem;color:var(--bk-text-3);letter-spacing:0.06rem;">${item.status.toUpperCase()}</div>
      </div>
    </div>
  `).join('');
}

function updateCostDisplay(state, cnt) {
  if (!cnt) return;

  const partsTotalEl = cnt.querySelector('#wo-parts-total');
  const laborTotalEl = cnt.querySelector('#wo-labor-total');
  const grandTotalEl = cnt.querySelector('#wo-grand-total');

  if (partsTotalEl) partsTotalEl.textContent = '$' + methods.getTotalPartsCost(state).toFixed(2);
  if (laborTotalEl) laborTotalEl.textContent = '$' + methods.getLaborCost(state).toFixed(2);
  if (grandTotalEl) grandTotalEl.textContent = '$' + methods.getTotalCost(state).toFixed(2);
}

function updateStatusBadge(state, cnt) {
  if (!cnt) return;

  const badge = cnt.querySelector('#wo-status-badge');
  const statusText = cnt.querySelector('#wo-status');
  const completeBtn = cnt.querySelector('#wo-complete-btn');
  const completionMsg = cnt.querySelector('#wo-completion-msg');
  const completionText = cnt.querySelector('#wo-completion-text');

  if (badge) {
    badge.classList.remove('warn');
    badge.classList.add('bk-pill');
    badge.style.background = 'linear-gradient(135deg,var(--bk-accent),var(--bk-accent-2))';
    badge.style.borderColor = 'transparent';
    badge.style.color = 'var(--bk-on-accent)';
    badge.innerHTML = '<span class="bk-dot" style="box-shadow:none;background:var(--bk-on-accent);"></span>COMPLETED';
  }
  if (statusText) {
    statusText.textContent = 'COMPLETED';
    statusText.style.color = 'var(--bk-accent)';
  }
  if (completeBtn) {
    completeBtn.disabled = true;
    completeBtn.style.background = 'var(--bk-panel-2)';
    completeBtn.style.color = 'var(--bk-text-3)';
    completeBtn.style.cursor = 'not-allowed';
    completeBtn.textContent = 'Maintenance completed';
  }
  if (completionMsg && completionText) {
    completionMsg.style.display = 'flex';
    completionText.textContent = 'Completed at ' + new Date().toLocaleString();
  }
}

// Setup event listeners after mount
const origWorkorderMount = ESAWorkorder.mount;
ESAWorkorder.mount = function(containerRef) {
  container = containerRef;
  const result = origWorkorderMount.call(this, containerRef);

  setTimeout(() => {
    const state = this.state;

    // Style + wire side tabs
    container.querySelectorAll('.wo-side-tab').forEach(btn => {
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.borderBottom = '2px solid transparent';
      btn.style.color = 'var(--bk-text-3)';
      btn.style.padding = '0.55rem 0.8rem';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '0.75rem';
      btn.style.fontWeight = '500';
      btn.style.fontFamily = "'DM Sans', sans-serif";
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        methods.switchSideTab(state, tab);
      });
    });
    updateTabUI(state, container);

    // Add Part button (catalog toggle)
    const addPartBtn = container.querySelector('#wo-add-part-btn');
    if (addPartBtn) {
      addPartBtn.addEventListener('click', () => {
        state.showPartsCatalog = !state.showPartsCatalog;
        const catalog = container.querySelector('#wo-parts-catalog');
        if (catalog) {
          catalog.style.display = state.showPartsCatalog ? 'block' : 'none';
          if (state.showPartsCatalog) {
            renderCatalog(state, container);
          }
        }
      });
    }

    // Complete Maintenance button
    const completeBtn = container.querySelector('#wo-complete-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        if (!state.maintenanceComplete) {
          methods.completeMaintenance(state);
        }
      });
    }

    // Notes textarea
    const notesTextarea = container.querySelector('#wo-notes-textarea');
    if (notesTextarea) {
      notesTextarea.value = state.workorderData.notes || '';
      notesTextarea.addEventListener('input', (e) => {
        state.workorderData.notes = e.target.value;
      });
    }

    // Labor hours input
    const laborInput = container.querySelector('#wo-labor-input');
    if (laborInput) {
      laborInput.value = state.workorderData.laborHours || 0;
      laborInput.addEventListener('input', (e) => {
        state.workorderData.laborHours = parseFloat(e.target.value) || 0;
        updateCostDisplay(state, container);
      });
    }

    // Warranty checkbox
    const warrantyCheck = container.querySelector('#wo-warranty-check');
    if (warrantyCheck) {
      warrantyCheck.checked = state.workorderData.warrantyClaim || false;
      warrantyCheck.addEventListener('change', (e) => {
        state.workorderData.warrantyClaim = e.target.checked;
      });
    }

    // Diagnostic lookup
    const diagBtn = container.querySelector('#wo-diag-btn');
    const diagInput = container.querySelector('#wo-diag-input');
    if (diagBtn && diagInput) {
      diagBtn.addEventListener('click', () => {
        const code = diagInput.value.toUpperCase();
        const resultEl = container.querySelector('#wo-diag-result');
        if (resultEl) {
          const diagnostics = {
            'F1': 'Indoor Thermistor Fault - Replace black thermistor',
            'F2': 'Outdoor Thermistor Fault - Replace outdoor sensor',
            'F3': 'Indoor Coil Sensor Fault - Check connection',
            'F6': 'Communication Error - Check wiring harness',
            'C1': 'Coil Freezing - Check refrigerant charge'
          };
          if (diagnostics[code]) {
            resultEl.innerHTML = '<div style="color:var(--bk-accent);font-weight:600;font-size:0.8rem;">' + code + ': ' + diagnostics[code] + '</div>';
          } else {
            resultEl.innerHTML = '<div style="color:var(--bk-danger);font-size:0.8rem;">Unknown code: ' + code + '</div>';
          }
        }
      });
    }

    // Initial renders
    renderPartsList(state, container);
    renderPartsInventory(state, container);
    renderHistory(state, container);
    updateCostDisplay(state, container);

  }, 100);

  return result;
};

export default ESAWorkorder;
