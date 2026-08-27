import express from 'express';
import { pushToDocs, listPages, searchSpace } from './docs-publisher.js';
import config from './config.js';

const app = express();
app.use(express.json({ limit: '5mb' }));

// ---------- API key middleware ----------
function requireKey(req, res, next) {
  if (!config.API_KEY) return next(); // no key = open
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (!provided || provided !== config.API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

// ---------- POST /ingest ----------
// Primary endpoint: push markdown to docs platform
app.post('/ingest', requireKey, async (req, res) => {
  try {
    const { markdown, title, parent_id, emoji } = req.body;

    if (!markdown || typeof markdown !== 'string') {
      return res.status(400).json({ error: 'Field "markdown" is required (string)' });
    }
    if (markdown.length < 10) {
      return res.status(400).json({ error: 'Markdown content too short (min 10 chars)' });
    }

    const result = await pushToDocs({
      markdown,
      title,
      parentId: parent_id,
      emoji,
    });

    res.json({ status: 'published', ...result });
  } catch (err) {
    console.error('[ingest] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET /pages ----------
// List all pages in the space
app.get('/pages', requireKey, async (_req, res) => {
  try {
    const pages = await listPages();
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET /search?q=... ----------
app.get('/search', requireKey, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    const results = await searchSpace(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET /health ----------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', space: config.SPACE_ID, site: config.SITE_ID });
});

// ---------- Start ----------
app.listen(config.PORT, () => {
  console.log(`[ingest] Content Ingestion API running on port ${config.PORT}`);
  console.log(`[ingest] POST /ingest  — push markdown to docs`);
  console.log(`[ingest] GET  /pages  — list all pages`);
  console.log(`[ingest] GET  /search  — search content`);
  if (!config.DOCS_TOKEN) {
    console.warn('[ingest] WARNING: DOCS_TOKEN not set — API calls will fail');
  }
});
