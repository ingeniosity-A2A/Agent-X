---
name: bento-ui8-master-skills-set-gsap
description: Master skill set for building UI8-style Bento grid interfaces with GSAP animations. Covers neumorphism, claymorphism, glassmorphism, dark/light themes, circular gauges, waveform visualizations, 3D tilt effects, ScrollTrigger batch reveals, Flip layout transitions, and production-ready component patterns.
---

# Bento UI8 Master Skills Set — GSAP

Build premium Bento-grid interfaces in the **UI8 aesthetic** using **GSAP** for animations. This skill covers the complete visual language — neumorphism, claymorphism, glassmorphism, circular gauges, waveform visualizations — paired with production-grade GSAP scroll, hover, and layout animation patterns.

---

## 1. Visual Language & Design Tokens

### 1.1 UI8 Aesthetic Pillars

From the UI8 Bento Cards and Bento Pro design systems, the visual language is defined by:

| Pillar | Description |
|--------|-------------|
| **Soft Depth** | Neumorphic/claymorphic shadows with colored tints, not gray |
| **Generous Radius** | Cards 24–32px, buttons 16–20px, pills 999px |
| **Dark Dominance** | Deep charcoal/near-black backgrounds (`#0a0a0f`, `#111118`) with subtle gradient accents |
| **Light Variants** | Warm cream/beige backgrounds (`#f5f0e8`, `#faf6f0`) for TTS and friendly apps |
| **Glassmorphism** | Translucent surfaces with `backdrop-blur` and subtle white borders |
| **Gradient Rings** | Circular progress gauges with multi-stop gradients (blue → purple → pink → orange) |
| **Micro-Interactions** | Squish on press, lift on hover, smooth spring-back on release |

### 1.2 CSS Token System

```css
:root {
  /* Backgrounds */
  --bento-bg-deep: #0a0a0f;
  --bento-bg-dark: #111118;
  --bento-bg-elevated: #1a1a24;
  --bento-bg-light: #f5f0e8;
  --bento-bg-cream: #faf6f0;

  /* Surfaces */
  --bento-surface-dark: rgba(255, 255, 255, 0.03);
  --bento-surface-light: rgba(255, 255, 255, 0.08);
  --bento-surface-glass: rgba(255, 255, 255, 0.06);

  /* Text */
  --bento-text-primary: #ffffff;
  --bento-text-secondary: rgba(255, 255, 255, 0.6);
  --bento-text-muted: rgba(255, 255, 255, 0.4);
  --bento-text-dark: #1a1a24;
  --bento-text-dark-secondary: #5a5a6e;

  /* Accents */
  --bento-accent-blue: #3b82f6;
  --bento-accent-purple: #8b5cf6;
  --bento-accent-pink: #ec4899;
  --bento-accent-orange: #f97316;
  --bento-accent-green: #22c55e;
  --bento-accent-coral: #ff7a6b;
  --bento-accent-mint: #7dd4a8;

  /* Gradient presets */
  --bento-gradient-ring: conic-gradient(
    from 0deg,
    #3b82f6,
    #8b5cf6,
    #ec4899,
    #f97316,
    #3b82f6
  );
  --bento-gradient-warm: linear-gradient(135deg, #ff7a6b 0%, #ffb347 100%);
  --bento-gradient-cool: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);

  /* Shadows — Dark Theme (inset glow) */
  --bento-shadow-dark: 
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --bento-shadow-dark-elevated:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --bento-shadow-dark-inset:
    inset 2px 2px 8px rgba(255, 255, 255, 0.04),
    inset -2px -2px 8px rgba(0, 0, 0, 0.4);

  /* Shadows — Light Theme (claymorphism) */
  --bento-shadow-light:
    8px 8px 24px rgba(128, 92, 70, 0.15),
    -8px -8px 20px rgba(255, 255, 255, 0.8),
    inset 2px 2px 6px rgba(255, 255, 255, 0.6),
    inset -4px -4px 10px rgba(128, 92, 70, 0.1);
  --bento-shadow-light-pressed:
    inset 3px 3px 8px rgba(128, 92, 70, 0.15),
    inset -3px -3px 8px rgba(255, 255, 255, 0.9);

  /* Radius */
  --bento-radius-sm: 12px;
  --bento-radius-md: 20px;
  --bento-radius-lg: 28px;
  --bento-radius-xl: 32px;
  --bento-radius-pill: 9999px;

  /* Spacing */
  --bento-gap: 16px;
  --bento-pad: 24px;
}
```

