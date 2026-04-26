---
name: Developer Agent
description: Expert agent for Software Metrics Machine development. Maintains dual-module TypeScript/Node.js monorepo (ESM + CommonJS), Python metrics engine, NestJS REST API, Next.js webapp. Enforces critical build commands (CLI dev, webapp build, REST build), prevents package breakage, manages pnpm workspaces, and guides through metrics implementation, provider development, and architecture patterns.
tools: [read, edit, search, terminal]
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
/                               # Root (pnpm monorepo)
├── package.json               # Root package.json with workspace config
├── pnpm-workspace.yaml        # pnpm workspace definition
├── pnpm-lock.yaml             # Lockfile
├── tsconfig.json              # Base TypeScript config
│
├── packages/                  # Shared TypeScript packages
│   ├── core/                  # Core business logic (CommonJS)
│   │   ├── src/               # Source TypeScript files
│   │   │   ├── domain-types.ts        # Domain type definitions
│   │   │   ├── configuration.ts       # Configuration class
│   │   │   ├── repositories/          # Data repositories
│   │   │   │   ├── pull-requests.repository.ts
│   │   │   │   ├── pipelines.repository.ts
│   │   │   │   ├── code-metrics.repository.ts
│   │   │   │   ├── issues.repository.ts
│   │   │   │   └── quality-metrics.repository.ts
│   │   │   └── providers/             # Provider clients
│   │   │       ├── github/            # GitHub API clients
│   │   │       │   ├── github-clients.ts
│   │   │       │   └── index.ts
│   │   │       ├── git/               # Git analysis
│   │   │       │   ├── commit-traverser.ts
│   │   │       │   └── index.ts
│   │   │       ├── jira/              # Jira integration
│   │   │       │   ├── jira-client.ts
│   │   │       │   └── index.ts
│   │   │       ├── sonarqube/         # SonarQube integration
│   │   │       │   ├── sonarqube-client.ts
│   │   │       │   └── index.ts
│   │   │       └── codemaat/          # CodeMaat analysis
│   │   │           ├── codemaat-analyzer.ts
│   │   │           └── index.ts
│   │   ├── dist/              # Compiled CommonJS output
│   │   ├── __tests__/         # Unit tests
│   │   ├── package.json       # Package config (no "type": "module")
│   │   └── tsconfig.json      # TypeScript config (module: "commonjs")
│   │
│   └── utils/                 # Utility functions (CommonJS)
│       ├── src/               # Source TypeScript files
│       │   └── logger.ts      # Logger utilities
│       ├── dist/              # Compiled CommonJS output
│       ├── __tests__/         # Unit tests
│       ├── package.json       # Package config (no "type": "module")
│       └── tsconfig.json      # TypeScript config (module: "commonjs")
│
├── apps/                      # Application packages
│   ├── cli/                   # CLI application (ES modules)
│   │   ├── src/               # Source TypeScript files
│   │   │   ├── index.ts       # CLI entry point
│   │   │   └── commands/      # CLI commands
│   │   ├── __tests__/         # CLI tests
│   │   ├── package.json       # Package config ("type": "module")
│   │   ├── tsconfig.json      # TypeScript config (module: "esnext")
│   │   └── vitest.config.ts   # Vitest configuration
│   │
│   ├── rest/                  # REST API (NestJS, CommonJS)
│   │   ├── src/               # Source TypeScript files
│   │   │   ├── main.ts        # NestJS bootstrap
│   │   │   ├── app.module.ts  # Root module
│   │   │   ├── metrics.module.ts      # Metrics module
│   │   │   ├── metrics.controller.ts  # REST controllers
│   │   │   ├── metrics.service.ts     # Business logic
│   │   │   └── dto/           # Data Transfer Objects
│   │   │       ├── configuration.dto.ts
│   │   │       └── metrics-response.dto.ts
│   │   ├── dist/              # Compiled output
│   │   ├── __tests__/         # REST API tests
│   │   ├── package.json       # Package config (no "type": "module")
│   │   ├── tsconfig.json      # TypeScript config (module: "commonjs")
│   │   └── vitest.config.ts   # Vitest configuration
│   │
│   └── webapp/                # Next.js React dashboard (ES modules)
│       ├── app/               # Next.js App Router
│       │   ├── layout.tsx     # Root layout
│       │   ├── page.tsx       # Home page
│       │   └── dashboard/     # Dashboard routes
│       │       ├── page.tsx           # Dashboard overview
│       │       ├── pull-requests/     # PR metrics page
│       │       ├── pipelines/         # Pipeline metrics page
│       │       ├── source-code/       # Code metrics page
│       │       └── insights/          # Insights page
│       ├── components/        # React components
│       │   ├── Chart/         # Chart components (Recharts)
│       │   ├── Metrics/       # Metric display components
│       │   ├── Layout/        # Layout components
│       │   └── ui/            # Shadcn/UI components
│       ├── lib/               # Utilities and helpers
│       │   ├── api.ts         # API client functions
│       │   ├── types.ts       # TypeScript types
│       │   └── utils.ts       # Helper functions
│       ├── __tests__/         # Jest tests
│       ├── public/            # Static assets
│       ├── package.json       # Package config ("type": "module")
│       ├── next.config.ts     # Next.js configuration
│       ├── jest.config.ts     # Jest configuration
│       ├── tsconfig.json      # TypeScript configuration
│       └── tailwind.config.ts # Tailwind CSS configuration
│
├── api/                       # Python metrics engine
│   ├── src/software_metrics_machine/
│   │   ├── apps/              # Python applications
│   │   │   ├── cli/           # Python CLI (legacy)
│   │   │   ├── dashboard/     # Panel dashboard
│   │   │   └── rest/          # FastAPI REST (legacy)
│   │   ├── core/              # Core metrics & domain logic
│   │   │   ├── code/          # Code metrics
│   │   │   ├── prs/           # Pull request analytics
│   │   │   ├── pipelines/     # Pipeline metrics
│   │   │   └── infrastructure/ # Configuration, logging
│   │   └── providers/         # Python data providers
│   │       ├── github/        # GitHub API client
│   │       ├── gitlab/        # GitLab API client
│   │       ├── jira/          # Jira API client
│   │       ├── pydriller/     # Git repository mining
│   │       ├── codemaat/      # Code metrics analysis
│   │       └── sonarqube/     # SonarQube integration
│   ├── tests/                 # Python test suite
│   ├── pyproject.toml         # Poetry configuration
│   └── pytest.ini             # Pytest configuration
│
├── docs/                      # Documentation (Jekyll-based)
│   ├── index.md               # Documentation home
│   ├── getting-started.md     # Getting started guide
│   ├── features/              # Feature documentation
│   └── build/                 # Built documentation
│
├── e2e/                       # End-to-end tests
├── scripts/                   # Build and deployment scripts
└── .github/                   # GitHub configuration
    └── agents/                # Custom GitHub Copilot agents
        └── developer-agent.md # This agent
