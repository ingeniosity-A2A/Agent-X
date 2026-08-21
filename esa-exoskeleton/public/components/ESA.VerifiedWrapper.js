/**
 * ESA.VerifiedWrapper.js
 * ============================================
 * Arrow.js Component Wrapper with Proper DOM Mounting
 * 
 * CORRECT Arrow.js API:
 * - html`...` returns a View object (NOT DOM Node)
 * - View.mount(container) attaches to DOM (mount is a View METHOD, not standalone export)
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';

export function ESAVerifyComponent(config) {
  const {
    name,
    version,
    props = {},
    state = {},
    template,
    methods = {},
    lifecycle = {},
    verified = false
  } = config;
  
  if (!verified) {
    console.warn(`[ESA.Verify] ${name} running in SANDBOX`);
  } else {
    console.log(`[ESA.Verify] ✓ ${name}@${version} VERIFIED`);
  }
  
  const componentState = reactive({
    ...state,
    _esa: {
      name: `ESA.${name}`,
      version,
      verified,
      loadedAt: new Date().toISOString()
    }
  });
  
  // Create the Arrow.js view (template result)
  const createView = (initialProps = {}) => {
    const propsData = reactive({ ...props, ...initialProps });
    
    if (lifecycle.onMount) {
      lifecycle.onMount(propsData, componentState);
    }
    
    // Return the template view
    return template(propsData, componentState, methods);
  };
  
  return {
    /**
     * Mount this component to a DOM container element
     * @param {HTMLElement} container - The DOM element to mount into
     * @param {Object} initialProps - Initial props for the component
     * @returns {{ unmount: Function, state: Object }}
     */
    mount(container, initialProps = {}) {
      if (!container || !(container instanceof HTMLElement)) {
        console.error(`[ESA.Verify] ${name}: Invalid container element`);
        return null;
      }
      
      try {
        const view = createView(initialProps);
        
        // CORRECT: Use View.mount() method (Arrow.js API)
        // view.mount(container) returns an unmount function
        const cleanup = view.mount(container);
        
        console.log(`[ESA.Verify] ${name} mounted successfully`);
        
        return {
          unmount: cleanup,
          state: componentState,
          container
        };
      } catch (err) {
        console.error(`[ESA.Verify] ${name} mount error:`, err);
        return null;
      }
    },
    
    /**
     * Create view without mounting (for nesting in other templates)
     * Returns the raw Arrow.js view for use in parent templates
     */
    view: (initialProps = {}) => createView(initialProps),
    
    /**
     * Get the reactive state reference
     */
    state: componentState,
    
    /**
     * Mark as verified
     */
    ESAVerify: () => {
      componentState._esa.verified = true;
      console.log(`[ESA.Verify] ✓ ${name} now VERIFIED`);
    }
  };
}
