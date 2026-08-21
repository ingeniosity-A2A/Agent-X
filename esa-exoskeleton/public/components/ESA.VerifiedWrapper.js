/**
 * ESA.VerifiedWrapper.js
 * ============================================
 * Arrow.js Component Wrapper with Proper DOM Mounting
 * 
 * FIX: Arrow.js components must use mount(), not appendChild()
 * - html`...` returns a View object, not DOM Node
 * - Must use arrow.js mount() to attach to container
 */

import { component, reactive, html, mount } from 'https://esm.sh/@arrow-js/core';
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
    console.warn(`%c[ESA.Verify] ${name} running in SANDBOX`, `color: ${activeTheme.orange}`);
  } else {
    console.log(`%c[ESA.Verify] ✓ ${name}@${version} VERIFIED`, `color: ${activeTheme.green}`);
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
        
        // Use Arrow.js mount() to properly attach the view
        const cleanup = mount(container, view);
        
        console.log(`%c[ESA.Verify] ${name} mounted successfully`, `color: ${activeTheme.green}`);
        
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
      console.log(`%c[ESA.Verify] ✓ ${name} now VERIFIED`, `color: ${activeTheme.green}`);
    }
  };
}
