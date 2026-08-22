/**
 * ESA.MaintenanceChecklist.js
 * ============================================
 * DAILY MAINTENANCE WORKFLOW — REACT MODULE
 * ============================================
 *
 * The daily to-do list card, styled like the dark glassmorphic "Checklist"
 * mockup:
 *   - header title + progress pill + refresh button
 *   - shift header fields (Date / Shift AM-PM / Employee / Manager sign-off)
 *   - category sections with colored circular icons + connector lines
 *   - rounded checkboxes with strikethrough on completion
 *   - skeleton loaders on mount / reset
 *   - "Shift Notes & Green Shield Tracking Log" table
 *
 * Content follows the printed DAILY MAINTENANCE WORKFLOW — Standard
 * Operating Procedure & Shift Checklist (Done / Task / SOP rows).
 *
 * React (esm.sh CDN, no build step); Arrow.js sandboxes the rest of the
 * Exoskeleton. State persists to localStorage.
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
      style=${{ width: '19px', height: '19px', borderRadius: '6px', border: `2px solid ${checked ? color : '#55555c'}`, background: checked ? color : 'rgba(255,255,255,0.03)', color: '#101014', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', lineHeight: 1, padding: 0, flexShrink: 0, marginTop: '2px', boxShadow: checked ? `0 0 10px ${color}66` : 'inset 0 1px 2px rgba(0,0,0,0.45)', transition: 'all 0.15s' }}
    >${checked ? '✓' : ''}</button>
  `;
}

function ChecklistItem({ section, index, task, sop, checked, onToggle }) {
  return html`
    <div style=${{ display: 'flex', gap: '10px', padding: '6px 0', alignItems: 'flex-start' }}>
      <${CheckBox} checked=${checked} color=${section.color} onToggle=${onToggle} />
      <div style=${{ flex: 1, minWidth: 0 }}>
        <div style=${{ fontSize: '13px', color: checked ? '#8a8a92' : '#ebdbb2', textDecoration: checked ? 'line-through' : 'none', fontWeight: checked ? 'normal' : 500, lineHeight: '1.35', transition: 'all 0.15s' }}>${task}</div>
        <div style=${{ fontSize: '11px', color: '#7d7d85', marginTop: '2px', lineHeight: '1.45' }}>${sop}</div>
      </div>
    </div>
  `;
}

function SkeletonRow() {
  return html`
    <div style=${{ padding: '7px 0' }}>
      <div style=${{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style=${{ width: '19px', height: '19px', borderRadius: '6px', background: '#333338', flexShrink: 0 }}></div>
        <div style=${{ flex: 1 }}>
          <div style=${{ height: '10px', width: '62%', borderRadius: '4px', background: 'linear-gradient(90deg,#333338,#3f3f46,#333338)', backgroundSize: '200% 100%', animation: 'esa-skel 1.4s infinite' }}></div>
          <div style=${{ height: '8px', width: '88%', marginTop: '7px', borderRadius: '4px', background: 'linear-gradient(90deg,#333338,#3f3f46,#333338)', backgroundSize: '200% 100%', animation: 'esa-skel 1.4s infinite 0.25s' }}></div>
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
        <div style=${{ width: '30px', height: '30px', borderRadius: '50%', background: section.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, boxShadow: `0 0 14px ${section.color}55` }}>${section.icon}</div>
        <div style=${{ flex: 1, minWidth: 0 }}>
          <div style=${{ fontSize: '14px', fontWeight: 'bold', color: '#ebdbb2', lineHeight: '1.25' }}>${section.title}</div>
          <div style=${{ fontSize: '10px', color: '#8a8a92', letterSpacing: '1px', marginTop: '1px' }}>${done}/${total} · ${pct}%</div>
        </div>
      </div>

      <div style=${{ position: 'relative', marginLeft: '14px', paddingLeft: '14px' }}>
        <div style=${{ position: 'absolute', left: '0', top: '2px', bottom: '4px', width: '2px', background: 'linear-gradient(180deg, ' + section.color + '88, #3a3a42)' }}></div>
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
    <div style=${{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style=${{ fontSize: '9px', letterSpacing: '1px', color: '#8a8a92', fontWeight: 'bold' }}>${label}</span>
      ${children}
    </div>
  `;
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#26262c',
  border: '1px solid #3a3a42',
  color: '#ebdbb2',
  padding: '8px 10px',
  borderRadius: '7px',
  fontSize: '12px',
  outline: 'none'
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
    <div style=${{ width: '100%', boxSizing: 'border-box' }}>
      <style>
        @keyframes esa-skel { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0 0; } }
      </style>

      <div style=${{ background: 'transparent', padding: '1.75rem', boxSizing: 'border-box', position: 'relative' }}>
        <!-- Header -->
        <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style=${{ fontSize: '17px', fontWeight: 'bold', color: '#ebdbb2', letterSpacing: '0.5px' }}>Daily Maintenance</div>
            <div style=${{ fontSize: '10px', color: '#8a8a92', marginTop: '2px' }}>Standard Operating Procedure & Shift Checklist</div>
          </div>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style=${{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(0,0,0,0.35)', border: '1px solid #3a3a42', borderRadius: '20px', padding: '6px 14px' }}>
              <span style=${{ width: '8px', height: '8px', borderRadius: '50%', background: '#2bc4f3', boxShadow: '0 0 8px #2bc4f3' }}></span>
              <span style=${{ fontSize: '11px', color: '#d9d9de', fontWeight: 'bold' }}>${doneCount}/${TOTAL}</span>
            </div>
            <button
              onClick=${() => reset()}
              title="Reset checklist"
              style=${{ width: '30px', height: '30px', borderRadius: '50%', background: '#2f2f36', border: '1px solid #3f3f47', color: '#a9a9b0', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            >↻</button>
          </div>
        </div>

        <!-- Shift header fields -->
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', padding: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid #3a3a42', borderRadius: '10px', marginBottom: '8px' }}>
          <${Field} label="DATE">
            <input type="date" value=${date} onChange=${e => setDate(e.target.value)} style=${inputStyle} />
          </${Field}>
          <${Field} label="SHIFT">
            <div style=${{ display: 'flex', background: '#202026', border: '1px solid #3a3a42', borderRadius: '7px', padding: '2px', gap: '2px' }}>
              ${['AM', 'PM'].map(m => html`
                <button key=${m} onClick=${() => setShift(m)} style=${{ flex: 1, padding: '6px 0', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', background: shift === m ? '#5b8def' : 'transparent', color: shift === m ? '#fff' : '#8a8a92', transition: 'all 0.15s' }}>${m}</button>
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
            <div style=${{ width: '30px', height: '30px', borderRadius: '50%', background: '#2bc4f3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: '0 0 14px #2bc4f355' }}>📝</div>
            <div style=${{ fontSize: '14px', fontWeight: 'bold', color: '#ebdbb2' }}>Shift Notes & Green Shield Tracking Log</div>
          </div>
          <div style=${{ fontSize: '11px', fontStyle: 'italic', color: '#8a8a92', margin: '8px 0 12px', lineHeight: '1.5' }}>
            Use this section to record any dynamic Green Shield tasks completed or complex property hazards encountered:
          </div>

          <div style=${{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #3a3a42' }}>
            <div style=${{ display: 'flex', background: '#2f2f36', color: '#d7b46a' }}>
              <div style=${{ flex: 1, padding: '9px 12px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>TARGET AREA / GREEN SHIELD CYCLE</div>
              <div style=${{ flex: '1.5', padding: '9px 12px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', borderLeft: '1px solid #3a3a42' }}>MAINTENANCE ACTIONS LOGGED & PARTS USED</div>
            </div>
            ${notes.map((row, i) => html`
              <div key=${i} style=${{ display: 'flex', borderTop: '1px solid #33333a', background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                <input value=${row.area} onChange=${e => updateNote(i, 'area', e.target.value)} placeholder="e.g. Lobby / Weekly" style=${{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent' }} />
                <input value=${row.actions} onChange=${e => updateNote(i, 'actions', e.target.value)} placeholder="e.g. Replaced filter HD-9033" style=${{ ...inputStyle, border: 'none', borderRadius: 0, borderLeft: '1px solid #33333a', background: 'transparent' }} />
                <button onClick=${() => removeNote(i)} title="Remove entry" style=${{ width: '32px', flexShrink: 0, border: 'none', borderLeft: '1px solid #33333a', background: 'transparent', color: '#cc241d', cursor: 'pointer', fontSize: '14px' }}>×</button>
              </div>
            `)}
          </div>

          <button
            onClick=${() => setNotes(rows => [...rows, { area: '', actions: '' }])}
            style=${{ marginTop: '10px', padding: '8px 16px', background: 'rgba(43,196,243,0.12)', color: '#2bc4f3', border: '1px solid #2bc4f355', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}
          >+ ADD LOG ENTRY</button>
        </div>
      </div>
    </div>
  `;
}

export const ESAMaintenanceChecklist = {
  name: 'MaintenanceChecklist',
  version: '3.0.0',
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
