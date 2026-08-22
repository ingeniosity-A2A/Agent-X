/**
 * ESA.Ingestion.js
 * ============================================
 * ESA INGESTION INTERFACE — REACT MODULE ADAPTER
 * ============================================
 *
 * The Ingestion Interface (AI chat + dual audio + lens) is a **React module**.
 * Arrow.js is used only to sandbox the remaining Exoskeleton components.
 *
 * This file is a thin adapter that keeps the Exoskeleton `.mount()` contract
 * so integration.js does not change its mounting strategy:
 *
 *     ESAIngestion.mount(container) → { unmount, state }
 *
 * The actual interface lives in ESAIngestionChat.js (React, htm, no build
 * step — React is loaded from esm.sh like the rest of the static app).
 *
 * Scope: ESA CONTENT ONLY. Sole communication hub for the ESA EXOSKELETON
 * console, routed to Cybernetic Ava007 via substrate. Not an Intellect host.
 */

import { mountReact } from './ESA.ReactMount.js';
import { ESAIngestionInterface } from './ESAIngestionChat.js';

const ESAIngestionRaw = {
  name: 'Ingestion',
  version: '7.0.0',
  kind: 'react',

  /**
   * Mount the React Ingestion Interface.
   * @param {HTMLElement} container - #esa-ingestion
   * @param {Object} [props] - optional props (onReady etc.)
   * @returns {{ unmount: Function, state: Object } | null}
   */
  mount(container, props = {}) {
    if (!container) return null;

    const result = mountReact(container, ESAIngestionInterface, props);
    if (!result) return null;

    return {
      unmount: result.unmount,
      state: {
        kind: 'react',
        mountedAt: new Date().toISOString(),
        // Public API is registered by the React module on mount:
        // window.ESA.ingestion.api = { audioEngine, chat, sendMessage, handleFile, pushSystem }
        api: () => (typeof window !== 'undefined' && window.ESA?.ingestion?.api) || null
      }
    };
  }
};

export const ESAIngestion = ESAIngestionRaw;
export default ESAIngestion;
