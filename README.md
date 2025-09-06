# Software Metrics Machine

## A Data-Driven Approach to High-Performing Teams

Agile software development has become a dominant practice, but many teams struggle to consistently deliver high-value
software. While story points and code maintainability metrics (like SonarQube) provide a starting point, they often
miss crucial factors like team dynamics, waiting times, code churn, and the impact of knowledge silos. Metrics Machine
is designed to fillin these gaps by providing a comprehensive set of metrics that reflect the health of your development
process.

## Why Metrics Machine?

We believe that the success of an Agile team is directly tied to the speed and quality with which value is delivered to
production. Software Metrics Machine provides insights beyond traditional metrics.

## Philosophy Drivers

* **Continuous Feedback Loops:**  A constant cycle of observation, analysis, and adjustment is essential.
* **Pipeline Health:**  Maintain a consistently green and stable development pipeline.
* **Controlled Code Churn:** Minimize unnecessary code changes, as they often indicate underlying issues.
* **Knowledge Sharing:** Actively avoid knowledge silos – encourage collaboration and knowledge transfer.
* **Data-Based Technical Debt:** Define and prioritize technical debt based on *real* data and impact.

## Facets

This project relies on metrics that are extracted from:

- Pipeline
  - Success rate of pipeline ✅
  - Average time to complete pipeline from start to finish 🚧
- Pull requests
  - Average of Pull requests opened ✅
- Git history
  * Code churn  ✅
  * Hotspots  ✅
  * Change Frequency 🚧
  * Complexity Trends Over Time 🚧

## Getting started

This section provides the needed configuration to get started with Metrics machine, it requires knowledge of env variables and python ecosystem tools.

### Environment requirements

* python 3.10+
* poetry installed --no-root

### MacOs

If you are on a mac, you can easily install them using the following commands:

```bash
brew install python
brew install poetry
```

### Define where to store the data

This project uses a folder to store the data fetched from the different providers, set the env variable `STORE_DATA_AT`
to point to the desired location. Use absolute path.

```bash
export STORE_DATA_AT=/path/to/data/folder
```

### Checkpoint

Once installed python and poetry, run the following command:

```bash
poetry run python --version
```

You should see an output something like the following:

```plaintext
Python 3.11.0
```

Let's now check the env variables for data storage, run the following command:

```bash
env
```

You should see an output something like the following:

```plaintext
STORE_DATA_AT=/path/to/data/folder
```

## Providers

This project is built based on a provider model, where each provider is responsible to extract data from a specific source.
This is because depending on the desired metric, it might come from a difference source. For example, there are metrics
extractd about coupling that are from the git log. Other metrics such as pipeline execution and pull request open days
average comes from GitHub API (or other providers).

Each provider has its own configuration and requirements, please refer to the specific README.md file in each provider
folder as pointed below.

### Git

[Git](providers/codemaat/README.md) is the only common provider, as it is used to extract code churn and hotspots. Which
means, it can be used regardless of the vendor. The following metrics are supported:

* Code churn
* Hotspots
* Age of code
* Authors per file

### Github

If your are using [GitHub/Github actions](providers/github/README.md), the following metrics are supported:

* Pull requests open days average
* Pipeline success rate
* Pipeline average time to complete

### GitLab

* If your are using [GitLab](providers/gitlab/README.md), this is a placeholder for future work.

## References

This project uses other tools to extract the metrics, and is inspired by other works in the field of software metrics.
Here are some references:

* Metrics
  * <https://github.com/adamtornhill/code-maat>
  * <https://pragprog.com/titles/atevol/software-design-x-rays/>
  * <https://github.com/fouadh/gocan>
* Platform
  * <https://python-poetry.org/>
  * <https://matplotlib.org/>
  * <https://git-scm.com/doc>
  * <https://docs.github.com/en/rest?apiVersion=2022-11-28>
