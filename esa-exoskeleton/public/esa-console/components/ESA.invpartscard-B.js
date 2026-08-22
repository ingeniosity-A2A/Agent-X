/**
 * ESA.invpartscard-B.js
 * ============================================
 * BROADCAST SERVICE PARTS CARD — REACT MODULE
 * ============================================
 *
 * Follows the APPROVED 3D RENDERING CARD STANDARD:
 *   size   24rem wide · 2rem radius · 1.75rem padding · warm glass
 *   middle fixed 11rem — meta col (5.6rem) | model zone | stepper (1.3rem)
 *   top / bottom are product-specific; middle and card size stay standard.
 *
 * Product: Seasons 9000 BTU PTAC (HD Supply #223532). Keeps the .mount()
 * contract and the hub events (esa:order-part / esa:broadcast) so
 * integration.js wiring stays intact. React loads from esm.sh (no build).
 */

import { html, useState, useEffect, useRef } from './ESA.ReactMount.js';
import { mountReact } from './ESA.ReactMount.js';

const PTAC = {
  brand: 'Seasons',
  model: '9000 BTU PTAC',
  modelCode: 'SP09EA2-20',
  partNumber: '223532',
  hdSupplyUrl: 'https://hdsupplysolutions.com/p/seasons-9000-btu-230-208-v-20-amp-electric-heat-cool-ptac-p223532#',
  specs: {
    btuCooling: '9,000',
    voltage: '230/208V',
    refrigerant: 'R-32'
  },
  price: 899.0
};

const CARD = {
  ink: '#0d0d0d',
  paper: '#f5f0eb',
  warm: '#c8a882',
  accent: '#b07d4f',
  muted: 'rgba(245,240,235,0.35)',
  glass: 'rgba(245,240,235,0.08)',
  border: 'rgba(200,168,130,0.18)',
  status: '#7ec8a0',
  amber: '#d9a441'
};

// ─────────────────────────────────────────────────────────────────────
// MODEL ZONE — PTAC sleeve visual (loader → rendered unit)
// ─────────────────────────────────────────────────────────────────────

