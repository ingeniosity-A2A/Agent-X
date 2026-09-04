/**
 * Agent Browser surface registry.
 *
 * `SectionId` is the contract `BottomAIBar` uses as `current_surface` when it
 * dispatches intents, so Ava's intent resolution knows what the operator is
 * looking at. Every section maps to a real route under the Agent Browser
 * Interface hierarchy — no "consoles" naming, nothing planned-but-unrouted.
 *
 *   /agent-browser/interface/terminal                    → Agent Browser + Elements Terminal
 *   /agent-browser/interface/bento-ui-editor             → Bento UI Editor
 *   /agent-browser/interface/3d-rendering                → 3D-Rendering pipeline
 *   /agent-browser/interface/3d-rendering/esa            → 3D-Rendering / ESA
 *   /agent-browser/interface/3d-rendering/helpassembly   → 3D-Rendering / HelpAssembly
 */
export type SectionId =
  | "browser"
  | "terminal"
  | "bento"
  | "rendering"
  | "esa"
  | "helpassembly";

export interface SectionMeta {
  id: SectionId;
  label: string;
  description: string;
  route: string;
}

export const SECTIONS: Record<SectionId, SectionMeta> = {
  browser: {
    id: "browser",
    label: "Agent Browser",
    description: "agent-browser viewport, snapshot refs and page actions",
    route: "/agent-browser/interface/terminal",
  },
  terminal: {
    id: "terminal",
    label: "Terminal",
    description:
      "AI Elements terminal — real allowlisted exec + agent-browser actions",
    route: "/agent-browser/interface/terminal",
  },
  bento: {
    id: "bento",
    label: "Bento UI Editor",
    description: "drag-reorder bento card builder surface",
    route: "/agent-browser/interface/bento-ui-editor",
  },
  rendering: {
    id: "rendering",
    label: "3D-Rendering",
    description: "recursive splitter → GSAP SplitText render pipeline",
    route: "/agent-browser/interface/3d-rendering",
  },
  esa: {
    id: "esa",
    label: "ESA",
    description: "ESA rendering surface (Select Card)",
    route: "/agent-browser/interface/3d-rendering/esa",
  },
  helpassembly: {
    id: "helpassembly",
    label: "HelpAssembly",
    description: "Help Assembly rendering surface",
    route: "/agent-browser/interface/3d-rendering/helpassembly",
  },
};

export const SECTION_IDS: SectionId[] = Object.keys(SECTIONS) as SectionId[];
