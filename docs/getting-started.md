---
outline: deep
---

# Getting started

This section provides the needed configuration to get started with Metrics machine, it requires knowledge of env variables
and python ecosystem tools.

## The concepts behind Software Metrics Machine

The way this project works goes through three main steps:

1. Fetch data from the providers (git, github, gitlab, etc)
2. Store the data in a structured way (json files)
3. Analyze and visualize the data

## Setting up the project

### Clone the repository

```bash
git clone https://github.com/marabesi/software-metrics-machine.git
```

## Local setup

### Environment requirements

* python 3.13+
* poetry installed --no-root
* java (for running codemaat)

### MacOs

If you are on a mac, you can easily install them using the following commands:

```bash
brew install python
brew install poetry
```

### Checkpoint python and poetry installation

Once installed python and poetry, run the following command:

```bash
poetry run python --version
```

You should see an output something like the following:

```plaintext
Python 3.11.0
```

### Install dependencies

Change directory to the cloned repository and install the dependencies using poetry:

```bash
cd software-metrics-machine
poetry install --no-root
```

## Define where to store the data

This project uses a folder to store the data fetched from the different providers, set the env variable `SMM_STORE_DATA_AT`
to point to the desired location. Use absolute paths.

```bash
export SMM_STORE_DATA_AT=/path/to/data/folder
```

Ensure the folder exists and use a different folder than the cloned repository to avoid any accidental deletion or data
changes. For example:

## Create the configuration file

in the folder pointed to store the data, create a configuration file named `smm_config.json` with the following content:

```json
{
  "git_provider": "github",
  "github_token": "your_github_token",
  "github_repository": "marabesi/json-tool",
  "git_repository_location": "/your/local/repo"
}
```

This configuration is the central point to configure the project and give it default values. Replace `your_github_token` with
the token you generated, and `/your/local/repo` with the path where you cloned the repository. A table wih the full
configuration options is available at [Configuration options](getting-started.md#configuration-options).

### Checkpoint store data

Let's now check the env variables for data storage, run the following command:

```bash
env
```

You should see an output something like the following:

```plaintext
SMM_STORE_DATA_AT=/path/to/data/folder
```

With this, you are ready to start using Software Metrics Machine and fetch data from your repository with a local
setup.

## Docker setup

This project provides a docker image to run the commands without the need to install python and poetry. To build the
docker image, run the following command in the root of the cloned repository:

```bash
docker build -t smm:latest .
```

Running the commands using docker is done using the provided script `run-cli.sh`, for example:

```bash
docker run --rm -e SMM_STORE_DATA_AT="/data" -v $(pwd)/downloads:/data smm sh ./run-cli.sh
```

### Checkpoint docker setup

To check the docker setup, run the following command:

```bash
docker run --rm -e SMM_STORE_DATA_AT="/data" -v $(pwd)/downloads:/data smm sh ./run-cli.sh
```

You should see an output something like the following:

```plaintext
Usage: main.py [OPTIONS] COMMAND [ARGS]...

Options:
  --help  Show this message and exit.

Commands:
  codemaat
  pipelines
  prs
  pydriller
  tools
```

## Ready to go

You are now ready to start using Software Metrics Machine and fetch data from your repository. The next step is to
pick a provider and start fetching data.

## Configuration options

The configuration file `smm_config.json` supports the following options:

| Key                     |  Section      |  Description                                                            | Required | Default Value        |
|-------------------------| -------       | ------------------------------------------------------------------------|----------|----------------------|
| **PROVIDERS**           |               |                                                                         |          |                      |
| git_provider            |  Provider     |  The git provider to use (github, gitlab, etc)                          | Yes      | github               |
| [github_token](./github.md#generating-a-token)          |  Provider     |  The personal access token for GitHub   | Yes      |                      |
| **REPOSITORY**          |               |                                                                         |          |                      |
| github_repository       |  Repository   |  The GitHub repository in the format user/repo                          | Yes      |                      |
| git_repository_location |  Repository   |  The local path to the git repository (for codemaat)                    | Yes      |                      |
| **METRICS**             |               |                                                                         |          |                      |
| deployment_frequency_target_pipeline    |  Metrics     |  The personal access token for GitLab                    | No       |                      |
| deployment_frequency_target_job         |  Metrics     |  The personal access token for GitLab                    | No       |                      |
| main_branch             |  Metrics      |  The main branch repository, usually main by default                    | No       |                      |
| **DASHBOARD**           |               |                                                                         |          |                      |
| dashboard_start_date    |  Dashboard     |  Specifies the start date to start the dashboard                       | No       |                      |
| dashboard_end_date      |  Dashboard     |  Specifies the end date to start the dashboard                         | No       |                      |
