# GitHub CLI Commands for Pull Request

This document provides a guide for developers to run GitHub-related analyses using the CLI commands available in the
`software-metrics-machine` project. Each command is categorized by its purpose and functionality.

## Pull Requests

### Fetch PRs

```bash
smm prs fetch
```

| Option         | Description                         | Example                  |
|----------------|-------------------------------------|--------------------------|
| Start date     | Fetches PRs created after a date.   | `--start-date=2025-01-01`|
| End date       | Fetches PRs created before a date.  | `--end-date=2025-12-31`  |
| Filters       | Allows to pass in filters directly to the [GitHub API](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests)  | `--raw-filters=state=open`  |
| Force       | By default a file is stored with the retrieved data to avoid refetching it again. However, using this parameter bypass this cache. | `--force=true`  |

Filtering the data fetch from PRs by date is done logically while fetching the data, this is not a feature that GitHub
API provides.

### Data quality

Once data is fetched, you can run a summary of the data using the following command:

```bash
smm prs summary
```

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

### Average Review Time by Author

```bash
smm prs review-time-by-author
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Labels         | Filters PRs by the labels attached to it.      | `--labels=my_label,another_label`       |
| Start date     | Fetches PRs created after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches PRs created before a date.  | `--end-date=2025-12-31`     |
| Limit          | If the list is too big --top will show only the top x results from the list.  | `--top=10`     |
| File           | The name of the file to store the generated chart  | `--out-file=my_chart.png` or   `--out-file=subfolder/my_chart.png`   |
| Step           | Step defines the pace in which the data is fetched. It helps to mitigate the rate limits in the GitHub API | `--step-by=day` |

### PRs by Author

```bash
smm prs by-author
```

### Average of PRs Open by Time

```bash
smm prs average-open-by
```

### Average Comments per PR

Plot the average number of comments a PR receives before it is merged, aggregated by week or month.

```bash
smm prs average-comments-by --aggregate-by=week
```

Note: CLI commands that return processed data will now print the returned data to the console when run
non-interactively (for example, when executed by the test harness or CI). If a command produces a plot and you
pass `--out-file`, the plot will also be saved to the provided path.
