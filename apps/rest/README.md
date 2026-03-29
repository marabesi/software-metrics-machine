# Software Metrics Machine - REST API

Professional REST API for comprehensive software metrics collection and analysis.

## Overview

The REST API exposes all metrics from the Software Metrics Machine through HTTP endpoints, powered by the MetricsOrchestrator business logic layer.

**Supported Data Sources:**
- 📊 **GitHub**: Pull requests, deployment pipelines, CI/CD metrics
- 🎫 **Jira**: Issue tracking, status metrics, priority analytics
- ✅ **SonarQube**: Code quality, coverage, complexity metrics
- 💻 **Git**: Local repository analysis, co-author detection, code churn
- 📈 **CodeMaat**: File coupling, change frequency, architectural metrics

## Features

✨ **Production-Ready**
- Global exception handling with consistent error responses
- Request validation using class-validator DTOs
- Comprehensive logging for all operations
- CORS support for cross-origin requests

📚 **Well-Documented**
- Swagger/OpenAPI documentation at `/api/docs`
- Detailed JSDoc comments for all endpoints
- Example curl commands for every endpoint
- Interactive API explorer

🔒 **Error Handling**
- Meaningful error messages with proper HTTP status codes
- Structured error responses with timestamp and request path
- Stack traces in development environment

## Quick Start

### Installation

```bash
# Install dependencies
npm install -w rest

# Add swagger and validation packages
npm install @nestjs/swagger swagger-ui-express class-validator class-transformer
```

### Running the API

```bash
# Development server with hot reload
npm run dev -w rest

# Production build
npm run build -w rest

# Run tests
npm test -w rest
```

The server will start on `http://localhost:3000` (or `$PORT` environment variable).

## Configuration

All configuration is managed through environment variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# GitHub
GITHUB_TOKEN=github_pat_xxxxx
GITHUB_OWNER=microsoft
GITHUB_REPO=vscode

# Jira
JIRA_URL=https://your-instance.atlassian.net
JIRA_EMAIL=user@example.com
JIRA_TOKEN=<api-token>
JIRA_PROJECT=YOUR-PROJECT

# SonarQube
SONARQUBE_URL=http://localhost:9000
SONARQUBE_TOKEN=<token>
SONARQUBE_PROJECT=project-key

# Git
GIT_REPOSITORY_PATH=./repo

# CodeMaat
CODEMAAT_DATA_PATH=/path/to/codemaat/csv/files

