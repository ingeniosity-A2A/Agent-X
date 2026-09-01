/**
 * ESA.invpartscard-B.js — BENTO EDITION
 * ============================================
 * BROADCAST SERVICE PARTS CARD — official Bento card.
 *
 * One framework: Bento (docs/BENTO-OFFICIAL-UI.md).
 * Structure:  .bento-card > .bento-demo (3D model zone) + .bento-text
 * Tokens:     --bk-* (bento-tokens.css) — Beige · Green · Black.
 * Polish:     punch-border + gradient-mask-btn (v6-exoskel-polish.css).
 *
 * Product: Seasons 9000 BTU PTAC (HD Supply #223532). Keeps the .mount()
 * contract and the hub events (esa:order-part / esa:broadcast-toggle /
 * esa:broadcast) so integration.js wiring stays intact.
 * React loads from esm.sh (no build).
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

// ─────────────────────────────────────────────────────────────────────
// MODEL ZONE — PTAC sleeve visual (fallback when the GLB fails)
// ─────────────────────────────────────────────────────────────────────

function PTACUnitVisual() {
  return html`
    <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      <div style=${{ width: '9.2rem', height: '5.6rem', borderRadius: '0.65rem', border: '1px solid var(--bk-border)', background: 'linear-gradient(160deg, rgba(126,200,160,0.14) 0%, rgba(126,200,160,0.03) 100%)', position: 'relative', boxShadow: '0 16px 34px rgba(0,0,0,0.55), var(--bk-inset-soft)' }}>
        <div style=${{ position: 'absolute', top: '0.55rem', left: '0.75rem', right: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          ${Array.from({ length: 6 }).map((_, i) => html`
            <div key=${i} style=${{ height: '2px', borderRadius: '2px', background: 'linear-gradient(90deg, rgba(244,244,238,0.4), rgba(244,244,238,0.1))' }}></div>
          `)}
        </div>
        <div style=${{ position: 'absolute', bottom: '0.45rem', left: '0.75rem', width: '2.4rem', height: '0.55rem', borderRadius: '0.3rem', border: '1px solid var(--bk-border)', background: 'var(--bk-panel-2)', display: 'flex', alignItems: 'center', gap: '0.18rem', padding: '0 0.25rem' }}>
          <span style=${{ width: '0.3rem', height: '0.3rem', borderRadius: '50%', background: 'var(--bk-accent)', boxShadow: '0 0 6px var(--bk-accent)' }}></span>
          <span style=${{ width: '0.55rem', height: '1px', background: 'var(--bk-line)' }}></span>
        </div>
      </div>
      <div style=${{ width: '5.5rem', height: '0.8rem', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(126,200,160,0.35) 0%, transparent 70%)' }}></div>
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

// Stepper wheel items — model / quote / specs / supply scroll through slides
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
        <div className="bk-meta" style=${{ marginBottom: '0.5rem' }}>Service quote</div>
        ${rows.map((r, ri) => html`
          <div key=${ri} style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.32rem 0', borderBottom: ri < rows.length - 1 ? '1px solid var(--bk-border-soft)' : 'none', fontSize: '0.72rem' }}>
            <span style=${{ color: 'var(--bk-text-3)' }}>${r.k}</span>
            <span style=${{ fontWeight: 600, color: ri === rows.length - 1 ? 'var(--bk-accent)' : 'var(--bk-text)' }}>${r.v}</span>
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
        <div className="bk-meta" style=${{ marginBottom: '0.5rem' }}>Specs</div>
        ${rows.map((r, ri) => html`
          <div key=${ri} style=${{ display: 'flex', justifyContent: 'space-between', padding: '0.32rem 0', borderBottom: ri < rows.length - 1 ? '1px solid var(--bk-border-soft)' : 'none', fontSize: '0.72rem' }}>
            <span style=${{ color: 'var(--bk-text-3)' }}>${r.k}</span>
            <span style=${{ fontWeight: 600, color: 'var(--bk-text)' }}>${r.v}</span>
          </div>
        `)}
      </div>`;
    }
    return html`<div style=${{ width: '100%', padding: '0.4rem 0.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
      <div className="bk-meta">HD Supply</div>
      <div style=${{ textAlign: 'center' }}>
        <div style=${{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bk-text)' }}>Part #${PTAC.partNumber}</div>
        <div style=${{ fontSize: '0.65rem', color: 'var(--bk-text-3)', marginTop: '0.15rem' }}>${PTAC.brand} ${PTAC.model}</div>
      </div>
      <a className="bk-btn" style=${{ marginTop: 0 }} href=${PTAC.hdSupplyUrl} target="_blank" rel="noopener noreferrer">Open HD Supply ↗</a>
    </div>`;
  };

  return html`
    <div className="bento-card punch-border" style=${{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <div className="bento-demo" style=${{ height: '15rem' }} ref=${zoneRef}>
        <div style=${{ position: 'absolute', top: '0.8rem', left: '0.9rem', right: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
          <span className="bk-pill"><span className="bk-dot pulse"></span>BROADCAST PARTS</span>
          <button
            onClick=${() => toggleBroadcast()}
            title="Broadcast this part to the console"
            style=${{ background: 'transparent', border: '1px solid var(--bk-border)', borderRadius: '3rem', color: broadcastOn ? 'var(--bk-warn)' : 'var(--bk-text-3)', fontSize: '0.55rem', letterSpacing: '0.08rem', textTransform: 'uppercase', fontWeight: 600, padding: '0.22rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', transition: 'color 0.2s', fontFamily: "'DM Sans', sans-serif" }}
          >📡 ${broadcastOn ? 'LIVE' : 'BROADCAST'}</button>
        </div>

        <div style=${{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.6rem 2.2rem 1.8rem 1.2rem' }}>
          ${loading && slide === 0 ? html`
            <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style=${{ width: '2rem', height: '2rem', border: '2px solid var(--bk-border)', borderTopColor: 'var(--bk-accent)', borderRadius: '50%', animation: 'bk-spin 0.9s linear infinite' }}></div>
              <div className="bk-meta">Loading model…</div>
            </div>
          ` : html`
            <div key=${SLIDES[slide].id} className="std-slide" style=${{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ${renderSlide(slide)}
            </div>
          `}
        </div>

        <div style=${{ position: 'absolute', bottom: '0.55rem', left: '1.2rem', right: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3 }}>
          <div style=${{ display: 'flex', gap: '0.35rem' }}>
            ${SLIDES.map((s, i) => html`
              <button key=${s.id} title=${s.label} onClick=${() => setSlide(i)} style=${{ width: i === slide ? '1.1rem' : '0.7rem', height: '3px', borderRadius: '5px', border: 'none', padding: 0, cursor: 'pointer', background: i === slide ? 'var(--bk-accent)' : 'var(--bk-line)', opacity: i === slide ? 1 : 0.5, transition: 'width 0.25s cubic-bezier(0.22,1,0.36,1), opacity 0.25s' }}></button>
            `)}
          </div>
          <div className="bk-meta" style=${{ fontSize: '0.55rem' }}>
            <span style=${{ color: 'var(--bk-accent)' }}>${String(slide + 1).padStart(2, '0')}</span> / ${String(SLIDES.length).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="bento-text">
        <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.6rem' }}>
          <h3 className="bento-title" style=${{ margin: 0 }}>Seasons <em>PTAC</em></h3>
          <div style=${{ fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', lineHeight: 1, color: 'var(--bk-text)' }}>
            <sup style=${{ fontSize: '0.8rem', opacity: 0.6, marginRight: '0.05rem' }}>$</sup>${priceInt}<span style=${{ fontSize: '0.85rem', opacity: 0.6, marginLeft: '0.1rem' }}>.${priceDec}</span>
          </div>
        </div>
        <p className="bento-desc">Part #${PTAC.partNumber} · HD Supply — Seasons 9000 BTU PTAC unit, in stock and ready to broadcast to the service desk.</p>

        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginTop: '0.8rem' }}>
          <div className="bk-row" style=${{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem', padding: '0.5rem 0.6rem' }}>
            <span className="bk-meta" style=${{ fontSize: '0.5rem' }}>BTU Cooling</span>
            <span style=${{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--bk-text)' }}>${PTAC.specs.btuCooling}</span>
          </div>
          <div className="bk-row" style=${{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem', padding: '0.5rem 0.6rem' }}>
            <span className="bk-meta" style=${{ fontSize: '0.5rem' }}>Voltage</span>
            <span style=${{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--bk-text)' }}>${PTAC.specs.voltage}</span>
          </div>
          <div className="bk-row" style=${{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem', padding: '0.5rem 0.6rem' }}>
            <span className="bk-meta" style=${{ fontSize: '0.5rem' }}>Refrigerant</span>
            <span style=${{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--bk-text)' }}>${PTAC.specs.refrigerant}</span>
          </div>
        </div>

        <div style=${{ display: 'flex', gap: '0.45rem', marginTop: '0.9rem' }}>
          <a className="bk-btn" style=${{ marginTop: 0, flex: 1, justifyContent: 'center' }} href=${PTAC.hdSupplyUrl} target="_blank" rel="noopener noreferrer">View HD Supply ↗</a>
          <button className="bk-btn primary gradient-mask-btn" style=${{ marginTop: 0, flex: 1, justifyContent: 'center' }} onClick=${() => orderPart()}>Order part</button>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// EXPORT — keeps the .mount() contract for integration.js
// ─────────────────────────────────────────────────────────────────────

export const ESAInvPartsCardB = {
  name: 'invpartscard-B',
  version: '3.0.0',
  kind: 'react',

  mount(container, props = {}) {
    if (!container) return null;
    const result = mountReact(container, ESA_InvPartsCardBView, props);
    return result ? { unmount: result.unmount, state: { kind: 'react' } } : null;
  }
};

export default ESAInvPartsCardB;
