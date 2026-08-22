/**
 * ESA.VerifiedWrapper.js
 * ============================================
 * Arrow.js Component Wrapper with Proper DOM Mounting
 * 
 * CORRECT Arrow.js API (v1.0.x):
 * - html`...` returns a FUNCTION (View), not an object
 * - Mount by CALLING the view function: view(container)
 * - The view function renders the template into the container
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
    
    // Return the template view (which is a function)
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
        
        // CORRECT Arrow.js v1.0.x API:
        // html`...` returns a FUNCTION - call it with container to mount
        if (typeof view === 'function') {
          view(container);
        } else {
          console.error(`[ESA.Verify] ${name}: Template did not return a valid View function`);
          return null;
        }
        
        console.log(`[ESA.Verify] ${name} mounted successfully`);
        
        return {
          unmount: () => { 
            // Arrow.js handles cleanup internally
            container.innerHTML = ''; 
          },
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
