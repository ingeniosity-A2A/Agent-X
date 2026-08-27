#!/usr/bin/env bash
# setup-termux.sh — Install the docs content ingestion pipeline on S26ULTRA via Termux
# Run: bash setup-termux.sh

set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}=== Docs Pipeline — Termux Setup ===${NC}"
echo ""

# 1. Install prerequisites
step="Install prerequisites"
echo -e "${CYAN}[1/5] $step...${NC}"
if ! command -v node &>/dev/null; then
  echo "  Installing Node.js..."
  pkg install -y nodejs-lts 2>/dev/null || pkg install -y nodejs
fi
if ! command -v curl &>/dev/null; then
  echo "  Installing curl..."
  pkg install -y curl
fi
if ! command -v jq &>/dev/null; then
  echo "  Installing jq..."
  pkg install -y jq
fi
echo "  Done."

# 2. Create project directory
step="Create project directory"
echo -e "${CYAN}[2/5] $step...${NC}"
DOCS_DIR="$HOME/docs-pipeline"
mkdir -p "$DOCS_DIR/bin"
echo "  Created: $DOCS_DIR"

# 3. Create package.json
step="Create package.json"
echo -e "${CYAN}[3/5] $step...${NC}"
cat > "$DOCS_DIR/package.json" << 'PKGJSON'
{
  "name": "docs-pipeline",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/server.js"
  },
  "dependencies": {
    "express": "^4.21.0"
  }
}
PKGJSON
echo "  Done."

# 4. Install Node dependencies
step="Install Node dependencies"
echo -e "${CYAN}[4/5] $step...${NC}"
cd "$DOCS_DIR" && npm install --production 2>&1 | tail -3
echo "  Done."

# 5. Create source files
echo -e "${CYAN}[5/5] Creating source files...${NC}"
mkdir -p "$DOCS_DIR/src"

cat > "$DOCS_DIR/src/config.js" << 'CONFIG'
export default {
  DOCS_TOKEN: process.env.DOCS_TOKEN || '',
  ORG_ID: process.env.DOCS_ORG_ID || '',
  SPACE_ID: process.env.DOCS_SPACE_ID || '',
  PORT: parseInt(process.env.PORT || '3456'),
  API_KEY: process.env.INGEST_API_KEY || '',
  SECTION_ROUTES: [
    {
      keywords: ['architecture', 'layer', 'foundation', 'substrate', 'design', 'structure', 'system'],
      parentId: '',
      sectionName: 'Core Concepts',
    },
    {
      keywords: ['api', 'endpoint', 'contract', 'semver', 'interface'],
      parentId: '',
      sectionName: 'API Reference',
    },
    {
      keywords: ['resilience', 'reliability', 'rate limit', 'circuit breaker', 'error recovery'],
      parentId: '',
      sectionName: 'Resilience & Reliability',
    },
    {
      keywords: ['telemetry', 'observability', 'monitoring', 'quack', 'airflow', 'dag'],
      parentId: '',
      sectionName: 'DevOps & Observability',
    },
    {
      keywords: ['quick start', 'getting started', 'install', 'setup', 'onboarding'],
      parentId: '',
      sectionName: 'Get Started',
    },
  ],
  DEFAULT_PARENT_ID: '',
  DEFAULT_SECTION_NAME: 'Core Concepts',
};
CONFIG

cat > "$DOCS_DIR/src/server.js" << 'SERVER'
import express from 'express';
import { pushToDocs, listPages } from './docs-publisher.js';
import config from './config.js';

const app = express();
app.use(express.json({ limit: '5mb' }));

function requireKey(req, res, next) {
  if (!config.API_KEY) return next();
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (!provided || provided !== config.API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

app.post('/ingest', requireKey, async (req, res) => {
  try {
    const { markdown, title, parent_id, emoji } = req.body;
    if (!markdown || typeof markdown !== 'string')
      return res.status(400).json({ error: 'Field "markdown" is required' });
    if (markdown.length < 10)
      return res.status(400).json({ error: 'Markdown too short (min 10 chars)' });
    const result = await pushToDocs({ markdown, title, parentId: parent_id, emoji });
    res.json({ status: 'published', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/pages', requireKey, async (_req, res) => {
  try {
    const pages = await listPages();
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', space: config.SPACE_ID });
});

app.listen(config.PORT, () => {
  console.log(`[ingest] Running on port ${config.PORT}`);
});
SERVER

echo "  Done."

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Set your token:"
echo "  export DOCS_TOKEN='your-token-here'"
echo ""
echo "Start the server:"
echo "  cd $DOCS_DIR && npm start"
echo ""
echo "Push content:"
echo "  docs-push myfile.md"
echo "  echo '# Hello' | docs-push -"
echo "  docs-push --section core-concepts myfile.md"
echo ""
echo "Or push directly via curl:"
echo "  curl -X POST http://localhost:3456/ingest \\
    -H 'Content-Type: application/json' \
    -d '{"markdown":"# Hello World\\nContent here"}'"