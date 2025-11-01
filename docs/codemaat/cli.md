# Codemaat CLI Commands for Analysis

This document provides a guide for developers to run Codemaat-related analyses using the CLI commands available in the
`software-metrics-machine` project. Each command is categorized by its functionality.

## Fetch Data

### Fetch Historical Data from Git Repository

```bash
../run-cli.sh code fetch
```

Fetches historical data from a git repository using Codemaat for analysis.

## Code Churn Analysis

### Run Code Churn Analysis

```bash
../run-cli.sh code code-churn
```

Analyzes the code churn in the repository.

## Coupling Analysis

### Run Coupling Analysis

```bash
../run-cli.sh code coupling
```

Analyzes the coupling between entities in the repository.

## Entity Churn Analysis

### Run Entity Churn Analysis

```bash
../run-cli.sh code entity-churn
```

Analyzes the churn of entities in the repository.

## Entity Effort Analysis

### Run Entity Effort Analysis

```bash
../run-cli.sh code entity-effort
```

Analyzes the effort spent on entities in the repository.

## Entity Ownership Analysis

### Run Entity Ownership Analysis

```bash
../run-cli.sh code entity-ownership
```

Analyzes the ownership of entities in the repository.
