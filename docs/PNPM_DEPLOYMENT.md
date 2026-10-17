# pnpm install and deployment map

All JavaScript projects pin pnpm 12.10.0 and Node.js 22.13+. Runtime choices (including Bun for the platform's production server) remain unchanged: pnpm installs packages and runs package scripts.

## First migration install

### Platform workspace

```sh
cd platform
corepack enable
corepack prepare pnpm@12.10.0 --activate
pnpm install
pnpm run build
```

The platform already has `pnpm-workspace.yaml` and `pnpm-lock.yaml`. Keep its lockfile authoritative; the legacy `bun.lock` is not used for installs and should only be removed after the migration review.

### ESA service cards

```sh
cd esa-exoskeleton
corepack prepare pnpm@12.10.0 --activate
pnpm install
pnpm run build
pnpm run dev
```

This package has no committed lockfile yet. Commit the generated `pnpm-lock.yaml` before using `pnpm install --frozen-lockfile` in CI or Cloudflare deployment.

### Document ingestion service

```sh
cd modules/document-ingestion/docs-pipeline
corepack prepare pnpm@12.10.0 --activate
pnpm import
pnpm install
pnpm start
```

Here `pnpm import` migrates the existing npm lockfile. Review and commit the generated pnpm lockfile; then require frozen installs in CI.

## Platform deployment

From `platform/`, use `pnpm install --frozen-lockfile`, `pnpm run build`, then `pnpm start` on the deployment host. The start script intentionally invokes Bun for the existing standalone Next.js runtime. Keep standalone service roots independent; do not move them into the platform workspace. Secrets belong in deployment environment variables, not package scripts or committed files.


Shared package-manager guidance: [pnpm Skill](https://github.com/ingeniosity-A2A/a2a-exoskeleton/blob/pnpm/12.10.0-readiness/.agents/skills/pnpm/SKILL.md) (includes the release blog and upstream migration/performance references).
