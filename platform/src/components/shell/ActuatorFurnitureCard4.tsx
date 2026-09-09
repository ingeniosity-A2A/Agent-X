"use client";

import { useState } from "react";
import { Settings } from "lucide-react";

export function ActuatorFurnitureCard4({
  presets = ["P1", "P2", "P3", "P4", "P5"],
  torqueValue = "320",
  torqueUnit = "Nm",
  torqueMax = 500,
}: {
  presets?: string[];
  torqueValue?: string;
  torqueUnit?: string;
  torqueMax?: number;
}) {
  const [selected, setSelected] = useState(0);
  const torquePct = Math.min(100, (Number(torqueValue) / torqueMax) * 100);

  return (
    <div className="exoskel-card punch-border">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7ec8a0", boxShadow: "0 0 8px #7ec8a0" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Actuator Preset</span>
        </div>
        <button style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
          <Settings size={14} />
        </button>
      </div>

      <div className="exoskel-viewport" style={{ padding: 16, justifyContent: "space-between" }}>
        <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10, padding: "0 8px" }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>
            {torqueValue} {torqueUnit}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Joint Torque</span>
          <div
            className="gel-progress-track"
            style={{ maxWidth: 140, ["--gel-progress" as string]: `${torquePct}%` } as React.CSSProperties}
          >
            <div className="gel-progress-fill" />
          </div>
        </div>

        <div className="exoskel-scroll-wheel no-scrollbar">
          {presets.map((item, idx) => (
            <div key={item} onClick={() => setSelected(idx)} className={`exoskel-wheel-item ${selected === idx ? "selected" : ""}`}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Limb Calibration</h4>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Adjust joint response profiles dynamically.</p>
      </div>
    </div>
  );
}
