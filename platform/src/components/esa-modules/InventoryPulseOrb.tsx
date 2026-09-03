"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

/* ═══════════════════════════════════════════════════════════
   Inventory Pulse Orb – lightweight canvas-driven particle
   visualization that acts as the "Inventory Pulse" status
   indicator for the left column.
   ═══════════════════════════════════════════════════════════ */

interface PulseOrbProps {
  lowStockCount: number;
  totalParts: number;
  status?: "idle" | "listening" | "reasoning" | "tooling" | "speaking";
}

const STATUS_COLORS: Record<string, string> = {
  idle: "#22d3ee",
  listening: "#22c55e",
  reasoning: "#eab308",
  tooling: "#22d3ee",
  speaking: "#34d399",
};

export function InventoryPulseOrb({
  lowStockCount,
  totalParts,
  status = "idle",
}: PulseOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; r: number; life: number; maxLife: number }[]
  >([]);

  const accentColor = STATUS_COLORS[status] || STATUS_COLORS.idle;
  const alertIntensity = lowStockCount > 0 ? Math.min(lowStockCount / 6, 1) : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 160;
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const cx = size;
    const cy = size;

    // Seed particles
    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: cx + (Math.random() - 0.5) * 80,
      y: cy + (Math.random() - 0.5) * 80,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2.5 + 0.8,
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 100,
    }));

    let frame = 0;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Glow core
      const pulse = Math.sin(frame * 0.02) * 0.15 + 0.85;
      const coreRadius = 28 * pulse;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      grad.addColorStop(0, `${accentColor}55`);
      grad.addColorStop(0.5, `${accentColor}22`);
      grad.addColorStop(1, `${accentColor}00`);
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Alert ring (orange pulsing)
      if (alertIntensity > 0) {
        const alertPulse = Math.sin(frame * 0.04) * 0.3 + 0.7;
        const ringRadius = 38 * alertPulse * alertIntensity;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 146, 60, ${0.3 * alertIntensity * alertPulse})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Particles
      particlesRef.current.forEach((p) => {
        p.life++;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.x = cx + (Math.random() - 0.5) * 80;
          p.y = cy + (Math.random() - 0.5) * 80;
        }

        // Attract to center
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        p.vx += (dx / dist) * 0.008;
        p.vy += (dy / dist) * 0.008;

        // Dampen
        p.vx *= 0.995;
        p.vy *= 0.995;

        p.x += p.vx;
        p.y += p.vy;

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle =
          alertIntensity > 0.3 && Math.random() > 0.7
            ? `rgba(251, 146, 60, ${alpha})`
            : `${accentColor}${Math.floor(alpha * 255).toString(16).padStart(2, "0")}`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [accentColor, alertIntensity, status]);

  // GSAP entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { scale: 0, rotation: -180, opacity: 0 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1.2,
        ease: "back.out(1.4)",
      }
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center"
      style={{ width: 160, height: 160 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ imageRendering: "auto" }}
      />
      {/* Center label */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
          Pulse
        </span>
        <span
          className="text-[18px] font-bold font-mono ava-glow-cyan"
          style={{ color: accentColor }}
        >
          {totalParts}
        </span>
        <span className="text-[9px] font-mono text-zinc-600">SKUs</span>
      </div>
    </div>
  );
}
