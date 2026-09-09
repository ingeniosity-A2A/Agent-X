'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MoreVertical, Flag, Zap, FileText, Pencil,
  ChevronUp, Play, Pause, SkipForward, Check,
} from 'lucide-react';
import type { JobStep, JobTrackerState } from '@/lib/agent-x/types';

/* ═══════════════════════════════════════════════════════════
   Constants & Defaults
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_STEPS: JobStep[] = [
  { id: 's1', label: 'Remove door', qty: 1, estimatedMinutes: 10, done: true },
  { id: 's2', label: 'Swap hinge', qty: 2, estimatedMinutes: 10, done: true },
  { id: 's3', label: 'Reattach + test', qty: 1, estimatedMinutes: 10, done: false },
];

const DEFAULT_JOB: JobTrackerState = {
  jobId: 'HAS-4821',
  title: 'Kitchen Repair',
  subtitle: 'Cabinet Hinge · Hardware',
  steps: DEFAULT_STEPS,
  elapsed: 69,
  paused: false,
  expectedPace: '30',
};

const EST_OPTIONS = [5, 10, 15];

const STATUS_CONFIG = {
  ahead:  { color: '#f5e642', label: 'ahead' },
  average: { color: '#ff8c00', label: 'on pace' },
  behind: { color: '#ff4d4d', label: 'behind' },
} as const;

type PaceState = keyof typeof STATUS_CONFIG;

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

function ProgressBar({ pct, expected }: { pct: number; expected: number }) {
  const pace: PaceState = pct > expected + 5 ? 'ahead' : pct < expected - 5 ? 'behind' : 'average';
  const cfg = STATUS_CONFIG[pace];
  const diff = Math.abs(pct - expected);

  return (
    <div className="mb-4">
      <div className="text-[11px] mb-2" style={{ color: '#9a9a9a' }}>
        You are <strong style={{ color: '#f2f2f2' }}>{pace === 'ahead' ? `${diff}% ${cfg.label}` : pace === 'behind' ? `${diff}% ${cfg.label}` : cfg.label}</strong> of the estimated pace.
      </div>
      <div className="relative h-[22px] rounded-[11px] overflow-visible" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {/* Striped expected-pace band */}
        <div
          className="absolute top-0 h-full overflow-hidden"
          style={{
            left: `${Math.min(pct, expected)}%`,
            width: `${diff}%`,
            animation: 'avgSlide 12s linear infinite',
          }}
        >
          <div
            className="w-[600%] h-full"
            style={{
              background: `repeating-linear-gradient(-75deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 6px, transparent 6px, transparent 12px)`,
            }}
          />
        </div>
        {/* Raised fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-l-[11px] transition-all duration-1000 ease-in-out"
          style={{ width: `${pct}%`, background: cfg.color }}
        />
        {/* Knob marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[6px] h-[30px] rounded-[6px] transition-all duration-1000 ease-in-out"
          style={{ left: `${pct}%`, background: '#fff', boxShadow: '0 0 6px rgba(0,0,0,0.4)' }}
        />
      </div>
    </div>
  );
}

function CheckCircle({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${
        done ? 'scale-100' : 'scale-95'
      }`}
      style={{
        border: done ? 'none' : '2px solid rgba(255,255,255,0.15)',
        background: done ? '#f5e642' : 'transparent',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {done && <Check className="w-4 h-4" style={{ color: '#161200', strokeWidth: 3 }} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

export interface HASJobTrackerProps {
  job?: Partial<JobTrackerState>;
  onStepToggle?: (stepId: string, done: boolean) => void;
  onComplete?: () => void;
}

export default function HASJobTracker({ job: jobProp, onStepToggle, onComplete }: HASJobTrackerProps) {
  const [job, setJob] = useState<JobTrackerState>(() => ({ ...DEFAULT_JOB, ...jobProp }));
  const [seconds, setSeconds] = useState(jobProp?.elapsed ?? 69);
  const [paused, setPaused] = useState(jobProp?.paused ?? false);
  const [note, setNote] = useState('');
  const [flagged, setFlagged] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const pct = Math.round((job.steps.filter(s => s.done).length / job.steps.length) * 100);
  const expected = parseInt(job.expectedPace, 10) || 30;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* Timer tick */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!paused) setSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  /* Step toggle handler */
  const toggleStep = useCallback((stepId: string) => {
    setJob(prev => {
      const steps = prev.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s);
      const allDone = steps.every(s => s.done);
      if (allDone) onComplete?.();
      return { ...prev, steps };
    });
  }, [onComplete]);

  return (
    <>
      {/* Inject keyframe for striped band animation */}
      <style>{`@keyframes avgSlide{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>

      <div
        className="rounded-[22px] p-4 sm:p-5"
        style={{
          background: 'rgba(20,20,20,0.95)',
          border: '1px solid rgba(63,63,70,0.3)',
          boxShadow: '0 14px 30px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <MoreVertical className="w-4 h-4" style={{ color: '#9a9a9a' }} />
            </div>
            <div>
              <div className="text-[17px] font-extrabold text-zinc-100">{job.title}</div>
              <div className="text-[11px]" style={{ color: '#6b6b6b' }}>{fmt(seconds)} · {pct}%</div>
            </div>
          </div>
          <div
            onClick={() => setFlagged(f => !f)}
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all ${flagged ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
            style={{ background: '#f5e642' }}
          >
            <Flag className="w-4 h-4" style={{ color: '#161200', strokeWidth: 2.2 }} />
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar pct={pct} expected={expected} />

        {/* Current pill */}
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="w-3.5 h-3.5" style={{ color: '#f5e642' }} />
          <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#f5e642' }}>Current</span>
        </div>

        {/* Task card */}
        <div
          className="rounded-2xl p-3 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0a0a0a' }}>
              <FileText className="w-5 h-5" style={{ color: '#6b6b6b', strokeWidth: 1.8 }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-zinc-200 truncate">Replace Cabinet Hinge</div>
              <div className="text-[11px]" style={{ color: '#6b6b6b' }}>Kitchen · Hardware, Cabinetry</div>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <MoreVertical className="w-3.5 h-3.5" style={{ color: '#9a9a9a' }} />
            </div>
          </div>

          {/* Note input */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Pencil className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6b6b6b' }} />
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Door closed flush after adjustment — hinge was…"
              className="bg-transparent outline-none text-[12px] text-zinc-300 placeholder:text-zinc-600 w-full"
            />
          </div>
        </div>

        {/* Checklist table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-4 gap-1 px-3 py-2 text-[9px] font-mono tracking-wider uppercase" style={{ color: '#6b6b6b', background: 'rgba(255,255,255,0.02)' }}>
            <div>Step</div><div>Qty</div><div>Est.</div><div className="text-center">Done</div>
          </div>
          {job.steps.map((step, i) => (
            <div
              key={step.id}
              className="grid grid-cols-4 gap-1 px-3 py-2.5 items-center"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: step.done ? 'rgba(245,230,66,0.15)' : 'rgba(255,255,255,0.06)', color: step.done ? '#f5e642' : '#6b6b6b' }}
                >{i + 1}</span>
                <span className="text-[12px] text-zinc-300 truncate">{step.label}</span>
              </div>
              <input
                type="number"
                defaultValue={step.qty}
                className="w-12 bg-transparent text-[11px] text-zinc-400 outline-none rounded-md px-1 py-0.5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <select
                defaultValue={`${step.estimatedMinutes} min`}
                className="bg-transparent text-[11px] text-zinc-400 outline-none rounded-md px-1 py-0.5 cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {EST_OPTIONS.map(m => <option key={m} value={`${m} min`}>{m} min</option>)}
              </select>
              <div className="flex justify-center">
                <CheckCircle done={step.done} onClick={() => {
                  toggleStep(step.id);
                  onStepToggle?.(step.id, !step.done);
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Sticky bottom bar */}
        <div
          className="flex items-center justify-between mt-4 -mx-1 -mb-1 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(24,24,27,0.9)', border: '1px solid rgba(63,63,70,0.3)' }}
        >
          <button
            onClick={() => setSeconds(0)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#9a9a9a' }}
          >
            Skip Step
          </button>
          <div className="text-[15px] font-mono font-bold text-zinc-200">{fmt(seconds)}</div>
          <div className="flex items-center gap-1">
            <div
              onClick={() => setPaused(p => !p)}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {paused
                ? <Play className="w-4 h-4 text-zinc-200" style={{ fill: '#f2f2f2' }} />
                : <Pause className="w-4 h-4 text-zinc-200" />
              }
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
