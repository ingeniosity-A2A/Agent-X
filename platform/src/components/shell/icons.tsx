import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = (children: React.ReactNode, props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
);

export const IconBrain = (p: IconProps) =>
  base(
    <>
      <path d="M9.5 4a2.5 2.5 0 0 0-2.5 2.5v1A2.5 2.5 0 0 0 4.5 10 2.5 2.5 0 0 0 6 14.3 2.5 2.5 0 0 0 8 18a2.5 2.5 0 0 0 1.5 2.3V21" />
      <path d="M14.5 4a2.5 2.5 0 0 1 2.5 2.5v1a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-1.5 4.3A2.5 2.5 0 0 1 16 18a2.5 2.5 0 0 1-1.5 2.3V21" />
      <path d="M9.5 4v17" />
      <path d="M14.5 4v17" />
    </>,
    p,
  );

export const IconGlobe = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
    </>,
    p,
  );

export const IconCube = (p: IconProps) =>
  base(
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4.5 7.5 12 12l7.5-4.5" />
      <path d="M12 12v9" />
    </>,
    p,
  );

export const IconCamera = (p: IconProps) =>
  base(
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>,
    p,
  );

export const IconScan = (p: IconProps) =>
  base(
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </>,
    p,
  );

export const IconWorkflow = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="4" width="6" height="4" rx="1" />
      <rect x="15" y="4" width="6" height="4" rx="1" />
      <rect x="9" y="16" width="6" height="4" rx="1" />
      <path d="M6 8v3a2 2 0 0 0 2 2h1" />
      <path d="M18 8v3a2 2 0 0 0-2 2h-1" />
      <path d="M12 13v3" />
    </>,
    p,
  );

export const IconKernel = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>,
    p,
  );

export const IconTerminal = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9l3 3-3 3" />
      <path d="M13 15h4" />
    </>,
    p,
  );

export const IconLinux = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="9" r="4" />
      <path d="M8 12c-1.5 2-2 4-1.5 7h11c.5-3 0-5-1.5-7" />
      <path d="M9.5 8h.01M14.5 8h.01" />
    </>,
    p,
  );

export const IconPhone = (p: IconProps) =>
  base(
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2" />
      <path d="M11 19h2" />
    </>,
    p,
  );

export const IconWrench = (p: IconProps) =>
  base(
    <>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z" />
    </>,
    p,
  );

export const IconLeaf = (p: IconProps) =>
  base(
    <>
      <path d="M4 20c8-1 13-6 15-15-9 1-14 6-15 15z" />
      <path d="M9 15c2-2 4-4 8-8" />
    </>,
    p,
  );

export const IconGauge = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13l3-3.5" />
      <path d="M8 6.5 6.5 5M16 6.5 17.5 5M4.5 13H3M21 13h-1.5" />
    </>,
    p,
  );

export const IconInjection = (p: IconProps) =>
  base(
    <>
      <path d="M18 3l3 3-9 9-4 1 1-4z" />
      <path d="M13 8l3 3" />
      <path d="M6 15l3 3" />
    </>,
    p,
  );

export const IconSettings = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z" />
    </>,
    p,
  );

export const IconMic = (p: IconProps) =>
  base(
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3M9 21h6" />
    </>,
    p,
  );

export const IconPaperclip = (p: IconProps) =>
  base(<path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3L15 8.5" />, p);

export const IconSend = (p: IconProps) => base(<path d="M4 12l16-8-6 16-3-6-7-2z" />, p);

export const IconRefresh = (p: IconProps) =>
  base(
    <>
      <path d="M4 12a8 8 0 0 1 14.3-4.9M20 12a8 8 0 0 1-14.3 4.9" />
      <path d="M18 3v4.5H13.5" />
      <path d="M6 21v-4.5h4.5" />
    </>,
    p,
  );

export const IconArrowLeft = (p: IconProps) => base(<path d="M19 12H5M11 6l-6 6 6 6" />, p);
export const IconArrowRight = (p: IconProps) => base(<path d="M5 12h14M13 6l6 6-6 6" />, p);
export const IconLock = (p: IconProps) =>
  base(
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>,
    p,
  );

export const IconLayoutGrid = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>,
    p,
  );
