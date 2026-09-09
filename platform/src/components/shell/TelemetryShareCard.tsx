"use client";

const BAR_HEIGHTS = [40, 70, 30, 90, 100, 60, 40, 85, 50, 30, 75, 45];

export function TelemetryShareCard({ owner = "Artur" }: { owner?: string }) {
  return (
    <div className="exoskel-card punch-border">
      <div style={{ position: "relative", width: "100%", height: 224, borderRadius: 16, background: "var(--exoskel-viewport-dark)", border: "1px solid var(--exoskel-border-dark)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)", opacity: 0.2 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ borderRight: i % 3 !== 2 ? "1px solid rgba(255,255,255,0.2)" : "none", borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.2)" : "none" }} />
          ))}
        </div>
        <div className="ui8-glass-overlay" style={{ position: "relative", width: 208, padding: 12, borderRadius: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 10, transform: "rotate(-1deg)" }}>
          <div style={{ width: "100%", height: 80, borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 32 }}>
              {BAR_HEIGHTS.map((h, i) => (
                <span key={i} style={{ width: 3, height: `${h}%`, background: "rgba(255,255,255,0.8)", borderRadius: 999, display: "inline-block" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
              AUDIO
            </div>
            <button className="gradient-mask-btn" style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
              →
            </button>
          </div>
          <div style={{ position: "absolute", bottom: -12, right: -24, display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#3a3a40", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, boxShadow: "0 8px 16px rgba(0,0,0,0.3)" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#fff" }}>{owner}</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>One-Click File Sharing</h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginTop: 4 }}>
          Simplify sharing with a single click for any file size.
        </p>
      </div>
      <div style={{ marginTop: 24 }}>
        <button className="gradient-mask-btn" style={{ padding: "10px 24px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, cursor: "pointer" }}>
          Discover
        </button>
      </div>
    </div>
  );
}
