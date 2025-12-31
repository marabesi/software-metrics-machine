# ADR 0002: Migration to Next.js Frontend and Monorepo Architecture

Date: 2025-12-29

Status: Accepted

Supersedes: ADR 0001 (partially - frontend only)

## Context

After initial development using Panel for visualization (as documented in ADR 0001), several limitations became apparent
as the project evolved and requirements grew more complex:

### Pain Points with Panel

1. Complex UI Interactions: Panel struggled to provide sophisticated UI interactions that modern web applications require:
   - Complex filtering with multiple criteria
   - Advanced date range selections with presets
   - Real-time updates and dynamic form validation
   - Persistent user preferences and state management (e.g., saving filtering options)

2. Poor Developer Experience: The development workflow with Panel had significant friction:
   - Long autoreload times: Making changes required waiting for the entire Python application to reload, significantly slowing down iteration, sometimes leading to not reloading the latest changes at all requiring a manual restart
   - Debugging UI issues required restarting the application frequently

3. Limited Customization: Panel's abstraction layer, while enabling rapid prototyping, became a constraint:
   - Difficult to implement custom styling beyond built-in themes (even though it offers a way to override CSS, adding custom styles is simple, but maintaining them in the long term is challenging)
   - Limited control over component behavior, for example, adding custom data-testids for playwright testing

## Decision

I decided to migrate the frontend to Next.js while maintaining Python for the backend, resulting in a monorepo architecture:

### Architecture

```
software-metrics-machine/
├── api/                   # Python backend (FastAPI)
│   └── src/               # Data processing, Git analysis, CLI
└── webapp/                # Next.js frontend
    ├── app/               # Dashboard pages
    ├── components/        # React components
    └── lib/               # API client
```

### Technology Choices

1. Next.js 16 with React 19: Modern React framework
   - Server and client components for optimal performance
   - Built-in routing and file-based navigation
   - Fast refresh for instant feedback during development
   - TypeScript support out of the box
   - Offers server-side capabilities when needed

2. TypeScript: Full type safety across the frontend
   - Type-safe API client
   - Compile-time error detection
   - Better IDE support and autocomplete

3. Tailwind CSS 4: Utility-first CSS framework
   - Rapid UI development
   - Consistent design system
   - Minimal custom CSS needed
   - Responsive design made easy

4. FastAPI Backend: Python remains for data processing
   - REST API serving JSON
   - Leverages existing Python data analysis code
   - 20+ endpoints for metrics data
   - OpenAPI documentation

5. Click CLI: Python remains for CLI tool

## Consequences

### Positive

- Fast Development Cycles: Hot module replacement enables instant feedback on UI changes without full application reload
- Rich UI Capabilities: Access to entire React ecosystem for complex interactions, custom components, and modern UX patterns
- Better Developer Experience: Separate frontend and backend development, faster iteration, better debugging tools
- Type Safety: TypeScript prevents entire classes of bugs at compile time
- Performance: Client-side rendering and optimization techniques improve user experience
- Separation of Concerns: Clear boundary between data processing (Python) and presentation (Next.js)
- Modern Tooling: Access to industry-standard frontend build tools, linters, and testing frameworks

### Negative

- Increased Complexity: Now managing two separate applications instead of one
- Additional Dependencies: Need to maintain both Python and Node.js environments
- Deployment: More complex deployment process requiring coordination between frontend and backend. At this stage, the CLI will continue to be deployed with a new command to use the dashboard from the webapp.
- CORS Configuration: Need to handle cross-origin requests between frontend and API

### Neutral

- Code Duplication: Some type definitions need to exist in both Python (Pydantic) and TypeScript
- API Contract: Requires maintaining explicit API contracts between frontend and backend
- Monorepo Management: Need tooling and conventions for managing multi-project repository

## Implementation Details

### Migration Approach

1. Backend API: Converted existing Panel dashboard logic to FastAPI REST endpoints (peding to remove references to panel and holoviews in the future)
2. Frontend Components: Created React components for each dashboard section:
   - Insights (overview metrics)
   - Pipeline (CI/CD analytics)
   - Pull Requests (PR metrics)
   - Source Code (code quality metrics)
3. API Client: Built type-safe API client with TypeScript interfaces matching backend responses
4. UI Components: Implemented reusable components using Radix UI primitives and Tailwind CSS

### Retained from Previous Architecture

- All Python data processing logic (pandas, pydriller)
- Git analysis algorithms
- Metric calculation code
- Repository and viewer patterns

## Alternatives Considered

1. Continue with Panel: Would have avoided migration costs but left pain points unresolved

2. Other Frontend Frameworks: Not considered.

3. Server-Side Rendering Only: Would limit interactivity and complex client-side state management

4. Separate Repositories: Would have made coordination harder; monorepo keeps related code together

## Notes

This migration preserves the strengths of ADR 0001 (Python's data ecosystem) while addressing its limitations (UI complexity and DX). The Python backend continues to leverage pandas, pydriller, and other data libraries, while Next.js provides a modern, performant frontend with excellent developer experience.

The decision to use a monorepo keeps frontend and backend code coordinated while maintaining clear separation of concerns. Both applications can be developed, tested, and deployed independently while sharing documentation and versioning.

Future enhancements can leverage this architecture for:

- Real-time updates via WebSockets
- Advanced filtering and search capabilities
- Export functionality and reporting
- User authentication and authorization
- Offline support and caching strategies
