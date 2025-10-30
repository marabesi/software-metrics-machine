# Codemaat CLI Commands for Analysis

This document provides a guide for developers to run Codemaat-related analyses using the CLI commands available in the
`software-metrics-machine` project. Each command is categorized by its functionality.

## Fetch Codemaat Data

Before running analysis commands, you need to fetch the historical data from your git repository.

```bash
./run-cli.sh codemaat fetch --start-date=2025-01-01 --end-date=2025-12-31
```

| Option         | Description                          | Required | Example                  |
|----------------|--------------------------------------|----------|--------------------------|
| start-date     | Filter commits created on or after this date   | Yes      | `--start-date=2025-01-01`     |
| end-date       | Filter commits created on or before this date  | Yes      | `--end-date=2025-12-31`     |
| subfolder      | Subfolder within the git repository to analyze | No       | `--subfolder=src`     |

## Code Churn Analysis

### Run Code Churn Analysis

```bash
./run-cli.sh codemaat code_churn
```

Analyzes the code churn in the repository and plots the churn rate over time.

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| out-file, -o   | Path to save the plot image          | `--out-file=churn.png` or `-o churn.png`   |
| start-date     | Filter data on or after this date    | `--start-date=2025-01-01`     |
| end-date       | Filter data on or before this date   | `--end-date=2025-12-31`     |

## Coupling Analysis

### Run Coupling Analysis

```bash
./run-cli.sh codemaat coupling
```

Analyzes the coupling between entities (files) in the repository and creates a coupling graph.

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| ignore-files   | Comma-separated glob patterns to ignore | `--ignore-files='*.json,**/**/*.png'` |
| out-file, -o   | Path to save the plot image          | `--out-file=coupling.png` or `-o coupling.png`   |

## Entity Churn Analysis

### Run Entity Churn Analysis

```bash
./run-cli.sh codemaat entity_churn
```

Analyzes the churn of entities (files) in the repository.

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| out-file, -o   | Path to save the plot image          | `--out-file=entity_churn.png`   |
| top            | Number of top entities to display    | `--top=10`     |
| ignore-files   | Comma-separated glob patterns to ignore | `--ignore-files='*.json,*.md'` |

## Entity Effort Analysis

### Run Entity Effort Analysis

```bash
./run-cli.sh codemaat entity_effort
```

Analyzes the effort spent on entities (files) in the repository.

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| out-file, -o   | Path to save the plot image          | `--out-file=entity_effort.png`   |
| top            | Number of top entities to display    | `--top=10`     |
| ignore-files   | Comma-separated glob patterns to ignore | `--ignore-files='*.json,*.md'` |

## Entity Ownership Analysis

### Run Entity Ownership Analysis

```bash
./run-cli.sh codemaat entity_ownership
```

Analyzes the ownership of entities (files) in the repository, showing which developers work on which files.

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| out-file, -o   | Path to save the plot image          | `--out-file=ownership.png`   |
| top            | Number of top entities to display    | `--top=10`     |
| ignore-files   | Comma-separated glob patterns to ignore | `--ignore-files='*.json,*.md'` |
| authors        | Comma-separated list of authors to filter by | `--authors='Jane,John'` |