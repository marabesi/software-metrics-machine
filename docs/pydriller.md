# PyDriller provider

This provider is focused on fetching and visualizing metrics from git repositories using [PyDriller](https://github.com/ishepard/pydriller),
which is a Python framework to analyze Git repositories. PyDriller provides process metrics to understand how the development
process evolves over time.

> [!IMPORTANT]
> Before following the steps below, make sure you have followed the [Getting Started](./getting-started.md) guide to set up
> the project and have Python and Poetry installed. You also need to have the repository cloned locally.

## Available Metrics

PyDriller provides process metrics that help understand the development workflow:

- **Change Set**: Analyzes how many files are typically committed together, indicating the scope of changes
