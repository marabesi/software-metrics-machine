# PyDriller CLI Commands for Analysis

This document provides a guide for developers to run PyDriller-related analyses using the CLI commands available in the
`software-metrics-machine` project. PyDriller is used to analyze git repositories and extract metrics from commit history.

## Change Set Analysis

### Run Change Set Analysis

```bash
./run-cli.sh pydriller change_set
```

Analyzes the change set metrics in the repository, including the maximum and average number of files committed together.

This command requires the following configuration in `smm_config.json`:

- `git_repository_location`: Path to the local git repository
- `dashboard_start_date`: Start date for analysis (format: YYYY-MM-DD)
- `dashboard_end_date`: End date for analysis (format: YYYY-MM-DD)

The command will output:
- Maximum number of files committed together
- Average number of files committed together
