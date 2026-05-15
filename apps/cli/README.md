# CLI Package - Software Metrics Machine

## Overview

The CLI package provides a command-line interface for the Software Metrics Machine, enabling developers and teams to access metrics from the command line.

## Installation

```bash
npm install -g @smmachine/launcher
```

## Configuration

The CLI requires configuration for the data providers you want to use. Set the following environment variables:

### GitHub Configuration
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=yourorg
GITHUB_REPO=yourrepo
```

### Jira Configuration
```bash
JIRA_URL=https://jira.company.com
JIRA_EMAIL=user@company.com
JIRA_TOKEN=xxxxxxxxxxxxxxxx
JIRA_PROJECT=PROJ
```

### SonarQube Configuration
```bash
SONARQUBE_URL=https://sonarqube.company.com
SONARQUBE_TOKEN=squ_xxxxxxxxxxxxxxxxxxxxx
SONARQUBE_PROJECT=com.company:projectkey
```

### Git Configuration
```bash
REPO_PATH=/path/to/repository
```

### Other Configuration
```bash
OUTPUT_DIR=./outputs          # Directory for caching metrics
DEBUG=true                    # Enable debug logging
NODE_ENV=production           # development|production
```

## Usage

### Pull Request Metrics

Get metrics related to pull requests:

```bash
# Default format (text)
smm metrics pr

# With date filtering
smm metrics pr --start-date 2024-01-01 --end-date 2024-12-31

# JSON output
smm metrics pr --format json

# CSV format
smm metrics pr --format csv

# Verbose output (includes stack traces on errors)
smm metrics pr --verbose
```

Output:
```
⏳ Fetching pull request metrics...

📊 Pull Request Metrics
═══════════════════════════════════════
Total PRs: 42
Lead Time: 2.5 days
Total Comments: 156

Labels:
  • bug: 8
  • feature: 15
  • docs: 5
```

### Deployment Metrics

Get deployment frequency and job metrics:

```bash
# Default (weekly aggregation)
smm metrics deployment

# Daily aggregation
smm metrics deployment --frequency day

# With date range
smm metrics deployment --start-date 2024-01-01 --frequency month

# JSON output
smm metrics deployment --format json
```

Output:
```
🚀 Deployment Metrics
═══════════════════════════════════════
Total Runs: 100
Success Rate: 95.0%

Deployment Frequency:
  • 2024-03-20: 5 deployments
  • 2024-03-21: 4 deployments
```

### Code Metrics

Get code churn and pairing index:

```bash
# All code metrics
smm metrics code

# Filter by specific authors
smm metrics code --authors "Alice,Bob"

# With date range
smm metrics code --start-date 2024-01-01 --end-date 2024-12-31

# CSV format
smm metrics code --format csv
```

Output:
```
💻 Code Metrics
═══════════════════════════════════════
Pairing Index: 45%
Code Churn: +1520 -890

File Coupling (5 pairs):
  • src/auth.ts ↔ src/middleware.ts
    Coupling: 85.3%
  • src/db.ts ↔ src/models/user.ts
    Coupling: 92.1%
```

### Issue Metrics

Get metrics from Jira:

```bash
# All issues
smm metrics issues

# Filter by status
smm metrics issues --status Done

# With date range
smm metrics issues --start-date 2024-01-01

# JSON output
smm metrics issues --format json
```

Output:
```
🎫 Issue Metrics
═══════════════════════════════════════
Total Issues: 320

Recent Issues:
  • [Done] PROJ-001
    Priority: High
    Created: 2024-03-20T10:30:00Z
  • [In Progress] PROJ-002
    Priority: Medium
    Created: 2024-03-21T14:15:00Z
```

### Quality Metrics

Get code quality data from SonarQube:

```bash
# All quality metrics
smm metrics quality

# Specific metrics
smm metrics quality --measures "coverage,complexity"

# JSON output
smm metrics quality --format json
```

Available measures:
- coverage
- complexity
- sqale_rating
- duplicated_lines_density
- ncloc (number of lines of code)
- vulnerability_rating

Output:
```
✅ Quality Metrics
═══════════════════════════════════════
Coverage: 78.5%
Complexity: 42
Sqale Rating: A
Duplicated Lines Density: 2.3%
Ncloc: 15420
Vulnerability Rating: A
```

### Complete Report

Generate a comprehensive report aggregating all metrics:

```bash
# Text format (default)
smm metrics report

