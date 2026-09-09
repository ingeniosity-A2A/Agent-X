'use client';

import React, { useState } from 'react';
import { Wrench, Clock, Send } from 'lucide-react';
import ESAJobTracker from './ESAJobTracker';
import ESARequestForm from './ESARequestForm';

/* ═══════════════════════════════════════════════════════════
   ESA Maintenance Card — renders inside the ESA framework
   as a card-mode tab alongside inventory, part card, etc.

   Note: the 3D holographic floor plan is NOT an Ava component.
   It lives in the Agent-X repo (esa-exoskeleton/public/components/
   ESA.HoloFloor.js) as part of the Workorder card's Floor tab.

   Sections:
     1. Job Tracker (live progress + checklist)
     2. New Request form (with drag-drop upload)
   ═══════════════════════════════════════════════════════════ */

export default function ESAMaintenanceCard() {
  const [section, setSection] = useState<'tracker' | 'request'>('tracker');

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full max-w-[420px] mx-auto">
      {/* Section toggle */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(24,24,27,0.8)', border: '1px solid rgba(63,63,70,0.3)' }}>
        {([['tracker', 'Job Tracker', Wrench], ['request', 'New Request', Send]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: section === key ? 'rgba(245,230,66,0.12)' : 'transparent',
              border: section === key ? '1px solid rgba(245,230,66,0.3)' : '1px solid transparent',
              color: section === key ? '#f5e642' : '#71717a',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {section === 'tracker' && (
        <ESAJobTracker
          onStepToggle={(stepId, done) => {
            console.log('[ESA] Step toggled:', stepId, done);
          }}
          onComplete={() => {
            setSection('request');
          }}
        />
      )}

      {section === 'request' && (
        <div
          className="w-full rounded-2xl p-4 sm:p-5"
          style={{
            background: 'rgba(20,20,20,0.95)',
            border: '1px solid rgba(63,63,70,0.3)',
            boxShadow: '0 14px 30px rgba(0,0,0,0.4)',
          }}
        >
          <ESARequestForm
            onSubmit={(req) => {
              console.log('[ESA] Request submitted:', JSON.stringify(req));
              // POST to /api/maintenance/request could be added here
            }}
          />
        </div>
      )}
    </div>
  );
}
