'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useBentoReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const cards = ref.current.querySelectorAll<HTMLElement>('.bento-card');
    if (!cards.length) return;

    if (prefersReducedMotion()) {
      gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(cards, { opacity: 0, y: 60, scale: 0.95 });
      ScrollTrigger.batch(cards, {
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
            stagger: { amount: 0.55, from: 'start', grid: 'auto' },
            overwrite: true,
          }),
        start: 'top 88%',
        once: true,
      });
    }, ref);

    const relayout = () => ScrollTrigger.refresh();
    window.addEventListener('bento:layout-done', relayout);
    const t = window.setTimeout(relayout, 600);

    return () => {
      window.removeEventListener('bento:layout-done', relayout);
      window.clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return ref;
}

export function useTilt3D(intensity = 10) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardRef.current || reduced.current || e.pointerType === 'touch') return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -intensity;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * intensity;
      gsap.to(cardRef.current, {
        rotateX,
        rotateY,
        transformPerspective: 900,
        duration: 0.4,
        ease: 'power2.out',
      });
    },
    [intensity],
  );

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.5)',
    });
  }, []);

  return { cardRef, handleMouseMove, handleMouseLeave };
}

export function useCountUp(target: number, decimals = 0, duration = 1.4) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: 0 };
    if (prefersReducedMotion()) {
      el.textContent = target.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: target,
        duration,
        ease: 'power2.out',
        snap: decimals === 0 ? { v: 1 } : undefined,
        onUpdate: () => {
          el.textContent = obj.v.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });
    return () => ctx.revert();
  }, [target, decimals, duration]);

  return ref;
}

interface BentoCardProps {
  title: string;
  desc: string;
  children: React.ReactNode;
  span?: string;
  className?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  onButtonClick?: () => void;
}

export function BentoCard({
  title,
  desc,
  children,
  span = '',
  className = '',
  buttonLabel = 'Discover',
  buttonClassName = '',
  onButtonClick,
}: BentoCardProps) {
  const { cardRef, handleMouseMove, handleMouseLeave } = useTilt3D(7);

  return (
    <article
      ref={cardRef}
      className={`bento-card ${span} ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bento-demo">{children}</div>
      <div className="bento-text">
        <h3 className="bento-title">{title}</h3>
        <p className="bento-desc">{desc}</p>
        <button className={`bk-btn ${buttonClassName}`} onClick={onButtonClick} type="button">
          {buttonLabel}
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M2 10 L10 2 M4 2 h6 v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export function WindowDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 pt-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 rounded-full" style={{ background: 'var(--bk-line)' }} />
      ))}
    </div>
  );
}

export function Line({
  w,
  h = 6,
  tone = 'normal',
  className = '',
}: {
  w: string | number;
  h?: number;
  tone?: 'normal' | 'soft';
  className?: string;
}) {
  return (
    <span
      className={`bk-line ${className}`}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: h,
        opacity: tone === 'soft' ? 0.45 : 1,
      }}
      aria-hidden
    />
  );
}

export function IconBtn({
  size = 28,
  children,
  className = '',
  onClick,
  title,
}: {
  size?: number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`bk-icon-btn ${className}`}
      style={{ width: size, height: size, flex: `0 0 ${size}px` }}
    >
      {children}
    </button>
  );
}

export function PlusIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 1.5v9M1.5 6h9" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 6.5 4.8 9 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
