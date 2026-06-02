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

3. Copy the webapp environment file:

```bash
cp apps/webapp/.env.local.example apps/webapp/.env.local
```

The default value (`SMM_REST_BASE_URL=http://localhost:8000`) works for local development without changes.

4. Export environment variables for the providers you want to use. At minimum, one provider must be configured. Example using GitHub:

```bash
export GITHUB_TOKEN=ghp_your_token
export GITHUB_OWNER=your-org-or-username
export GITHUB_REPO=your-repo-name
```

Full list of supported variables:

| Variable | Provider | Description |
|---|---|---|
| `GITHUB_TOKEN` | GitHub | Personal access token |
| `GITHUB_OWNER` | GitHub | Organisation or username |
| `GITHUB_REPO` | GitHub | Repository name |
| `JIRA_URL` | Jira | Base URL of your Jira instance |
| `JIRA_EMAIL` | Jira | Account email |
| `JIRA_TOKEN` | Jira | API token |
| `JIRA_PROJECT` | Jira | Project key (e.g. `PROJ`) |
| `SONARQUBE_URL` | SonarQube | Base URL of your SonarQube instance |
| `SONARQUBE_TOKEN` | SonarQube | API token |
| `SONARQUBE_PROJECT` | SonarQube | Project key |
| `GIT_REPOSITORY_PATH` | Git | Absolute path to the local git repository |
| `CODEMAAT_DATA_PATH` | CodeMaat | Path to CodeMaat CSV output files |
| `SMM_STORE_DATA_AT` | General | Directory where SMM stores fetched data |
| `OUTPUT_DIR` | General | Directory for CLI output files |
| `PORT` | REST API | Port for the REST API (default: `8000`) |

Only variables for providers you actually use are required — unconfigured providers are gracefully skipped.

5. Create a branch:

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

### Docker Compose (optional)

A `docker-compose.yml` is provided at the repository root. It starts the REST API, the Next.js webapp, and a local SonarQube instance together.

Before running Docker Compose for the first time, create the SonarQube data directories that are mounted as volumes:

```bash
mkdir -p docker/sonar_data docker/sonar_extensions docker/sonar_logs
```

Then start all services:

```bash
export SMM_STORE_DATA_AT=/path/to/your/data/folder
docker-compose up
```

Services started:

| Service | URL |
|---|---|
| Dashboard (webapp) | http://localhost:3000 |
| REST API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/docs |
| SonarQube | http://localhost:9000 |

> The `docker/sonar_*` directories are excluded from version control (`.gitignore`). They must be created manually on each new clone.

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