function PTACUnitVisual() {
  return html`
    <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      <div style=${{ width: '9.2rem', height: '5.6rem', borderRadius: '0.65rem', border: '1px solid rgba(200,168,130,0.4)', background: 'linear-gradient(160deg, rgba(200,168,130,0.16) 0%, rgba(176,125,79,0.05) 100%)', position: 'relative', boxShadow: '0 16px 34px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
        <div style=${{ position: 'absolute', top: '0.55rem', left: '0.75rem', right: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          ${Array.from({ length: 6 }).map((_, i) => html`
            <div key=${i} style=${{ height: '2px', borderRadius: '2px', background: 'linear-gradient(90deg, rgba(200,168,130,0.55), rgba(200,168,130,0.15))' }}></div>
          `)}
        </div>
        <div style=${{ position: 'absolute', bottom: '0.45rem', left: '0.75rem', width: '2.4rem', height: '0.55rem', borderRadius: '0.3rem', border: '1px solid rgba(200,168,130,0.45)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '0.18rem', padding: '0 0.25rem' }}>
          <span style=${{ width: '0.3rem', height: '0.3rem', borderRadius: '50%', background: CARD.status, boxShadow: `0 0 6px ${CARD.status}` }}></span>
          <span style=${{ width: '0.55rem', height: '1px', background: 'rgba(200,168,130,0.5)' }}></span>
        </div>
      </div>
      <div style=${{ width: '5.5rem', height: '0.8rem', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(176,125,79,0.4) 0%, transparent 70%)' }}></div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// MODEL ZONE — GLB 3D render (demo placeholder; swap PRODUCT_GLB for the
// real Seasons PTAC model. Falls back to the CSS sleeve if the GLB fails.)
// ─────────────────────────────────────────────────────────────────────

const PRODUCT_GLB = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BoomBox/glTF-Binary/BoomBox.glb';

function Model3D() {
  const [glbOk, setGlbOk] = useState(true);
  return glbOk
    ? html`
      <model-viewer
        src=${PRODUCT_GLB}
        alt="3D product model"
        auto-rotate
        camera-controls
        camera-orbit="0deg 78deg 105%"
        shadow-intensity="1"
        style=${{ width: '100%', height: '100%', background: 'transparent', display: 'block' }}
        onError=${() => setGlbOk(false)}
      ></model-viewer>
    `
    : html`<${PTACUnitVisual} />`;
}

// ─────────────────────────────────────────────────────────────────────
// ROOT VIEW
// ─────────────────────────────────────────────────────────────────────

// Stepper wheel items — quotes and images scroll through these slides
const SLIDES = [
  { id: 'model', label: 'Model view' },
  { id: 'quote', label: 'Service quote' },
  { id: 'specs', label: 'Specs' },
  { id: 'supply', label: 'HD Supply' }
];

function ESA_InvPartsCardBView() {
  const [loading, setLoading] = useState(true);
  const [broadcastOn, setBroadcastOn] = useState(false);
  const [slide, setSlide] = useState(0);
  const zoneRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(t);
  }, []);

  // Wheel over the model zone scrolls through quotes / images
  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.deltaY > 4) setSlide(s => (s + 1) % SLIDES.length);
      else if (e.deltaY < -4) setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const orderPart = () => {
    window.dispatchEvent(new CustomEvent('esa:order-part', {
      detail: {
        part: { part: PTAC.partNumber, name: `${PTAC.brand} ${PTAC.model}`, price: `$${PTAC.price.toFixed(2)}` },
        source: 'InvPartsCard-B'
      }
    }));
  };

  const toggleBroadcast = () => {
    const next = !broadcastOn;
    setBroadcastOn(next);
    window.dispatchEvent(new CustomEvent('esa:broadcast', {
      detail: { part: PTAC.partNumber, name: `${PTAC.brand} ${PTAC.model}`, source: 'InvPartsCard-B' }
    }));
    window.dispatchEvent(new CustomEvent('esa:broadcast-toggle', {
      detail: { open: next, component: 'InvPartsCard-B' }
    }));
  };

  const [priceInt, priceDec] = PTAC.price.toFixed(2).split('.');

  const renderSlide = (i) => {
    if (i === 0) return html`<${Model3D} />`;
    if (i === 1) {
      const rows = [
        { k: 'Unit — 9000 BTU', v: '$899.00' },
        { k: 'Install · 2h @ $75', v: '$150.00' },
        { k: 'Est. total', v: '$1,049.00' }
      ];
      return html`<div style=${{ width: '100%', padding: '0.4rem 0.2rem' }}>
        <div style=${{ fontSize: '0.48rem', letterSpacing: '0.1rem', color: CARD.muted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>🧾 Service quote</div>
        ${rows.map((r, ri) => html`
          <div key=${ri} style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.32rem 0', borderBottom: ri < rows.length - 1 ? `1px solid ${CARD.border}` : 'none', fontSize: '0.62rem' }}>
            <span style=${{ color: CARD.muted }}>${r.k}</span>
            <span style=${{ fontWeight: 600, color: ri === rows.length - 1 ? CARD.status : CARD.paper }}>${r.v}</span>
          </div>
        `)}
      </div>`;
    }
    if (i === 2) {
      const rows = [
        { k: 'Cooling', v: '9,000 BTU' },
        { k: 'Voltage', v: '230/208V' },
        { k: 'Refrigerant', v: 'R-32' },
        { k: 'Amperage', v: '20A' }
      ];
      return html`<div style=${{ width: '100%', padding: '0.4rem 0.2rem' }}>
        <div style=${{ fontSize: '0.48rem', letterSpacing: '0.1rem', color: CARD.muted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>⚙️ Specs</div>
        ${rows.map((r, ri) => html`
          <div key=${ri} style=${{ display: 'flex', justifyContent: 'space-between', padding: '0.32rem 0', borderBottom: ri < rows.length - 1 ? `1px solid ${CARD.border}` : 'none', fontSize: '0.62rem' }}>
            <span style=${{ color: CARD.muted }}>${r.k}</span>
            <span style=${{ fontWeight: 600, color: CARD.paper }}>${r.v}</span>
          </div>
        `)}
      </div>`;
    }
    return html`<div style=${{ width: '100%', padding: '0.4rem 0.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
      <div style=${{ fontSize: '0.48rem', letterSpacing: '0.1rem', color: CARD.muted, textTransform: 'uppercase' }}>🔗 HD Supply</div>
      <div style=${{ textAlign: 'center' }}>
        <div style=${{ fontSize: '0.78rem', fontWeight: 600, color: CARD.paper }}>Part #${PTAC.partNumber}</div>
        <div style=${{ fontSize: '0.58rem', color: CARD.muted, marginTop: '0.15rem' }}>${PTAC.brand} ${PTAC.model}</div>
      </div>
      <a className="std-cta" href=${PTAC.hdSupplyUrl} target="_blank" rel="noopener noreferrer" style=${{ padding: '0.45rem 0.9rem', fontSize: '0.55rem' }}>Open HD Supply ↗</a>
    </div>`;
  };

  const meta = [
    { icon: '🔤', label: 'MODEL', value: PTAC.modelCode },
    { icon: '🛠️', label: 'SERVICE', value: 'PTAC Unit' },
    { icon: '📦', label: 'QUANTITY', value: '1 Item' },
    { icon: '✅', label: 'STATUS', mini: { text: broadcastOn ? 'Broadcasting' : 'In stock', processing: broadcastOn } }
  ];

  return html`
    <div style=${{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.75rem', boxSizing: 'border-box', position: 'relative' }}>
      <div className="std-blob"></div>

      <!-- top -->
      <div className="std-head">
        <div className="std-brand"><span className="std-brand-tile">HD</span> BROADCAST PARTS</div>
        <div style=${{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            onClick=${() => toggleBroadcast()}
            title="Broadcast this part to the console"
            style=${{ background: 'transparent', border: `1px solid ${CARD.border}`, borderRadius: '3rem', color: broadcastOn ? CARD.amber : CARD.muted, fontSize: '0.48rem', letterSpacing: '0.08rem', textTransform: 'uppercase', fontWeight: 600, padding: '0.18rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
          >📡 ${broadcastOn ? 'LIVE' : 'BROADCAST'}</button>
          <span className="std-pill"><span className="std-dot"></span>IN STOCK</span>
        </div>
      </div>
      <div className="std-title">Seasons <em>PTAC</em></div>
      <div className="std-sub">Part #${PTAC.partNumber} · HD Supply</div>

      <!-- middle: meta | model zone | stepper -->
      <div className="std-middle">
        <div className="std-meta">
          ${meta.map(m => html`
            <div key=${m.label} className="std-meta-item">
              <span className="std-meta-icon">${m.icon}</span>
              <div style=${{ minWidth: 0 }}>
                <div className="std-meta-label">${m.label}</div>
                ${m.mini
                  ? html`<div className=${`std-status-mini${m.mini.processing ? ' processing' : ''}`}><span className="std-dot"></span>${m.mini.text}</div>`
                  : html`<div className="std-meta-value">${m.value}</div>`}
              </div>
            </div>
          `)}
        </div>

        <div className="std-zone" ref=${zoneRef}>
          ${loading && slide === 0 ? html`
            <div className="std-loader">
              <div className="std-loader-ring"></div>
              <div className="std-loader-text">Loading model…</div>
            </div>
          ` : html`
            <div key=${SLIDES[slide].id} className="std-slide" style=${{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ${renderSlide(slide)}
            </div>
          `}
          <div style=${{ position: 'absolute', bottom: '0.2rem', right: '1.6rem', fontSize: '0.46rem', letterSpacing: '0.08rem', color: 'rgba(245,240,235,0.3)' }}>
            <span style=${{ color: CARD.warm }}>${String(slide + 1).padStart(2, '0')}</span> / ${String(SLIDES.length).padStart(2, '0')}
          </div>
          <div className="std-stepper">
            ${SLIDES.map((s, i) => html`
              <button key=${s.id} className=${`std-step${i === slide ? ' active' : ''}`} onClick=${() => setSlide(i)} title=${s.label}></button>
            `)}
          </div>
        </div>
      </div>

      <!-- bottom -->
      <div className="std-divider"></div>

      <div className="std-specs">
        <div className="std-spec">
          <div className="std-spec-label">🔥 BTU Cooling</div>
          <div className="std-spec-value">${PTAC.specs.btuCooling}</div>
        </div>
        <div className="std-spec">
          <div className="std-spec-label">⚡ Voltage</div>
          <div className="std-spec-value">${PTAC.specs.voltage}</div>
        </div>
        <div className="std-spec">
          <div className="std-spec-label">🧊 Refrigerant</div>
          <div className="std-spec-value">${PTAC.specs.refrigerant}</div>
        </div>
      </div>

      <div className="std-price-row">
        <div className="std-price-tag"><sup>$</sup>${priceInt}<span style=${{ fontSize: '0.9rem', opacity: 0.6, marginLeft: '0.1rem' }}>.${priceDec}</span></div>
        <div className="std-a2a"><span className="std-dot"></span>HD SUPPLY LIVE</div>
      </div>

      <div className="std-cta-row">
        <a className="std-cta" href=${PTAC.hdSupplyUrl} target="_blank" rel="noopener noreferrer">View HD Supply ↗</a>
        <button className="std-cta primary" onClick=${() => orderPart()}>Order part</button>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// EXPORT — keeps the .mount() contract for integration.js
// ─────────────────────────────────────────────────────────────────────

export const ESAInvPartsCardB = {
  name: 'invpartscard-B',
  version: '2.0.0',
  kind: 'react',

  mount(container, props = {}) {
    if (!container) return null;
    const result = mountReact(container, ESA_InvPartsCardBView, props);
    return result ? { unmount: result.unmount, state: { kind: 'react' } } : null;
  }
};

export default ESAInvPartsCardB;