### 1.3 Dark Card Base (UI8 Standard)

```css
.bento-card {
  background: var(--bento-surface-dark);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--bento-radius-lg);
  box-shadow: var(--bento-shadow-dark);
  padding: var(--bento-pad);
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.bento-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}
```

### 1.4 Light Card Base (Claymorphism)

```css
.bento-card-light {
  background: var(--bento-bg-cream);
  border-radius: var(--bento-radius-lg);
  box-shadow: var(--bento-shadow-light);
  padding: var(--bento-pad);
  position: relative;
}

.bento-card-light:active {
  box-shadow: var(--bento-shadow-light-pressed);
  transform: scale(0.98);
}
```

---

## 2. Bento Grid Layout Patterns

### 2.1 Tailwind Grid Structure

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
  {/* Hero card — spans 3 columns */}
  <BentoCard className="lg:col-span-3 lg:row-span-2">
    <CardContent />
  </BentoCard>

  {/* Side card — tall */}
  <BentoCard className="lg:row-span-2">
    <CardContent />
  </BentoCard>

  {/* Standard cards */}
  <BentoCard className="lg:col-span-2">
    <CardContent />
  </BentoCard>

  <BentoCard>
    <CardContent />
  </BentoCard>

  <BentoCard>
    <CardContent />
  </BentoCard>
</div>
```

### 2.2 Responsive Span Patterns

| Pattern | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Hero | `col-span-1` | `col-span-2` | `col-span-3` |
| Feature | `col-span-1` | `col-span-1` | `col-span-2` |
| Square | `col-span-1` | `col-span-1` | `col-span-1` |
| Tall | `row-span-1` | `row-span-2` | `row-span-2` |

### 2.3 Grid Gap & Padding Rules

- **Gap**: Always `16px` (`gap-4`) minimum. Shadows need breathing room.
- **Card padding**: `24px` default, `20px` compact, `32px` spacious.
- **Section padding**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

---

## 3. GSAP Animation Patterns

### 3.1 ScrollTrigger Batch Reveal (Primary Pattern)

The canonical UI8 Bento entrance: cards fade up and scale in with staggered timing as they enter the viewport.

```tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useBentoReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.bento-card');

    // Set initial state
    gsap.set(cards, { opacity: 0, y: 60, scale: 0.95 });

    // Batch reveal with stagger
    ScrollTrigger.batch(cards, {
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: {
            amount: 0.6,
            from: 'start',
            grid: 'auto',
          },
          ease: 'power3.out',
        });
      },
      start: 'top 85%',
      once: true,
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return containerRef;
}
```

### 3.2 Advanced Grid Stagger (from Center)

For dramatic reveals, stagger from the center of the grid outward:

```tsx
gsap.to(cards, {
  opacity: 1,
  y: 0,
  scale: 1,
  duration: 0.8,
  stagger: {
    amount: 0.8,
    from: 'center',
    grid: [3, 4], // rows, cols — or 'auto' for responsive
    axis: 'both',
  },
  ease: 'power2.out',
  scrollTrigger: {
    trigger: containerRef.current,
    start: 'top 75%',
  },
});
```

### 3.3 3D Tilt Hover Effect

Signature UI8 interaction: cards subtly tilt toward the cursor on hover.

```tsx
import { useRef, useCallback } from 'react';
import gsap from 'gsap';

