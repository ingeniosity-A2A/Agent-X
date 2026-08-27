export default {
  // Docs Platform
  DOCS_TOKEN: process.env.DOCS_TOKEN || '',
  ORG_ID: 'kEtFqhOnKKt9SlUCIoOK',
  SPACE_ID: 'LCd2u1aRmF4jn2dyr5SL',
  SITE_ID: 'site_mYwWQ',

  // Server
  PORT: parseInt(process.env.PORT || '3456'),
  API_KEY: process.env.INGEST_API_KEY || '',

  // Section routing: keywords → parent page ID
  // Add new entries here to create new filing targets
  SECTION_ROUTES: [
    {
      keywords: ['architecture', 'layer', 'foundation', 'substrate', 'design', 'structure', 'system'],
      parentId: '0b6iTnqcd7QTBNhA9G4e', // Core Concepts
      sectionName: 'Core Concepts',
    },
    {
      keywords: ['api', 'endpoint', 'contract', 'semver', 'interface'],
      parentId: 'QTzQCGGI058DhqctVw4r', // API Reference
      sectionName: 'API Reference',
    },
    {
      keywords: ['resilience', 'reliability', 'rate limit', 'circuit breaker', 'error recovery', 'retry'],
      parentId: 'CxP45m6MOmVtFBIExjOD', // Resilience & Reliability
      sectionName: 'Resilience & Reliability',
    },
    {
      keywords: ['telemetry', 'observability', 'monitoring', 'quack', 'airflow', 'dag', 'cot', 'scrubbing'],
      parentId: 'UowUJ12We71JI7qsiRir', // DevOps & Observability
      sectionName: 'DevOps & Observability',
    },
    {
      keywords: ['quick start', 'getting started', 'install', 'setup', 'onboarding', 'introduction'],
      parentId: 'q4XBows54cHqvvkfz4Ti', // Get Started (section)
      sectionName: 'Get Started',
    },
  ],

  // Default parent if no keywords match
  DEFAULT_PARENT_ID: '0b6iTnqcd7QTBNhA9G4e', // Core Concepts
  DEFAULT_SECTION_NAME: 'Core Concepts',
};