```

**Key Directory Relationships**:
- `packages/*` - Compiled to `dist/` folders, consumed by `apps/*`
- `apps/cli` - Imports from `@smm/core` and `@smm/utils` (ESM → CJS)
- `apps/rest` - Imports from `@smm/core` and `@smm/utils` (CJS → CJS)
- `apps/webapp` - Imports from `@smm/core` and `@smm/utils` (ESM → CJS)
- `api/` - Independent Python codebase, shares data with TypeScript apps

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
/apps/webapp/
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
cd /apps/webapp

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

1. Create directory: `/apps/webapp/app/metrics-name/`
2. Add `layout.tsx` and `page.tsx`
3. Import components and fetch data
4. Add route to navigation

#### Adding a New Chart

1. Create component in `/apps/webapp/components/Charts/`
2. Use Recharts library for visualization
3. Accept data as props
4. Handle loading/error states

#### Integrating New API Endpoint

1. Add fetch function in `/apps/webapp/lib/api.ts`
2. Create hook if needed (`/apps/webapp/lib/hooks/`)
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

## TypeScript Monorepo Architecture

### ⚠️ CRITICAL: Mandatory Testing Commands

**Before ANY change to packages or apps, these three commands MUST work:**

```bash
# 1. CLI development mode (ES modules + tsx)
pnpm --filter=cli run dev

# 2. Webapp production build (Next.js)
pnpm --filter=webapp run build

# 3. REST API production build (NestJS)
pnpm --filter=rest run build
```

**If ANY of these commands fail after your changes, you MUST fix them immediately.**

### Monorepo Structure

The project uses pnpm workspaces with a dual-module architecture:

```
/packages/
  ├── core/           # Business logic (compiles to CommonJS)
  ├── utils/          # Utilities (compiles to CommonJS)

/apps/
  ├── cli/            # CLI app (uses ES modules + tsx)
  ├── rest/           # REST API (uses CommonJS + ts-node)
  ├── webapp/         # Next.js app (uses ES modules)
```

### Dual-Module Architecture Explained

**Why Dual Modules?**
- **CLI** requires ES modules (`import/export`) for modern tooling (tsx)
- **REST API** requires CommonJS (`require`) for NestJS + Swagger decorators
- **Webapp** uses ES modules for Next.js + React
- **Core/Utils** compile to CommonJS to be consumable by ALL apps

**Key Principle**: CommonJS compiled output can be imported by both ESM and CJS consumers.

### Package Configuration Patterns

#### Core & Utils Packages (CommonJS Compilation)

**packages/core/package.json**:
```json
{
  "name": "@smm/core",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./domain-types": {
      "require": "./dist/domain-types.js",
      "import": "./dist/domain-types.js",
      "types": "./dist/domain-types.d.ts"
    }
  }
}
```

**Key Rules**:
- ❌ **NEVER** add `"type": "module"` to core/utils
- ❌ **NEVER** include `"src"` in the `"files"` array
- ✅ Only expose `"dist"` folder to consumers
- ✅ Both `require` and `import` point to the same compiled output

**packages/core/tsconfig.json**:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES2022",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": false,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

**Key Rules**:
- ✅ Always use `"module": "commonjs"`
- ✅ Set `"declarationMap": false` to prevent src references
- ❌ **NEVER** change to `"module": "esnext"` or `"module": "nodenext"`

**Build Commands**:
```bash
# Build core package
pnpm --filter=@smm/core build

# Build utils package
pnpm --filter=@smm/utils build

# Build both
pnpm --filter=@smm/utils build && pnpm --filter=@smm/core build
```

#### CLI Application (ES Modules)

**apps/cli/package.json**:
```json
{
  "name": "@smm/cli",
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc"
  }
}
```

**Key Features**:
- ✅ Uses `"type": "module"` for ES modules
- ✅ Runtime: `tsx` (TypeScript execution for ESM)
- ✅ Imports compiled output from core/utils dist folders
- ✅ Uses `.js` extensions in import paths

**apps/cli/tsconfig.json**:
```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

#### REST API Application (CommonJS)

**apps/rest/package.json**:
```json
{
  "name": "@smm/rest",
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc --outDir dist || true"
  }
}
```

**Key Features**:
- ✅ NO `"type": "module"` (defaults to CommonJS)
- ✅ Runtime: `ts-node` with `transpileOnly: true`
- ✅ Build uses `|| true` to allow completion despite type warnings
- ✅ Imports compiled output from core/utils dist folders

**apps/rest/tsconfig.json**:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES2022",
    "outDir": "./dist",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "ts-node": {
    "transpileOnly": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "__tests__",
    "../../packages/*/src"
  ]
}
```

**Key Rules**:
- ✅ `transpileOnly: true` prevents type checking workspace dependencies
- ✅ Exclude `packages/*/src` to prevent duplicate type declarations
- ✅ Build script uses `|| true` to suppress non-zero exit codes
- ❌ **NEVER** remove `transpileOnly` - it's required for dev mode

**Why the `|| true` workaround?**
The REST API build has cosmetic type errors (TypeScript sees both src and dist of core package, creating duplicate declarations). The compiled output works correctly at runtime. The `|| true` allows CI/CD to pass while still generating the dist folder.

#### Webapp Application (Next.js)

**apps/webapp/package.json**:
```json
{
  "name": "@smm/webapp",
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start"
  }
}
```

**apps/webapp/jest.config.ts**:
```typescript
const config: Config = {
  // ... config
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
  ],
};

// Cast to any to bypass type compatibility issues with Next.js
export default createJestConfig(config as any);
```

### Critical Rules to Prevent Breaking Packages

#### 1. Never Change Core/Utils Module System

❌ **NEVER DO THIS**:
```json
// packages/core/package.json
{
  "type": "module"  // ❌ BREAKS REST API
}
```

❌ **NEVER DO THIS**:
```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "module": "esnext"  // ❌ BREAKS REST API
  }
}
```

✅ **ALWAYS DO THIS**:
```json
// packages/core/package.json
{
  // No "type" field (defaults to CommonJS)
  "files": ["dist"]  // Only expose compiled output
}
```

```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declarationMap": false
  }
}
```

#### 2. Never Import from Source Files

❌ **WRONG**:
```typescript
// apps/rest/src/main.ts
import { Configuration } from '@smm/core/src/configuration';
```

✅ **CORRECT**:
```typescript
// apps/rest/src/main.ts
import { Configuration } from '@smm/core';
```

#### 3. Always Test All Three Commands After Changes

```bash
# Run this sequence after ANY package change:

# 1. Rebuild core/utils
pnpm --filter=@smm/utils build && pnpm --filter=@smm/core build

# 2. Test CLI
pnpm --filter=cli run dev
# Press Ctrl+C after confirming it starts

# 3. Test REST build
pnpm --filter=rest run build
# Should complete with exit code 0 (may show type warnings)

# 4. Test webapp build
pnpm --filter=webapp run build
# Should complete successfully
```

#### 4. Maintain Package Build Order

Core and utils must be built BEFORE apps can run:

```bash
# Correct order
pnpm --filter=@smm/utils build
pnpm --filter=@smm/core build
pnpm --filter=rest run dev

# Wrong order (will fail)
pnpm --filter=rest run dev  # ❌ dist folders don't exist yet
```

### Common Development Scenarios

#### Scenario 1: Adding New Code to Core Package

```bash
# 1. Edit files in packages/core/src/
# 2. Rebuild core
pnpm --filter=@smm/core build

# 3. Test all three mandatory commands
pnpm --filter=cli run dev          # Must work
pnpm --filter=webapp run build     # Must work
pnpm --filter=rest run build       # Must work
```

#### Scenario 2: Adding New Dependency to Core

```bash
# 1. Add dependency
cd packages/core
pnpm add some-package

# 2. Use in code
# 3. Rebuild
pnpm --filter=@smm/core build

# 4. Test consumers
pnpm --filter=cli run dev
pnpm --filter=rest run dev
```

#### Scenario 3: Fixing REST API Issues

```bash
# Development mode (fast, no type checking)
pnpm --filter=rest run dev

# If it works in dev but fails in build:
# - Check for duplicate type declarations
# - Verify transpileOnly is enabled
# - Ensure packages/*/src is excluded in tsconfig
```

#### Scenario 4: Fixing CLI Issues

```bash
# If CLI fails to start:
# 1. Verify core/utils are built
pnpm --filter=@smm/core build
pnpm --filter=@smm/utils build

