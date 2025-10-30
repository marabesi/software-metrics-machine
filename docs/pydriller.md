# PyDriller Provider

PyDriller is a Python framework that helps developers analyze Git repositories. It provides a simple interface to analyze
commits, developers, and files in a repository.

Software Metrics Machine uses PyDriller to extract process metrics from git history, such as change sets and commit patterns.

## Features

- **Change Set Analysis**: Analyze the number of files that are typically committed together
- **Commit Pattern Analysis**: Understand how developers work with the codebase

## Getting Started

To use PyDriller commands, you need to have:

1. A local git repository cloned
2. Configuration file `smm_config.json` with:
   - `git_repository_location`: Path to your local repository
   - `dashboard_start_date`: Start date for analysis
   - `dashboard_end_date`: End date for analysis

## CLI Commands

For detailed CLI command documentation, see [PyDriller CLI Commands](./pydriller/cli.md).

## References

- [PyDriller GitHub Repository](https://github.com/ishepard/pydriller)
- [PyDriller Documentation](https://pydriller.readthedocs.io/)
