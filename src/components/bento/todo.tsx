'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import gsap from 'gsap';
import { CheckIcon, Line, PlusIcon, WindowDots } from './core';

/* ------------------------------------------------------------------ */
/* Todo state (localStorage-persisted, shared across cards)            */
/* Seeded from the real paper: "Daily Maintenance Workflow — SOP &     */
/* Shift Checklist" (5 phases + dynamic shift notes log)               */
/* ------------------------------------------------------------------ */

export type Priority = 'low' | 'normal' | 'high';
export type Filter = 'all' | 'open' | 'done';

export type SectionId = 'setup' | 'inspection' | 'common' | 'midday' | 'wrapup' | 'notes';

export interface SectionDef {
  id: SectionId;
  num: string;
  name: string;
}

export const SECTIONS: SectionDef[] = [
  { id: 'setup', num: '1', name: 'Shift Start & Setup' },
  { id: 'inspection', num: '2', name: 'Property Inspection & Trash Collection' },
  { id: 'common', num: '3', name: 'Common Areas & Preventative Maintenance' },
  { id: 'midday', num: '4', name: 'Mid-Day Operations & Maintenance Execution' },
  { id: 'wrapup', num: '5', name: 'Shift Wrap-Up & Handover' },
  { id: 'notes', num: '★', name: 'Shift Notes & Green Shield Tracking Log' },
];

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  pri: Priority;
  created: number;
  section: SectionId;
  note?: string; // Standard Operating Procedure / Instructions line from the paper
}

interface TodoCtx {
  todos: Todo[];
  add: (text: string, pri?: Priority, section?: SectionId) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearDone: () => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
  shift: 'AM' | 'PM';
  setShift: (s: 'AM' | 'PM') => void;
  employee: string;
  setEmployee: (name: string) => void;
  signed: boolean;
  signOff: () => void;
}

const Ctx = createContext<TodoCtx | null>(null);

const KEY = 'bento-todos-v2';
const SHIFT_KEY = 'bento-shift';
const EMP_KEY = 'bento-employee';
const SIGN_KEY = 'bento-signed';