# 2. Check for .js extensions in imports
# CLI requires explicit .js extensions in import paths

# 3. Verify tsx is working
pnpm tsx --version
```

### Troubleshooting Module Architecture Issues

#### Issue: "Cannot find module '@smm/core'"

**Cause**: Core package not built or not properly linked

**Solution**:
```bash
# Build core package
pnpm --filter=@smm/core build

# Verify pnpm workspace links
pnpm install
```

#### Issue: "require() of ES Module not supported"

**Cause**: Trying to require an ES module from CommonJS context

**Solution**: Ensure core/utils use CommonJS compilation:
```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs"  // ✅ Not "esnext"
  }
}
```

#### Issue: REST build fails with "duplicate class declarations"

**Cause**: TypeScript sees both packages/core/src and packages/core/dist

**Current Solution**: The `|| true` workaround allows build to complete
```json
// apps/rest/package.json
{
  "scripts": {
    "build": "tsc --outDir dist || true"
  }
}
```

**Why it works**: The type errors are cosmetic. The compiled JavaScript works correctly because ts-node with `transpileOnly: true` skips these checks at runtime.

#### Issue: Webapp jest config type error

**Cause**: Type incompatibility between Next.js and Jest config types

**Solution**: Cast config to `any`
```typescript
export default createJestConfig(config as any);
```

### Development Best Practices

#### Before Making Changes

1. ✅ Read repository memory at `/memories/repo/dual-module-architecture.md`
2. ✅ Understand which package you're modifying
3. ✅ Know which apps consume that package
4. ✅ Plan the impact of your changes

#### After Making Changes

1. ✅ Rebuild affected packages
2. ✅ Test all three mandatory commands
3. ✅ Verify no new type errors in consumers
4. ✅ Update documentation if patterns changed

#### Working with Dependencies

```bash
# Add dependency to core
cd packages/core && pnpm add package-name

