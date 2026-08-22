/**
 * hooks/use-esa-chat.js
 * ============================================
 * useESAChat — REACT HOOK FOR THE ESA INGESTION INTERFACE
 * ============================================
 *
 * Modeled on the AI SDK chatbot example (`useChat` / message "parts"):
 *   - text parts     → operator / agent content
 *   - image parts    → lens captures rendered inline in the thread
 *   - attachment     → pdf/text payloads (chip, no inline render)
 *   - card parts     → HD Supply catalog rows (tool-call style cards)
 *   - divider/list/stats → structured assistant output
 *   - system parts   → hub events from other ESA components
 *
 * Scope: ESA CONTENT ONLY. The Ingestion Interface is the sole communication
 * hub for the ESA EXOSKELETON console. It routes ESA content to the AI agent
 * (Cybernetic Ava007 via substrate) — it does not host an Intellect.
 *
 * The catalog engine prefers DuckDB WASM (HD Supply streaming, zero local
 * storage) and falls back to an embedded catalog when WASM is unavailable.
 */

import { useState, useRef, useCallback } from '../components/ESA.ReactMount.js';

// ─────────────────────────────────────────────────────────────────────
// HD SUPPLY CATALOG — embedded fallback (schema mirrors the DuckDB table)
// ─────────────────────────────────────────────────────────────────────

const FALLBACK_CATALOG = [
  { sku: 'HD-4421', name: 'Seasons 9000 BTU PTAC Unit',   category: 'PTAC Units',  price: 899.0,  inventory: 15,  location: 'Warehouse A' },
  { sku: 'HD-1180', name: 'PTAC Subbase 20A',            category: 'Accessories', price: 45.0,   inventory: 42,  location: 'Warehouse B' },
  { sku: 'HD-9033', name: 'Double Packed Filter',        category: 'Filters',     price: 12.5,   inventory: 150, location: 'Warehouse A' },
  { sku: 'HD-2205', name: 'Wireless Thermostat',         category: 'Controls',    price: 159.0,  inventory: 28,  location: 'Warehouse C' },
  { sku: 'HD-3311', name: 'PTAC Filter Grille (18x18)',  category: 'Filters',     price: 24.99,  inventory: 63,  location: 'Warehouse B' },
  { sku: 'HD-5540', name: 'Line Set Insulation Kit',     category: 'Accessories', price: 18.75,  inventory: 88,  location: 'Warehouse A' }
];

const DUCKDB_URLS = {
  mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-mvp.wasm',
  mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-mvp.worker.js',
  pthreadWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-mvp.pthread.worker.js'
};

const SKU_RE = /HD-\d{3,5}/gi;

