/**
 * ESA.TestComponent.js - Minimal Arrow.js Test
 */
import { html } from 'https://esm.sh/@arrow-js/core';

export const ESATestComponent = {
  name: 'TestComponent',
  version: '1.0.0',
  
  state: {
    message: 'Hello from ESA!'
  },
  
  template: () => html`
    <div style="background: #32302f; border: 1px solid #3c3836; border-radius: 12px; padding: 20px; min-height: 100px;">
      <h3 style="color: #98971a; margin-bottom: 12px;">✅ TEST COMPONENT LOADED</h3>
      <p style="color: #ebdbb2; font-size: 14px;">This component uses only static HTML.</p>
      <p style="color: #a89984; font-size: 12px;">If you can see this, Arrow.js basic rendering works!</p>
    </div>
  `,
  
  mount(container) {
    if (!container) return null;
    try {
      container.innerHTML = '';
      const view = this.template();
      if (typeof view === 'function') {
        view(container);
        console.log('[ESA.Test] Component mounted successfully');
        return { unmount: () => { container.innerHTML = ''; }, state: this.state };
      }
    } catch(e) {
      console.error('[ESA.Test] Mount error:', e);
      container.innerHTML = `<div style="color: #cc241d; padding: 20px;">ERROR: ${e.message}</div>`;
    }
    return null;
  }
};

export default ESATestComponent;