const SEED: Todo[] = [
  /* 1. Shift Start & Setup */
  { id: 'm1', text: 'Sign Out Keys', done: false, pri: 'normal', created: 1, section: 'setup', note: 'Log your name, timestamp, and designated key number on the master log.' },
  { id: 'm2', text: 'Check Maintenance Mailbox', done: false, pri: 'normal', created: 2, section: 'setup', note: 'Retrieve, sort, and prioritize incoming hardcopy maintenance requests.' },
  { id: 'm3', text: 'Print Front Desk Reports', done: false, pri: 'normal', created: 3, section: 'setup', note: 'Obtain the current Vacant Room List and Out-of-Service (OOS) report from PM shift.' },
  { id: 'm4', text: 'Manager Check-In (GM)', done: false, pri: 'high', created: 4, section: 'setup', note: 'Briefly sync with the General Manager to review critical or high-priority tasks for the day.' },
  /* 2. Property Inspection & Trash Collection */
  { id: 'm5', text: 'Full Walkthrough', done: false, pri: 'high', created: 5, section: 'inspection', note: 'Walk the entire property structure systematically (complete indoor corridors and full outdoor perimeter).' },
  { id: 'm6', text: 'Identify Deficiencies', done: false, pri: 'normal', created: 6, section: 'inspection', note: 'Proactively scan for missing window screens, structural hazards, lighting failures, or visible leaks.' },
  { id: 'm7', text: 'Log Repairs Needed', done: false, pri: 'normal', created: 7, section: 'inspection', note: 'Document found room/common area issues clearly on the OOS or maintenance report for afternoon action.' },
  { id: 'm8', text: 'First Trash Sweep', done: false, pri: 'normal', created: 8, section: 'inspection', note: 'Collect all trash from common area bins and safely transport the loads to the primary dumpster area.' },
  /* 3. Common Areas & Preventative Maintenance */
  { id: 'm9', text: 'Clean Common Areas', done: false, pri: 'normal', created: 9, section: 'common', note: 'Sanitize high-touch surfaces, sweep, and mop entryways, lobbies, and shared public corridors.' },
  { id: 'm10', text: 'Clean Guest Laundry', done: false, pri: 'normal', created: 10, section: 'common', note: 'Wipe down external surfaces of washers/dryers, clear lint traps completely, and sweep flooring.' },
  { id: 'm11', text: 'Green Shield Focus', done: false, pri: 'high', created: 11, section: 'common', note: 'Execute the designated preventative Green Shield task scheduled for today (Daily/Weekly/Monthly/Annual sequence).' },
  /* 4. Mid-Day Operations & Maintenance Execution */
  { id: 'm12', text: 'Mid-Day GM Check-In', done: false, pri: 'normal', created: 12, section: 'midday', note: 'Provide a brief status update to the GM regarding critical hazards fixed or long-term OOS progress.' },
  { id: 'm13', text: 'Address Work Orders', done: false, pri: 'high', created: 13, section: 'midday', note: 'Execute and close out prioritized maintenance requests and room repairs logged during the morning walk.' },
  /* 5. Shift Wrap-Up & Handover */
  { id: 'm14', text: 'Final Trash Round', done: false, pri: 'normal', created: 14, section: 'wrapup', note: 'Perform one last complete round of trash collection from high-traffic zones before shift end.' },
  { id: 'm15', text: 'Secure & Sign In Keys', done: false, pri: 'high', created: 15, section: 'wrapup', note: 'Return all keys directly to the secure lockbox and officially sign them back into the registry.' },
];

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [hydrated, setHydrated] = useState(false);
  const [shift, setShiftState] = useState<'AM' | 'PM'>('AM');
  const [employee, setEmployeeState] = useState('');
  const [signedRaw, setSignedRaw] = useState(false);

  /* Hydrate from localStorage after mount (SSR-safe; intentional setState) */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as Todo[]) : null;
      setTodos(parsed && Array.isArray(parsed) && parsed.length ? parsed : SEED);
    } catch {
      setTodos(SEED);
    }
    setShiftState(window.localStorage.getItem(SHIFT_KEY) === 'PM' ? 'PM' : 'AM');
    setEmployeeState(window.localStorage.getItem(EMP_KEY) ?? '');
    setSignedRaw(window.localStorage.getItem(SIGN_KEY) === '1');
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(KEY, JSON.stringify(todos));
  }, [todos, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(SHIFT_KEY, shift);
  }, [shift, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(EMP_KEY, employee);
  }, [employee, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(SIGN_KEY, signedRaw ? '1' : '0');
  }, [signedRaw, hydrated]);

  /* sign-off is DERIVED: any reopened task instantly voids it — no sync effect needed */
  const signed = hydrated && todos.length > 0 && signedRaw && todos.every((t) => t.done);

  const add = useCallback(
    (text: string, pri: Priority = 'normal', section: SectionId = 'notes') => {
      const t = text.trim();
      if (!t) return;
      setTodos((prev) => [
        {
          id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          text: t,
          done: false,
          pri,
          created: Date.now(),
          section,
        },
        ...prev,
      ]);
    },
    [],
  );

  const toggle = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.done));
  }, []);

  const setShift = useCallback((s: 'AM' | 'PM') => setShiftState(s), []);
  const setEmployee = useCallback((name: string) => setEmployeeState(name), []);
  const signOff = useCallback(() => setSignedRaw(true), []);

  return (
    <Ctx.Provider
      value={{
        todos,
        add,
        toggle,
        remove,
        clearDone,
        filter,
        setFilter,
        shift,
        setShift,
        employee,
        setEmployee,
        signed,
        signOff,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTodos() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTodos must be used inside TodoProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Animated checkbox                                                   */
/* ------------------------------------------------------------------ */

export function TaskCheck({ done, onClick }: { done: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);

  const handle = () => {
    if (ref.current && !done) {
      gsap.fromTo(
        ref.current,
        { scale: 0.7 },
        { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.5)' },
      );
    }
    onClick();
  };

  return (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? 'Mark as open' : 'Mark as done'}
      onClick={handle}
      className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border transition-colors"
      style={{
        background: done ? 'var(--bk-check-bg)' : 'transparent',
        borderColor: done ? 'var(--bk-check-bg)' : 'var(--bk-line)',
        color: 'var(--bk-on-accent)',
      }}
    >
      {done && <CheckIcon className="h-3 w-3" />}
    </button>
  );
}

const PRI_COLOR: Record<Priority, string> = {
  low: 'var(--bk-accent-3)',
  normal: 'var(--bk-accent-2)',
  high: 'var(--bk-accent)',
};

/* ------------------------------------------------------------------ */
/* Task row with enter/exit GSAP animations                            */
/* ------------------------------------------------------------------ */

function TaskRow({
  todo,
  onToggle,
  onRemove,
}: {
  todo: Todo;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: -14, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' },
    );
  }, [todo.id]);

  const handleRemove = () => {
    const el = ref.current;
    if (!el) return onRemove();
    gsap.to(el, {
      opacity: 0,
      x: 48,
      height: 0,
      marginTop: 0,
      paddingBottom: 0,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: onRemove,
    });
  };

  return (
    <div
      ref={ref}
      className="group flex items-start gap-3 overflow-hidden px-2 py-2.5 rounded-xl transition-colors"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bk-chip)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="pt-0.5">
        <TaskCheck done={todo.done} onClick={onToggle} />
      </div>
      <span
        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: PRI_COLOR[todo.pri] }}
        title={`${todo.pri} priority`}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-sm font-medium"
          style={{
            color: todo.done ? 'var(--bk-text-3)' : 'var(--bk-text)',
            textDecoration: todo.done ? 'line-through' : 'none',
            transition: 'color .25s ease',
          }}
        >
          {todo.text}
        </span>
        {todo.note && (
          <span
            className="mt-0.5 block text-[11px] leading-snug line-clamp-2"
            style={{ color: 'var(--bk-text-3)' }}
            title={todo.note}
          >
            {todo.note}
          </span>
        )}
      </span>
      <button
        type="button"
        aria-label={`Delete task: ${todo.text}`}
        onClick={handleRemove}
        className="bk-icon-btn mt-1 h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TodoBoard — the HERO functional to-do card                          */
