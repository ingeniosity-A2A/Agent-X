'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';

/* Product Lens — Bento upgrade of ProductLensPanel (v6) */
export function ProductLensDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capture, setCapture] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setError('Camera permission denied or unavailable in this browser context.');
    }
  };

  const takeShot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    setCapture(c.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="absolute inset-0 flex gap-3 p-4">
      <div className="relative flex min-w-0 flex-1 flex-col gap-2">
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl"
          style={{ background: 'var(--bk-panel-2)', border: '1px solid var(--bk-viewport-border)', boxShadow: 'var(--bk-inset-soft)' }}
          data-testid="lens-viewport"
        >
          {streaming ? (
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="p-4 text-center text-xs leading-relaxed" style={{ color: 'var(--bk-text-3)' }} data-testid="lens-status">
              {error || 'Camera not started.'}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          <div className="pointer-events-none absolute inset-3" aria-hidden>
            <span className="absolute left-0 top-0 h-3 w-3 border-l border-t" style={{ borderColor: 'var(--bk-accent)' }} />
            <span className="absolute right-0 top-0 h-3 w-3 border-r border-t" style={{ borderColor: 'var(--bk-accent)' }} />
            <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l" style={{ borderColor: 'var(--bk-accent)' }} />
            <span className="absolute bottom-0 right-0 h-3 w-3 border-b border-r" style={{ borderColor: 'var(--bk-accent)' }} />
          </div>
        </div>
        <button
          type="button"
          onClick={streaming ? takeShot : startCamera}
          data-testid="lens-action"
          className="gradient-mask-btn flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, var(--bk-accent), var(--bk-accent-2))',
            color: 'var(--bk-on-accent)',
          }}
        >
          <Camera size={13} strokeWidth={1.9} aria-hidden />
          {streaming ? 'Capture' : 'Start camera'}
        </button>
      </div>
      <div
        className="flex w-[42%] shrink-0 flex-col rounded-xl p-3"
        style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
      >
        <div className="text-xs font-semibold" style={{ color: 'var(--bk-text)' }}>
          Identification
        </div>
        <div
          className="mt-2 flex flex-1 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: 'var(--bk-panel-2)', border: '1px solid var(--bk-border-soft)' }}
        >
          {capture ? (
            <img src={capture} alt="Captured product" className="h-full w-full object-cover" data-testid="lens-capture" />
          ) : (
            <span className="p-2 text-center text-[10px] leading-snug" style={{ color: 'var(--bk-text-3)' }}>
              Capture a product to identify it.
            </span>
          )}
        </div>
        <div className="mt-2 space-y-1.5">
          <LensField label="SKU" value="—" />
          <LensField label="Product" value={capture ? 'Pending match' : '—'} />
          <LensField label="Qty" value="?" />
        </div>
      </div>
    </div>
  );
}

function LensField({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[10px]"
      style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border-soft)' }}
    >
      <span style={{ color: 'var(--bk-text-3)' }}>{label}</span>
      <span className="font-mono font-semibold" style={{ color: 'var(--bk-text-2)' }}>
        {value}
      </span>
    </div>
  );
}
