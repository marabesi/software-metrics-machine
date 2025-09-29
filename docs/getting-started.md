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

## Environment requirements

* python 3.10+
* poetry installed --no-root
* java (for running codemaat)

## MacOs

If you are on a mac, you can easily install them using the following commands:

```bash
brew install python
brew install poetry
```

## Checkpoint python and poetry installation

Once installed python and poetry, run the following command:

```bash
poetry run python --version
```

You should see an output something like the following:

```plaintext
Python 3.11.0
```

## Clone the repository

```bash
git clone https://github.com/marabesi/software-metrics-machine.git
```

## Install dependencies

Change directory to the cloned repository and install the dependencies using poetry:

```bash
cd software-metrics-machine
poetry install --no-root
```

## Define where to store the data

This project uses a folder to store the data fetched from the different providers, set the env variable `SMM_STORE_DATA_AT`
to point to the desired location. Use absolute path.

```bash
export SMM_STORE_DATA_AT=/path/to/data/folder
```

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

A table wih the full configuration options is available at [Configuration options](getting-started.md#configuration-options).

## Checkpoint store data

Let's now check the env variables for data storage, run the following command:

```bash
env
```

You should see an output something like the following:

```plaintext
SMM_STORE_DATA_AT=/path/to/data/folder
```

With this, you are ready to start using Software Metrics Machine and fetch data from your repository.

## Configuration options

The configuration file `smm_config.json` supports the following options:

| Key                     |  Section      |  Description                                                            | Required | Default Value        |
|-------------------------| -------       | ------------------------------------------------------------------------|----------|----------------------|
| Providers               |               |                                                                         |          |                      |
| git_provider            |  Provider     |  The git provider to use (github, gitlab, etc)                          | Yes      | github               |
| [github_token](./github.md#generating-a-token)          |  Provider     |  The personal access token for GitHub                                   | Yes      |                      |
| Repository              |               |                                                                         |          |                      |
| github_repository       |  Repository   |  The GitHub repository in the format user/repo                          | Yes      |                      |
| git_repository_location |  Repository   |  The local path to the git repository (for codemaat)                    | Yes      |                      |
| Metrics                 |               |                                                                         |          |                      |
| deployment_frequency_target_pipeline    |  Metrics     |  The personal access token for GitLab                    | No       |                      |
| deployment_frequency_target_job         |  Metrics     |  The personal access token for GitLab                    | No       |                      |
