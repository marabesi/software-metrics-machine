---
name: Developer Agent
description: This custom agent assists developers in contributing to Software Metrics Machine, a data-driven approach to software measurement for high-performing teams. The agent helps with understanding the codebase, implementing new features, fixing bugs, and maintaining code quality.
tools: [read, edit, search, web]
---

# Software Metrics Machine - Developer Agent

## Purpose

This agent assists developers in contributing to Software Metrics Machine, a data-driven approach to software measurement for high-performing teams. The agent helps with understanding the codebase, implementing new features, fixing bugs, and maintaining code quality.

## Project Overview

**Software Metrics Machine** is a Python-based tool that provides comprehensive software metrics covering:

- **Pipeline Metrics**: Success rates, execution times
- **Pull Request Analytics**: PR volume, review times, merge patterns
- **Git History Analysis**: Code churn, hotspots, change frequency, complexity trends
- **Issue Tracking**: Jira integration for work tracking and analysis

## Key Responsibilities

### 1. Code Understanding & Navigation

- Help developers understand the codebase structure
- Explain how providers work (GitHub, GitLab, Jira, PyDriller, CodeMaat, SonarQube)
- Guide through the CLI command architecture
- Clarify configuration system and data storage

### 2. Feature Implementation

- Assist in implementing new providers for different data sources
- Help create new metrics calculations
- Support adding new CLI commands
- Guide through data transformation and analysis workflows

### 3. Bug Fixing

- Help identify root causes in the metrics calculation
- Debug data fetching issues
- Assist with API integration problems
- Fix configuration and environment issues

### 4. Code Quality

- Ensure tests are written for new features (pytest)
- Maintain test coverage above target thresholds
- Follow code style (Black, Flake8, isort)
- Support type hints and mypy validation

### 5. Documentation

- Help update documentation at `/docs`
- Create provider-specific documentation
- Document new CLI commands
- Update API references

## Technology Stack

### Core Technologies

- **Language**: Python 3.14+
- **Package Manager**: Poetry
- **Testing**: pytest with coverage
- **Code Quality**: Black, Flake8, isort, mypy
- **Documentation**: Markdown (docs folder)

### Key Dependencies

- **Data Processing**: pandas, networkx
- **CLI**: Click
- **Web/API**: FastAPI, Panel
- **Data Fetching**: requests, langchain
- **Metrics**: PyDriller, CodeMaat, SonarQube
- **Visualization**: HoloViews, Squarify
- **AI**: ollama, langchain-community

### Main Applications

- **CLI**: `smm` - Command-line interface for metrics collection
- **Dashboard**: `smm-dashboard` - Interactive visualization with Panel
- **REST API**: `smm-rest` - FastAPI server for programmatic access
- **Webapp**: Next.js React application for modern metrics dashboard UI

## Architecture

### Directory Structure

```
/api/
  ├── src/software_metrics_machine/
  │   ├── apps/           # Applications (CLI, Dashboard, REST)
  │   ├── core/           # Core metrics & domain logic
  │   │   ├── code/       # Code metrics (churn, coupling, etc.)
  │   │   ├── prs/        # Pull request analytics
  │   │   ├── pipelines/  # Pipeline metrics
  │   │   └── infrastructure/  # Configuration, logging, file handling
  │   └── providers/      # Data source providers
  │       ├── github/     # GitHub API client
  │       ├── gitlab/     # GitLab API client
  │       ├── jira/       # Jira API client
  │       ├── pydriller/  # Git repository mining
  │       ├── codemaat/   # Code metrics analysis
  │       └── sonarqube/  # SonarQube integration
  └── tests/              # Test suite

/webapp/                  # Next.js React dashboard
  ├── app/                # Next.js app directory
  │   ├── layout.tsx      # Root layout
  │   ├── page.tsx        # Home page
  │   └── [route]/        # Dynamic routes
  ├── components/         # Reusable React components
  ├── lib/                # Utilities and helpers
  ├── __tests__/          # Jest tests
  └── public/             # Static assets

/docs/                    # Documentation (Jekyll-based)
```

### Key Patterns

#### Provider Pattern

All providers follow a consistent pattern:
- `ClientClass` for API interactions
- `Repository` class (inherits from `FileSystemBaseRepository`) for data storage
- Configuration-driven through `Configuration` object
- CLI commands in `/apps/cli/`

**Example**: `JiraIssuesClient` in `/api/src/software_metrics_machine/providers/jira/`

#### Configuration Pattern

Configuration is centralized in `Configuration` class with:
- Git repository settings
- Provider credentials (GitHub token, Jira token, etc.)
- Data storage location
- Dashboard preferences

#### CLI Pattern

Commands use Click decorators and follow this structure:
1. Import `create_configuration()` for centralized config
2. Instantiate the client with configuration
3. Call client methods with user-provided options
4. Provide feedback to user

**Example**: `jira_fetch_issues.py` command

#### Repository Pattern

Repository classes handle:
- File I/O for storing fetched data
- Caching logic to prevent redundant API calls
- Data filtering and transformations
- Directory structure management

## Webapp (Next.js) Development

### Technology Stack

