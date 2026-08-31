/**
 * Prefer id=esa-ai-chatbot. Keep legacy esa-ingestion for ESA.Ingestion.mount.
 */
(function () {
  function alias() {
    let primary = document.getElementById('esa-ai-chatbot');
    let legacy = document.getElementById('esa-ingestion');

    if (!primary && legacy) {
      legacy.id = 'esa-ai-chatbot';
      legacy.setAttribute('data-legacy-id', 'esa-ingestion');
      legacy.setAttribute('aria-label', 'AI Chatbot Ingestion');
      // dual lookup: synthetic id map for getElementById('esa-ingestion')
      Object.defineProperty(legacy, 'id', {
        configurable: true,
        get() {
          return 'esa-ai-chatbot';
        },
        set() {},
      });
      // simpler approach: also set attribute and patch getElementById once
      primary = legacy;
    }

    if (primary) {
      primary.setAttribute('aria-label', 'AI Chatbot Ingestion');
      primary.classList.add('esa-ai-chatbot-root');
      // Ensure integration can still find #esa-ingestion
      if (!document.getElementById('esa-ingestion')) {
        primary.setAttribute('id', 'esa-ingestion');
        // visible name stays AI Chatbot Ingestion via aria-label
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', alias);
  } else {
    alias();
  }
})();
