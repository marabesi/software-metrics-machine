# Contributing to Software Metrics Machine

Thanks for contributing. This repository is a **pnpm TypeScript monorepo** with applications in `apps/*` and shared libraries in `packages/*`.

## Requirements

- Node.js `>=25.2.1`
- pnpm `>=10.0.0`
- Git

Optional (only for specific workflows like local container runs):

- Docker / Docker Compose

## Project Structure

Main workspace layout:

- `apps/cli`: CLI application (`@smmachine/cli`)
- `apps/rest`: REST API (`@smmachine/rest`)
- `apps/webapp`: Next.js dashboard (`@smmachine/webapp`)
- `packages/core`: Core domain logic (`@smmachine/core`)
- `packages/utils`: Shared helpers (`@smmachine/utils`)
- `docs/`: Documentation (including architecture docs)

See architecture documentation in `docs/architecture`.

## Getting Started

1. Fork and clone your fork:

```bash
git clone https://github.com/marabesi/software-metrics-machine
cd software-metrics-machine
```

2. Install dependencies from the monorepo root:

```bash
pnpm install
```

3. Create a branch:

```bash
git checkout -b feature/your-feature-name
```

## Development Commands

Run these from the repository root.

### Full workspace

```bash
# Build all workspace packages/apps
pnpm build

# Run tests in all workspaces
pnpm test
```

### Local API + dashboard development

```bash
# Starts webapp (port 3000) and REST API (port 8000)
pnpm dev
```

### CLI development

```bash
# Run CLI in dev mode
pnpm cli
```

### Targeted workspace commands

```bash
# Examples
pnpm --filter @smmachine/rest test
pnpm --filter @smmachine/core test
pnpm --filter @smmachine/webapp build
```

## Contribution Guidelines

- Keep changes focused and scoped to the feature/fix.
- Add or update tests for behavior changes.
- Update docs when public behavior, commands, or architecture changes.
- Preserve existing project conventions and folder boundaries.

Before opening a PR, at minimum run:

```bash
pnpm test
pnpm run clean:full && pnpm i && pnpm run build
```

## Pull Request Checklist

1. Branch is rebased or up to date with `main`.
2. Tests pass locally.
3. Relevant documentation is updated.
4. PR description explains:
   - what changed
   - why it changed
   - how it was validated

## Review Process

Maintainers will review your PR and may request changes. Please address feedback with follow-up commits.

## License

By contributing, you agree your contributions are licensed under the repository license.
