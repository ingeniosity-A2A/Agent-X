/**
 * ESA.VerifiedWrapper.js
 * Arrow.js verification wrapper for ESA components
 */

import { component, reactive, html } from 'https://esm.sh/@arrow-js/core';
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
    console.warn(`%c[ESA.Verify] ${name} running in SANDBOX`, 
      `color: ${activeTheme.orange}`);
  } else {
    console.log(`%c[ESA.Verify] ✓ ${name}@${version} VERIFIED`, 
      `color: ${activeTheme.green}`);
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
  
  const ESAComponent = component((initialProps = {}) => {
    const propsData = reactive({ ...props, ...initialProps });
    
    if (lifecycle.onMount) {
      lifecycle.onMount(propsData, componentState);
    }
    
    return template(propsData, componentState, methods);
  });
  
  return {
    component: ESAComponent,
    state: componentState,
    ESAVerify: () => {
      componentState._esa.verified = true;
      console.log(`%c[ESA.Verify] ✓ ${name} now VERIFIED`, 
        `color: ${activeTheme.green}`);
    },
    getESAMetadata: () => ({
      name: componentState._esa.name,
      version: componentState._esa.version,
      verified: componentState._esa.verified,
      loadedAt: componentState._esa.loadedAt
    })
  };
}

export default ESAVerifyComponent;
