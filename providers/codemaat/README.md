# Git provider

Git is used as a source of data to extract metrics from the git log. This provider uses a local git repository to fetch
the data through [Codemaat](https://github.com/adamtornhill/code-maat).

## Basic configuration with env

### Define where the git repository is located

This project uses a local git repository to extract data from the git log, set the env variable `GIT_REPOSITORY_LOCATION`
to point to the desired location. Use absolute path.

```bash
export GIT_REPOSITORY_LOCATION=/my/path/to/git/repo
```

This provider in addition to the GIT_REPOSITORY_LOCATION env variable, requires the STORE_DATA_AT env variable to know
where to store the fetched data. [Make sure to have it set](../../README.md).

### Checkpoint

Let's now check the env variables for the repository location and data store, run the following command:

```bash
env
```

You should see an output something like the following:

```plaintext
GIT_REPOSITORY_LOCATION=/my/path/to/git/repo
STORE_DATA_AT=/path/to/data/folder
```
