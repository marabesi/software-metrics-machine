# GitHub CLI Commands for Pull Request

This document provides a guide for developers to run GitHub-related analyses using the CLI commands available in the
`software-metrics-machine` project. Each command is categorized by its purpose and functionality.

## Pull Requests

### Fetch PRs

```bash
./run-cli.sh prs fetch
```

| Option         | Description                         | Example                  |
|----------------|-------------------------------------|--------------------------|
| Start date     | Fetches PRs created after a date.   | `--start-date=2025-01-01`|
| End date       | Fetches PRs created before a date.  | `--end-date=2025-12-31`  |
| Filters       | Allows to pass in filters directly to the [GitHub API](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests)  | `--raw-filters=state=open`  |
| Force       | By default a file is stored with the retrieved data to avoid refetching it again. However, using this parameter bypasses this cache. | `--force=true`  |

Filtering the data fetch from PRs by date is done logically while fetching the data, this is not a feature that GitHub
API provides.

### Data quality

Once data is fetched, you can run a summary of the data using the following command:

```bash
./run-cli.sh prs summary
```

| Option         | Description                         | Example                  |
|----------------|-------------------------------------|--------------------------|
| csv            | Export summary as CSV to the given file path | `--csv=summary.csv` |
| Start date     | Filter PRs created on or after this date   | `--start-date=2025-01-01`|
| End date       | Filter PRs created on or before this date  | `--end-date=2025-12-31`  |
| Output         | Output format (text or json)        | `--output=json`          |

It will print a summary of the PRs fetched, including:

- Total PRs (total_prs): The total number of pull requests.
- First PR (first_pr): Details of the first pull request.
- Last PR (last_pr): Details of the last pull request.
- Merged PRs (merged_prs): The number of pull requests that were merged.
- Closed PRs (closed_prs): The number of pull requests that were closed but not merged.
- PRs Without Conclusion (without_conclusion): The number of pull requests that are neither closed nor merged.
- Unique Authors (unique_authors): The number of unique authors who created pull requests.
- Unique Labels (unique_labels): The number of unique labels used across pull requests.
- Labels (labels): A list of all unique labels used in pull requests.

### View Average Review Time by Author

```bash
./run-cli.sh prs review_time_by_author
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Top            | How many top authors to show         | `--top=10`               |
| Labels, -l     | Filters PRs by the labels attached to it | `--labels=my_label,another_label` or `-l bug,enhancement` |
| Start date     | Filter PRs created on or after this date   | `--start-date=2025-01-01`     |
| End date       | Filter PRs created on or before this date  | `--end-date=2025-12-31`     |
| File, -o       | The path to save the plot image  | `--out-file=my_chart.png` or `-o subfolder/my_chart.png`   |

### View PRs by Author

```bash
./run-cli.sh prs by_author
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Top            | How many top authors to show         | `--top=10`               |
| Labels, -l     | Filters PRs by the labels attached to it | `--labels=my_label,another_label` or `-l bug,enhancement` |
| Start date     | Filter PRs created on or after this date   | `--start-date=2025-01-01`     |
| End date       | Filter PRs created on or before this date  | `--end-date=2025-12-31`     |
| File, -o       | The path to save the plot image  | `--out-file=my_chart.png` or `-o subfolder/my_chart.png`   |

### View Average of PRs Open by Time

```bash
./run-cli.sh prs average_open_by
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| File, -o       | The path to save the plot image  | `--out-file=my_chart.png` or `-o subfolder/my_chart.png`   |
| Author, -a     | Filter PRs by author username        | `--author=username` or `-a username` |
| Labels, -l     | Filters PRs by the labels attached to it | `--labels=my_label,another_label` or `-l bug,enhancement` |
| Aggregate by, -g | Aggregate the averages by month (default) or week | `--aggregate-by=week` or `-g week` |
| Start date     | Filter PRs created on or after this date   | `--start-date=2025-01-01`     |
| End date       | Filter PRs created on or before this date  | `--end-date=2025-12-31`     |
