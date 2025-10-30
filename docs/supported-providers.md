---
outline: deep
---

# Supported providers

This project is possible thanks to the integration with various source control providers and code analysis tools. Below
is a list of the currently supported providers and tools.

## Supported Source Control Providers

### Github

If your are using [GitHub/Github actions](./github.md), the following metrics are supported:

- Pull requests open days average
- Pipeline success rate
- Pipeline average time to complete

### GitLab

(coming soon)

### Bitbucket

(coming soon)

## Code analysis tools

### Codemaat

[Codemaat](./codemaat.md) analyzes Git history to extract code evolution metrics. It can be used regardless of the source control provider. The following metrics are supported:

- Code churn
- Hotspots
- Age of code
- Authors per file
- Coupling
- Entity effort
- Entity ownership

### PyDriller

[PyDriller](./pydriller.md) is a Python framework for analyzing Git repositories. It provides process metrics from commit history:

- Change set analysis
- Commit patterns
- File commit frequency

### SonarQube

(comming soon)