function escapeSql(value) {
  return String(value ?? '').replace(/'/g, "''");
}

function rowify(record) {
  return {
    sku: String(record.sku ?? ''),
    name: String(record.name ?? ''),
    category: String(record.category ?? ''),
    price: Number(record.price) || 0,
    inventory: Number(record.inventory) || 0,
    location: String(record.location ?? '')
  };
}

async function createDuckDBEngine() {
  const duckdb = window.__esaDuckdb || window.duckdb;
  if (!duckdb) throw new Error('DuckDB runtime not loaded');

  // Official duckdb-wasm bootstrap: getJsDelivrBundles() + blob worker
  // (direct cross-origin `new Worker(cdnUrl)` is blocked by browsers).
  const bundles = typeof duckdb.getJsDelivrBundles === 'function'
    ? duckdb.getJsDelivrBundles()
    : DUCKDB_URLS;
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundles.mainWorker}");`], { type: 'text/javascript' })
  );
  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundles.mainModule, bundles.pthreadWorker);
  const conn = await db.connect();

  await conn.query(
    `CREATE TABLE IF NOT EXISTS hd_supply_catalog (
       sku VARCHAR, name VARCHAR, category VARCHAR,
       price DOUBLE, inventory INTEGER, location VARCHAR
     )`
  );
  for (const item of FALLBACK_CATALOG) {
    await conn.query(
      `INSERT OR REPLACE INTO hd_supply_catalog VALUES
       ('${escapeSql(item.sku)}', '${escapeSql(item.name)}', '${escapeSql(item.category)}',
        ${item.price}, ${item.inventory}, '${escapeSql(item.location)}')`
    );
  }

  const toRows = async (result) => {
    const table = await result;
    const arr = table && typeof table.toArray === 'function' ? table.toArray() : [];
    return arr.map(rowify);
  };

  return {
    status: 'duckdb',
    search: async (query, limit = 4) => {
      const term = escapeSql((query || '').trim());
      const sql = term
        ? `SELECT * FROM hd_supply_catalog
           WHERE name ILIKE '%${term}%' OR sku ILIKE '%${term}%' OR category ILIKE '%${term}%'
           LIMIT ${limit}`
        : `SELECT * FROM hd_supply_catalog LIMIT ${limit}`;
      return toRows(conn.query(sql));
    },
    bySKU: async (sku) => {
      const rows = await toRows(
        conn.query(`SELECT * FROM hd_supply_catalog WHERE sku = '${escapeSql(sku)}' LIMIT 1`)
      );
      return rows[0] || null;
    },
    stats: async () => {
      const rows = await toRows(
        conn.query(
          `SELECT category, COUNT(*) AS count, SUM(inventory) AS stock
           FROM hd_supply_catalog GROUP BY category ORDER BY count DESC`
        )
      );
      return rows.map(r => ({ category: r.category, count: Number(r.count) || 0, stock: Number(r.stock) || 0 }));
    }
  };
}

function createFallbackEngine() {
  const matches = (row, term) => {
    const t = term.toLowerCase();
    return !t
      || row.sku.toLowerCase().includes(t)
      || row.name.toLowerCase().includes(t)
      || row.category.toLowerCase().includes(t);
  };

  return {
    status: 'fallback',
    search: async (query, limit = 4) => {
      const term = (query || '').trim();
      return FALLBACK_CATALOG.filter(r => matches(r, term)).slice(0, limit).map(rowify);
    },
    bySKU: async (sku) => {
      const row = FALLBACK_CATALOG.find(r => r.sku.toLowerCase() === String(sku).toLowerCase());
      return row ? rowify(row) : null;
    },
    stats: async () => {
      const byCat = {};
      FALLBACK_CATALOG.forEach(r => {
        byCat[r.category] = byCat[r.category] || { category: r.category, count: 0, stock: 0 };
        byCat[r.category].count += 1;
        byCat[r.category].stock += r.inventory;
      });
      return Object.values(byCat);
    }
  };
}

let catalogPromise = null;

/** Lazy, cached catalog engine — DuckDB WASM with embedded fallback. */
export function ensureCatalog() {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      try {
        const engine = await createDuckDBEngine();
        console.log('[ESA.Chat] HD Supply catalog engine: DuckDB WASM');
        return engine;
      } catch (err) {
        console.warn('[ESA.Chat] DuckDB unavailable, using embedded catalog:', err.message);
        return createFallbackEngine();
      }
    })();
  }
  return catalogPromise;
}

/** 'idle' | 'loading' | 'duckdb' | 'fallback' | 'offline' */
export async function getCatalogStatus() {
  try {
    return (await ensureCatalog()).status;
  } catch (_) {
    return 'offline';
  }
}

// ─────────────────────────────────────────────────────────────────────
// ASSISTANT PIPELINE — ESA CONTENT ONLY
// ─────────────────────────────────────────────────────────────────────

function buildUserParts(text, attachments) {
  const parts = [];
  if (text) parts.push({ type: 'text', text });
  attachments.forEach(a => {
    if (a.type === 'image' && a.dataUrl) {
      parts.push({ type: 'image', name: a.name, dataUrl: a.dataUrl });
    } else {
      parts.push({ type: 'attachment', name: a.name, kind: a.type });
    }
  });
  return parts;
}

