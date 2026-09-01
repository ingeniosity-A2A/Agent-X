# Restore AI Chatbot Ingestion (if component was truncated)

```bash
cd Agent-X
git fetch origin
git checkout 27cd692b6c3eabd25dad31c2b705415502061ef4 -- \
  esa-exoskeleton/public/esa-console/components/ESAIngestionChat.js

# Strip ESA from chatbot-visible titles only
sed -i \
  -e 's/🤖 ESA AGENT/🤖 AGENT/g' \
  -e 's/ESA CONTENT ONLY/HUB ACTIVE/g' \
  -e 's/AI INGESTION/Chat/g' \
  -e 's/alt="ESA lens capture"/alt="Lens capture"/g' \
  esa-exoskeleton/public/esa-console/components/ESAIngestionChat.js

git add esa-exoskeleton/public/esa-console/components/ESAIngestionChat.js
git commit -m "fix(esa): dual end-speakers + strip ESA chatbot titles [skip ci]"
git push origin main
```

## Wired layout (AI SDK PromptInput–style)

```
[ 🎤 speaker L ]  [ input / tools / send / tall lens ]  [ 🔊 speaker R ]
```

- Left speaker = Sound I (mic)
- Right speaker = Agent voice
- No **ESA** in chatbot chrome labels
- Service name **ESA** remains left nav only
- CSS: `ai-chatbot-dock.css` (`.ai-speaker`, `.ai-shell`, `.ai-lens`)
- Ref: https://elements.ai-sdk.dev/examples/chatbot
