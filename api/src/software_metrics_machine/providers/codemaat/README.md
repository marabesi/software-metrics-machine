# Git provider

This provider is focused on fetching and visualizing data from git repositories, it does it through [Codemaat](https://github.com/adamtornhill/code-maat)
which is a tool to extract and analyze data from version control systems. It is a must to have the repository cloned
locally to be able to extract the data.

## Basic configuration with env

### Define where the git repository is located

This project uses a local git repository to extract data from the git log, set the env variable `SSM_GIT_REPOSITORY_LOCATION`
to point to the desired location. Use absolute path.

```bash
export SSM_GIT_REPOSITORY_LOCATION=/my/path/to/git/repo
```

This provider in addition to the SSM_GIT_REPOSITORY_LOCATION env variable, requires the SMM_STORE_DATA_AT env variable to know
where to store the fetched data. [Make sure to have it set](../../../../README.md).

### Checkpoint

Let's now check the env variables for the repository location and data store, run the following command:

```bash
env
```

You should see an output something like the following:

```plaintext
SSM_GIT_REPOSITORY_LOCATION=/my/path/to/git/repo
SMM_STORE_DATA_AT=/path/to/data/folder
```
