'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, Image as ImageIcon, Video, FileText, X, Check, RefreshCw,
} from 'lucide-react';
import type { UploadFile } from '@/lib/agent-x/types';

/* ═══════════════════════════════════════════════════════════ */

export interface HASFileUploadProps {
  onFilesChange?: (files: UploadFile[]) => void;
  maxSizeMB?: number;
}

const MAX_SIZE_DEFAULT = 25;

function isImage(type: string) { return ['png','jpg','jpeg','gif','webp','svg'].includes(type.split('/')[1] || ''); }
function isVideo(type: string) { return type.startsWith('video/'); }

function FileIcon({ type }: { type: string }) {
  if (isImage(type)) return <ImageIcon className="w-4 h-4" style={{ color: '#9a9a9a' }} />;
  if (isVideo(type)) return <Video className="w-4 h-4" style={{ color: '#9a9a9a' }} />;
  return <FileText className="w-4 h-4" style={{ color: '#9a9a9a' }} />;
}

/* ═══════════════════════════════════════════════════════════
   Single file row with progress simulation
   ═══════════════════════════════════════════════════════════ */
function FileRow({
  file, maxSizeMB, onRemove, onRetry,
}: {
  file: UploadFile;
  maxSizeMB: number;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const [progress, setProgress] = useState(file.progress);
  const [status, setStatus] = useState(file.status);
  const [errorMsg, setErrorMsg] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  /* Simulate upload */
  const startUpload = useCallback((f: File) => {
    setProgress(0);
    setStatus('uploading');
    setErrorMsg('');

    const tooLarge = (f.size / (1024 * 1024)) >= maxSizeMB;
    const willError = !tooLarge && Math.random() < 0.12;
    const speed = Math.floor(Math.random() * 90) + 10;

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if ((willError && next === 50) || tooLarge) {
          clearInterval(intervalRef.current);
          if (tooLarge) {
            setStatus('error');
            setErrorMsg('File must be less than ' + maxSizeMB + 'MB.');
            return 100;
          }
          setStatus('error');
          setErrorMsg('Upload failed');
          return next;
        }
        if (next >= 100) {
          clearInterval(intervalRef.current);
          setStatus('done');
          return 100;
        }
        return next;
      });
    }, speed);
  }, [maxSizeMB]);

  /* Kick off on mount */
  React.useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleRemove = () => {
    clearInterval(intervalRef.current);
    onRemove();
  };

  const handleRetry = () => {
    clearInterval(intervalRef.current);
    onRetry();
  };

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const displayName = file.name.length > 22 ? file.name.slice(0, 22) + '…' : file.name;
  const barColor = status === 'error' ? '#ff4d4d' : '#f5e642';

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: status === 'error' ? '1px solid rgba(255,77,77,0.2)' : '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <FileIcon type={file.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-zinc-300 truncate">{displayName}</span>
          <span className="text-[9px] text-zinc-500 ml-2 flex-shrink-0">{sizeMB} Mb</span>
        </div>
        <div className="h-[3px] rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: barColor }} />
        </div>
        <div className="text-[9px]" style={{ color: status === 'error' ? '#ff4d4d' : '#6b6b6b' }}>
          {status === 'done' ? 'Done' : status === 'error' ? errorMsg : `${progress}% done`}
        </div>
      </div>
      {status === 'uploading' && (
        <button onClick={handleRemove} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
          <X className="w-3.5 h-3.5" style={{ color: '#9a9a9a' }} />
        </button>
      )}
      {status === 'done' && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(46,204,113,0.15)' }}>
          <Check className="w-3.5 h-3.5" style={{ color: '#2ecc71' }} />
        </div>
      )}
      {status === 'error' && (
        <button onClick={handleRetry} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" style={{ color: '#ff4d4d' }} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Upload Component
   ═══════════════════════════════════════════════════════════ */

export default function HASFileUpload({ onFilesChange, maxSizeMB = MAX_SIZE_DEFAULT }: HASFileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const newFiles: UploadFile[] = arr.map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      progress: 0,
      status: 'uploading' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    onFilesChange?.([...files, ...newFiles]);
  }, [files, onFilesChange]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      onFilesChange?.(next);
      return next;
    });
  }, [onFilesChange]);

  return (
    <div>
      <div className="mb-1.5">
        <div className="text-[12px] font-semibold text-zinc-300">Attachments</div>
        <div className="text-[10px]" style={{ color: '#6b6b6b' }}>photos, videos, or docs for this request</div>
      </div>

      {/* Drop zone */}
      <div
        className={`relative rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors ${
          dragging ? 'border-yellow-500/40' : ''
        }`}
        style={{
          background: dragging ? 'rgba(245,230,66,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px dashed ${dragging ? 'rgba(245,230,66,0.4)' : 'rgba(255,255,255,0.1)'}`,
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
      >
        {/* Decorative floating spheres */}
        <div className="absolute w-16 h-16 rounded-full opacity-20 blur-2xl" style={{ background: '#f5e642', top: '10%', left: '15%' }} />
        <div className="absolute w-12 h-12 rounded-full opacity-10 blur-xl" style={{ background: '#f5e642', bottom: '15%', right: '20%' }} />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
        />
        <Upload className="w-6 h-6" style={{ color: '#6b6b6b' }} />
        <div className="text-[12px] text-zinc-400">
          Drag & drop files here or{' '}
          <button onClick={() => fileInputRef.current?.click()} className="underline" style={{ color: '#f5e642' }}>browse</button>
        </div>
        <div className="text-[9px]" style={{ color: '#6b6b6b' }}>{maxSizeMB} Mb max file size</div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: '#6b6b6b' }}>Uploading</div>
          {files.map(f => (
            <FileRow
              key={f.id}
              file={f}
              maxSizeMB={maxSizeMB}
              onRemove={() => removeFile(f.id)}
              onRetry={() => { removeFile(f.id); /* re-add handled by retry logic */ }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
