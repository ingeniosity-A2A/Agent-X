/**
 * Console surface registry for the AVA007 Cybernetic Console.
 *
 * `SectionId` is the contract `BottomAIBar` uses as `current_surface` when it
 * dispatches intents, so Ava's intent resolution knows what the operator is
 * looking at. Each section maps to a real console route (or a planned one,
 * labeled honestly below).
 */
export type SectionId = "browser" | "terminal" | "cards" | "pipeline" | "esa";

export interface SectionMeta {
  id: SectionId;
  label: string;
  description: string;
  route: string | null; // null = not wired to a route yet (stated, not faked)
}

export const SECTIONS: Record<SectionId, SectionMeta> = {
  browser: {
    id: "browser",
    label: "Browser",
    description: "agent-browser viewport, snapshot refs and page actions",
    route: "/consoles/ava-console",
  },
  terminal: {
    id: "terminal",
    label: "Terminal",
    description: "browser CLI exec surface (bash exec backend not wired yet)",
    route: null,
  },
  cards: {
    id: "cards",
    label: "Cards",
    description: "drag-reorder console card builder (Edit Mode → Card Editor)",
    route: null,
  },
  pipeline: {
    id: "pipeline",
    label: "Render Pipeline",
    description: "recursive splitter → GSAP SplitText diff render",
    route: "/consoles/render-pipeline",
  },
  esa: {
    id: "esa",
    label: "ESA",
    description: "ESA maintenance operator surface",
    route: "/consoles/esa-maintenance",
  },
};

export const SECTION_IDS: SectionId[] = Object.keys(SECTIONS) as SectionId[];
