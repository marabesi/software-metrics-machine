# PyDriller CLI Commands for Analysis

This document provides a guide for developers to run PyDriller-related analyses using the CLI commands available in the
`software-metrics-machine` project.

## Change Set Analysis

### Run Change Set Analysis

```bash
../run-cli.sh pydriller change-set
```

Analyzes the change set from the git repository using PyDriller. This command calculates:

- **Maximum number of files committed together**: The highest number of files changed in a single commit
- **Average number of files committed together**: The typical number of files changed per commit

This metric helps understand:
- The scope and complexity of changes in your codebase
- Whether changes are focused (few files) or widespread (many files)
- Potential coupling issues when many files are frequently changed together

> [!NOTE]
> This command requires the `dashboard_start_date` and `dashboard_end_date` to be configured in your `smm_config.json` file.