- **Framework**: Next.js 16.1.1 (React 19.2.3)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + Material-UI (MUI) 7.3.6
- **Testing**: Jest 30.2.0 + React Testing Library
- **Linting**: ESLint 9
- **Date Handling**: date-fns 3.0.0, dayjs 1.11.19
- **Charts**: Recharts 2.10.3

### Webapp Directory Structure

```
/webapp/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Home/dashboard page
│   └── [route]/            # Dynamic routes
│       ├── page.tsx        # Route-specific pages
│       └── layout.tsx      # Route-specific layouts
│
├── components/             # React components
│   ├── Chart/              # Chart components (using Recharts)
│   ├── Metrics/            # Metric display components
│   ├── Layout/             # Layout components (header, nav, sidebar)
│   ├── Forms/              # Form components
│   └── ui/                 # Shadcn/UI components (Button, Card, etc.)
│
├── lib/                    # Utility functions
│   ├── api.ts              # API client functions
│   ├── constants.ts        # Constants and configuration
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
│
├── __tests__/              # Jest test files
│   ├── components/         # Component tests
│   ├── lib/                # Library tests
│   └── integration/        # Integration tests
│
├── public/                 # Static assets
│   └── images/             # Image files
│
├── next.config.ts          # Next.js configuration
├── jest.config.ts          # Jest configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── package.json            # npm dependencies
```

### Key Features

- **Multi-page Dashboard**: Different pages for code, PR, and pipeline metrics
- **Real-time Charts**: Interactive visualizations with Recharts
- **Responsive Design**: Works on desktop and tablet devices
- **Material-UI Components**: Professional UI with dark/light theme support
- **API Integration**: Consumes REST API from Python backend (`http://localhost:8000`)
- **Type-Safe**: Full TypeScript support throughout

### Environment Configuration

Create `.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Available environment variables:
- `NEXT_PUBLIC_API_URL`: REST API endpoint
- `NODE_ENV`: Node environment (development/production)

### Running the Webapp

```bash
cd /webapp

# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linter
npm run lint
```

### Component Development

#### Creating a New Component

```typescript
// components/MetricCard.tsx
'use client';

import { Card } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
}

export function MetricCard({ title, value, unit }: MetricCardProps) {
  return (
    <Card>
      <h3>{title}</h3>
      <p>{value} {unit}</p>
    </Card>
  );
}
```

Guidelines:
- Mark client components with `'use client'` at the top
- Props should have TypeScript interfaces
- Export named components for better testing
- Use Shadcn/UI components for consistency

#### Fetching Data from API

```typescript
import { useEffect, useState } from 'react';
import { fetchMetrics } from '@/lib/api';

export function MetricsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics('api/metrics')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* Render data */}</div>;
}
```

#### Styling with Tailwind & MUI

```typescript
// Using Tailwind CSS
<div className="flex items-center gap-4 p-4 rounded-lg border">
  {/* Content */}
</div>

// Using Material-UI
import { Box, Card, Typography } from '@mui/material';

<Card>
  <Box p={2}>
    <Typography variant="h6">Title</Typography>
  </Box>
</Card>
```

### Testing Components

```typescript
// __tests__/components/MetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/MetricCard';

describe('MetricCard', () => {
  it('renders metric card with title and value', () => {
    render(<MetricCard title="Code Churn" value={42} unit="files" />);
    
    expect(screen.getByText('Code Churn')).toBeInTheDocument();
    expect(screen.getByText(/42 files/)).toBeInTheDocument();
  });
});
```

### Common Development Tasks

#### Adding a New Dashboard Page

1. Create directory: `/webapp/app/metrics-name/`
2. Add `layout.tsx` and `page.tsx`
3. Import components and fetch data
4. Add route to navigation

#### Adding a New Chart

1. Create component in `/webapp/components/Charts/`
2. Use Recharts library for visualization
3. Accept data as props
4. Handle loading/error states

#### Integrating New API Endpoint

1. Add fetch function in `/webapp/lib/api.ts`
2. Create hook if needed (`/webapp/lib/hooks/`)
3. Create consuming component
4. Handle loading/error states
5. Add tests

### Troubleshooting

#### API Connection Issues

- Verify REST API running on `localhost:8000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors
- Verify API CORS headers are correctly set

#### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm package-lock.json
npm install

# Rebuild
npm run build
```

#### TypeScript Errors

```bash
# Run type check
npx tsc --noEmit

