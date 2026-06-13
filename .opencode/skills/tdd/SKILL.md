---
name: tdd
description: "Test-Driven Development workflow for Software Metrics Machine. Covers test frameworks (Vitest 4.x for CLI/REST/core/utils, Jest 30.x for webapp), test patterns (describe/it, builder pattern, mocks via vi.fn), test commands, coverage requirements, and the Red-Green-Refactor cycle. USE FOR: write tests, run tests, test this, add tests, testing, coverage, TDD, test-driven development, vitest, jest, test pattern, test convention. DO NOT USE FOR: linting (use lint skill), building (use build commands directly), debugging production issues."
---

# TDD Skill — Software Metrics Machine

## Test Frameworks

| Workspace | Framework | Config |
|-----------|-----------|--------|
| `packages/core` | Vitest 4.x | `vitest.config.ts` (extends `vitest.base.config.ts`) |
| `packages/utils` | Vitest 4.x | `vitest.config.ts` (extends `vitest.base.config.ts`) |
| `apps/cli` | Vitest 4.x | `vitest.config.ts` |
| `apps/rest` | Vitest 4.x | `vitest.config.ts` |
| `apps/webapp` | Jest 30.x | `jest.config.ts` (via `next/jest`) |

### Vitest base config (`vitest.base.config.ts`)
- `pool: 'forks'`, `fileParallelism: false`
- Test pattern: `**/__tests__/**/*.test.ts`
- Coverage: v8 provider, excludes `node_modules/`, `dist/`, test files
- `testTimeout: 20000`
- Globals enabled (`describe`, `it`, `expect`, `vi`)

### Webapp Jest config
- Environment: `jsdom`
- Setup: `jest.setup.ts`
- Module alias: `@/` maps to `<rootDir>/`
- Imports via `next/jest`

## Test Commands

```bash
pnpm test                          # all workspaces (via turbo)
pnpm --filter @smmachine/core test # single workspace
pnpm --filter @smmachine/cli test
pnpm --filter @smmachine/rest test
pnpm --filter @smmachine/webapp test
pnpm --filter @smmachine/utils test
pnpm --filter @smmachine/core exec vitest run --coverage  # with coverage
pnpm --filter @smmachine/core exec vitest run --reporter=verbose
```

## Test Location Convention

Tests live in `__tests__/` directories alongside their source:

```
packages/core/__tests__/
  domain-services.test.ts
  providers.test.ts
  infrastructure.test.ts
  providers/github/
    fetch-pull-requests-repository.test.ts
    pull-request-filters-repository.test.ts
    ...
```

## Test Patterns

### Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ServiceName', () => {
  let service: ServiceName;
  let mockRepo: IRepository;

  beforeEach(() => {
    mockRepo = { /* vi.fn() mocks */ };
    service = new ServiceName(mockRepo);
  });

  it('should ...', async () => {
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Mocking
- Use `vi.fn()` for mock functions
- Use `vi.fn(async () => value)` for async mocks
- Build mock objects inline or with the Builder pattern

### Builder Pattern
Use existing builders for test data:

```typescript
import { PullRequestBuilder, PipelineRunBuilder, CommitBuilder } from './builders/builders';

const pr = new PullRequestBuilder()
  .withAuthor('Alice')
  .withTitle('Feature X')
  .withCreatedAt('2024-01-01T00:00:00Z')
  .withMergedAt('2024-01-05T00:00:00Z')
  .withComments(3)
  .build();
```

### Assertions
- Prefer specific expectations over generic ones
- Validate field types, ranges, and formats (e.g. regex for date strings)
- Use `expect.objectContaining()` and `expect.arrayContaining()` for partial matching

## Coverage

Coverage config is inherited from `vitest.base.config.ts`:
- Provider: `v8`
- Reporters: `text`, `json`, `html`, `lcov`
- Coverage excludes: `node_modules/`, `dist/`, `**/__tests__/**`, `**/*.test.ts`, `**/*.d.ts`

Run with: `pnpm --filter <workspace> exec vitest run --coverage`

## Red-Green-Refactor Workflow

1. **Red** — Write a failing test first (assert the expected behavior before implementing)
2. **Green** — Write minimal code to make the test pass
3. **Refactor** — Clean up the implementation while keeping tests green

## Guidelines

- Write tests for all new features and bug fixes
- Use `describe`/`it` blocks (not `test`)
- Tests must be deterministic (no reliance on external APIs or network)
- Integration tests go in `__tests__/providers/<name>/*.integration.test.ts` or `.test.ts`
- Prefix unused callback params with `_` (consistent with ESLint rule)
- Do NOT add `"type": "module"` to `packages/core` or `packages/utils` — this breaks Vitest
