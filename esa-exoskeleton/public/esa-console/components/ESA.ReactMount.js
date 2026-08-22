/**
 * ESA.ReactMount.js
 * ============================================
 * SHARED REACT SETUP FOR THE ESA INGESTION MODULE
 * ============================================
 *
 * The ESA Ingestion Interface (AI chat, dual audio, lens) is a **React module**.
 * Arrow.js is used only to sandbox the remaining Exoskeleton components
 * (workorder, parts cards, diagnostics, maintenance checklist).
 *
 * React is loaded from esm.sh (same CDN as the rest of the static app) so the
 * Cloudflare Pages deployment keeps working with zero build step:
 *   - one shared React module instance (esm.sh caches by URL)
 *   - `html` = htm bound to React.createElement (JSX-like templates, no build)
 *   - `mountReact` = framework-agnostic .mount() contract for integration.js
 */

import { createElement } from 'https://esm.sh/react';
import { createRoot } from 'https://esm.sh/react-dom/client';
import { createPortal } from 'https://esm.sh/react-dom';
import htm from 'https://esm.sh/htm';

export { createElement, createPortal };
export { useState, useEffect, useRef, useCallback } from 'https://esm.sh/react';

/** JSX-like tagged template: html`<div onClick=${...}>…</div>` */
export const html = htm.bind(createElement);

/**
 * Mount a React view into a container, keeping the Exoskeleton .mount() contract.
 * @param {HTMLElement} container
 * @param {Function} View - React component (function)
 * @param {Object} props
 * @param {Function} [onReady] - called with the component's public API once mounted
 * @returns {{ root: Object, unmount: Function, element: Object } | null}
 */
export function mountReact(container, View, props = {}, onReady) {
  if (!container) return null;

  try {
    container.innerHTML = '';
    const root = createRoot(container);
    const element = createElement(View, { ...props, onReady });
    root.render(element);

    return {
      root,
      unmount: () => {
        try { root.unmount(); } catch (_) { /* already unmounted */ }
        container.innerHTML = '';
      },
      element
    };
  } catch (err) {
    console.error('[ESA.React] mount error:', err);
    container.innerHTML = `<div style="color:#cc241d;padding:20px;font-size:12px;">React mount error: ${err.message}</div>`;
    return null;
  }
}

export default mountReact;