export function useTilt3D(intensity: number = 15) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    gsap.to(cardRef.current, {
      rotateX,
      rotateY,
      transformPerspective: 800,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    });
  }, []);

  return { cardRef, handleMouseMove, handleMouseLeave };
}

// Usage
function BentoCard({ children }) {
  const { cardRef, handleMouseMove, handleMouseLeave } = useTilt3D(12);

  return (
    <div
      ref={cardRef}
      className="bento-card"
      style={{ transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
```

### 3.4 Flip Layout Transitions

Animate cards when grid layout changes (e.g., filtering, resizing):

```tsx
import { useCallback, useState } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export function useBentoFlip() {
  const [isAnimating, setIsAnimating] = useState(false);

  const animateLayout = useCallback((container: HTMLElement, newLayout: () => void) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const state = Flip.getState(container.querySelectorAll('.bento-card'));
    newLayout();

    Flip.from(state, {
      duration: 0.8,
      ease: 'expo.inOut',
      stagger: 0.05,
      onComplete: () => setIsAnimating(false),
    });
  }, [isAnimating]);

  return { animateLayout, isAnimating };
}
```

### 3.5 Parallax Depth Layers

Add depth by animating inner card content at different speeds:

```tsx
gsap.utils.toArray('.bento-card .parallax-layer').forEach((layer) => {
  const speed = (layer as HTMLElement).dataset.speed || '0.2';
  gsap.to(layer, {
    yPercent: -50 * parseFloat(speed),
    ease: 'none',
    scrollTrigger: {
      trigger: layer.parentElement,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
});
```

### 3.6 Scroll-Scrubbed Gauge Animation

Animate circular progress rings tied to scroll position:

```tsx
gsap.to('.gauge-progress', {
  strokeDashoffset: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '.gauge-container',
    start: 'top 80%',
    end: 'center center',
    scrub: 1,
  },
});
```

---

## 4. Component Patterns

### 4.1 Circular Balance Gauge (Crypto/Wallet Card)

From UI8 Bento Pro — a large circular gauge with gradient ring and inner shadow.

```tsx
function CircularGauge({ value, max, label, sublabel }: GaugeProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Outer gradient ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle
          cx="50%" cy="50%" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
        />
        <circle
          cx="50%" cy="50%" r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="gauge-progress"
        />
      </svg>

      {/* Inner neumorphic disc */}
      <div className="w-32 h-32 rounded-full bg-[#1a1a24] shadow-[inset_4px_4px_12px_rgba(0,0,0,0.5),inset_-4px_-4px_12px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
```

### 4.2 Waveform Visualization (Audio/TTS Card)

Vertical bar waveform with GSAP stagger animation:

```tsx
function Waveform({ bars = 40, isPlaying = false }: WaveformProps) {
  const barsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!isPlaying) {
      gsap.to(barsRef.current, { scaleY: 0.3, duration: 0.4, ease: 'power2.out' });
      return;
    }

    const tl = gsap.timeline({ repeat: -1 });
    barsRef.current.forEach((bar, i) => {
      tl.to(bar, {
        scaleY: 0.2 + Math.random() * 0.8,
        duration: 0.3 + Math.random() * 0.2,
        ease: 'sine.inOut',
      }, i * 0.02);
    });

    return () => { tl.kill(); };
  }, [isPlaying]);

  return (
    <div className="flex items-end justify-center gap-[2px] h-24">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { if (el) barsRef.current[i] = el; }}
          className="w-1 bg-gradient-to-t from-emerald-400 to-yellow-300 rounded-full origin-bottom"
          style={{ height: '100%', transform: 'scaleY(0.3)' }}
        />
      ))}
    </div>
  );
}
```

### 4.3 Profile Card (Dark Glassmorphism)

```tsx
function ProfileCard({ name, role, avatar, tools }: ProfileProps) {
  return (
    <div className="bento-card flex flex-col items-center text-center">
      {/* Avatar with glow */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30" />
        <img
          src={avatar}
          alt={name}
          className="relative w-24 h-24 rounded-full object-cover border-2 border-white/10"
        />
      </div>

      <h3 className="text-xl font-semibold text-white">{name}</h3>
      <p className="text-sm text-white/50 mb-6">{role}</p>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        {['phone', 'video', 'message', 'mail', 'briefcase'].map((icon) => (
          <button
            key={icon}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icon name={icon} className="w-4 h-4 text-white/70" />
          </button>
        ))}
      </div>

      {/* Details grid */}
      <div className="w-full grid grid-cols-2 gap-x-6 gap-y-3 text-left">
        <DetailItem label="First Name" value={name.split(' ')[0]} />
        <DetailItem label="Last Name" value={name.split(' ')[1]} />
        <DetailItem label="Job Title" value={role} />
        <DetailItem label="Level" value="Senior" />
      </div>

      {/* Tools */}
      <div className="flex gap-2 mt-6">
        {tools.map((tool) => (
          <div key={tool} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <img src={tool} alt="" className="w-5 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.4 AI Chat Interface Card

```tsx
function AIChatCard() {
  return (
    <div className="bento-card lg:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">New chat</span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-2 bg-white/10 rounded-full w-3/4" />
            <div className="h-2 bg-white/10 rounded-full w-1/2" />
          </div>
        </div>

        {/* Image previews */}
        <div className="flex gap-2 mt-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 border border-white/10" />
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-400/20 to-pink-400/20 border border-white/10" />
        </div>
      </div>

      {/* Input bar */}
      <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="w-4 h-4 rounded-full border border-white/20" />
        <div className="flex-1 h-2 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}
```

### 4.5 Video Timeline Editor Card

```tsx
function VideoTimelineCard() {
  return (
    <div className="bento-card lg:col-span-2">
      <div className="relative">
        {/* Timeline ruler */}
        <div className="flex justify-between text-xs text-white/40 mb-2 px-2">
          <span>0:00</span><span>0:30</span><span>1:00</span><span>1:30</span><span>2:00</span>
        </div>

        {/* Tracks */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm text-white/80 font-medium">Footage.mp4</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-green-400/50 to-emerald-400/50" />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-sm text-white/80 font-medium">Effects.mp4</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-yellow-400/50 to-orange-400/50" />
            </div>
          </div>
        </div>

        {/* Playhead */}
        <div className="absolute top-8 bottom-0 left-1/3 w-px bg-blue-400">
          <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-blue-400" />
        </div>

        {/* Status */}
        <div className="mt-3 flex justify-end">
          <span className="text-xs text-emerald-400 font-medium">rendering...</span>
        </div>
      </div>
    </div>
  );
}
```

### 4.6 File Manager Card (Cloud Drive)

```tsx
function CloudDriveCard() {
  const files = [
    { name: 'UI8', items: 32, color: 'bg-sky-400' },
    { name: 'Moodboard', items: 32, color: 'bg-gray-400' },
    { name: 'Nov', items: 88, color: 'bg-gray-400' },
    { name: 'Assets', items: 1024, color: 'bg-gray-400' },
  ];

  return (
    <div className="bento-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm font-semibold text-white">Cloud Drive</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {files.map((file) => (
          <div key={file.name} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className={`w-12 h-10 ${file.color} rounded-lg shadow-lg group-hover:scale-105 transition-transform`} />
            <span className="text-xs text-white/70">{file.name}</span>
            <span className="text-[10px] text-white/40">{file.items} items</span>
          </div>
        ))}
      </div>

      {/* File list */}
      <div className="mt-4 space-y-2">
        {['Gradient', 'Background', 'Texture'].map((name) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400/30 to-purple-400/30" />
            <span className="text-xs text-white/60">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.7 Workout Tracker Card

```tsx
function WorkoutCard({ exercise, sets }: WorkoutProps) {
  return (
    <div className="bento-card">
      <div className="flex items-start gap-3 mb-4">
        <img src={exercise.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
        <div>
          <h4 className="text-sm font-semibold text-white">{exercise.name}</h4>
          <p className="text-xs text-white/40">{exercise.muscles}</p>
        </div>
        <button className="ml-auto text-white/40 hover:text-white">
          <Icon name="more-vertical" className="w-4 h-4" />
        </button>
      </div>

      {/* Sets table */}
      <div className="space-y-2">
        <div className="grid grid-cols-5 gap-2 text-[10px] text-white/40 uppercase tracking-wider">
          <span>Set</span><span>KG</span><span>Reps</span><span>RPE</span><span />
        </div>
        {sets.map((set, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 items-center">
            <span className="text-xs text-white/60">{set.type}</span>
            <span className="text-xs text-white">{set.weight}</span>
            <span className="text-xs text-white">{set.reps}</span>
            <span className="text-xs text-white">{set.rpe}</span>
            <div className="flex justify-end">
              {set.completed ? (
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                  <Icon name="check" className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-white/20" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.8 Calendar Dashboard Card

```tsx
function CalendarCard({ month, year, events, selectedDate }: CalendarProps) {
  return (
    <div className="bento-card lg:col-span-3">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">{month} {year}</h2>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">←</button>
          <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">→</button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <span key={d} className="text-center text-xs text-white/40">{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.date}
            className={`aspect-square rounded-xl p-2 flex flex-col justify-between cursor-pointer transition-colors ${
              day.isSelected ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/5'
            }`}
          >
            <span className={`text-sm ${day.isSelected ? 'text-blue-400 font-semibold' : 'text-white/70'}`}>
              {day.number}
            </span>
            {day.events.length > 0 && (
              <div className="flex gap-1">
                {day.events.map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Theme Variants

### 5.1 Dark Theme (Default)

```css
.theme-dark {
  --bento-bg: var(--bento-bg-deep);
  --bento-card-bg: var(--bento-surface-dark);
  --bento-text: var(--bento-text-primary);
  --bento-shadow: var(--bento-shadow-dark);
  --bento-border: rgba(255, 255, 255, 0.06);
}
```

### 5.2 Light Claymorphism Theme

```css
.theme-light {
  --bento-bg: var(--bento-bg-light);
  --bento-card-bg: var(--bento-bg-cream);
  --bento-text: var(--bento-text-dark);
  --bento-shadow: var(--bento-shadow-light);
  --bento-border: rgba(128, 92, 70, 0.08);
}
```

### 5.3 Theme Toggle Animation

```tsx
function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('theme-dark');

    gsap.to('.bento-card', {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      stagger: 0.02,
      onComplete: () => {
        root.classList.toggle('theme-dark');
        root.classList.toggle('theme-light');
        gsap.to('.bento-card', {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.03,
          ease: 'back.out(1.2)',
        });
      },
    });
  };

  return (
    <button onClick={toggleTheme} className="bento-card p-3">
      <Icon name={isDark ? 'sun' : 'moon'} />
    </button>
  );
}
```

---

## 6. Accessibility & Reduced Motion

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// GSAP global reduced motion
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0);
  ScrollTrigger.getAll().forEach((st) => st.kill());
}

// Or per-animation simplified fallback
const animConfig = prefersReducedMotion
  ? { duration: 0, stagger: 0, ease: 'none' }
  : { duration: 0.8, stagger: 0.1, ease: 'power3.out' };

gsap.to(cards, {
  opacity: 1,
  y: prefersReducedMotion ? 0 : 60,
  ...animConfig,
});
```

---

## 7. Performance Optimization

### 7.1 GPU-Accelerated Properties Only

```tsx
// GOOD — GPU composited
gsap.to(card, {
  x: 100,
  y: 50,
  rotation: 5,
  scale: 1.05,
  opacity: 0.9,
});

// BAD — triggers layout/paint
gsap.to(card, {
  left: 100,
  width: '200px',
  marginTop: 50,
});
```

### 7.2 Lazy Initialization

```tsx
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      initSectionAnimations(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { rootMargin: '100px' });

document.querySelectorAll('.bento-section').forEach((section) => {
  observer.observe(section);
});
```

### 7.3 Cleanup for SPAs

```tsx
function cleanupAnimations() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  gsap.killTweensOf('.bento-card');
  gsap.killTweensOf('.gauge-progress');
}

// Call on route change / unmount
useEffect(() => cleanupAnimations, []);
```

### 7.4 Will-Change Strategy

```css
.bento-card {
  will-change: transform, opacity;
}

.bento-card.revealed {
  will-change: auto;
}
```

---

## 8. Complete Page Integration

```tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function BentoPage() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.bento-card');
    if (!cards) return;

    // Initial hidden state
    gsap.set(cards, { opacity: 0, y: 80, scale: 0.92 });

    // Batch reveal
    ScrollTrigger.batch(cards, {
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1, y: 0, scale: 1,
        duration: 1,
        stagger: { amount: 0.8, from: 'start', grid: 'auto' },
        ease: 'power3.out',
      }),
      start: 'top 88%',
      once: true,
    });

    // Parallax on inner images
    gsap.utils.toArray('.bento-card img').forEach((img) => {
      gsap.to(img, {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: img.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0f] p-4 md:p-8">
      <div ref={gridRef} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroCard className="lg:col-span-3 lg:row-span-2" />
        <ProfileCard className="lg:row-span-2" />
        <AnalyticsCard className="lg:col-span-2" />
        <WalletCard />
        <ChatCard />
        <TimelineCard className="lg:col-span-2" />
        <DriveCard />
        <WorkoutCard />
      </div>
    </main>
  );
}
```

---

## 9. Key Takeaways

| Principle | Implementation |
|-----------|---------------|
| **Shadows define depth** | Use colored shadows keyed to surface hue, never pure gray |
| **Radius sells the style** | Minimum 16px on buttons, 24px+ on cards |
| **GSAP Batch for grids** | `ScrollTrigger.batch()` with stagger is the canonical reveal pattern |
| **3D tilt on hover** | `rotateX`/`rotateY` with `transformPerspective: 800` |
| **Flip for layout changes** | Capture state with `Flip.getState()`, mutate DOM, `Flip.from()` |
| **Parallax for depth** | Inner images at `yPercent: -15` with `scrub: true` |
| **Gauge animations** | `strokeDashoffset` tied to scroll with `scrub` |
| **Respect motion prefs** | Kill ScrollTrigger and set `timeScale(0)` for reduced motion |
| **Cleanup on unmount** | Always kill tweens and ScrollTriggers to prevent memory leaks |

---

## 10. Reference Links

- **UI8 Bento Cards v2 (AI)**: `https://ui8.net/ui8/products/bento-cards-v2-ai`
- **UI8 Bento Pro v2 (Multipurpose)**: `https://ui8.net/ui8/products/bento-pro-v2-multipurpose`
- **UI8 Bento Cards v1 (Framer)**: `https://ui8.net/ui8/products/bento-cardsv1-framer`
- **Aceternity Bento Grid Guide**: `https://ui.aceternity.com/blog/how-to-create-a-bento-grid-with-tailwindcss-nextjs-and-framer-motion`
- **GSAP ScrollTrigger Batch**: `https://gsap.com/docs/v3/Plugins/ScrollTrigger/`
- **GSAP Flip Plugin**: `https://gsap.com/docs/v3/Plugins/Flip/`
- **GSAP Staggers**: `https://gsap.com/resources/getting-started/Staggers/`
