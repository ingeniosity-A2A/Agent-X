/**
 * ESA.MaintenanceChecklist.js — BENTO EDITION
 * ============================================
 * DAILY MAINTENANCE WORKFLOW — official Bento card.
 *
 * One framework: Bento (docs/BENTO-OFFICIAL-UI.md).
 * Structure:  .bento-card > header (title + gel progress) + shift fields +
 *             SOP sections + Green Shield tracking log
 * Tokens:     --bk-* (bento-tokens.css) — Beige · Green · Black.
 * Polish:     punch-border + gel-progress-track (v6-exoskel-polish.css).
 *
 * Content follows the printed DAILY MAINTENANCE WORKFLOW — Standard
 * Operating Procedure & Shift Checklist (Done / Task / SOP rows).
 *
 * React (esm.sh CDN, no build step). State persists to localStorage.
 * Contract kept identical for integration.js: .mount() + esa:checklist events.
 */

import { html, useState, useEffect, useRef, useCallback } from './ESA.ReactMount.js';
import { mountReact } from './ESA.ReactMount.js';

const STORAGE_KEY = 'esa-maintenance-checklist-v2';

const SECTIONS = [
  {
    id: 'shift-start',
    title: 'Shift Start & Setup',
    icon: '🔑',
    color: '#5b8def',
    items: [
      { task: 'Sign Out Keys', sop: 'Log your name, timestamp, and designated key number on the master log.' },
      { task: 'Check Maintenance Mailbox', sop: 'Retrieve, sort, and prioritize incoming hardcopy maintenance requests.' },
      { task: 'Print Front Desk Reports', sop: 'Obtain the current Vacant Room List and Out-of-Service (OOS) report from PM shift.' },
      { task: 'Manager Check-In (GM)', sop: 'Briefly sync with the General Manager to review critical or high-priority tasks for the day.' }
    ]
  },
  {
    id: 'inspection',
    title: 'Property Inspection & Trash Collection',
    icon: '🏢',
    color: '#2bc4f3',
    items: [
      { task: 'Full Walkthrough', sop: 'Walk the entire property structure systematically (complete indoor corridors and full outdoor perimeter).' },
      { task: 'Identify Deficiencies', sop: 'Proactively scan for missing window screens, structural hazards, lighting failures, or visible leaks.' },
      { task: 'Log Repairs Needed', sop: 'Document found room/common area issues clearly on the OOS or maintenance report for afternoon action.' },
      { task: 'First Trash Sweep', sop: 'Collect all trash from common area bins and safely transport the loads to the primary dumpster area.' }
    ]
  },
  {
    id: 'common-areas',
    title: 'Common Areas & Preventative Maintenance',
    icon: '🧹',
    color: '#4caf7d',
    items: [
      { task: 'Clean Common Areas', sop: 'Sanitize high-touch surfaces, sweep, and mop entryways, lobbies, and shared public corridors.' },
      { task: 'Clean Guest Laundry', sop: 'Wipe down external surfaces of washers/dryers, clear lint traps completely, and sweep flooring.' },
      { task: 'Green Shield Focus', sop: 'Execute the designated preventative Green Shield task scheduled for today (Daily/Weekly/Monthly/Annual sequence).' }
    ]
  },
  {
    id: 'mid-day',
    title: 'Mid-Day Operations & Maintenance Execution',
    icon: '🛠️',
    color: '#f2a33c',
    items: [
      { task: 'Mid-Day GM Check-In', sop: 'Provide a brief status update to the GM regarding critical hazards fixed or long-term OOS progress.' },
      { task: 'Address Work Orders', sop: 'Execute and close out prioritized maintenance requests and room repairs logged during the morning walk.' }
    ]
  },
  {
    id: 'wrap-up',
    title: 'Shift Wrap-Up & Handover',
    icon: '🔐',
    color: '#9c6ade',
    items: [
      { task: 'Final Trash Round', sop: 'Perform one last complete round of trash collection from high-traffic zones before shift end.' },
      { task: 'Secure & Sign In Keys', sop: 'Return all keys directly to the secure lockbox and officially sign them back into the registry.' }
    ]
  }
];

const TOTAL = SECTIONS.reduce((sum, s) => sum + s.items.length, 0); // 18

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* corrupted storage */ }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// PIECES
// ─────────────────────────────────────────────────────────────────────