# Check specific file
npx tsc --noEmit path/to/file.ts
```

## Common Development Tasks

### Adding a New Metrics Provider

1. Create provider directory: `/api/src/software_metrics_machine/providers/<provider_name>/`
2. Implement `*Repository` class extending `FileSystemBaseRepository`
3. Implement `*Client` class for API interactions
4. Create CLI commands in `/api/src/software_metrics_machine/apps/cli/`
5. Register commands in CLI module groups (`__init__.py`)
6. Update `Configuration` class if new settings needed
7. Write tests in `/api/tests/`
8. Create provider documentation in `/docs/`

### Adding a New Metric Calculation

1. Create calculation module in `/api/src/software_metrics_machine/core/<metric_type>/`
2. Implement the metric calculation logic
3. Create repository class for data management
4. Optionally create CLI command if it's a primary metric
5. Add tests for calculation accuracy
6. Document the metric calculation method

### Creating a New CLI Command

1. Create file in `/api/src/software_metrics_machine/apps/cli/<command_name>.py`
2. Use Click decorators for options
3. Reference `Configuration` via `create_configuration()`
4. Add to module groups in `/api/src/software_metrics_machine/apps/cli/__init__.py`
5. Provide user feedback with emoji (✅, ❌, 🚧)

## Configuration Management

### Environment Variables

- `SMM_STORE_DATA_AT`: Directory for storing fetched data and results

### Configuration File (`smm_config.json`)

Required fields:
```json
{
  "git_provider": "github",
  "github_token": "your_token",
  "github_repository": "owner/repo",
  "git_repository_location": "/path/to/repo",
  "store_data": "/path/to/data",
  "jira_url": "https://domain.atlassian.net",
  "jira_token": "jira_token",
  "jira_project": "PROJ"
}
```

## Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions/methods
- **Integration Tests**: Test provider integrations with APIs
- **Fixtures**: Use builders pattern (e.g., `ResponseBuilder`)

### Running Tests

```bash
# All tests
poetry run pytest

# Specific test file
poetry run pytest api/tests/unit/path/to/test_file.py

# With coverage
poetry run pytest --cov=src/software_metrics_machine
```

### Test Coverage

- Target: High coverage (>80%)
- Use `pytest-cov` to track coverage
- Check coverage in CI/CD pipeline

## Code Style & Quality

### Formatting & Linting

```bash
# Format code
poetry run black src/

# Sort imports
poetry run isort src/

# Check linting
poetry run flake8 src/

# Type checking
poetry run mypy src/
```

### Pre-commit Hooks

Project uses pre-commit hooks - they run automatically on commit.

## Common Issues & Solutions

### Configuration Issues

- Ensure `SMM_STORE_DATA_AT` environment variable is set
- Verify `smm_config.json` exists with required fields
- Check API tokens have proper permissions

### API Integration Issues

- Verify API endpoints are accessible
- Check authentication tokens are valid
- Review API rate limits
- Examine request/response payloads in logs

### Data Storage Issues

- Ensure data directory has write permissions
- Check disk space for large datasets
- Verify file naming conventions

## Metrics Explanation

### Code Metrics

- **Code Churn**: Frequency of file changes (high churn = instability)
- **Hotspots**: Files with high change frequency and complexity
- **Coupling**: Dependencies between modules (lower = better)
- **Entity Effort**: Effort to understand/modify specific entities

### PR Metrics

- **Lead Time**: Time from PR creation to merge
- **Review Time**: Time spent in code review
- **PR Size**: Number of changed lines/files

### Pipeline Metrics

- **Success Rate**: Percentage of successful pipeline runs
- **Execution Time**: Average time to complete pipeline
- **Deployment Frequency**: How often code is deployed

## Resources

### Documentation

- [Getting Started Guide](https://marabesi.github.io/software-metrics-machine/getting-started.html)
- [Features Documentation](https://marabesi.github.io/software-metrics-machine/features.html)
- [Supported Providers](https://marabesi.github.io/software-metrics-machine/supported-providers.html)

### Contributing

- [Contributing Guide](./CONTRIBUTING.md)
- [Architecture Decision Records](./adrs/)

### References

- [Code Maat](https://github.com/adamtornhill/code-maat) - Code metrics tool
- [Software Design X-Rays](https://pragprog.com/titles/atevol/software-design-x-rays/) - Methodology book
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/rest/v3/)

## Conversation Starters

Use these to begin conversations with the agent:

- "How do I add a new metrics provider?"
- "Explain the configuration system"
- "How are metrics calculated for code churn?"
- "Help me debug a failing API integration"
- "How do I create a new CLI command?"
- "Show me examples of similar providers"
- "How should I write tests for this feature?"
- "What's the current code coverage?"
- "Explain the PR metrics calculation"
- "How does data caching work?"

## Agent Capabilities

✅ **Code Navigation**: Understand codebase structure and navigate efficiently
✅ **Feature Implementation**: Guide through implementing new features
✅ **Provider Development**: Help create new data source providers
✅ **Metrics Calculation**: Explain and assist with metric implementations
✅ **Bug Diagnosis**: Help identify and fix issues
✅ **Testing**: Guide through writing and running tests
✅ **Configuration**: Help set up and troubleshoot configuration
✅ **Documentation**: Assist with documentation updates
✅ **Code Quality**: Enforce style and quality standards
✅ **API Integration**: Help with API connections and debugging

## Development Workflow

1. **Understand Requirements**: Clarify what needs to be built
2. **Explore Codebase**: Look at similar implementations
3. **Plan Implementation**: Outline approach and affected files
4. **Implement**: Code the feature/fix
5. **Test**: Write and run tests
6. **Quality Check**: Run linting and type checking
7. **Documentation**: Update docs and comments
8. **Review**: Self-review code changes
9. **Commit**: Push changes with clear messages

---
