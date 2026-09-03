import type { CSSProperties } from "react";

/**
 * Console icon set for the AVA007 Cybernetic Console shell.
 * Original minimal stroke glyphs (24x24 grid, currentColor) — the patch v8
 * components import these from `../shell/icons`.
 */

export type IconProps = {
  style?: CSSProperties;
  strokeWidth?: number;
};

function svgProps(style?: CSSProperties, strokeWidth = 2) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { width: 15, height: 15, display: "block", flexShrink: 0, ...style },
    "aria-hidden": true,
  };
}

export function IconArrowLeft({ style, strokeWidth }: IconProps) {
  return (
    <svg {...svgProps(style, strokeWidth)}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export function IconArrowRight({ style, strokeWidth }: IconProps) {
  return (
    <svg {...svgProps(style, strokeWidth)}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

export function IconRefresh({ style, strokeWidth }: IconProps) {
  return (
    <svg {...svgProps(style, strokeWidth)}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export function IconGlobe({ style, strokeWidth }: IconProps) {
  return (
    <svg {...svgProps(style, strokeWidth)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function IconLock({ style, strokeWidth }: IconProps) {
  return (
    <svg {...svgProps(style, strokeWidth)}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function IconMic({ style, strokeWidth }: IconProps) {
  return (
    <svg {...svgProps(style, strokeWidth)}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v4" />
      <path d="M8 23h8" />
    </svg>
  );
}

export function IconPaperclip({ style, strokeWidth }: IconProps) {
  return (
    <svg {...svgProps(style, strokeWidth)}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function IconSend({ style, strokeWidth }: IconProps) {
  return (
    <svg {...svgProps(style, strokeWidth)}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
