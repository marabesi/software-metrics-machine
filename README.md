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

If you are on a mac, you can easily install them using the following commands:

```bash
brew install python
brew install poetry
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

## Providers

* If your are using [GitHub/Github actions](providers/github/README.md)
* If your are using [GitLab](providers/gitlab/README.md)

## References

* Metrics
  * <https://github.com/adamtornhill/code-maat>
  * <https://pragprog.com/titles/atevol/software-design-x-rays/>
  * <https://github.com/fouadh/gocan>
* Platform
  * <https://python-poetry.org/>
  * <https://matplotlib.org/>
  * <https://git-scm.com/doc>
  * <https://docs.github.com/en/rest?apiVersion=2022-11-28>