function pushCardParts(parts, rows) {
  rows.slice(0, 4).forEach(row => parts.push({ type: 'card', card: row }));
}

async function respond(engine, text, attachments) {
  const q = (text || '').trim();
  const parts = [];
  const hasImage = attachments.some(a => a.type === 'image');
  const uniqueSkus = [...new Set([...(q.matchAll(SKU_RE) || [])].map(m => m[0].toUpperCase()))];

  // ── Lens path: captured image → catalog scan ──
  if (hasImage) {
    parts.push({ type: 'text', text: '🔍 Lens capture received. Scanning HD Supply catalog for matching stock…' });
    const rows = await engine.search(q);
    if (rows.length) {
      parts.push({ type: 'divider', label: 'HD SUPPLY — CATALOG MATCHES' });
      pushCardParts(parts, rows);
      parts.push({ type: 'text', text: `Found ${rows.length} item(s). Reply with a part name or SKU (e.g. HD-9033) to narrow results.` });
    } else {
      parts.push({ type: 'text', text: 'No catalog matches for that capture. Try adding a part name, category, or SKU.' });
    }
    return parts;
  }

  // ── Exact SKU path ──
  if (uniqueSkus.length) {
    const row = await engine.bySKU(uniqueSkus[0]);
    if (row) {
      parts.push({ type: 'text', text: `Exact SKU match — ${row.sku}:` });
      parts.push({ type: 'card', card: row });
      parts.push({ type: 'text', text: `${row.inventory} in stock at ${row.location}. Say "order ${row.sku}" to add it to a workorder.` });
    } else {
      parts.push({ type: 'text', text: `No catalog entry for ${uniqueSkus[0]}. Check the SKU and try again.` });
    }
    return parts;
  }

  const lower = q.toLowerCase();

  // ── Help / capabilities ──
  if (/help|what can you|commands|capabilit|menu/.test(lower)) {
    parts.push({ type: 'text', text: 'This hub handles ESA content only — HD Supply parts, inventory, and diagnostics. Try:' });
    parts.push({
      type: 'list',
      items: [
        '"look up PTAC filter" — search the HD Supply catalog',
        '"HD-9033" — exact SKU lookup',
        '"inventory status" — warehouse stock summary',
        'Lens button — capture a part and match it against the catalog'
      ]
    });
    return parts;
  }

  // ── Inventory summary ──
  if (/inventory|stock|status|count|warehouse|summary/.test(lower)) {
    const stats = await engine.stats();
    parts.push({ type: 'text', text: 'HD Supply inventory summary:' });
    parts.push({ type: 'stats', stats });
    return parts;
  }

  // ── Catalog search ──
  if (q) {
    const rows = await engine.search(q);
    if (rows.length) {
      parts.push({ type: 'text', text: `Catalog results for "${q}":` });
      parts.push({ type: 'divider', label: 'HD SUPPLY — CATALOG RESULTS' });
      pushCardParts(parts, rows);
      parts.push({ type: 'text', text: `${rows.length} item(s) shown. Reply with a SKU for exact pricing and stock.` });
    } else {
      parts.push({ type: 'text', text: `No HD Supply matches for "${q}". Scope is ESA content only — try a part name, category, or SKU.` });
    }
    return parts;
  }

  // ── Bare send ──
  parts.push({
    type: 'text',
    text: 'ESA Agent online — scope: ESA content only (HD Supply catalog, inventory, diagnostics). Ask a part query or press the lens button to capture a part.'
  });
  return parts;
}

// ─────────────────────────────────────────────────────────────────────
// useESAChat — REACT HOOK
// ─────────────────────────────────────────────────────────────────────

const WELCOME = {
  id: 'esa-msg-welcome',
  role: 'assistant',
  timestamp: new Date().toISOString(),
  parts: [{
    type: 'text',
    text: '🛡️ ESA Agent online — communication hub for the ESA EXOSKELETON console.\nScope: ESA content only (HD Supply catalog, inventory, diagnostics).\nUse the lens button to capture a part, or type a part name / SKU.'
  }]
};