/* ------------------------------------------------------------------ */

export function TodoBoard() {
  const {
    todos,
    add,
    toggle,
    remove,
    clearDone,
    filter,
    setFilter,
    shift,
    setShift,
    employee,
    setEmployee,
    signed,
    signOff,
  } = useTodos();
  const [draft, setDraft] = useState('');
  const [pri, setPri] = useState<Priority>('normal');
  const listRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLButtonElement>(null);

  const total = todos.length;
  const done = todos.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  const shown = todos.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done,
  );

  /* animate progress bar */
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${pct}%`,
        duration: 0.7,
        ease: 'power3.out',
      });
    }
  }, [pct]);

  /* manager sign-off stamp animation */
  useEffect(() => {
    if (signed && signRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(
        signRef.current,
        { scale: 1.5, rotate: -6, opacity: 0.4 },
        { scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: 'back.out(2.2)' },
      );
    }
  }, [signed]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim()) return;
    add(draft, pri); // custom entries land in the Shift Notes & Green Shield log
    setDraft('');
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <article
      className="bento-card bento-card-functional md:col-span-2"
      data-testid="todo-board"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="relative z-[2] flex flex-col">
        {/* header — Daily Maintenance Workflow */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--bk-text-3)' }}>
              {today} · Shift {shift}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--bk-text)' }}>
              Daily Maintenance Workflow
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--bk-text-3)' }}>
              Standard Operating Procedure &amp; Shift Checklist
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--bk-text)' }}>
              {pct}
              <span className="text-base font-semibold" style={{ color: 'var(--bk-text-3)' }}>
                %
              </span>
            </p>
            <p className="text-xs" style={{ color: 'var(--bk-text-3)' }}>
              {done} of {total} done
            </p>
          </div>
        </div>

        {/* shift register bar — mirrors the paper header fields */}
        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-3 py-2.5 text-xs"
          style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border-soft)' }}
        >
          {/* AM / PM toggle */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Shift">
            <span style={{ color: 'var(--bk-text-3)' }} className="font-semibold uppercase tracking-wider">
              Shift
            </span>
            {(['AM', 'PM'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShift(s)}
                aria-pressed={shift === s}
                className="rounded-full px-2.5 py-1 text-[11px] font-bold transition-all"
                style={{
                  background: shift === s ? 'var(--bk-check-bg)' : 'transparent',
                  color: shift === s ? 'var(--bk-on-accent)' : 'var(--bk-text-3)',
                  border: `1px solid ${shift === s ? 'var(--bk-check-bg)' : 'var(--bk-border)'}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* employee name */}
          <div className="flex min-w-[150px] flex-1 items-center gap-2">
            <span style={{ color: 'var(--bk-text-3)' }} className="font-semibold uppercase tracking-wider">
              Employee
            </span>
            <input
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              placeholder="Your name…"
              aria-label="Employee name"
              maxLength={40}
              className="h-7 min-w-0 flex-1 rounded-lg px-2 text-xs outline-none"
              style={{
                background: 'var(--bk-input-bg)',
                border: '1px solid var(--bk-border)',
                color: 'var(--bk-text)',
              }}
            />
          </div>

          {/* manager sign-off — unlocked only at 100% */}
          <button
            ref={signRef}
            type="button"
            onClick={signOff}
            disabled={!allDone || signed}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all"
            style={{
              background: signed
                ? 'color-mix(in srgb, var(--bk-accent-3) 18%, transparent)'
                : allDone
                  ? 'var(--bk-check-bg)'
                  : 'transparent',
              color: signed ? 'var(--bk-accent-3)' : allDone ? 'var(--bk-on-accent)' : 'var(--bk-text-3)',
              border: `1px solid ${signed ? 'color-mix(in srgb, var(--bk-accent-3) 45%, transparent)' : allDone ? 'var(--bk-check-bg)' : 'var(--bk-border)'}`,
              cursor: !allDone || signed ? 'default' : 'pointer',
            }}
            aria-label={signed ? 'Shift signed off by manager' : allDone ? 'Request manager sign-off' : 'Manager sign-off pending — complete all tasks'}
            title={allDone ? 'All tasks complete — ready for manager sign-off' : 'Complete every task to unlock sign-off'}
          >
            {signed ? (
              <>
                <CheckIcon className="h-2.5 w-2.5" /> Manager signed
              </>
            ) : allDone ? (
              'Manager sign-off'
            ) : (
              'Sign-off pending'
            )}
          </button>
        </div>

        {/* progress bar */}
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--bk-chip)' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Task completion"
        >
          <div
            ref={progressRef}
            className="h-full rounded-full"
            style={{
              width: 0,
              background: 'linear-gradient(90deg, var(--bk-ring-1), var(--bk-ring-2), var(--bk-ring-3))',
            }}
          />
        </div>

        {/* add form */}
        <form onSubmit={submit} className="mt-3 flex items-center gap-2" aria-label="Add a shift note or Green Shield task">
          <div className="relative flex-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Log a shift note / Green Shield task…"
              aria-label="New task text"
              maxLength={120}
              className="bk-input h-11 w-full pl-4 pr-24 text-sm"
            />
            {/* priority picker */}
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1" role="group" aria-label="Priority">
              {(['low', 'normal', 'high'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  title={`${p} priority`}
                  aria-label={`${p} priority`}
                  aria-pressed={pri === p}
                  onClick={() => setPri(p)}
                  className="h-3.5 w-3.5 rounded-full transition-transform hover:scale-125"
                  style={{
                    background: PRI_COLOR[p],
                    opacity: pri === p ? 1 : 0.32,
                    outline: pri === p ? '2px solid var(--bk-border)' : 'none',
                    outlineOffset: 1,
                  }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-base font-bold transition-transform active:scale-95"
            style={{
              background: 'var(--bk-check-bg)',
              color: 'var(--bk-on-accent)',
            }}
            aria-label="Add task"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </form>

        {/* filter tabs */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full p-1" style={{ background: 'var(--bk-chip)' }} role="tablist" aria-label="Filter tasks">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.id)}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: active ? 'var(--bk-panel)' : 'transparent',
                    color: active ? 'var(--bk-text)' : 'var(--bk-text-3)',
                    boxShadow: active ? 'var(--bk-inset-soft)' : 'none',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          {done > 0 && (
            <button
              type="button"
              onClick={clearDone}
              className="text-xs font-semibold transition-colors"
              style={{ color: 'var(--bk-text-3)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bk-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bk-text-3)')}
            >
              Clear done ({done})
            </button>
          )}
        </div>

        {/* task list — grouped by workflow phase */}
        <div
          ref={listRef}
          className="bk-scroll mt-2 max-h-[460px] min-h-[120px] overflow-y-auto pr-1"
          data-testid="todo-list"
          role="list"
          aria-label="Task list"
        >
          {shown.length === 0 ? (
            <div className="flex h-[120px] flex-col items-center justify-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: 'var(--bk-chip)' }}>
                <CheckIcon className="h-4 w-4" />
              </span>
              <p className="text-sm" style={{ color: 'var(--bk-text-3)' }}>
                {filter === 'done' ? 'Nothing done yet.' : filter === 'open' ? 'All clear — enjoy!' : 'No tasks yet.'}
              </p>
            </div>
          ) : (
            SECTIONS.map((s) => {
              const items = shown.filter((t) => t.section === s.id);
              if (!items.length) return null;
              const sTotal = todos.filter((t) => t.section === s.id).length;
              const sDone = todos.filter((t) => t.section === s.id && t.done).length;
              const sComplete = sTotal > 0 && sDone === sTotal;
              return (
                <div key={s.id} className="mt-2" role="group" aria-label={`${s.name} section`}>
                  {/* phase header */}
                  <div className="flex items-center gap-2 px-2 pb-1 pt-2">
                    <span
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-black"
                      style={{
                        background: sComplete ? 'var(--bk-check-bg)' : 'var(--bk-chip)',
                        color: sComplete ? 'var(--bk-on-accent)' : 'var(--bk-text-2)',
                        border: '1px solid var(--bk-border-soft)',
                      }}
                      aria-hidden
                    >
                      {s.num}
                    </span>
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: sComplete ? 'var(--bk-accent-3)' : 'var(--bk-text-2)' }}
                    >
                      {s.name}
                    </span>
                    <span
                      className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                      style={{
                        background: sComplete ? 'color-mix(in srgb, var(--bk-accent-3) 15%, transparent)' : 'var(--bk-chip)',
                        color: sComplete ? 'var(--bk-accent-3)' : 'var(--bk-text-3)',
                      }}
                    >
                      {sDone}/{sTotal}
                    </span>
                  </div>
                  {items.map((t) => (
                    <div role="listitem" key={t.id}>
                      <TaskRow todo={t} onToggle={() => toggle(t.id)} onRemove={() => remove(t.id)} />
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* TodoUpNext — compact companion card (Extensive-Layouts style)       */
/* ------------------------------------------------------------------ */

export function TodoUpNext() {
  const { todos, toggle } = useTodos();
  const open = todos.filter((t) => !t.done).slice(0, 4);

  return (
    <div className="absolute inset-0 flex flex-col p-5">
      <WindowDots />
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--bk-text-3)' }}>
          Up next
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-accent)' }}
        >
          {todos.filter((t) => !t.done).length} open
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {open.length === 0 && (
          <p className="px-1 text-sm" style={{ color: 'var(--bk-text-3)' }}>
            Everything is done. Nice.
          </p>
        )}
        {open.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            className="flex items-center gap-3 rounded-xl px-1 py-1.5 text-left transition-colors hover:opacity-90"
          >
            <span
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full border"
              style={{ borderColor: 'var(--bk-line)' }}
              aria-hidden
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRI_COLOR[t.pri] }} />
            </span>
            <span className="truncate text-sm" style={{ color: 'var(--bk-text-2)' }}>
              {t.text}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 pt-4 px-1">
        <Line w="40%" tone="soft" />
        <Line w="18%" tone="soft" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FocusTimer card — mini pomodoro with waveform (Universal Feature    */
/* Stack: play/pause + stream/library select + waveform)               */
/* ------------------------------------------------------------------ */

export function Waveform() {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [playing, setPlaying] = useState(false);
  const [source, setSource] = useState<'stream' | 'library'>('stream');

  const BARS = 36;

  useEffect(() => {
    tlRef.current?.kill();
    const bars = barsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!playing) {
      gsap.to(bars, { scaleY: 0.25, duration: 0.5, ease: 'power2.out' });
      return;
    }
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    bars.forEach((bar, i) => {
      tl.to(
        bar,
        {
          scaleY: 0.2 + Math.abs(Math.sin(i * 0.55)) * 0.8,
          duration: 0.28 + (i % 5) * 0.06,
          ease: 'sine.inOut',
        },
        (i % 9) * 0.03,
      );
    });
    tlRef.current = tl;
    return () => {
      tl.kill();
    };
  }, [playing]);

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-5">
      {/* viewport */}
      <div
        className="flex flex-1 items-end justify-center gap-[3px] pb-2"
        style={{ minHeight: 96 }}
        aria-hidden
      >
        {Array.from({ length: BARS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="w-[4px] origin-bottom rounded-full"
            style={{
              height: '100%',
              transform: 'scaleY(0.25)',
              background:
                i % 7 === 3
                  ? 'var(--bk-accent)'
                  : 'linear-gradient(to top, color-mix(in srgb, var(--bk-accent) 55%, transparent), var(--bk-accent-2))',
            }}
          />
        ))}
      </div>

      {/* controls — Universal Feature Stack */}
      <div
        className="flex items-center justify-between gap-2 rounded-xl p-2"
        style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border-soft)' }}
      >
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
          style={{
            background: 'color-mix(in srgb, var(--bk-accent) 18%, transparent)',
            border: '1px solid color-mix(in srgb, var(--bk-accent) 40%, transparent)',
            color: 'var(--bk-accent)',
          }}
          aria-pressed={playing}
          aria-label={playing ? 'Pause voice memo' : 'Play voice memo'}
        >
          {playing ? (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden>
              <rect x="2" y="1.5" width="3" height="9" rx="1" />
              <rect x="7" y="1.5" width="3" height="9" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden>
              <path d="M3 1.8 L10 6 L3 10.2 Z" />
            </svg>
          )}
          {playing ? 'Pause' : source === 'stream' ? 'Stream Voice' : 'Play Recorded'}
        </button>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as 'stream' | 'library')}
          className="rounded-lg px-2 py-1.5 text-xs outline-none"
          style={{
            background: 'var(--bk-panel-2)',
            color: 'var(--bk-text-2)',
            border: '1px solid var(--bk-border-soft)',
          }}
          aria-label="Audio source"
        >
          <option value="stream">Live Stream</option>
          <option value="library">Audio Library</option>
        </select>
      </div>
    </div>
  );
}
