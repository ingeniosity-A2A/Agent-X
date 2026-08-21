/**
 * ESA.ButtonPanel.js (Arrow.js Compatible - FULLY FIXED)
 * ============================================
 * AI INGESTION BUTTON PANEL
 * 
 * CRITICAL FIX: All dynamic expressions removed from template!
 * Image preview rendered via post-mount DOM manipulation only.
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

export const ESAButtonPanel = ESAVerifyComponent({
  name: 'ButtonPanel',
  version: '1.1.1',
  verified: true,
  
  state: {
    cameraActive: false,
    capturedImage: null,
    pendingAttachments: []
  },
  
  methods: {
    activateCamera: async (state, onCapture) => {
      try {
        state.cameraActive = true;
        updateCameraButton(state);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          
          const dataURL = canvas.toDataURL('image/png');
          state.capturedImage = dataURL;
          state.cameraActive = false;
          
          updateCameraButton(state);
          renderImagePreview(state);
          
          stream.getTracks().forEach(track => track.stop());
          
          if (onCapture) {
            const blob = dataURLToBlob(dataURL);
            const file = new File([blob], `esa_img_${Date.now()}.png`, { type: 'image/png' });
            onCapture(file);
          }
        }, 2000);
        
      } catch (error) {
        console.error('[ESA.ButtonPanel] Camera error:', error.message);
        state.cameraActive = false;
        updateCameraButton(state);
      }
    },
    
    handleFileUpload: (state, event, type, onAttachment) => {
      const file = event.target.files[0];
      if (file && onAttachment) {
        onAttachment(file, type);
      }
    },
    
    clearImage: (state) => {
      state.capturedImage = null;
      const preview = document.querySelector('#esa-image-preview');
      if (preview) preview.remove();
    },

    sendText: (state, onAttachment) => {
      const text = prompt('ESA Text Input:');
      if (text && text.trim()) {
        const blob = new Blob([text], { type: 'text/plain' });
        const file = new File([blob], `esa_text_${Date.now()}.txt`, { type: 'text/plain' });
        if (onAttachment) onAttachment(file, 'text');
      }
    }
  },
  
  // Template with ALL HARDCODED STYLES - no dynamic ${} expressions!
  template: (props, state, methods) => {
    return html`
      <div class="ESA-ButtonPanel" id="esa-button-panel-container" style="display: flex; flex-direction: column; gap: 6px; position: relative;">
        <!-- Main AI Button -->
        <button
          id="esa-camera-btn"
          title="ESA AI - Camera & Upload"
          style="width: 60px; height: 60px; background: linear-gradient(135deg, #b16286, #458588); border: 2px solid #ebdbb2; border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ebdbb2; font-size: 24px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5); transition: all 0.2s;"
        >
          <span id="esa-camera-icon">✨</span>
          <span style="font-size: 10px; font-weight: bold;">AI</span>
        </button>
        
        <!-- Stacked Buttons -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <!-- Send Text -->
          <button
            id="esa-text-btn"
            title="Send Text to Ingestion"
            style="width: 60px; height: 40px; background: #98971a; border: 2px solid #ebdbb2; border-radius: 10px; cursor: pointer; color: #ebdbb2; font-size: 18px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);"
          >
            📝
          </button>
          
          <!-- PDF Upload -->
          <label
            title="Upload PDF/TXT to Ingestion"
            style="width: 60px; height: 40px; background: #cc241d; border: 2px solid #ebdbb2; border-radius: 10px; cursor: pointer; color: #ebdbb2; font-size: 18px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;"
          >
            📄
            <input
              id="esa-file-input"
              type="file"
              accept=".pdf,.txt"
              style="display: none"
            />
          </label>
        </div>
        
        <!-- Image Preview Container (empty by default, populated via DOM) -->
        <div id="esa-image-preview-container" style="position: relative;"></div>
      </div>
    `;
  }
});

// Helper functions for DOM updates (outside template)
function updateCameraButton(state) {
  const icon = document.querySelector('#esa-camera-icon');
  if (icon) {
    icon.textContent = state.cameraActive ? '📷' : '✨';
  }
}

function renderImagePreview(state) {
  const container = document.querySelector('#esa-image-preview-container');
  if (!container || !state.capturedImage) return;
  
  container.innerHTML = `
    <div id="esa-image-preview" style="position: absolute; top: 0; right: 70px; width: 140px; height: 105px; background: #282828; border: 2px solid #3c3836; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); z-index: 10;">
      <img src="${state.capturedImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="Capture" />
      <button
        id="esa-clear-img-btn"
        title="Remove image"
        style="position: absolute; top: 4px; right: 4px; background: #cc241d; color: #ebdbb2; border: 1px solid #ebdbb2; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 14px; line-height: 1;"
      >×</button>
    </div>
  `;
  
  // Attach clear button listener
  const clearBtn = document.querySelector('#esa-clear-img-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      methods.clearImage(state);
    });
  }
}

// Setup event listeners after mount
const originalMount = ESAButtonPanel.mount;
ESAButtonPanel.mount = function(container, props = {}) {
  const result = originalMount.call(this, container, props);
  
  // Attach event listeners via DOM after mount
  setTimeout(() => {
    const cameraBtn = container.querySelector('#esa-camera-btn');
    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => {
        this.state.cameraActive = !this.state.cameraActive;
        if (this.state.cameraActive) {
          methods.activateCamera(this.state, props.onCapture);
        }
      });
    }
    
    const textBtn = container.querySelector('#esa-text-btn');
    if (textBtn) {
      textBtn.addEventListener('click', () => {
        methods.sendText(this.state, props.onAttachment);
      });
    }
    
    const fileInput = container.querySelector('#esa-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const type = e.target.files[0]?.name.endsWith('.pdf') ? 'pdf' : 'text';
        methods.handleFileUpload(this.state, e, type, props.onAttachment);
        e.target.value = '';
      });
    }
  }, 100);
  
  return result;
};

function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export default ESAButtonPanel;