# Output
OUTPUT_DIR=./outputs
```

## API Documentation

### Interactive Docs

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api-json

### Endpoints

#### Pull Request Metrics
```
GET /api/metrics/pr?startDate=2024-01-01&endDate=2024-12-31
```

Returns:
- `totalPRs`: Total number of pull requests
- `leadTime`: Average lead time for PR merges
- `commentSummary`: Total comments across PRs
- `labelSummary`: Distribution of PR labels

**Example:**
```bash
curl "http://localhost:3000/api/metrics/pr?startDate=2024-01-01&endDate=2024-03-31"
```

**Response:**
```json
{
  "totalPRs": 42,
  "leadTime": {
    "average": 2.5,
    "unit": "days"
  },
  "commentSummary": {
    "total": 156
  },
  "labelSummary": {
    "bug": 5,
    "feature": 12
  },
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-03-31"
  }
}
```

---

#### Deployment Metrics
```
GET /api/metrics/deployment?frequency=week&startDate=2024-01-01&endDate=2024-12-31
```

Query Parameters:
- `frequency`: Aggregation frequency (day|week|month), default: week
- `startDate`: Optional start date filter
- `endDate`: Optional end date filter

Returns:
- `pipelineMetrics`: Pipeline success rate and total runs
- `deploymentFrequency`: Deployments per time period
- `jobMetrics`: Individual job performance

**Example:**
```bash
curl "http://localhost:3000/api/metrics/deployment?frequency=day"
```

**Response:**
```json
{
  "pipelineMetrics": {
    "totalRuns": 100,
    "successRate": 0.95
  },
  "deploymentFrequency": [
    {
      "date": "2024-03-29",
      "value": 3
    }
  ],
  "jobMetrics": [
    {
      "jobName": "build",
      "avgDuration": 120,
      "successRate": 0.98
    }
  ]
}
```

---

#### Code Metrics
```
GET /api/metrics/code?selectedAuthors=Alice&selectedAuthors=Bob&startDate=2024-01-01
```

Query Parameters:
- `selectedAuthors`: Filter by specific authors (repeatable)
- `startDate`: Filter commits after date
- `endDate`: Filter commits before date

Returns:
- `pairingIndex`: Percentage of commits with co-authors
- `codeChurn`: Lines added/deleted
- `fileCoupling`: File dependencies and coupling strength

**Example:**
```bash
curl "http://localhost:3000/api/metrics/code?selectedAuthors=alice@example.com&selectedAuthors=bob@example.com"
```

**Response:**
```json
{
  "pairingIndex": {
    "pairingIndexPercentage": 45
  },
  "codeChurn": {
    "data": {
      "additions": 1520,
      "deletions": 890
    }
  },
  "fileCoupling": [
    {
      "file1": "src/api.ts",
      "file2": "src/utils.ts",
      "couplingStrength": 78
    }
  ]
}
```

---

#### Issue Metrics
```
GET /api/metrics/issues?status=Done&startDate=2024-01-01&endDate=2024-12-31
```

Query Parameters:
- `status`: Filter by issue status (e.g., Done, In Progress)
- `startDate`: Filter issues created after date
- `endDate`: Filter issues created before date

Returns:
- `totalIssues`: Total number of issues
- `issues`: Array of issue details with status and dates

**Example:**
```bash
curl "http://localhost:3000/api/metrics/issues?status=Done"
```

**Response:**
```json
{
  "totalIssues": 320,
  "issues": [
    {
      "key": "PROJ-1234",
      "status": "Done",
      "priority": "High",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### Quality Metrics
```
GET /api/metrics/quality?measures=coverage&measures=complexity
```

Query Parameters:
- `measures`: Specific metrics to retrieve (repeatable)
  - Available: coverage, complexity, sqale_rating, duplicated_lines_density, ncloc, vulnerability_rating

Returns:
- Dynamic object with requested metrics and their values

**Example:**
```bash
curl "http://localhost:3000/api/metrics/quality?measures=coverage&measures=complexity"
```

**Response:**
```json
{
  "coverage": 78.5,
  "complexity": 42,
  "sqale_rating": "A",
  "ncloc": 15420
}
```

---

#### Complete Report
```
GET /api/metrics/report?startDate=2024-01-01&endDate=2024-12-31
```

Query Parameters:
- `startDate`: Filter data after date
- `endDate`: Filter data before date
- `selectedAuthors`: Filter by authors (repeatable)
- `status`: Filter issues by status

Returns:
- Comprehensive report combining all metrics sources
- Includes timestamp and applied filters

**Example:**
```bash
curl "http://localhost:3000/api/metrics/report?startDate=2024-01-01&endDate=2024-12-31&selectedAuthors=alice"
```

**Response:**
```json
{
  "timestamp": "2024-03-29T15:30:45.123Z",
  "pullRequests": {
    "totalPRs": 42,
    "leadTime": { "average": 2.5, "unit": "days" }
  },
  "deployment": {
    "pipelineMetrics": { "totalRuns": 100, "successRate": 0.95 }
  },
  "code": {
    "pairingIndex": { "pairingIndexPercentage": 45 }
  },
  "issues": {
    "totalIssues": 320
  },
  "quality": {
    "coverage": 78.5,
    "complexity": 42
  },
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Invalid date format. Expected YYYY-MM-DD",
  "error": "BadRequest",
  "timestamp": "2024-03-29T15:30:45.123Z",
  "path": "/api/metrics/pr"
}
```

### Common Error Codes

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | BadRequest | Invalid query parameters or request format |
| 401 | Unauthorized | Authentication failed (future version) |
| 404 | NotFound | Resource not found |
| 500 | InternalServerError | Server error |

## Testing

```bash
# Run all tests
npm test -w rest

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

Example test:
```typescript
it('should return PR metrics with date filtering', () => {
  return request(app.getHttpServer())
    .get('/api/metrics/pr?startDate=2024-01-01&endDate=2024-12-31')
    .expect(200)
    .expect((res) => {
      expect(res.body).toHaveProperty('totalPRs');
      expect(res.body).toHaveProperty('filters');
    });
});
```

## Architecture

### Module Structure

```
packages/rest/
├── src/
│   ├── dtos/                      # Request/Response DTOs
│   │   ├── request.dto.ts        # Query parameter validators
│   │   └── response.dto.ts       # Response type definitions
│   ├── filters/                   # Exception filters
│   │   └── http-exception.filter.ts
│   ├── middleware/                # Request middleware
│   │   └── logging.middleware.ts
│   ├── config/                    # Configuration
│   │   └── swagger.config.ts     # OpenAPI setup
│   ├── metrics.controller.ts      # HTTP endpoints
│   ├── metrics.module.ts          # DI configuration
│   ├── main.ts                    # Application entry point
│   └── index.ts                   # Module exports
├── __tests__/
│   └── metrics.controller.test.ts # Integration tests
└── package.json
```

### Dependency Injection

The MetricsModule automatically initializes:

1. **Configuration** - Loads environment variables
2. **Providers** - GitHub, Jira, SonarQube, Git, CodeMaat clients
3. **Repositories** - Data access layer
4. **MetricsOrchestrator** - Business logic orchestration

All dependencies are injected into the MetricsController.

### Request Flow

```
HTTP Request
    ↓
MetricsController (validates query parameters)
    ↓
MetricsOrchestrator (business logic)
    ↓
Repositories (aggregate data)
    ↓
Providers (fetch from sources)
    ↓
HTTP Response (JSON)
```

## Docker Support

Build Docker image:
```bash
docker build -f packages/rest/Dockerfile -t smm-rest:latest .
```

Run container:
```bash
docker run -p 3000:3000 \
  -e GITHUB_TOKEN=xxx \
  -e GITHUB_OWNER=microsoft \
  -e GITHUB_REPO=vscode \
  smm-rest:latest
```

## Performance

- **Response Times**: Typically < 500ms per endpoint
- **Pagination**: Automatic pagination for large datasets
- **Caching**: Can be added with Redis layer
- **Rate Limiting**: Can be added with @nestjs/throttler

## Security

Current version:
- ✅ CORS enabled
- ✅ Input validation on all routes
- ✅ Error messages don't leak internal details

Future enhancements:
- [ ] JWT authentication
- [ ] API key support
- [ ] Rate limiting
- [ ] Request signing

## Troubleshooting

### Server won't start

Check logs for configuration errors:
```bash
# Enable debug logging
DEBUG=* npm run dev -w rest
```

### Provider authentication failures

Verify environment variables are set correctly:
```bash
# Check GitHub token
echo $GITHUB_TOKEN

# Check Jira credentials
echo $JIRA_EMAIL $JIRA_TOKEN
```

### Slow responses

- Check network connectivity to external APIs
- Verify API rate limits haven't been exceeded
- Check server logs for performance bottlenecks

## Support & Contributing

For issues or feature requests, please open an issue in the main repository.

## License

Same as the Software Metrics Machine project.
