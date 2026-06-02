---
outline: deep
---

# Getting started

This section walks you through the configuration needed to start using Software Metrics Machine.

## How it works

The project follows three steps:

1. Fetch data from providers (GitHub, GitLab, Jira, SonarQube, local Git)
2. Store the data in a structured way (JSON files)
3. Analyse and visualise the data

## Environment requirements

- Node.js 25+
- Java (required only for source code analysis via CodeMaat)

## Installing

```bash
npm i -g @smmachine/launcher
```

Once installed, run `smm` in your terminal to see available commands.

## Configuration approaches

Software Metrics Machine supports two configuration approaches depending on how you use it:

| Approach | Used by | How |
|---|---|---|
| `smm_config.json` file | CLI (`smm` commands) | JSON file in your data folder |
| Environment variables | REST API (`pnpm dev`) | Shell exports or `.env` |

Both approaches can be combined — environment variables serve as fallback for values not set in `smm_config.json`.

### CLI: smm_config.json

The CLI reads configuration from a JSON file located in the folder you designate for data storage.

**Step 1** — Set the data storage location:

```bash
export SMM_STORE_DATA_AT=/path/to/your/data/folder
```

Use an absolute path outside the cloned repository to avoid accidental data loss.

**Step 2** — Create `smm_config.json` in that folder:

```json
{
  "git_provider": "github",
  "github_token": "your_github_token",
  "github_repository": "owner/repo-name",
  "git_repository_location": "/absolute/path/to/local/repo"
}
```

A full list of supported config file keys is available at [Configuration options](./features/configuration.md).

**Step 3** — Verify your setup:

```bash
env | grep SMM_STORE_DATA_AT
smm --help
```

### REST API: environment variables

When running the REST API directly (e.g. with `pnpm dev`), configuration is provided via shell environment variables:

```bash
# GitHub
export GITHUB_TOKEN=ghp_your_token
export GITHUB_OWNER=your-org-or-username
export GITHUB_REPO=your-repo-name

# Data storage
export SMM_STORE_DATA_AT=/path/to/your/data/folder

# Optional: Jira
export JIRA_URL=https://jira.company.com
export JIRA_EMAIL=user@company.com
export JIRA_TOKEN=your_jira_token
export JIRA_PROJECT=PROJ

# Optional: SonarQube
export SONAR_URL=https://sonarqube.company.com
export SONAR_TOKEN=your_sonar_token
export SONAR_PROJECT=com.company:projectkey
```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for the complete variable reference.

## Ready to go

You are now ready to start using Software Metrics Machine. The next step is to pick a provider and start fetching data. Proceed to [your first analysis with GitHub](./your-first-analysis-with-github.md).

## Docker setup (optional)

> [!IMPORTANT]
> Using Docker is optional and requires Docker and Docker Compose to be installed.

A `docker-compose.yml` is provided at the repository root. It starts the REST API, the Next.js webapp, and SonarQube together.

Before starting, create the SonarQube data directories:

```bash
mkdir -p docker/sonar_data docker/sonar_extensions docker/sonar_logs
```

Then start all services:

```bash
SMM_STORE_DATA_AT=/path/to/your/data/folder docker-compose up
```

Services:
- Dashboard: `http://localhost:3000`
- REST API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/api/docs`
- SonarQube: `http://localhost:9000`
