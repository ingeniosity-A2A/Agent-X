'use client';

import React, { useState, useMemo } from 'react';
import {
  Phone, Camera, MessageSquare, Mic, Send, Check,
} from 'lucide-react';
import ESAFileUpload from './ESAFileUpload';
import type { MaintenanceRequest, UploadFile } from '@/lib/agent-x/types';

/* ═══════════════════════════════════════════════════════════ */

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const CATEGORIES = ['Furniture Assembly', 'Plumbing', 'Electrical', 'HVAC', 'General Repair'];

export interface ESARequestFormProps {
  onSubmit?: (request: MaintenanceRequest) => void;
}

export default function ESARequestForm({ onSubmit }: ESARequestFormProps) {
  const requestId = useMemo(() => 'MR-' + Math.floor(100000 + Math.random() * 899999), []);
  const [submitted, setSubmitted] = useState(false);
  const [priority, setPriority] = useState<string>('medium');
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    category: CATEGORIES[0], unit: '', description: '',
  });
  const [attachments, setAttachments] = useState<UploadFile[]>([]);

  const inputCls = "w-full bg-transparent outline-none text-[12px] text-zinc-200 placeholder:text-zinc-600 rounded-xl px-3 py-2.5";
  const inputWrap = { background: 'rgba(24,24,27,0.8)', border: '1px solid rgba(63,63,70,0.5)' } as React.CSSProperties;
  const labelCls = 'text-[10px] font-mono text-zinc-500 tracking-wider uppercase mb-1';

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req: MaintenanceRequest = {
      requestId,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      category: form.category,
      unit: form.unit,
      priority,
      description: form.description,
      attachments: attachments.map(f => f.name),
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };
    onSubmit?.(req);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(46,204,113,0.12)' }}>
          <Check className="w-7 h-7" style={{ color: '#2ecc71' }} />
        </div>
        <div className="text-[14px] text-zinc-200">
          Request <span className="font-mono font-bold" style={{ color: '#f5e642' }}>{requestId}</span> submitted.
        </div>
        <div className="text-[12px]" style={{ color: '#6b6b6b' }}>A technician will follow up shortly.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Action buttons row */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {[
          { icon: Phone, label: 'Call technician' },
          { icon: Camera, label: 'Add photo' },
          { icon: MessageSquare, label: 'Message' },
          { icon: Mic, label: 'Voice note' },
          { icon: Send, label: 'Submit request' },
        ].map(a => (
          <div
            key={a.label}
            title={a.label}
            className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all ${
              a.label === 'Submit request' ? '' : 'hover:bg-white/5'
            }`}
            style={{
              background: a.label === 'Submit request'
                ? 'linear-gradient(135deg, #f5e642, #d4c729)'
                : 'rgba(255,255,255,0.04)',
              border: '1px solid ' + (a.label === 'Submit request' ? 'rgba(245,230,66,0.3)' : 'rgba(255,255,255,0.08)'),
            }}
          >
            <a.icon className="w-5 h-5" style={{ color: a.label === 'Submit request' ? '#161200' : '#9a9a9a' }} />
          </div>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-[13px] font-semibold text-zinc-300">Request Details</div>
        <div className="flex-1 border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Row 1: Name */}
        <div className="grid grid-cols-2 gap-3">
          <div><div className={labelCls}>First Name</div><div style={inputWrap}><input className={inputCls} placeholder="Henry" required value={form.firstName} onChange={set('firstName')} /></div></div>
          <div><div className={labelCls}>Last Name</div><div style={inputWrap}><input className={inputCls} placeholder="Carter" required value={form.lastName} onChange={set('lastName')} /></div></div>
        </div>
        {/* Row 2: Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div><div className={labelCls}>Phone</div><div style={inputWrap}><input type="tel" className={inputCls} placeholder="(718) 302-1546" value={form.phone} onChange={set('phone')} /></div></div>
          <div><div className={labelCls}>Email</div><div style={inputWrap}><input type="email" className={inputCls} placeholder="you@email.com" value={form.email} onChange={set('email')} /></div></div>
        </div>
        {/* Row 3: Category + Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={labelCls}>Category</div>
            <div style={inputWrap}>
              <select className={inputCls + ' cursor-pointer'} value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><div className={labelCls}>Unit / Location</div><div style={inputWrap}><input className={inputCls} placeholder="Unit 4B — Kitchen" value={form.unit} onChange={set('unit')} /></div></div>
        </div>
        {/* Row 4: Request ID + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div><div className={labelCls}>Request ID</div><div style={{ ...inputWrap, opacity: 0.5 }}><input className={inputCls} readOnly value={requestId} /></div></div>
          <div><div className={labelCls}>Date</div><div style={inputWrap}><input type="date" className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} /></div></div>
        </div>

        {/* Priority pills */}
        <div>
          <div className={labelCls}>Priority</div>
          <div className="flex gap-2 mt-1">
            {PRIORITIES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all"
                style={{
                  background: priority === p ? 'rgba(245,230,66,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${priority === p ? 'rgba(245,230,66,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: priority === p ? '#f5e642' : '#9a9a9a',
                }}
              >{p}</button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className={labelCls}>Description</div>
          <div style={inputWrap}>
            <textarea
              className={inputCls + ' min-h-[72px] resize-none'}
              placeholder="Describe the issue — e.g. cabinet hinge came loose after assembly, door won't close flush…"
              value={form.description} onChange={set('description')}
            />
          </div>
        </div>

        {/* File upload */}
        <ESAFileUpload onFilesChange={setAttachments} />

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold transition-all hover:brightness-110"
          style={{
            background: 'linear-gradient(135deg, #f5e642, #d4c729)',
            color: '#161200',
            boxShadow: '0 0 18px rgba(245,230,66,0.2)',
          }}
        >
          <Send className="w-4 h-4" style={{ color: '#161200' }} />
          Submit Maintenance Request
        </button>
      </form>
    </div>
  );
}