function CheckBox({ checked, color, onToggle }) {
  return html`
    <button
      onClick=${onToggle}
      aria-pressed=${checked}
      title=${checked ? 'Mark incomplete' : 'Mark complete'}
      style=${{ width: '19px', height: '19px', borderRadius: '6px', border: `2px solid ${checked ? color : 'var(--bk-border)'}`, background: checked ? color : 'var(--bk-panel-2)', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', lineHeight: 1, padding: 0, flexShrink: 0, marginTop: '2px', boxShadow: checked ? `0 0 10px ${color}66` : 'var(--bk-inset-soft)', transition: 'all 0.15s' }}
    >${checked ? '✓' : ''}</button>
  `;
}

function ChecklistItem({ section, index, task, sop, checked, onToggle }) {
  return html`
    <div style=${{ display: 'flex', gap: '10px', padding: '6px 0', alignItems: 'flex-start' }}>
      <${CheckBox} checked=${checked} color=${section.color} onToggle=${onToggle} />
      <div style=${{ flex: 1, minWidth: 0 }}>
        <div style=${{ fontSize: '13px', color: checked ? 'var(--bk-text-3)' : 'var(--bk-text)', textDecoration: checked ? 'line-through' : 'none', fontWeight: checked ? 'normal' : 500, lineHeight: '1.35', transition: 'all 0.15s' }}>${task}</div>
        <div style=${{ fontSize: '11px', color: 'var(--bk-text-3)', marginTop: '2px', lineHeight: '1.45' }}>${sop}</div>
      </div>
    </div>
  `;
}

function SkeletonRow() {
  return html`
    <div style=${{ padding: '7px 0' }}>
      <div style=${{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style=${{ width: '19px', height: '19px', borderRadius: '6px', background: 'var(--bk-chip)', flexShrink: 0 }}></div>
        <div style=${{ flex: 1 }}>
          <div style=${{ height: '10px', width: '62%', borderRadius: '4px', background: 'linear-gradient(90deg,var(--bk-chip),var(--bk-line),var(--bk-chip))', backgroundSize: '200% 100%', animation: 'esa-skel 1.4s infinite' }}></div>
          <div style=${{ height: '8px', width: '88%', marginTop: '7px', borderRadius: '4px', background: 'linear-gradient(90deg,var(--bk-chip),var(--bk-line),var(--bk-chip))', backgroundSize: '200% 100%', animation: 'esa-skel 1.4s infinite 0.25s' }}></div>
        </div>
      </div>
    </div>
  `;
}

function SectionBlock({ section, checks, onToggle, skeleton }) {
  const done = section.items.filter((_, i) => checks[`${section.id}:${i}`]).length;
  const total = section.items.length;
  const pct = Math.round((done / total) * 100);

  return html`
    <div style=${{ margin: '18px 0 4px' }}>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        <div className="bk-tile" style=${{ background: section.color, boxShadow: `0 0 14px ${section.color}55` }}>${section.icon}</div>
        <div style=${{ flex: 1, minWidth: 0 }}>
          <div style=${{ fontSize: '14px', fontWeight: 'bold', color: 'var(--bk-text)', lineHeight: '1.25' }}>${section.title}</div>
          <div style=${{ fontSize: '10px', color: 'var(--bk-text-3)', letterSpacing: '1px', marginTop: '1px' }}>${done}/${total} · ${pct}%</div>
        </div>
      </div>

      <div style=${{ position: 'relative', marginLeft: '14px', paddingLeft: '14px' }}>
        <div style=${{ position: 'absolute', left: '0', top: '2px', bottom: '4px', width: '2px', background: 'linear-gradient(180deg, ' + section.color + '88, var(--bk-border-soft))' }}></div>
        <div style=${{ padding: '4px 0 2px' }}>
          ${skeleton
            ? Array.from({ length: 2 }).map((_, i) => html`<${SkeletonRow} key=${i} />`)
            : section.items.map((item, i) => html`
                <${ChecklistItem}
                  key=${`${section.id}:${i}`}
                  section=${section}
                  index=${i}
                  task=${item.task}
                  sop=${item.sop}
                  checked=${!!checks[`${section.id}:${i}`]}
                  onToggle=${() => onToggle(`${section.id}:${i}`)}
                />
              `)}
        </div>
      </div>
    </div>
  `;
}

