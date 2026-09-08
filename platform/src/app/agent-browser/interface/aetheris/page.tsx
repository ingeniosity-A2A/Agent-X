import type { Metadata } from "next";
import AetherisExplorer from "@/components/aetheris/AetherisExplorer";
import "./aetheris.css";

export const metadata: Metadata = {
  title: "Aetheris — 3D Memory Timeline File Explorer",
  description:
    "Bento UI8 pluggable file system on the Forge UI8 Canvas: 4-tier memory timeline (L3 Persona → L2 Scenario → L1 Atoms → L0 Trace + refs offload), lock-and-slide governance, Mermaid symbol graphs, and Rev.ike zero-copy streaming ingestion (verified flat RAM).",
};

/**
 * /agent-browser/interface/aetheris — the Aetheris Memory Timeline Explorer.
 *
 * The Bento UI8 plugin surface of the memory-tdai file system: scroll-driven
 * 3D tier stack (perspective 1200px, 250vh driver), scoop-corner cards,
 * lock-and-slide governance (0.6s back.out(1.1) unprepared window), TDAI
 * symbolic in-context graphing with deterministic recall hooks, and live
 * Rev.ike ingestion telemetry inside the 100ms perceptual fusion constant.
 * Canonical specs: the Aetheris / Sovereign Ingestion / Rev.ike corpus.
 */
export default function AetherisPage() {
  return <AetherisExplorer />;
}
