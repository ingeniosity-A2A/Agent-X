/**
 * Prefer id=ai-chatbot. Keep legacy esa-ingestion / esa-ai-chatbot mounts
 * working for ESA.Ingestion.mount and existing integrations.
 */
(function () {
  var PREFERRED = 'ai-chatbot';
  var LEGACY = 'esa-ingestion';

  function alias() {
    var primary =
      document.getElementById(PREFERRED) ||
      document.getElementById('esa-ai-chatbot');
    var legacy = document.getElementById(LEGACY);

    if (!primary && legacy) primary = legacy;

    if (primary) {
      primary.setAttribute('aria-label', 'AI Chatbot Ingestion');
      primary.classList.add('ai-chatbot-root');

      // Legacy ESA.Ingestion.mount lookup → resolve to the preferred node
      if (!legacy && primary.id !== LEGACY) {
        var nativeGetById = document.getElementById.bind(document);
        document.getElementById = function (id) {
          return id === LEGACY ? primary : nativeGetById(id);
        };
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', alias);
  } else {
    alias();
  }
})();
