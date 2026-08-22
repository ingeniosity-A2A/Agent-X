/**
 * ESA.ButtonPanel.js
 * ============================================
 * ESA INGESTION BUTTON PANEL — REACT MODULE
 * ============================================
 *
 * Part of the ESA Ingestion Interface (React module):
 *   - ✨ LENS button — camera capture (2s auto-capture) → Ingestion → DuckDB
 *   - 📝 Text button — prompt-based text payload
 *   - 📄 PDF/TXT upload button
 *
 * All captures flow through the Ingestion chat (its parent), which routes
 * them to the HD Supply catalog engine. Arrow.js only sandboxes the rest of
 * the Exoskeleton.
 */

import { html, useState, useRef } from './ESA.ReactMount.js';
import { mountReact } from './ESA.ReactMount.js';
import { activeTheme } from '../config/gruvbox-colors.js';

function ESAButtonPanelView({ onCapture, onAttachment }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const activateCamera = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Auto-capture after ~2s
      await new Promise(resolve => setTimeout(resolve, 2000));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataURL = canvas.toDataURL('image/png');

      stream.getTracks().forEach(track => track.stop());

      setPreview(dataURL);

      const blob = dataURLToBlob(dataURL);
      const file = new File([blob], `esa_img_${Date.now()}.png`, { type: 'image/png' });
      if (onCapture) onCapture(file);
    } catch (err) {
      console.warn('[ESA.ButtonPanel] Camera error:', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = e => {
    const file = e.target.files && e.target.files[0];
    if (file && onAttachment) {
      const type = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'text';
      onAttachment(file, type);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const sendText = () => {
    const text = window.prompt('ESA Text Input:');
    if (text && text.trim() && onAttachment) {
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], `esa_text_${Date.now()}.txt`, { type: 'text/plain' });
      onAttachment(file, 'text');
    }
  };

  return html`
    <div style=${{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
      <!-- LENS (camera) -->
      <button
        onClick=${() => activateCamera()}
        disabled=${busy}
        title="Lens — capture part → HD Supply catalog"
        style=${{ width: '60px', height: '60px', background: `linear-gradient(135deg, ${activeTheme.purple}, ${activeTheme.blue})`, border: `2px solid ${activeTheme.fg}`, borderRadius: '12px', cursor: busy ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: activeTheme.fg, fontSize: '24px', boxShadow: `0 4px 8px ${activeTheme.shadow}` }}
      >
        <span>${busy ? '📷' : '✨'}</span>
        <span style=${{ fontSize: '10px', fontWeight: 'bold' }}>LENS</span>
      </button>

      <!-- Text -->
      <button
        onClick=${() => sendText()}
        title="Send text to Ingestion"
        style=${{ width: '60px', height: '40px', background: activeTheme.green, border: `2px solid ${activeTheme.fg}`, borderRadius: '10px', cursor: 'pointer', color: activeTheme.fg, fontSize: '18px', boxShadow: `0 2px 4px ${activeTheme.shadow}` }}
      >
        📝
      </button>

      <!-- PDF / TXT upload -->
      <label
        title="Upload PDF/TXT to Ingestion"
        style=${{ width: '60px', height: '40px', background: activeTheme.red, border: `2px solid ${activeTheme.fg}`, borderRadius: '10px', cursor: 'pointer', color: activeTheme.fg, fontSize: '18px', boxShadow: `0 2px 4px ${activeTheme.shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        📄
        <input ref=${fileRef} type="file" accept=".pdf,.txt" style=${{ display: 'none' }} onChange=${e => handleUpload(e)} />
      </label>

      <!-- Capture preview -->
      ${preview ? html`
        <div style=${{ position: 'absolute', top: '0', right: '70px', width: '140px', height: '105px', background: activeTheme.bg, border: `2px solid ${activeTheme.border}`, borderRadius: '8px', overflow: 'hidden', boxShadow: `0 4px 12px ${activeTheme.shadow}`, zIndex: 10 }}>
          <img src=${preview} alt="ESA capture — sent to Ingestion" style=${{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            onClick=${() => setPreview(null)}
            title="Remove image"
            style=${{ position: 'absolute', top: '4px', right: '4px', background: activeTheme.red, color: activeTheme.fg, border: `1px solid ${activeTheme.fg}`, borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
          >×</button>
        </div>
      ` : ''}
    </div>
  `;
}

function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export const ESAButtonPanel = {
  name: 'ButtonPanel',
  version: '2.0.0',
  kind: 'react',

  /**
   * Mount the React ButtonPanel.
   * @param {HTMLElement} container - #esa-button-panel
   * @param {Object} props - { onCapture(file), onAttachment(file, type) }
   */
  mount(container, props = {}) {
    if (!container) return null;
    const result = mountReact(container, ESAButtonPanelView, props);
    return result ? { unmount: result.unmount, state: { kind: 'react' } } : null;
  }
};

export default ESAButtonPanel;