function Field({ label, children }) {
  return html`
    <div className="bk-field">
      <span className="bk-field-label">${label}</span>
      ${children}
    </div>
  `;
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--bk-panel-2)',
  border: '1px solid var(--bk-border)',
  color: 'var(--bk-text)',
  padding: '8px 10px',
  borderRadius: '7px',
  fontSize: '12px',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif"
};

// ─────────────────────────────────────────────────────────────────────
// ROOT VIEW
// ─────────────────────────────────────────────────────────────────────

function ESA_MaintenanceChecklistView() {
  const persisted = useRef(loadPersisted()).current;

  const [checks, setChecks] = useState(persisted?.checks || {});
  const [date, setDate] = useState(persisted?.date || new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState(persisted?.shift || 'AM');
  const [employee, setEmployee] = useState(persisted?.employee || '');
  const [manager, setManager] = useState(persisted?.manager || '');
  const [notes, setNotes] = useState(persisted?.notes && persisted.notes.length ? persisted.notes : [
    { area: '', actions: '' },
    { area: '', actions: '' },
    { area: '', actions: '' }
  ]);
  const [loading, setLoading] = useState(true);
  const prevChecks = useRef(checks);

  // Skeleton on first paint
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const doneCount = Object.values(checks).filter(Boolean).length;
  const donePct = Math.round((doneCount / TOTAL) * 100);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ checks, date, shift, employee, manager, notes }));
    } catch (_) { /* storage full / unavailable */ }
  }, [checks, date, shift, employee, manager, notes]);

  // Hub events when a section (or the whole day) completes
  useEffect(() => {
    const prev = prevChecks.current;
    prevChecks.current = checks;
    const isDone = s => s.items.every((_, i) => checks[`${s.id}:${i}`]);
    const wasDone = s => s.items.every((_, i) => prev[`${s.id}:${i}`]);

    SECTIONS.forEach(s => {
      if (isDone(s) && !wasDone(s)) {
        window.dispatchEvent(new CustomEvent('esa:checklist', {
          detail: { section: s.id, title: s.title, progress: doneCount, total: TOTAL }
        }));
      }
    });
    const allNow = doneCount === TOTAL;
    const allPrev = Object.values(prev).filter(Boolean).length === TOTAL;
    if (allNow && !allPrev) {
      window.dispatchEvent(new CustomEvent('esa:checklist', {
        detail: { all: true, progress: TOTAL, total: TOTAL }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checks]);

  const toggle = useCallback((key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const reset = () => {
    setChecks({});
    setNotes([
      { area: '', actions: '' },
      { area: '', actions: '' },
      { area: '', actions: '' }
    ]);
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  const updateNote = (i, field, value) => {
    setNotes(rows => rows.map((r, ri) => (ri === i ? { ...r, [field]: value } : r)));
  };

  const removeNote = (i) => setNotes(rows => rows.filter((_, ri) => ri !== i));

  return html`
    <div className="bento-card punch-border" style=${{ width: '100%', margin: '0 auto' }}>
      <style>${'@keyframes esa-skel { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0 0; } }'}</style>

      <div style=${{ padding: '1.5rem 1.4rem 1.3rem', boxSizing: 'border-box', position: 'relative' }}>
        <!-- Header: title + progress pill + refresh -->
        <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div>
            <div className="bento-title" style=${{ fontSize: '1.3rem' }}>Daily <em>maintenance</em></div>
            <div className="bento-desc" style=${{ marginTop: '2px' }}>Standard Operating Procedure & Shift Checklist</div>
          </div>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="bk-pill" style=${{ padding: '0.3rem 0.7rem', fontSize: '0.62rem' }}>
              <span className="bk-dot pulse"></span>${doneCount}/${TOTAL}
            </div>
            <button
              onClick=${() => reset()}
              title="Reset checklist"
              className="bk-icon-btn"
              style=${{ width: '30px', height: '30px', borderRadius: '50%', fontSize: '14px' }}
            >↻</button>
          </div>
        </div>

        <!-- Gel progress -->
        <div className="gel-progress-track" style=${{ '--gel-progress': donePct + '%', marginBottom: '14px' }}>
          <div className="gel-progress-fill"></div>
        </div>

        <!-- Shift header fields -->
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', padding: '12px', background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)', borderRadius: '12px', marginBottom: '8px' }}>
          <${Field} label="DATE">
            <input type="date" value=${date} onChange=${e => setDate(e.target.value)} style=${inputStyle} />
          </${Field}>
          <${Field} label="SHIFT">
            <div style=${{ display: 'flex', background: 'var(--bk-panel-2)', border: '1px solid var(--bk-border)', borderRadius: '7px', padding: '2px', gap: '2px' }}>
              ${['AM', 'PM'].map(m => html`
                <button key=${m} onClick=${() => setShift(m)} style=${{ flex: 1, padding: '6px 0', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', background: shift === m ? 'var(--bk-accent)' : 'transparent', color: shift === m ? 'var(--bk-on-accent)' : 'var(--bk-text-3)', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif" }}>${m}</button>
              `)}
            </div>
          </${Field}>
          <${Field} label="EMPLOYEE NAME">
            <input type="text" value=${employee} onChange=${e => setEmployee(e.target.value)} placeholder="Enter name…" style=${inputStyle} />
          </${Field}>
          <${Field} label="MANAGER SIGN-OFF">
            <input type="text" value=${manager} onChange=${e => setManager(e.target.value)} placeholder="Manager initials…" style=${inputStyle} />
          </${Field}>
        </div>

        <!-- Sections -->
        ${SECTIONS.map(s => html`<${SectionBlock} key=${s.id} section=${s} checks=${checks} onToggle=${toggle} skeleton=${loading} />`)}

        <!-- Shift Notes & Green Shield Tracking Log -->
        <div style=${{ marginTop: '22px' }}>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="bk-tile" style=${{ background: '#2bc4f3', boxShadow: '0 0 14px #2bc4f355' }}>📝</div>
            <div style=${{ fontSize: '14px', fontWeight: 'bold', color: 'var(--bk-text)' }}>Shift Notes & Green Shield Tracking Log</div>
          </div>
          <div style=${{ fontSize: '11px', fontStyle: 'italic', color: 'var(--bk-text-3)', margin: '8px 0 12px', lineHeight: '1.5' }}>
            Use this section to record any dynamic Green Shield tasks completed or complex property hazards encountered:
          </div>

          <div style=${{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--bk-border)' }}>
            <div style=${{ display: 'flex', background: 'var(--bk-chip)', color: 'var(--bk-text-2)' }}>
              <div style=${{ flex: 1, padding: '9px 12px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>TARGET AREA / GREEN SHIELD CYCLE</div>
              <div style=${{ flex: '1.5', padding: '9px 12px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', borderLeft: '1px solid var(--bk-border-soft)' }}>MAINTENANCE ACTIONS LOGGED & PARTS USED</div>
            </div>
            ${notes.map((row, i) => html`
              <div key=${i} style=${{ display: 'flex', borderTop: '1px solid var(--bk-border-soft)', background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                <input value=${row.area} onChange=${e => updateNote(i, 'area', e.target.value)} placeholder="e.g. Lobby / Weekly" style=${{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent' }} />
                <input value=${row.actions} onChange=${e => updateNote(i, 'actions', e.target.value)} placeholder="e.g. Replaced filter HD-9033" style=${{ ...inputStyle, border: 'none', borderRadius: 0, borderLeft: '1px solid var(--bk-border-soft)', background: 'transparent' }} />
                <button onClick=${() => removeNote(i)} title="Remove entry" style=${{ width: '32px', flexShrink: 0, border: 'none', borderLeft: '1px solid var(--bk-border-soft)', background: 'transparent', color: 'var(--bk-danger)', cursor: 'pointer', fontSize: '14px' }}>×</button>
              </div>
            `)}
          </div>

          <button
            onClick=${() => setNotes(rows => [...rows, { area: '', actions: '' }])}
            style=${{ marginTop: '10px', padding: '8px 16px', background: 'rgba(126,200,160,0.12)', color: 'var(--bk-accent)', border: '1px solid rgba(126,200,160,0.35)', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}
          >+ ADD LOG ENTRY</button>
        </div>
      </div>
    </div>
  `;
}

export const ESAMaintenanceChecklist = {
  name: 'MaintenanceChecklist',
  version: '4.0.0',
  kind: 'react',

  /**
   * Mount the React daily to-do list card.
   * @param {HTMLElement} container - #esa-maintenance-checklist
   */
  mount(container, props = {}) {
    if (!container) return null;
    const result = mountReact(container, ESA_MaintenanceChecklistView, props);
    return result ? { unmount: result.unmount, state: { kind: 'react' } } : null;
  }
};

export default ESAMaintenanceChecklist;
