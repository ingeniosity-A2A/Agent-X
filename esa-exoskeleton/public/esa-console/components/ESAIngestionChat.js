/**
 * ESAIngestionChat.js
 * ============================================
 * ESA INGESTION INTERFACE — REACT MODULE
 * ============================================
 *
 * The ESA Ingestion Interface is a **React module**. Arrow.js remains only
 * as the sandbox wrapper for the rest of the Exoskeleton components.
 *
 * Layout (per the operator spec):
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ RENDERING AREA (every module is a card)                   │
 *   │   [ AI INGESTION CHAT ] [ DIAGNOSTIC ] [ PARTS ] [ TO-DO ]│
 *   ├───────────────────────────────────────────────────────────┤
 *   │ INGESTION DOCK (bottom):                                  │
 *   │ [Sound I][Lens][PDF][Email] [ input + visualizer overlay ]│
 *   │ [Agent Voice]                                             │
 *   └───────────────────────────────────────────────────────────┘
 *
 * The chat thread renders as a card in the rendering area (via a React
 * portal into #esa-ingestion-chat-card); the input/audio dock lives at the
 * bottom (#esa-ingestion). Mobile shows only cards + the dock.
 *
 * Modeled on the AI SDK chatbot example: message "parts" (text / image /
 * card / divider / list / stats / system), a chat hook (`useESAChat`,
 * mirroring `useChat`), attachments, and streaming status.
 *
 * Scope: ESA CONTENT ONLY. Sole communication hub for the ESA EXOSKELETON
 * console, routed to Cybernetic Ava007 via substrate. Not an Intellect host.
 */

import {
  html,
  createPortal,
  useState,
  useEffect,
  useRef,
  useCallback
} from './ESA.ReactMount.js';
import { useESAChat, handleFileToChat } from '../hooks/use-esa-chat.js';
import { DynamicAudioBroadcaster } from './ESA.SoundPanel.js';
import { activeTheme } from '../config/gruvbox-colors.js';

// ─────────────────────────────────────────────────────────────────────
// HUB — events from other ESA components surface here as system parts
// ─────────────────────────────────────────────────────────────────────

