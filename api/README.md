[![CI](https://github.com/marabesi/software-metrics-machine/actions/workflows/ci.yml/badge.svg)](https://github.com/marabesi/software-metrics-machine/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/marabesi/software-metrics-machine/badge.svg?branch=main)](https://coveralls.io/github/marabesi/software-metrics-machine?branch=main)
[![Docs](https://github.com/marabesi/software-metrics-machine/actions/workflows/static.yml/badge.svg)](https://github.com/marabesi/software-metrics-machine/actions/workflows/static.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=marabesi_software-metrics-machine&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=marabesi_software-metrics-machine)
[![PyPI version](https://badge.fury.io/py/software-metrics-machine.svg)](https://badge.fury.io/py/software-metrics-machine)
![PyPI - Downloads](https://img.shields.io/pypi/dm/software-metrics-machine)


# Software Metrics Machine

## A Data-Driven Approach to High-Performing Teams

Agile software development has become a dominant practice, but many teams struggle to consistently deliver high-value
software. While story points and code maintainability metrics (like SonarQube) provide a starting point, they often
miss crucial factors like team dynamics, waiting times, code churn, and the impact of knowledge silos. Metrics Machine
is designed to fillin these gaps by providing a comprehensive set of metrics that reflect the health of your development
process.

> "software quality is a multi-dimensional concept, and no single metric can fully represent its various aspects" - [Morteza Zakeri et al.](https://www.sciencedirect.com/science/article/pii/S0167642325001728)

## Why Metrics Machine?

We believe that the success of an Agile team is directly tied to the speed and quality with which value is delivered to
production. Software Metrics Machine provides insights beyond traditional metrics.

## Philosophy Drivers

* Continuous Feedback Loops: A constant cycle of observation, analysis, and adjustment is essential.
* Pipeline Health: Maintain a consistently green and stable development pipeline.
* Controlled Code Churn: Minimize unnecessary code changes, as they often indicate underlying issues.
* Knowledge Sharing: Actively avoid knowledge silos – encourage collaboration and knowledge transfer.
* Data-Based Technical Debt: Define and prioritize technical debt based on *real* data and impact.

## Facets

This project relies on metrics that are extracted from:

* Pipeline
  * Success rate of pipeline ✅
  * Average time to complete pipeline from start to finish ✅
* Pull requests
  * Average of Pull requests opened ✅
* Git history
  * Code churn  ✅
  * Hotspots  ✅
  * Change Frequency ✅
  * Complexity Trends Over Time 🚧

## Getting started

The official documentation is hosted at [github pages](https://marabesi.github.io/software-metrics-machine/getting-started.html).

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
* Research
  * <https://www.researchgate.net/publication/379096213_Software_Metrics_in_Agile_Software_Development_A_Review_Report> 
