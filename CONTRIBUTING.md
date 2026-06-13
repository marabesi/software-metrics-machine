# Contributing to Software Metrics Machine

Thanks for contributing. This repository is a **pnpm TypeScript monorepo** with applications in `apps/*` and shared libraries in `packages/*`.

## Table of Contents

- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Development Workflows](#development-workflows)
- [Codebase Architecture](#codebase-architecture)
- [Testing](#testing)
- [Linting and Formatting](#linting-and-formatting)
- [Docker](#docker)
- [Pull Request Process](#pull-request-process)
- [Contribution Guidelines](#contribution-guidelines)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Requirements

| Tool    | Version    | Notes                          |
|---------|------------|--------------------------------|
| Node.js | `>=25.2.1` | See `.nvmrc` — use `nvm use`   |
| pnpm    | `>=10.0.0` | Exact: `10.34.1`               |
| Git     | any        |                                |

Optional:

- **Docker / Docker Compose** — for local SonarQube analysis or running the full stack in containers

### Quick environment check

```bash
node --version   # should be >=25.2.1
pnpm --version   # should be >=10.0.0
nvm use          # if using nvm, reads .nvmrc
```

## Project Structure

```
├── apps/
│   ├── cli/              # CLI application (@smmachine/cli)
│   ├── rest/             # REST API (@smmachine/rest, NestJS)
│   └── webapp/           # Next.js dashboard (@smmachine/webapp)
├── packages/
│   ├── core/             # Domain logic, providers, aggregates (@smmachine/core)
│   └── utils/            # Shared utilities — logging, JSON, date helpers (@smmachine/utils)
├── docs/
│   ├── adrs/             # Architecture Decision Records
│   ├── architecture/     # Architecture documentation
│   └── vitepress/        # VitePress documentation site
├── docker-compose.yml    # SonarQube + API + webapp containers
├── tsup.config.ts        # CLI bundler config
├── turbo.json            # Turborepo task runner config
├── pnpm-workspace.yaml   # Workspace definitions and dependency catalog
└── vitest.base.config.ts # Shared Vitest configuration
```

### Package responsibilities

- **`packages/utils`** — Logger, date formatting, JSON utilities. Zero dependencies on other workspace packages.
- **`packages/core`** — Domain types, service layer (PRs, pipelines, code analysis), git providers (GitHub/GitLab), infrastructure (configuration, file system cache, SonarQube, Jira, CodeMaat). Depends on `@smmachine/utils`.
- **`apps/cli`** — Commander.js CLI. Depends on `@smmachine/core` and `@smmachine/utils`.
- **`apps/rest`** — NestJS REST API. Depends on `@smmachine/core`.
- **`apps/webapp`** — Next.js 16 dashboard with MUI. Fetches from the REST API.

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/marabesi/software-metrics-machine
cd software-metrics-machine
pnpm install
```

pnpm installs all workspace packages and links cross-dependencies automatically.

### 2. Build packages (required before running anything)

```bash
# Build all workspace packages and apps
pnpm build
```

> **Important:** `packages/core` and `packages/utils` must be built before any app can use them. The root `turbo.json` handles this automatically via `dependsOn: ["^build"]`.

### 3. Verify it works

```bash
# Run all tests
pnpm test

# Run the CLI (after build)
node dist/index.cjs --help
```

## Configuration

### Environment variables

The project uses environment variables for configuration, consumed by the `Configuration` class in `packages/core/src/infrastructure/configuration.ts`. Key variables:

| Variable                 | Required | Description                                      |
|--------------------------|----------|--------------------------------------------------|
| `SMM_STORE_DATA_AT`      | Yes      | Path to cache directory for fetched data         |
| `GIT_PROVIDER`           | Yes      | `github` or `gitlab`                             |
| `GITHUB_TOKEN`           | For GitHub | GitHub personal access token                     |
| `GITHUB_REPOSITORY`      | For GitHub | `owner/repo` format                              |
| `GIT_REPOSITORY_LOCATION`| For local git | Path to local git repository                     |
| `GITLAB_TOKEN`           | For GitLab | GitLab personal access token                     |
| `SMM_DEV_MODE`           | No       | Set to `true` during CLI dev to use local scripts |

### Webapp environment

```bash
# apps/webapp/.env.local
SMM_REST_BASE_URL=http://localhost:8000
```

## Development Workflows

### CLI development

```bash
# Fast dev mode with tsx (no build step)
pnpm cli -- --help
pnpm cli -- prs summary

# Pass additional options
pnpm cli -- prs summary --start-date=2025-01-01 --output=json
```

The `pnpm cli` command runs `tsx src/index.ts` from `apps/cli` with `SMM_DEV_MODE=true`.

### REST API development

```bash
# Start the API on port 8000
pnpm --filter @smmachine/rest dev
```

This runs NestJS via `ts-node`. The API serves Swagger docs at `http://localhost:8000/api`.

### Webapp development

```bash
# Start the Next.js dashboard on port 3000
pnpm --filter @smmachine/webapp dev
```

Requires the REST API to be running.

### Running the full stack

```bash
# Starts both webapp (3000) and REST API (8000) concurrently
pnpm dev
```

### Dashboard (bundled)

```bash
# Start both bundled REST and webapp servers from the CLI
pnpm cli -- dashboard serve
```

### Documentation

```bash
# Start VitePress dev server
pnpm docs
```

Docs are served at `http://localhost:5173` by default.

### Targeted workspace commands

```bash
pnpm --filter @smmachine/core build
pnpm --filter @smmachine/cli test
pnpm --filter @smmachine/rest lint
pnpm --filter @smmachine/webapp build
```

### Common workflows

**Adding a new CLI command:**
1. Add domain logic to `packages/core/src/domain/` (service + types)
2. Add CLI command to `apps/cli/src/commands/`
3. Register it in `apps/cli/src/index.ts`
4. Add REST endpoint to `apps/rest/src/controllers/` (if needed)
5. Update VitePress docs in `docs/vitepress/features/`
6. Build and test: `pnpm build && pnpm test`

**Adding a new provider (e.g., a new git platform):**
1. Create provider client in `packages/core/src/providers/`
2. Implement the fetch repository interface
3. Wire it into the CLI command factory
4. Add configuration handling in `Configuration` class

## Codebase Architecture

### Dependency graph

```
@packages/utils  (no deps)
       ↓
@packages/core   (depends on @packages/utils)
       ↓
apps/cli  ────── apps/rest
                       ↓
                 apps/webapp
```

### Key patterns

- **Services** (`packages/core/src/domain/`) — Business logic, no I/O. Accept `PRFilters` and return domain types.
- **Repositories** (`packages/core/src/aggregates/` and `packages/core/src/providers/`) — Data access, caching. Read from local file cache or fetch from external APIs.
- **Factories** (`packages/core/src/aggregates/*-factory.ts`) — Wire configuration and create repository instances.
- **Commands** (`apps/cli/src/commands/`) — Commander.js command definitions. Thin layer that parses options and calls services.

### Module system

The monorepo uses a mix of module systems:

| Package     | Type     |
|-------------|----------|
| `apps/cli`  | CommonJS (for Node.js CLI distribution) |
| `apps/rest` | ESM via NestJS/ts-node |
| `apps/webapp` | ESM (Next.js) |
| `packages/core` | CommonJS |
| `packages/utils` | CommonJS |

## Testing

### Test framework

- **Vitest** (`^4.1.8`) — used by `apps/cli`, `apps/rest`, `packages/core`, `packages/utils`
- **Jest** — used by `apps/webapp` (via `next/jest`)

### Running tests

```bash
# All workspaces
pnpm test

# Single workspace
pnpm --filter @smmachine/core test
pnpm --filter @smmachine/cli test

# With coverage
pnpm --filter @smmachine/core test:coverage

# Watch mode
pnpm --filter @smmachine/core exec vitest --watch
```

### Test conventions

- Test files live in `__tests__/` directories within each workspace
- File pattern: `*.test.ts`
- Vitest globals are enabled (`describe`, `it`, `expect` available without import)
- Shared Vitest config lives in `vitest.base.config.ts`

### Writing tests

```typescript
// Example test structure
describe('PRsService', () => {
  it('calculates average open days correctly', async () => {
    // ...
  });
});
```

## Linting and Formatting

### ESLint

```bash
# All workspaces
pnpm lint

# Single workspace
pnpm --filter @smmachine/cli lint
```

Key rules (from `eslint.config.mjs`):
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/no-unused-vars`: error (prefix with `_` to ignore)
- `prettier/prettier`: error
- `no-console`: warn (only `console.warn` and `console.error` allowed)
- `@typescript-eslint/no-floating-promises`: error

### Prettier

```bash
# Check formatting
pnpm exec prettier --check .

# Fix formatting
pnpm exec prettier --write .

# Stage + fix (via lint-staged, runs automatically on commit)
```

Configuration (`.prettierrc.json`):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Pre-commit checks

Lint-staged runs automatically on commit via `.lintstagedrc.json`:
- `*.{ts,tsx}` → `eslint --fix` + `prettier --write`
- `*.{json,md}` → `prettier --write`

## Docker

The project includes Docker support for running services locally.

### docker-compose.yml

```bash
# Start full stack (SonarQube + API + webapp)
docker compose up

# Start only SonarQube (for local code analysis)
docker compose up sonarqube
```

Services:
- **SonarQube** — port 9000, `sonarqube:10-community`
- **API** — port 8000, `node:25-slim`
- **Webapp** — port 3000, `node:25-slim`

### CLI command for SonarQube analysis

```bash
# Run local SonarQube analysis via Docker
smm sonarqube analysis run
```

## Pull Request Process

### Checklist before opening

1. Branch is rebased or up to date with `main`.
2. Run `pnpm test` — all tests pass.
3. Run `pnpm lint` — no errors (warnings are acceptable).
4. Run `pnpm build` — builds successfully.
5. Relevant documentation is updated (`docs/vitepress/`).
6. New CLI commands are documented in `docs/vitepress/features/`.

### Pre-submission sanity check

```bash
pnpm test
pnpm run clean:full && pnpm install && pnpm run build
```

> `clean:full` removes all `node_modules` and performs a clean install. Use it to verify your changes work in a fresh environment.

### PR description template

```
## What changed
[Describe the changes in 1-2 sentences]

## Why it changed
[Motivation, bug reference, or feature request link]

## How it was validated
[Test output, manual verification steps, screenshots]
```

### Review process

Maintainers will review your PR and may request changes. Please:

- Address feedback with follow-up commits (no need to squash).
- Keep discussions focused on the code.
- Respond to reviews in a timely manner.

### After merge

Your changes will be included in the next release. The package is published to npm as `@smmachine/launcher`.

## Contribution Guidelines

- Keep changes focused and scoped to a single feature or fix.
- Add or update tests for behavior changes.
- Update docs when public behavior, commands, or architecture changes.
- Preserve existing project conventions and folder boundaries.
- Follow the existing module system (CommonJS for CLI/core/utils, ESM for webapp).
- Do not add new runtime dependencies without discussion.
- Use the pnpm catalog (`pnpm-workspace.yaml`) for dependency versions instead of hardcoding them.

### What not to do

- Do not commit secrets, tokens, or `.env` files.
- Do not add files to the npm package without updating `package.json` `files` field.
- Do not change the module system of existing packages (CJS ↔ ESM) without discussion.
- Do not introduce new build tools without a clear rationale.

## Troubleshooting

### Build failures after pulling changes

```bash
pnpm install                    # Update lockfile if dependencies changed
pnpm build                      # Full rebuild
```

### "Cannot find module @smmachine/core"

The workspace packages need to be built first:

```bash
pnpm --filter @smmachine/utils build
pnpm --filter @smmachine/core build
```

### ESLint errors on code you didn't change

```bash
pnpm run lint -- --fix                      # Re-run lint
```

### Tests failing due to missing test data

Some tests require cached data in `SMM_STORE_DATA_AT`. Set it to a directory with pre-fetched data, or run the corresponding fetch commands first:

```bash
SMM_STORE_DATA_AT=./.data smm prs fetch
SMM_STORE_DATA_AT=./.data smm pipelines fetch
```

### pnpm version mismatch

```bash
corepack enable
corepack prepare pnpm@10.34.1 --activate
```

## License

MIT — by contributing, you agree your contributions are licensed under the repository license. See [LICENSE](LICENSE).
