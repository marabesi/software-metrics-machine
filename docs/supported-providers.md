---
outline: deep
---

# Supported providers

This project is possible thanks to the integration with various source control providers and code analysis tools. Below
is a list of the currently supported providers and tools.

## Supported Source Control Providers

### Github

If your are using [GitHub/Github actions](./github.md), the following metrics are supported:

- Insights
- Pipeline
- Pull requests
- Source code analysis via git

### GitLab

If your are using [GitLab](./gitlab.md), the following metrics are supported:

- Source code analysis via git

### Bitbucket

If your are using BitBucket, the following metrics are supported:

- Source code analysis via git

## Code analysis tools

### Codemaat

[Git](./codemaat.md) is the only common provider, as it is used to extract code churn and hotspots. Which
means, it can be used regardless of the vendor. The following metrics are supported:

- Code churn
- Hotspots
- Age of code
- Authors per file

### PyDriller

(comming soon)

### SonarQube

(comming soon)
