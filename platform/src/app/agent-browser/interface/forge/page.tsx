import type { Metadata } from "next";
import { ForgedxFoldersExplorer } from "@/components/forge/ForgedxFoldersExplorer";
import "./forge.css";

export const metadata: Metadata = {
  title: "ForgedxFolders — FORGE-ORG",
  description:
    "File Explorer Canvas over ForgedxFolders: F0 Raw Upload → F1 Chunk (GSAP SplitText) → Refactor/Normalize → Exoskeleton Application → F2 Forged File → RocksDB Skills / DuckDB Intelligence → F3 Manifest. Forged File Standard 1.1.0.",
};

/**
 * /agent-browser/interface/forge — FORGE-ORG execution surface.
 *
 * The File Explorer Canvas is the UI implementation of the Forged File
 * Standard: the reference explorer's geometry, navigation, inspector,
 * grid/list behavior, breadcrumbs, search, sorting and interaction model
 * stay intact; the pipeline (F0→F3), RocksDB/DuckDB housing, HF vendor
 * boundary, three-color contract and semantic animations are the
 * architecture additions. Canonical spec: skills/forge-org/FORGED-FILE-STANDARD.md
 */
export default function ForgePage() {
  return <ForgedxFoldersExplorer />;
}
