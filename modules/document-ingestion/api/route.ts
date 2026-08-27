import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GitBookAPI } from '@gitbook/api';

const DOCS_TOKEN = process.env.DOCS_TOKEN || '';
const SPACE_ID = 'LCd2u1aRmF4jn2dyr5SL';

const SECTION_ROUTES: { keywords: string[]; parentId: string; sectionName: string }[] = [
  { keywords: ['architecture', 'layer', 'foundation', 'substrate', 'design', 'structure', 'system', 'orchestration'], parentId: '0b6iTnqcd7QTBNhA9G4e', sectionName: 'Core Concepts' },
  { keywords: ['api', 'endpoint', 'contract', 'semver', 'interface', 'specification', 'skill'], parentId: 'QTzQCGGI058DhqctVw4r', sectionName: 'API Reference' },
  { keywords: ['resilience', 'reliability', 'rate limit', 'circuit breaker', 'error recovery', 'retry'], parentId: 'CxP45m6MOmVtFBIExjOD', sectionName: 'Resilience & Reliability' },
  { keywords: ['telemetry', 'observability', 'monitoring', 'quack', 'airflow', 'dag', 'cot', 'scrubbing'], parentId: 'UowUJ12We71JI7qsiRir', sectionName: 'DevOps & Observability' },
  { keywords: ['quick start', 'getting started', 'install', 'setup', 'onboarding', 'introduction', 'overview'], parentId: 'q4XBows54cHqvvkfz4Ti', sectionName: 'Get Started' },
];

const DEFAULT_PARENT_ID = '0b6iTnqcd7QTBNhA9G4e';
const DEFAULT_SECTION = 'Core Concepts';

function extractTitle(markdown: string): string {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim().slice(0, 100);
  const first = markdown.split('\n').find(l => l.trim().length > 0);
  return first ? first.replace(/^#+\s*/, '').slice(0, 100) : 'Untitled Page';
}

function routeToSection(markdown: string): { parentId: string; sectionName: string } {
  const lower = markdown.toLowerCase();
  let best = { parentId: DEFAULT_PARENT_ID, sectionName: DEFAULT_SECTION, score: 0 };
  for (const route of SECTION_ROUTES) {
    let score = 0;
    for (const kw of route.keywords) {
      score += (lower.split(kw.toLowerCase()).length - 1);
    }
    if (score > best.score) {
      best = { parentId: route.parentId, sectionName: route.sectionName, score };
    }
  }
  return { parentId: best.parentId, sectionName: best.sectionName };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markdown, parentId: overrideParent, title: overrideTitle, emoji } = body;

    if (!markdown || markdown.trim().length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
    }

    if (!DOCS_TOKEN) {
      return NextResponse.json({ error: 'DOCS_TOKEN not configured' }, { status: 500 });
    }

    const title = overrideTitle || extractTitle(markdown);
    const route = overrideParent
      ? { parentId: overrideParent, sectionName: 'Manual' }
      : routeToSection(markdown);

    // Create DB record
    const record = await db.ingestionRecord.create({
      data: { title, section: route.sectionName, markdown, source: 'chat' },
    });

    // Update status to pushing
    await db.ingestionRecord.update({ where: { id: record.id }, data: { status: 'pushing' } });

    try {
      const api = new GitBookAPI({ authToken: DOCS_TOKEN });

      // 1. Create change request
      const cr = await api.spaces.createChangeRequest(SPACE_ID, {
        title: `Add: ${title}`,
      });
      const crId = cr.data.id;
      const crNumber = cr.data.number;

      // 2. Insert page
      const insertOp: Record<string, unknown> = {
        operation: 'insert_page',
        into: route.parentId,
        document: { markdown },
      };
      if (emoji) insertOp.emoji = emoji;

      await api.spaces.updateChangeRequestContent(SPACE_ID, crId, {
        changes: [insertOp],
      }, { compat: false });

      // 3. Merge
      await api.spaces.mergeChangeRequest(SPACE_ID, crId);

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Update DB record
      await db.ingestionRecord.update({
        where: { id: record.id },
        data: {
          status: 'merged',
          crNumber,
          crUrl: `/docs/${slug}`,
        },
      });

      return NextResponse.json({
        success: true,
        id: record.id,
        title,
        section: route.sectionName,
        crNumber,
        crUrl: `/docs/${slug}`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await db.ingestionRecord.update({
        where: { id: record.id },
        data: { status: 'failed', errorMessage: message.slice(0, 500) },
      });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const records = await db.ingestionRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(records);
}