export function useESAChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [status, setStatus] = useState('ready'); // ready | submitting | streaming
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('idle');
  const [speakSignal, setSpeakSignal] = useState(0);
  const [audioReady, setAudioReady] = useState(false);

  const idRef = useRef(0);
  const inputRef = useRef('');
  const attachmentsRef = useRef([]);

  const nextId = () => `esa-msg-${++idRef.current}`;

  const pushSystem = useCallback((text) => {
    setMessages(m => [...m, {
      id: nextId(),
      role: 'system',
      timestamp: new Date().toISOString(),
      parts: [{ type: 'text', text: String(text ?? '') }]
    }]);
  }, []);

  const attachFile = useCallback((file, type) => new Promise(resolve => {
    const attachment = {
      id: nextId(),
      name: file?.name || `${type || 'file'}-${Date.now()}`,
      type: type || 'file',
      dataUrl: null
    };
    const commit = () => {
      setAttachments(a => {
        const next = [...a, attachment];
        attachmentsRef.current = next;
        return next;
      });
      resolve(attachment);
    };
    if ((type === 'image' || file?.type?.startsWith('image/')) && file) {
      const reader = new FileReader();
      reader.onload = () => { attachment.dataUrl = reader.result; commit(); };
      reader.onerror = commit;
      reader.readAsDataURL(file);
    } else {
      commit();
    }
  }), []);

  const removeAttachment = useCallback((id) => {
    setAttachments(a => {
      const next = a.filter(x => x.id !== id);
      attachmentsRef.current = next;
      return next;
    });
  }, []);

  const send = useCallback(async (textOverride) => {
    const text = (textOverride ?? inputRef.current).trim();
    const atts = attachmentsRef.current;

    if (!text && atts.length === 0) return;

    setAttachments([]);
    attachmentsRef.current = [];
    setInput('');
    inputRef.current = '';
    setStatus('submitting');

    const userMessage = {
      id: nextId(),
      role: 'user',
      timestamp: new Date().toISOString(),
      parts: buildUserParts(text, atts)
    };
    setMessages(m => [...m, userMessage]);

    setStatus('streaming');
    try {
      const engine = await ensureCatalog();
      setCatalogStatus(engine.status);
      const replyParts = await respond(engine, text, atts);
      setMessages(m => [...m, {
        id: nextId(),
        role: 'assistant',
        timestamp: new Date().toISOString(),
        parts: replyParts
      }]);
      setSpeakSignal(s => s + 1);
    } catch (err) {
      setMessages(m => [...m, {
        id: nextId(),
        role: 'assistant',
        timestamp: new Date().toISOString(),
        parts: [{ type: 'text', text: `[ESA Agent] Lookup failed: ${err.message}` }]
      }]);
    } finally {
      setStatus('ready');
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([WELCOME]);
    setAttachments([]);
    attachmentsRef.current = [];
    setInput('');
    inputRef.current = '';
    setStatus('ready');
  }, []);

  return {
    messages,
    status,
    input,
    setInput,
    attachments,
    attachFile,
    removeAttachment,
    send,
    pushSystem,
    clear,
    catalogStatus,
    speakSignal,
    audioReady,
    setAudioReady
  };
}

/**
 * Route a file/capture from the ButtonPanel into the chat.
 * Images (lens) attach and auto-send → catalog scan; other files attach
 * as pending payloads with a system note.
 */
export async function handleFileToChat(chat, file, type) {
  if (!file || !chat) return;
  if (type === 'image') {
    await chat.attachFile(file, 'image');
    await chat.send('');
  } else {
    await chat.attachFile(file, type || 'file');
    chat.pushSystem(`📎 ${String(type || 'file').toUpperCase()} received: ${file.name} — type a query and send.`);
  }
}
