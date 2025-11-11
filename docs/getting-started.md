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

## Installing

### Environment requirements

* python 3.13+
* java (for running source code analysis)

### Via PyPI

```bash
pip install software-metrics-machine
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
configuration options is available at [Configuration options](./dashboard/configuration.md).

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

## Ready to go

You are now ready to start using Software Metrics Machine and fetch data from your repository. The next step is to
pick a provider and start fetching data. Proceed to [your first analysis with GitHub](./your-first-analysis-with-github.md).

## Docker setup

> [!IMPORTANT]
> Using docker is optional, it requires extra knowledge of docker commands and docker installation.
>

This project provides a docker image to run the commands without the need to instal the python environment locally. To build the
docker image, run the following command in the root of the cloned repository:

```bash
docker build -t smm-docker:latest .
```

Once the image is built, you can run the commands using docker.

### Checkpoint docker setup

To check the docker setup, run the following command:

```bash
docker run --rm -e SMM_STORE_DATA_AT="/data" -v $(pwd)/downloads:/data smm-docker smm
```

You should see an output something like the following:

```plaintext
Usage: main.py [OPTIONS] COMMAND [ARGS]...

Options:
  --help  Show this message and exit.

Commands:
  code
  pipelines
  prs
  pydriller
  tools
```

Now you are ready to go and start running the commands using docker, take the commands from the CLI documentation
and run them using docker as shown in the checkpoint above.