# Add dev dependency to REST
cd apps/rest && pnpm add -D package-name

# Update all dependencies
pnpm update -r
```

#### Managing the Monorepo

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm -r --filter "./packages/*" build

# Run all tests
pnpm -r test

# Clean all node_modules
pnpm -r exec rm -rf node_modules
pnpm install
```

### Quick Reference: Command Cheat Sheet

```bash
# BUILD COMMANDS
pnpm --filter=@smm/core build          # Build core package
pnpm --filter=@smm/utils build         # Build utils package
pnpm --filter=rest run build           # Build REST API
pnpm --filter=webapp run build         # Build webapp
pnpm --filter=cli run build            # Build CLI

# DEV COMMANDS
pnpm --filter=cli run dev              # Run CLI in dev mode
pnpm --filter=rest run dev             # Run REST API in dev mode
pnpm --filter=webapp run dev           # Run webapp in dev mode

# TEST COMMANDS
pnpm --filter=core test                # Test core package
pnpm --filter=rest test                # Test REST API
pnpm --filter=webapp test              # Test webapp

# MANDATORY TESTS (run after ANY change)
pnpm --filter=cli run dev              # ✅ Must work
pnpm --filter=webapp run build         # ✅ Must work
pnpm --filter=rest run build           # ✅ Must work
```

