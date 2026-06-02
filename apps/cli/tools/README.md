# CodeMaat Tools

This directory contains the [CodeMaat](https://github.com/adamtornhill/code-maat) JAR used for source code analysis (file coupling, change frequency, code churn, entity effort, etc.).

## Requirements

- **Java** (any recent JRE/JDK — 11+ recommended) must be installed and available on your `PATH`.
- The JAR file `code-maat-1.0.4-standalone.jar` must be present in this directory. It is bundled in the repository.

Verify Java is available:

```bash
java -version
```

## Running CodeMaat analysis

Use the `fetch-codemaat.sh` script in `apps/cli/` to generate the CSV files that SMM reads for code metrics.

```bash
./apps/cli/fetch-codemaat.sh <git_repo_path> <data_output_path> <start_date> [sub_folder] [force]
```

| Argument | Required | Description |
|---|---|---|
| `git_repo_path` | yes | Absolute path to the local git repository to analyse |
| `data_output_path` | yes | Directory where output CSV files will be written (must be writable) |
| `start_date` | yes | Analysis start date in `YYYY-MM-DD` format |
| `sub_folder` | no | Restrict analysis to a sub-directory within the repo |
| `force` | no | Set to `true` to regenerate existing output files |

### Example

```bash
./apps/cli/fetch-codemaat.sh \
  /path/to/your/repo \
  /path/to/smm/data \
  2024-01-01
```

## Output files

The script writes the following CSV files to `data_output_path`:

| File | CodeMaat analysis | What it contains |
|---|---|---|
| `logfile.log` | _(git log)_ | Raw git log used as input to CodeMaat |
| `age.csv` | `age` | Age of each file (time since last change) |
| `abs-churn.csv` | `abs-churn` | Absolute code churn (lines added/removed) |
| `author-churn.csv` | `author-churn` | Code churn broken down by author |
| `entity-ownership.csv` | `entity-ownership` | Primary ownership of each file |
| `entity-effort.csv` | `entity-effort` | Effort (commit count) per file per author |
| `entity-churn.csv` | `entity-churn` | Churn per file |
| `coupling.csv` | `coupling` | Logical coupling between files |

## Configuring SMM to use the output

Point `CODEMAAT_DATA_PATH` at the folder where the CSVs were written:

```bash
export CODEMAAT_DATA_PATH=/path/to/smm/data
```

This variable is read by both the REST API and the CLI to serve code metrics.
