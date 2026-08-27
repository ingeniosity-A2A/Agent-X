/**
 * Docs Publisher — content publishing interface.
 *
 * This module provides the publishing contract for the docs pipeline.
 * The underlying publishing backend is pluggable — replace the
 * implementation below with whichever docs platform you target.
 */
import config from './config.js';

/**
 * Extract the first H1 or derive a title from the first line.
 */
function extractTitle(markdown) {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  const firstLine = markdown.split('\n').find(l => l.trim().length > 0);
  return firstLine ? firstLine.replace(/^#+\s*/, '').slice(0, 80) : 'Untitled Page';
}

/**
 * Score each section route against the content.
 * Returns { parentId, sectionName, confidence }.
 */
function routeToSection(markdown) {
  const lower = markdown.toLowerCase();
  let best = { parentId: config.DEFAULT_PARENT_ID, sectionName: config.DEFAULT_SECTION_NAME, confidence: 0 };

  for (const route of config.SECTION_ROUTES) {
    let score = 0;
    for (const kw of route.keywords) {
      const occurrences = lower.split(kw.toLowerCase()).length - 1;
      score += occurrences;
    }
    if (score > best.confidence) {
      best = { parentId: route.parentId, sectionName: route.sectionName, confidence: score };
    }
  }
  return best;
}

/**
 * Push markdown content to docs platform.
 *
 * @param {object} opts
 * @param {string} opts.markdown - Full markdown content
 * @param {string} [opts.parentId] - Override auto-detected parent
 * @param {string} [opts.title] - Override extracted title
 * @param {string} [opts.emoji] - Page emoji
 * @returns {Promise<object>} - { url, pageId, crNumber, section, title }
 */
export async function pushToDocs({ markdown, parentId, title, emoji } = {}) {
  // 1. Extract title and route to section
  const detectedTitle = title || extractTitle(markdown);
  const route = parentId
    ? { parentId, sectionName: 'Manual', confidence: -1 }
    : routeToSection(markdown);

  console.log(`[ingest] Title: "${detectedTitle}"`);
  console.log(`[ingest] Section: ${route.sectionName} (${route.parentId})`);

  // TODO: Wire to your publishing backend (Confluence, Notion, internal wiki, etc.)
  // The previous SaaS GitBook integration has been removed.
  // Replace this stub with your target platform's API calls.

  const slug = detectedTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  console.log(`[ingest] Stub publish: /docs/${slug}`);

  return {
    url: `/docs/${slug}`,
    pageId: null,
    crNumber: null,
    section: route.sectionName,
    title: detectedTitle,
  };
}

/**
 * List current page tree.
 */
export async function listPages() {
  // TODO: Replace with your publishing backend's page listing API
  console.log('[ingest] listPages: stub — no backend configured');
  return [];
}

/**
 * Search content across the docs space.
 */
export async function searchSpace(query) {
  // TODO: Replace with your publishing backend's search API
  console.log(`[ingest] searchSpace("${query}"): stub — no backend configured`);
  return { results: [] };
}