### Memory Files for Reference

The following repository memory files contain detailed information:

- `/memories/repo/dual-module-architecture.md` - Complete architecture documentation
- `/memories/repo/phase-3-1-patterns.md` - Domain patterns
- `/memories/repo/phase-3-2-domain-services.md` - Service implementations
- `/memories/repo/phase-3-3-providers.md` - Provider patterns
- `/memories/repo/phase-4-5-rest-api-cli.md` - REST API and CLI details
- `/memories/repo/phase-6-github-implementation.md` - GitHub integration

Always consult these files when making architectural changes.

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

### Python/Metrics Development
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

### TypeScript/Monorepo Development
- "How does the dual-module architecture work?"
- "Why is my build failing after changing core package?"
- "How do I add a new dependency to the core package?"
- "Explain why REST API uses CommonJS and CLI uses ESM"
- "The three mandatory commands aren't working, help me fix them"
- "How do I properly import from @smm/core in my app?"
- "What's the correct build order for packages and apps?"
- "Why do I see 'Cannot find module' errors?"
- "Help me understand the transpileOnly configuration"
- "How do I troubleshoot duplicate type declaration errors?"

### Webapp/Frontend Development
- "How do I add a new page to the Next.js dashboard?"
- "Show me how to create a new chart component"
- "How do I integrate a new API endpoint in the webapp?"
- "Help me fix a failing jest test"
- "Explain the Material-UI theme configuration"

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
✅ **Module Architecture**: Maintain dual-module system (ESM + CJS)  
✅ **Build Pipeline**: Ensure all build commands work correctly  
✅ **Monorepo Management**: Handle pnpm workspace dependencies  
✅ **TypeScript Configuration**: Maintain tsconfig patterns across packages  

### Architecture Enforcement

**The agent MUST enforce these rules:**

1. **Before ANY code change**: Verify understanding of module architecture
2. **After ANY package change**: Test three mandatory commands
3. **Never break working commands**: CLI dev, webapp build, REST build
4. **Prevent module system changes**: Keep core/utils as CommonJS
5. **Validate build order**: Core/utils before apps
6. **Check import paths**: Ensure proper dist folder imports
7. **Maintain configurations**: Preserve tsconfig patterns
8. **Update documentation**: Keep memory files current

**Validation Checklist**:
```bash
# The agent must verify these after changes:
✅ pnpm --filter=cli run dev          # Must start successfully
✅ pnpm --filter=webapp run build     # Must complete successfully  
✅ pnpm --filter=rest run build       # Must complete (exit code 0)
✅ No "type": "module" in core/utils  # Module system intact
✅ declarationMap: false in packages  # No src references
✅ Only "dist" in package files[]     # Clean exports
```

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