const HUB_LABELS = {
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

function hubSummary(detail) {
  if (!detail) return 'event';
  const picks = ['workorderId', 'workorder_id', 'id', 'sku', 'part', 'code', 'status', 'message', 'type', 'name'];
  for (const key of picks) {
    if (detail[key] !== undefined && detail[key] !== null && detail[key] !== '') {
      const value = String(detail[key]);
      return value.length > 80 ? `${value.slice(0, 77)}…` : value;
    }
  }
  try {
    const json = JSON.stringify(detail);
    return json.length > 80 ? `${json.slice(0, 77)}…` : json;
  } catch (_) {
    return 'event';
  }
}

// ─────────────────────────────────────────────────────────────────────
// SOUND PANEL — dual audio system (left = inbound mic, right = agent voice)
// ─────────────────────────────────────────────────────────────────────

function SoundPanel({ side, audio, compact }) {
  const isLeft = side === 'left';
  const [micActive, setMicActive] = useState(false);
  const [status, setStatus] = useState('IDLE');
  const segRef = useRef(null);
  const rafRef = useRef(0);
  const analyserRef = useRef(null);

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };

  const startVisualizer = (analyser) => {
    analyserRef.current = analyser;
    const loop = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const segments = segRef.current ? Array.from(segRef.current.querySelectorAll('.esa-vis-seg')) : [];
      segments.forEach((seg, i) => {
        const value = data[Math.min(i * 4, data.length - 1)] || 0;
        seg.style.height = `${Math.max(6, (value / 255) * 90)}%`;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const toggleMic = async () => {
    if (!audio) return;
    if (!micActive) {
      try {
        setStatus('INGEST');
        const analyser = await audio.enableMicrophone();
        setMicActive(true);
        setTimeout(() => startVisualizer(analyser), 60);
      } catch (err) {
        console.warn('[ESA.Ingestion] Mic denied:', err.message);
        setMicActive(false);
        setStatus('ERROR');
      }
    } else {
      audio.disableMicrophone();
      stopVisualizer();
      setMicActive(false);
      setStatus('IDLE');
    }
  };

  const testVoice = () => {
    if (!audio) return;
    setStatus('BROADCAST');
    audio.triggerAvaVoice(523, 0.6, { duration: 0.22 });
    setTimeout(() => audio.triggerAvaVoice(659, 0.6, { duration: 0.22 }), 220);
    setTimeout(() => {
      audio.triggerAvaVoice(784, 0.8, { duration: 0.4 });
      setStatus('IDLE');
    }, 460);
  };

  useEffect(() => () => {
    stopVisualizer();
    try { audio?.disableMicrophone?.(); } catch (_) { /* noop */ }
  }, [audio]);

  const isCompact = !!compact;
  const panelH = isCompact ? 128 : 300;
  const ringSize = isCompact ? 84 : 150;
  const segmentCount = isCompact ? (isLeft ? 12 : 6) : (isLeft ? 16 : 8);
  const step = 360 / segmentCount;
  const translate = isCompact ? -32 : -58;

  return html`
    <div style=${{ background: 'linear-gradient(165deg, #1d1f27 0%, #0c0d12 100%)', borderRadius: '2em', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 60px 120px rgba(0,0,0,0.9)', position: 'relative', overflow: 'hidden', height: `${panelH}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isCompact ? '8px' : '18px' }}>
      <div style=${{ position: 'absolute', top: isCompact ? '6px' : '14px', background: 'rgba(0,0,0,0.6)', padding: '3px 10px', borderRadius: '12px', border: `1px solid ${activeTheme.border}`, fontSize: isCompact ? '8px' : '10px', fontWeight: 'bold', letterSpacing: '1px', color: status === 'INGEST' || status === 'BROADCAST' ? activeTheme.aqua : activeTheme.fg_soft, zIndex: 10 }}>
        STATUS: ${status}
      </div>
      <div style=${{ position: 'absolute', top: isCompact ? '24px' : '38px', fontSize: isCompact ? '8px' : '9px', letterSpacing: '1.5px', color: activeTheme.fg_soft, opacity: 0.75, zIndex: 10, whiteSpace: 'nowrap' }}>
        ${isLeft ? 'SOUND I — MIC' : 'AGENT VOICE'}
      </div>

      <div ref=${segRef} style=${{ position: 'relative', width: `${ringSize}px`, height: `${ringSize}px`, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(0,255,204,0.12) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: isCompact ? '14px' : 0 }}>
        ${Array.from({ length: segmentCount }).map((_, i) => html`
          <div key=${i} className="esa-vis-seg" style=${{ position: 'absolute', width: isLeft ? '3px' : '4px', height: '12px', background: 'linear-gradient(90deg, rgba(59,180,155,0.85) 0%, rgba(137,58,255,0.85) 100%)', borderRadius: '2px', transform: `rotate(${i * step}deg) translateY(${translate}px)`, transformOrigin: `center ${-translate}px`, transition: 'height 0.06s ease-out' }}></div>
        `)}
        <div style=${{ width: isCompact ? '34px' : '70px', height: isCompact ? '34px' : '70px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #3a3a3a, #0c0d12)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.5)', zIndex: 2 }}></div>
      </div>

      <div style=${{ marginTop: isCompact ? '8px' : '24px', zIndex: 10 }}>
        <button
          onClick=${isLeft ? toggleMic : testVoice}
          style=${{ padding: isCompact ? '6px 10px' : '10px 16px', background: activeTheme.blue, color: activeTheme.fg, border: `1px solid ${activeTheme.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: isCompact ? '9px' : '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}
        >
          ${isLeft ? (micActive ? '⏹ STOP' : '🎤 MIC') : '🔊 TEST'}
        </button>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// CARD PALETTE — approved warm standard for rendering cards
// ─────────────────────────────────────────────────────────────────────

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
// PART RENDERERS (message "parts", AI SDK style)
// ─────────────────────────────────────────────────────────────────────

function PartCard({ card }) {
  return html`
    <div style=${{ margin: '6px 0', background: CARD.glass, border: `1px solid ${CARD.border}`, borderLeft: `3px solid ${CARD.warm}`, borderRadius: '0.75rem', padding: '8px 10px' }}>
      <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style=${{ background: 'rgba(200,168,130,0.12)', color: CARD.warm, border: `1px solid ${CARD.border}`, borderRadius: '4px', padding: '1px 7px', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>${card.sku}</span>
        <span style=${{ fontSize: '8px', color: CARD.muted }}>${card.category}</span>
      </div>
      <div style=${{ fontSize: '11px', fontWeight: '600', color: CARD.paper, marginBottom: '4px' }}>${card.name}</div>
      <div style=${{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: CARD.muted }}>
        <span>📍 ${card.location}</span>
        <span style=${{ color: CARD.amber }}>${card.inventory} in stock</span>
      </div>
      <div style=${{ marginTop: '5px', fontSize: '14px', fontWeight: 'bold', color: CARD.status }}>$${Number(card.price).toFixed(2)}</div>
    </div>
  `;
}

// Lens picker — operator taps the part they photographed → renders product card
function PartMatch({ part, chat }) {
  return html`
    <div style=${{ margin: '6px 0' }}>
      ${part.rows.map((row, i) => html`
        <div key=${i} style=${{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', background: CARD.glass, border: `1px solid ${CARD.border}`, borderRadius: '8px', padding: '6px 9px' }}>
          <span style=${{ flex: 1, minWidth: 0 }}>
            <span style=${{ fontSize: '10px', fontWeight: '600', color: CARD.paper, display: 'block' }}>${row.name}</span>
            <span style=${{ fontSize: '8px', color: CARD.muted }}>${row.sku} · ${row.category} · $${Number(row.price).toFixed(2)}</span>
          </span>
          <button
            onClick=${() => chat && chat.send('select ' + row.sku)}
            style=${{ background: 'linear-gradient(135deg, #b07d4f, #c8a882)', color: '#0d0d0d', border: 'none', borderRadius: '999px', padding: '5px 12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }}
          >SELECT</button>
        </div>
      `)}
      ${part.hint ? html`<div style=${{ fontSize: '8px', color: CARD.muted, marginTop: '3px' }}>${part.hint}</div>` : ''}
    </div>
  `;
}

// 3D-style product render card — PTAC unit visual + info + inventory + workorder actions
function PartProduct({ product, chat }) {
  const p = product || {};
  return html`
    <div style=${{ margin: '6px 0', background: 'rgba(18,15,12,0.85)', border: `1px solid ${CARD.border}`, borderRadius: '14px', padding: '10px 12px', boxShadow: '0 10px 28px rgba(0,0,0,0.45)' }}>
      <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style=${{ background: 'rgba(200,168,130,0.12)', color: CARD.warm, border: `1px solid ${CARD.border}`, borderRadius: '4px', padding: '2px 8px', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>${p.sku}</span>
        <span style=${{ fontSize: '8px', color: CARD.muted }}>${p.category}</span>
      </div>
      <div style=${{ fontFamily: "'DM Serif Display', serif", fontSize: '15px', color: CARD.paper, marginBottom: '8px' }}>${p.name}</div>
      ${p.model ? html`
        <model-viewer src=${p.model} alt=${p.name} auto-rotate camera-controls camera-orbit="0deg 78deg 105%" shadow-intensity="1" style=${{ width: '100%', height: '130px', margin: '2px 0 8px', background: 'transparent', borderRadius: '8px', display: 'block' }}></model-viewer>
      ` : html`
        <!-- CSS 3D unit fallback: sleeve + vent slats + brand + LED -->
        <div style=${{ position: 'relative', height: '74px', margin: '2px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style=${{ position: 'absolute', bottom: '2px', width: '120px', height: '14px', background: 'radial-gradient(ellipse, rgba(176,125,79,0.35) 0%, transparent 70%)' }}></div>
          <div style=${{ position: 'relative', width: '128px', height: '58px', borderRadius: '10px', background: 'linear-gradient(180deg, #2b2620 0%, #1c1813 100%)', border: `1px solid ${CARD.border}`, boxShadow: '0 14px 26px rgba(0,0,0,0.55), inset 0 1px 0 rgba(200,168,130,0.25)' }}>
            <div style=${{ position: 'absolute', inset: '8px 10px', display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
              ${[14, 18, 22, 18, 14].map((h, i) => html`<div key=${i} style=${{ flex: 1, height: h + 'px', background: 'rgba(200,168,130,0.5)', borderRadius: '2px 2px 0 0' }}></div>`)}
            </div>
            <div style=${{ position: 'absolute', top: '3px', left: '50%', transform: 'translateX(-50%)', fontSize: '6px', letterSpacing: '2px', color: 'rgba(200,168,130,0.6)', fontWeight: 'bold' }}>SEASONS</div>
            <div style=${{ position: 'absolute', bottom: '4px', right: '7px', width: '5px', height: '5px', borderRadius: '50%', background: '#7ec8a0', boxShadow: '0 0 6px #7ec8a0' }}></div>
          </div>
        </div>
      `}
      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '8px' }}>
        <div style=${{ background: CARD.glass, border: `1px solid ${CARD.border}`, borderRadius: '6px', padding: '4px 6px' }}>
          <div style=${{ fontSize: '6.5px', letterSpacing: '1px', color: CARD.muted, textTransform: 'uppercase' }}>Price</div>
          <div style=${{ fontSize: '13px', fontWeight: 'bold', color: CARD.status }}>$${Number(p.price).toFixed(2)}</div>
        </div>
        <div style=${{ background: CARD.glass, border: `1px solid ${CARD.border}`, borderRadius: '6px', padding: '4px 6px' }}>
          <div style=${{ fontSize: '6.5px', letterSpacing: '1px', color: CARD.muted, textTransform: 'uppercase' }}>Inventory</div>
          <div style=${{ fontSize: '13px', fontWeight: 'bold', color: CARD.paper }}>${p.inventory} @ ${p.location}</div>
        </div>
      </div>
      <div style=${{ display: 'flex', gap: '6px' }}>
        <button
          onClick=${() => window.dispatchEvent(new CustomEvent('esa:order-part', { detail: { sku: p.sku, name: p.name, price: p.price } }))}
          style=${{ flex: 1, background: 'linear-gradient(135deg, #b07d4f, #c8a882)', color: '#0d0d0d', border: 'none', borderRadius: '999px', padding: '6px 10px', fontSize: '8.5px', fontWeight: 'bold', cursor: 'pointer' }}>🛒 ORDER PART</button>
        <button
          onClick=${() => window.dispatchEvent(new CustomEvent('esa:create-workorder', { detail: { sku: p.sku, part: p.name } }))}
          style=${{ flex: 1, background: CARD.glass, color: CARD.paper, border: `1px solid ${CARD.border}`, borderRadius: '999px', padding: '6px 10px', fontSize: '8.5px', fontWeight: 'bold', cursor: 'pointer' }}>📋 WORK ORDER</button>
      </div>
    </div>
  `;
}

function PartView({ part, chat }) {
  switch (part.type) {
    case 'image':
      return html`
        <div style=${{ margin: '5px 0' }}>
          <img src=${part.dataUrl} alt=${part.name || 'lens capture'} style=${{ maxWidth: '200px', width: '100%', borderRadius: '8px', border: `1px solid ${CARD.border}`, display: 'block' }} />
          <div style=${{ fontSize: '8px', color: CARD.muted, marginTop: '2px' }}>${part.name || 'lens capture'}</div>
        </div>
      `;
    case 'attachment':
      return html`
        <div style=${{ display: 'inline-flex', alignItems: 'center', gap: '5px', margin: '3px 0', background: CARD.glass, border: `1px solid ${CARD.border}`, borderRadius: '6px', padding: '3px 9px', fontSize: '9px', color: CARD.muted }}>
          📎 ${part.name} <span style=${{ fontSize: '7px', opacity: 0.7 }}>${String(part.kind || 'file').toUpperCase()}</span>
        </div>
      `;
    case 'divider':
      return html`
        <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 3px' }}>
          <span style=${{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px', color: CARD.warm, whiteSpace: 'nowrap' }}>${part.label}</span>
          <span style=${{ flex: 1, height: '1px', background: CARD.border }}></span>
        </div>
      `;
    case 'card':
      return html`<${PartCard} card=${part.card} />`;
    case 'match':
      return html`<${PartMatch} part=${part} chat=${chat} />`;
    case 'product':
      return html`<${PartProduct} product=${part.product} chat=${chat} />`;
    case 'list':
      return html`
        <ul style=${{ margin: '4px 0 4px 16px', padding: 0, fontSize: '10px', lineHeight: '1.6', color: CARD.paper }}>
          ${part.items.map((item, i) => html`<li key=${i} style=${{ margin: '1px 0' }}>${item}</li>`)}
        </ul>
      `;
    case 'stats':
      return html`
        <div style=${{ margin: '5px 0', background: CARD.glass, border: `1px solid ${CARD.border}`, borderRadius: '8px', padding: '6px 9px' }}>
          ${part.stats.map((row, i) => html`
            <div key=${i} style=${{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9px', borderBottom: i < part.stats.length - 1 ? `1px solid ${CARD.border}` : 'none', color: CARD.paper }}>
              <span>${row.category}</span>
              <span style=${{ color: CARD.muted }}>${row.count} item${row.count === 1 ? '' : 's'} · ${row.stock} in stock</span>
            </div>
          `)}
        </div>
      `;
    default:
      return html`<div style=${{ fontSize: '10.5px', lineHeight: '1.5', color: CARD.paper, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>${part.text}</div>`;
  }
}

function MessageBubble({ message, chat }) {
  if (message.role === 'system') {
    return html`
      <div style=${{ textAlign: 'center', margin: '7px 0' }}>
        <span style=${{ fontSize: '8.5px', color: CARD.muted, background: CARD.glass, padding: '3px 10px', borderRadius: '12px', display: 'inline-block', maxWidth: '92%' }}>
          📡 ${message.parts.map(p => p.text).join(' ')}
        </span>
      </div>
    `;
  }

  const isUser = message.role === 'user';

  return html`
    <div style=${{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', margin: '7px 0' }}>
      <div style=${{ maxWidth: '88%', background: isUser ? 'rgba(245,240,235,0.07)' : 'rgba(200,168,130,0.09)', border: `1px solid ${CARD.border}`, borderRadius: '10px', padding: '6px 10px' }}>
        <div style=${{ fontSize: '7.5px', fontWeight: 'bold', marginBottom: '3px', letterSpacing: '1px', color: isUser ? CARD.warm : CARD.status }}>
          ${isUser ? '👤 OPERATOR' : '🤖 ESA AGENT'}
        </div>
        ${message.parts.map((part, i) => html`<${PartView} part=${part} key=${i} chat=${chat} />`)}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// CHAT THREAD (renders in the chat card, rendering area)
// ─────────────────────────────────────────────────────────────────────

function ChatThread({ chat, registerScroll }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (registerScroll) registerScroll(scrollRef.current);
  }, [registerScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.status]);

  const typing = chat.status !== 'ready';

  return html`
    <div ref=${scrollRef} style=${{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
      ${chat.messages.map(m => html`<${MessageBubble} message=${m} key=${m.id} chat=${chat} />`)}
      ${typing ? html`
        <div style=${{ display: 'flex', justifyContent: 'flex-start', margin: '7px 0' }}>
          <div style=${{ background: 'rgba(200,168,130,0.09)', border: `1px solid ${CARD.border}`, borderRadius: '10px', padding: '8px 12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span className="esa-dot" style=${{ width: '5px', height: '5px', borderRadius: '50%', background: CARD.warm }}></span>
            <span className="esa-dot" style=${{ width: '5px', height: '5px', borderRadius: '50%', background: CARD.warm }}></span>
            <span className="esa-dot" style=${{ width: '5px', height: '5px', borderRadius: '50%', background: CARD.warm }}></span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function catalogLabel(status) {
  switch (status) {
    case 'duckdb': return 'CATALOG: DUCKDB';
    case 'fallback': return 'CATALOG: LOCAL';
    case 'loading': return 'CATALOG: LOADING…';
    case 'offline': return 'CATALOG: OFFLINE';
    default: return 'CATALOG: STANDBY';
  }
}

/**
 * Chat card — portaled into #esa-ingestion-chat-card (rendering area).
 * Follows the APPROVED 3D RENDERING CARD STANDARD:
 *   top    = brand + status pill + serif title
 *   middle = meta col | model zone (thread) | stepper  (11rem)
 *   bottom = footer status chips
 */
function ChatCard({ chat }) {
  const count = chat.messages.length;
  const idx = String(Math.min(count, 99)).padStart(2, '0');
  const statusText = chat.status === 'ready' ? 'READY'
    : chat.status === 'streaming' ? 'PROCESSING…' : 'SUBMITTING…';
  const threadEl = useRef(null);

  const registerScroll = useCallback((el) => { threadEl.current = el; }, []);

  // Stepper wheel steps scroll the thread proportionally
  const scrollTo = (i) => {
    const el = threadEl.current;
    if (!el) return;
    const steps = Math.min(Math.max(count, 4), 12);
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTop = max > 0 && steps > 1 ? (i / (steps - 1)) * max : 0;
  };

  const meta = [
    { icon: '🔗', label: 'CATALOG', value: chat.catalogStatus === 'duckdb' ? 'DuckDB' : chat.catalogStatus === 'fallback' ? 'Local' : chat.catalogStatus === 'loading' ? 'Loading' : 'Standby' },
    { icon: '🎙️', label: 'SOUND I', value: chat.audioReady ? 'Ready' : '—' },
    { icon: '🔊', label: 'AGENT VOICE', value: chat.audioReady ? 'Ready' : '—' },
    { icon: '📡', label: 'HUB', value: 'Active' }
  ];

  return html`
    <div style=${{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.75rem', boxSizing: 'border-box', position: 'relative' }}>
      <div className="std-blob"></div>

      <!-- top -->
      <div className="std-head">
        <div className="std-brand"><span className="std-brand-tile">AI</span> AI INGESTION</div>
        <span className="std-pill warm"><span className="std-dot flat"></span>ESA CONTENT ONLY</span>
      </div>
      <div className="std-title">Ingestion <em>Hub</em></div>
      <div className="std-sub">Sole comms hub · Ava007 substrate</div>

      <!-- middle: meta | model zone (thread) | stepper -->
      <div className="std-middle">
        <div className="std-meta">
          ${meta.map(m => html`
            <div key=${m.label} className="std-meta-item">
              <span className="std-meta-icon">${m.icon}</span>
              <div style=${{ minWidth: 0 }}>
                <div className="std-meta-label">${m.label}</div>
                <div className="std-meta-value">${m.value}</div>
              </div>
            </div>
          `)}
        </div>

        <div className="std-zone" style=${{ alignItems: 'stretch' }}>
          <${ChatThread} chat=${chat} registerScroll=${registerScroll} />
          <div className="std-item-index" style=${{ position: 'absolute', top: '0.15rem', right: '1.6rem', margin: 0 }}><em>${idx}</em> MSG</div>
          <div className="std-stepper">
            ${Array.from({ length: Math.min(Math.max(count, 4), 12) }).map((_, i) => html`
              <button key=${i} className=${`std-step${i === count - 1 ? ' active' : ''}`} onClick=${() => scrollTo(i)} title=${`Scroll to message ${i + 1}`}></button>
            `)}
          </div>
        </div>
      </div>

      <!-- bottom -->
      <div className="std-divider"></div>
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', position: 'relative' }}>
        <span className="std-pill" style=${{ fontSize: '0.46rem', padding: '0.14rem 0.5rem' }}>
          <span className="std-dot"></span>${statusText}
        </span>
        <span style=${{ fontSize: '0.48rem', letterSpacing: '0.08rem', color: CARD.muted, textTransform: 'uppercase' }}>${catalogLabel(chat.catalogStatus)}</span>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// DOCK VISUALIZER — audio visualizer overlaid on the input box
// ─────────────────────────────────────────────────────────────────────

function DockVisualizer({ audio }) {
  const barRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      // Read the engine live each frame: mic analyser when ingesting,
      // otherwise the master (voice output) analyser.
      const source = audio ? (audio.micAnalyser || audio.analyser || null) : null;
      const bars = barRef.current ? Array.from(barRef.current.children) : [];
      if (source && bars.length) {
        const data = new Uint8Array(source.frequencyBinCount);
        source.getByteFrequencyData(data);
        bars.forEach((bar, i) => {
          const index = Math.min(Math.floor((i * data.length) / bars.length), data.length - 1);
          const value = data[index] || 0;
          bar.style.height = `${Math.max(4, (value / 255) * 100)}%`;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [audio]);

  return html`
    <div ref=${barRef} style=${{ position: 'absolute', top: '50%', left: '10px', right: '10px', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', opacity: 0.3, pointerEvents: 'none', zIndex: 0, height: '24px' }}>
      ${Array.from({ length: 28 }).map((_, i) => html`
        <span key=${i} style=${{ width: '3px', height: '8px', borderRadius: '1px', background: 'linear-gradient(180deg, rgba(104,157,106,0.9) 0%, rgba(177,98,134,0.9) 100%)', display: 'inline-block' }}></span>
      `)}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// DOCK — AI Chatbot Ingestion (locked layout: prompt row + bottom row +
// tall Lens column on the far right; speakers on each END of the bottom)
// ─────────────────────────────────────────────────────────────────────

const ADD_ACTIONS = [
  { id: 'photo', icon: '🖼️', label: 'Add photos or videos', sub: 'Lens capture → HD Supply scan' },
  { id: 'file', icon: '📄', label: 'Add files (docs, txt…)', sub: 'PDF / TXT into Ingestion' },
  { id: 'email', icon: '✉️', label: 'Email to AgentMail', sub: 'ava007@agentmail.to' }
];

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Inventory status', text: 'Show current inventory status' },
  { icon: '🔎', label: 'Lookup a SKU', text: 'Look up part ' },
  { icon: '🛠️', label: 'PTAC parts', text: 'Show PTAC parts in the catalog' },
  { icon: '📦', label: 'Filter stock', text: 'Show filter stock in the catalog' }
];

function Dock({ chat, audio, onEmail }) {
  const [menu, setMenu] = useState(null);
  const [busy, setBusy] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micErr, setMicErr] = useState(false);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const activateLens = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise(resolve => setTimeout(resolve, 2000));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      stream.getTracks().forEach(track => track.stop());

      setPreview(dataURL);
      const blob = dataURLToBlob(dataURL);
      const file = new File([blob], `esa_img_${Date.now()}.png`, { type: 'image/png' });
      await handleFileToChat(chat, file, 'image'); // → lens → HD Supply scan
    } catch (err) {
      console.warn('[ESA.Ingestion] Lens error:', err.message);
      chat.pushSystem(`⚠️ Lens capture failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async e => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const type = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'text';
      await handleFileToChat(chat, file, type);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleMic = async () => {
    if (!audio) return;
    if (!micOn) {
      try {
        await audio.enableMicrophone();
        setMicOn(true);
        setMicErr(false);
      } catch (err) {
        console.warn('[ESA.Ingestion] Mic denied:', err.message);
        setMicErr(true);
      }
    } else {
      audio.disableMicrophone();
      setMicOn(false);
    }
  };

  // Agent voice chime — outbound speaker on the right END of the bottom row
  const testVoice = () => {
    if (!audio) return;
    audio.triggerAvaVoice(523, 0.6, { duration: 0.22 });
    setTimeout(() => audio.triggerAvaVoice(659, 0.6, { duration: 0.22 }), 220);
    setTimeout(() => audio.triggerAvaVoice(784, 0.8, { duration: 0.4 }), 460);
  };

  const handleAdd = (id) => {
    if (id === 'photo') activateLens();
    else if (id === 'file') { if (fileRef.current) fileRef.current.click(); }
    else if (id === 'email') { if (onEmail) onEmail(); }
  };

  const runPrompt = (text) => {
    chat.setInput(text);
    chat.send(text);
    setMenu(null);
  };

  const canSend = chat.input.trim() !== '' || chat.attachments.length > 0;

  return html`
    <div className="esa-dock-wrap">
      ${chat.attachments.length ? html`
        <div className="esa-dock-chips">
          ${chat.attachments.map(a => html`
            <span key=${a.id} style=${{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1d1d1d', border: '1px solid #2e2e2e', borderRadius: '999px', padding: '4px 12px', fontSize: '11px', color: '#c8c8c8' }}>
              ${a.type === 'image' ? '🖼️' : '📎'} ${a.name}
              <button onClick=${() => chat.removeAttachment(a.id)} style=${{ background: 'transparent', border: 'none', color: '#e06c5f', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }} title="Remove attachment">×</button>
            </span>
          `)}
        </div>
      ` : ''}

      <div className="ai-dock-row">
        <!-- Speaker LEFT — OUTSIDE the chatbot (inbound Sound I / mic) -->
        <button
          className=${`ai-speaker ai-speaker-left${micOn ? ' active' : ''}`}
          onClick=${() => toggleMic()}
          data-tip=${micOn ? 'Sound I — stop mic' : 'Sound I — mic'}
          aria-pressed=${micOn ? 'true' : 'false'}
        >🎤</button>

        <div className="ai-shell">
        <div className="ai-prompt-row">
          <${DockVisualizer} audio=${audio} />
          <input
            type="text"
            value=${chat.input}
            onChange=${e => chat.setInput(e.target.value)}
            onKeyDown=${e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chat.send(); } }}
            placeholder="Add… (SKU, part, or question)"
            aria-label="AI Chatbot Ingestion prompt"
          />
        </div>

        <div className="ai-bottom">
          <div className="ai-icon-dock">
            <!-- Add menu -->
            <div style=${{ position: 'relative', display: 'flex' }}>
              <button
                className=${`ai-tool${menu === 'add' ? ' add-open' : ''}`}
                onClick=${() => setMenu(menu === 'add' ? null : 'add')}
                data-tip="Add"
                aria-expanded=${menu === 'add' ? 'true' : 'false'}
              >+</button>
              ${menu === 'add' ? html`
                <div className="esa-dock-pop">
                  ${ADD_ACTIONS.map(a => html`
                    <button key=${a.id} className="esa-dock-pop-item" onClick=${() => { setMenu(null); handleAdd(a.id); }}>
                      <span className="esa-dock-pop-ico">${a.icon}</span>
                      <span>
                        <span style=${{ display: 'block', fontSize: '12px', color: '#e6e6e6' }}>${a.label}</span>
                        <span style=${{ display: 'block', fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.3px' }}>${a.sub}</span>
                      </span>
                    </button>
                  `)}
                </div>
              ` : ''}
            </div>

            <!-- Inspiration -->
            <div style=${{ position: 'relative', display: 'flex' }}>
              <button
                className=${`ai-tool${menu === 'inspire' ? ' add-open' : ''}`}
                onClick=${() => setMenu(menu === 'inspire' ? null : 'inspire')}
                data-tip="Inspiration — quick catalog prompts"
                aria-expanded=${menu === 'inspire' ? 'true' : 'false'}
              >✨</button>
              ${menu === 'inspire' ? html`
                <div className="esa-dock-pop">
                  ${QUICK_PROMPTS.map(p => html`
                    <button key=${p.label} className="esa-dock-pop-item" onClick=${() => runPrompt(p.text)}>
                      <span className="esa-dock-pop-ico">${p.icon}</span>
                      <span style=${{ color: '#e6e6e6' }}>${p.label}</span>
                    </button>
                  `)}
                </div>
              ` : ''}
            </div>

            <!-- Attach PDF / TXT -->
            <button
              className="ai-tool"
              onClick=${() => { if (fileRef.current) fileRef.current.click(); }}
              data-tip="Attach PDF / TXT"
            >📎</button>
          </div>

          <!-- Send — BOTTOM row only -->
          <button
            className="ai-send"
            onClick=${() => chat.send()}
            disabled=${!canSend}
            aria-label="Send"
          >➤</button>

          <input ref=${fileRef} type="file" accept=".pdf,.txt" style=${{ display: 'none' }} onChange=${e => handleUpload(e)} />
        </div>

        <!-- Lens — tall column spanning TOP + BOTTOM -->
        <button
          className="ai-lens"
          aria-label="Lens"
          onClick=${() => activateLens()}
          disabled=${busy}
        >◉</button>
        </div>

        <!-- Speaker RIGHT — OUTSIDE the chatbot (outbound agent voice) -->
        <button className="ai-speaker ai-speaker-right" onClick=${testVoice} data-tip="Agent voice">🔊</button>
      </div>

      <div className="esa-dock-meta">
        <span>${catalogLabel(chat.catalogStatus)}</span>
        <span>📡 HUB: ACTIVE</span>
        <span>🔍 LENS → HD SUPPLY</span>
        <span>✉️ EMAIL → AVA007@AGENTMAIL.TO</span>
        ${micErr ? html`<span style=${{ color: '#e06c5f' }}>🎤 MIC BLOCKED — CHECK PERMISSIONS</span>` : ''}
      </div>

      ${preview ? html`
        <div style=${{ position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '120px', background: '#161616', border: '1px solid #2e2e2e', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.7)', zIndex: 60 }}>
          <img src=${preview} alt="ESA lens capture" style=${{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick=${() => setPreview(null)} title="Remove image" style=${{ position: 'absolute', top: '4px', right: '4px', background: '#e06c5f', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
        </div>
      ` : ''}
    </div>
  `;
}

function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

// ─────────────────────────────────────────────────────────────────────
// INGESTION INTERFACE — the React module root
// ─────────────────────────────────────────────────────────────────────

function ESAIngestionInterface({ onReady }) {
  const chat = useESAChat();
  const [audioEngine, setAudioEngine] = useState(null);
  const audioRef = useRef(null);
  audioRef.current = audioEngine;

  // Boot audio engine + register hub/API
  useEffect(() => {
    let engine = null;
    try {
      engine = new DynamicAudioBroadcaster();
    } catch (err) {
      console.warn('[ESA.Ingestion] Audio unavailable:', err.message);
    }
    setAudioEngine(engine);
    chat.setAudioReady(!!engine);

    const api = {
      audioEngine: engine,
      chat,
      sendMessage: text => chat.send(text),
      handleFile: (file, type) => handleFileToChat(chat, file, type),
      pushSystem: text => chat.pushSystem(text)
    };
    if (onReady) onReady(api);
    if (typeof window !== 'undefined') {
      window.ESA = window.ESA || {};
      window.ESA.ingestion = window.ESA.ingestion || { components: {} };
      window.ESA.ingestion.api = api;
    }

    const onIngestFile = e => handleFileToChat(chat, e.detail?.file, e.detail?.type);
    window.addEventListener('esa:ingestion-file', onIngestFile);

    const hubHandlers = Object.entries(HUB_LABELS).map(([name, [icon, label]]) => {
      const handler = e => chat.pushSystem(`${icon} ${label} — ${hubSummary(e.detail)}`);
      window.addEventListener(name, handler);
      return [name, handler];
    });

    return () => {
      window.removeEventListener('esa:ingestion-file', onIngestFile);
      hubHandlers.forEach(([name, handler]) => window.removeEventListener(name, handler));
      try { engine?.destroy?.(); } catch (_) { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Agent voice chime on assistant reply
  useEffect(() => {
    if (chat.speakSignal > 0 && audioRef.current) {
      audioRef.current.triggerAvaVoice(659, 0.45, { duration: 0.22 });
    }
  }, [chat.speakSignal]);

  const emailTo = () => {
    const subject = encodeURIComponent('ESA Exoskeleton — Operator request');
    const body = encodeURIComponent(
      (chat.input.trim() ? `${chat.input.trim()}\n\n` : '') +
      `— from ESA EXOSKELETON console (${new Date().toLocaleString()})`
    );
    window.location.href = `mailto:ava007@agentmail.to?subject=${subject}&body=${body}`;
  };

  const portalTarget = typeof document !== 'undefined'
    ? document.getElementById('esa-ingestion-chat-card')
    : null;

  const chatCard = html`<${ChatCard} chat=${chat} />`;

  return html`
    <div style=${{ width: '100%' }}>
      <style>
        @keyframes esa-dot-pulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        .esa-dot { animation: esa-dot-pulse 1.2s infinite; }
        .esa-dot:nth-child(2) { animation-delay: 0.2s; }
        .esa-dot:nth-child(3) { animation-delay: 0.4s; }
      </style>

      ${portalTarget ? createPortal(chatCard, portalTarget) : html`<div style=${{ marginBottom: '12px' }}>${chatCard}</div>`}

      <${Dock} chat=${chat} audio=${audioEngine} onEmail=${emailTo} />
    </div>
  `;
}

export { ESAIngestionInterface };
export default ESAIngestionInterface;
