"use client";

export function GelMeterCard({
  title = "Metric",
  value = 50,
  max = 100,
  unit = "%",
  color = "#7ec8a0",
}: {
  title?: string;
  value?: number;
  max?: number;
  unit?: string;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bento-card punch-border" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 22, fontWeight: 700 }}>
        {value}
        <span style={{ fontSize: 12, color: "var(--bento-text-muted)", marginLeft: 4 }}>{unit}</span>
      </span>
      <div className="gel-progress-track" style={{ "--gel-progress": `${pct}%`, "--gel-progress-color": color } as React.CSSProperties}>
        <div className="gel-progress-fill" />
      </div>
    </div>
  );
}
