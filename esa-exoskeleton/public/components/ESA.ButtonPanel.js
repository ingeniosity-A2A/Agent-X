/**
 * ESA.ButtonPanel.js
 * ============================================
 * AI INGESTION CHAT BOX COMPONENT
 * ============================================
 * 
 * OWNER: AI Ingestion Chat Box
 * 
 * Features:
 * - Camera capture (2s auto-capture)
 * - Text input
 * - PDF/Text file upload
 * - Image preview with clear
 * 
 * Connections:
 * → AI Ingestion Chat Box (PARENT) - all captures go here!
 * → Lens/Camera Integration
 * → GSAP Transport (capture:image, capture:file, ingestion:input)
 * 
 * NOTE: This component BELONGS TO the AI Ingestion Box.
 * All captures/attachments flow THROUGH Ingestion.
 */

import { reactive, html } from 'https://esm.sh/@arrow-js/core';
import { activeTheme } from '../config/gruvbox-colors.js';
import { ESAVerifyComponent } from './ESA.VerifiedWrapper.js';

export const ESAButtonPanel = ESAVerifyComponent({
  name: 'ButtonPanel',
  version: '1.1.0',
  owner: 'AI-Ingestion-Chat-Box',  // ← BELONGS TO INGESTION
  verified: false,
  
  state: {
    cameraActive: false,
    capturedImage: null,
    pendingAttachments: []
  },
  
  methods: {
    activateCamera: async (state, onCapture) => {
      try {
        state.cameraActive = true;
        console.log(`%c[ESA.ButtonPanel] Camera activated`, 
          `color: ${activeTheme.yellow}`);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        // Auto-capture after 2 seconds
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          
          const dataURL = canvas.toDataURL('image/png');
          state.capturedImage = dataURL;
          state.cameraActive = false;
          
          // Stop camera
          stream.getTracks().forEach(track => track.stop());
          
          // Send to Ingestion (parent!)
          if (onCapture) {
            const blob = dataURLToBlob(dataURL);
            const file = new File([blob], `esa_img_${Date.now()}.png`, { type: 'image/png' });
            onCapture(file);
          }
        }, 2000);
        
      } catch (error) {
        console.error(`%c[ESA.ButtonPanel] Camera error: ${error.message}`, 
          `color: ${activeTheme.red}`);
        state.cameraActive = false;
      }
    },
    
    handleFileUpload: (state, event, type, onAttachment) => {
      const file = event.target.files[0];
      if (file && onAttachment) {
        onAttachment(file, type);
        console.log(`%c[ESA.ButtonPanel] 📎 ${type.toUpperCase()}: ${file.name}`, 
          `color: ${activeTheme.green}`);
      }
    },
    
    clearImage: (state) => {
      state.capturedImage = null;
      console.log(`%c[ESA.ButtonPanel] Image cleared`, 
        `color: ${activeTheme.fg_soft}`);
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
  
  template: (props, state, methods) => {
    const { onCapture, onAttachment } = props;
    
    return html`
      <div class="ESA-ButtonPanel" style="
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: relative;
      ">
        <!-- ESA AI Button (Main - belongs to Ingestion!) -->
        <button
          @click=${() => methods.activateCamera(state, onCapture)}
          disabled=${() => state.cameraActive}
          title="ESA AI - Camera & Upload (Ingestion)"
          style="
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, ${activeTheme.purple}, ${activeTheme.blue});
            border: 2px solid ${activeTheme.fg};
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: ${activeTheme.fg};
            font-size: 24px;
            box-shadow: 0 4px 8px ${activeTheme.shadow};
            transition: all 0.2s;
          "
          onmouseenter=${(e) => e.target.style.transform = 'scale(1.05)'}
          onmouseleave=${(e) => e.target.style.transform = 'scale(1)'}
        >
          ${() => state.cameraActive ? '📷' : '✨'}
          <span style="font-size: 10px; font-weight: bold;">AI</span>
        </button>
        
        <!-- Stacked Square Curved Buttons -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <!-- Send Text Button -->
          <button
            @click=${() => methods.sendText(state, onAttachment)}
            title="Send Text to Ingestion"
            style="
              width: 60px;
              height: 40px;
              background: ${activeTheme.green};
              border: 2px solid ${activeTheme.fg};
              border-radius: 10px;
              cursor: pointer;
              color: ${activeTheme.fg};
              font-size: 18px;
              box-shadow: 0 2px 4px ${activeTheme.shadow};
            "
          >
            📝
          </button>
          
          <!-- PDF Attachment Button -->
          <label
            title="Upload PDF/TXT to Ingestion"
            style="
              width: 60px;
              height: 40px;
              background: ${activeTheme.red};
              border: 2px solid ${activeTheme.fg};
              border-radius: 10px;
              cursor: pointer;
              color: ${activeTheme.fg};
              font-size: 18px;
              box-shadow: 0 2px 4px ${activeTheme.shadow};
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            📄
            <input
              type="file"
              accept=".pdf,.txt"
              style="display: none"
              @change=${(e) => {
                const type = e.target.files[0]?.name.endsWith('.pdf') ? 'pdf' : 'text';
                methods.handleFileUpload(state, e, type, onAttachment);
                e.target.value = ''; // Reset input
              }}
            />
          </label>
        </div>
        
        <!-- Image Preview (if captured) -->
        ${() => state.capturedImage ? html`
          <div style="
            position: absolute;
            top: 0;
            right: 70px;
            width: 140px;
            height: 105px;
            background: ${activeTheme.bg};
            border: 2px solid ${activeTheme.border};
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px ${activeTheme.shadow};
            z-index: 10;
          ">
            <img
              src=${state.capturedImage}
              style="width: 100%; height: 100%; object-fit: cover;"
              alt="ESA Capture - Sent to Ingestion"
            />
            <button
              @click=${() => methods.clearImage(state)}
              title="Remove image"
              style="
                position: absolute;
                top: 4px;
                right: 4px;
                background: ${activeTheme.red};
                color: ${activeTheme.fg};
                border: 1px solid ${activeTheme.fg};
                border-radius: 50%;
                width: 22px;
                height: 22px;
                cursor: pointer;
                font-size: 14px;
                line-height: 1;
              "
            >×</button>
          </div>
        ` : ''}
      </div>
    `;
  }
}).component;

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