# With filters
smm metrics report \
  --start-date 2024-01-01 \
  --end-date 2024-12-31 \
  --authors "Alice,Bob" \
  --status Done

# JSON format
smm metrics report --format json

# CSV format
smm metrics report --format csv
```

Output:
```
╔════════════════════════════════════════════════════════╗
║                    Software Metrics Machine            ║
║                  Comprehensive Report                  ║
╚════════════════════════════════════════════════════════╝
Generated: 2024-03-29T10:30:00.000Z

Applied Filters:
  • startDate: 2024-01-01
  • endDate: 2024-12-31

📊 Pull Request Metrics
═══════════════════════════════════════
Total PRs: 42
Lead Time: 2.5 days
...

🚀 Deployment Metrics
═══════════════════════════════════════
Total Runs: 100
Success Rate: 95.0%
...
```

## Global Options

### Debug Logging

Enable detailed logging for troubleshooting:

```bash
smm --debug metrics pr
# or
DEBUG=true smm metrics pr
```

### Help

```bash
smm --help
smm metrics --help
smm metrics pr --help
```

### Version

```bash
smm --version
```

## Error Handling

The CLI provides clear error messages:

```bash
# Missing configuration
$ smm metrics pr
❌ Error: No provider configuration found. Please set at least one of: GITHUB_TOKEN, JIRA_URL, SONARQUBE_URL, REPO_PATH

# Wrong arguments
$ smm metrics deployment --frequency invalid
❌ Error: Invalid frequency. Use day, week, or month

# Provider error
$ smm metrics issues
❌ Error: Failed to connect to Jira. Check JIRA_URL and JIRA_TOKEN

# Verbose mode (includes stack trace)
$ smm metrics pr --verbose
❌ Error: Database connection failed

Stack Trace:
Error: ECONNREFUSED 127.0.0.1:27017
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:33)
```

## Output Formats

### Text (Default)

Human-readable format with emojis and formatting:

```bash
smm metrics pr --format text
```

### JSON

Machine-readable JSON format, suitable for piping to other tools:

```bash
smm metrics pr --format json | jq '.leadTime.average'
```

### CSV

Comma-separated values, suitable for Excel or data analysis:

```bash
smm metrics pr --format csv > metrics.csv
```

## Examples

### Daily Report

Create a daily metrics report and save to file:

```bash
smm metrics report --format json > report-$(date +%Y-%m-%d).json
```

### Compare Week-over-Week

Get metrics for two different weeks:

```bash
echo "=== This Week ==="
smm metrics pr --start-date 2024-03-20 --end-date 2024-03-26

echo ""
echo "=== Last Week ==="
smm metrics pr --start-date 2024-03-13 --end-date 2024-03-19
```

### Export to CSV for Analysis

```bash
smm metrics report --format csv > metrics.csv
# Open in Excel or Google Sheets
```

### Monitor Deployment Frequency

Check deployment frequency every hour:

```bash
watch -n 3600 'smm metrics deployment | grep "Success Rate"'
```

### Programmatic Usage

Parse JSON output in scripts:

```bash
#!/bin/bash
METRICS=$(smm metrics pr --format json)
LEAD_TIME=$(echo $METRICS | jq '.leadTime.average')
echo "Current lead time: ${LEAD_TIME} days"
```

## Troubleshooting

### "No provider configuration found"

Make sure at least one provider is configured:

```bash
# Check environment variables
env | grep GITHUB
env | grep JIRA
env | grep SONARQUBE
env | grep REPO_PATH
```

### "Failed to fetch metrics"

1. Check provider credentials:
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/user
   ```

2. Verify network connectivity:
   ```bash
   ping api.github.com
   ```

3. Enable debug logging:
   ```bash
   DEBUG=true smm metrics pr
   ```

### Slow Response Time

1. Check network connectivity
2. Verify provider API status
3. Consider date filtering to reduce data volume:
   ```bash
   smm metrics pr --start-date $(date -d '7 days ago' +%Y-%m-%d)
   ```

## Development

### Building from Source

```bash
npm run build -w cli
```

### Running in Development Mode

```bash
npm run dev -w cli -- metrics pr
```

### Running Tests

```bash
npm run test -w cli
```

### Linking Locally

For testing locally without publishing:

```bash
npm link -w cli
smm metrics pr
```

## Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

## License

MIT
