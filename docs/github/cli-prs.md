---
outline: deep
---

# GitHub CLI Commands for Pull Request

Pull Requests (PRs) are a fundamental part of collaborative software development on GitHub. They allow developers to
propose changes to a codebase, review code, and discuss modifications before merging them into the main branch. Analyzing
PRs can provide valuable insights into the development process, code quality, and team collaboration. In this section,
we will explore the CLI commands available for fetching and analyzing Pull Requests from GitHub repositories. This is a
must step in order to analyze PRs data using the CLI or [the dashboard](../features/prs.md).

## Fetch PRs

Fetching PR data from GitHub is the first step before performing any analysis. The CLI provide comments to fetch PRs from
a specified repository from GitHub.

```bash
smm prs fetch
```

| Option         | Description <div style="width:200px"></div> | Example <div style="width:200px"></div> |
|----------------|-------------------------------------|--------------------------|
| Months         | It defaults to 1. It is used if no start or end date is given   | `--months=2`|
| Start date     | Fetches PRs created after a date.   | `--start-date=2025-01-01`|
| End date       | Fetches PRs created before a date.  | `--end-date=2025-12-31`  |
| Filters       | Allows to pass in filters directly to the [GitHub API](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests)  | `--raw-filters=state=open`  |
| Force       | By default a file is stored with the retrieved data to avoid refetching it again. However, using this parameter bypass this cache. | `--force=true`  |

Filtering the data fetch from PRs by date is done logically while fetching the data, this is not a feature that GitHub
API provides.

### Examples - Fetch PRs

Fetching PRs from the last 3 months:

```bash
smm prs fetch --months=3
```

Fetching PRs created between January 1, 2025, and June 30, 2025:

```bash
smm prs fetch --start-date=2025-01-01 --end-date=2025-06-30
```

Fetching only open PRs:

```bash
smm prs fetch --raw-filters=state=open,head=main
```

Forcing the fetch to ignore already fetched PRs (this overrides the data stored):

```bash
smm prs fetch --force=true
```

## Fetch PRs comments

Pull requests often have comments that provide insights into the review process. However, in order to fetch comments for
Pull Request, you must first fetch the PRs using the `smm prs fetch` command. The comments are not fetched by default to
optimize the data retrieval process as GitHub API has rate limits. Before fetching the comments, it first uses the PRs
data already fetched to get the comments for each PR using the property `review_comments_url` from each PR.

```bash
smm prs fetch-comments
```

| Option         | Description <div style="width:200px"></div> | Example <div style="width:240px"></div> |
|----------------|-------------------------------------|--------------------------|
| Start date     |  The PRs created date to filter after this date, this is the PR not the comment pr itself.  | `--start-date=2025-01-01`|
| End date       | The PRs created date to filter before this date, this is the PR not the comment pr itself.  | `--end-date=2025-12-31`  |
| Filters        | Allows to pass in filters directly to the [GitHub API](https://docs.github.com/en/rest/pulls/comments?apiVersion=2022-11-28&versionId=free-pro-team%40latest&category=pulls&subcategory=review-requests#list-review-comments-on-a-pull-request). It will pass the filters for each PR request.  | `--raw-filters=sort=created`  |
| Force       | By default a file is stored with the retrieved data to avoid refetching it again. However, using this parameter bypass this cache. | `--force=true`  |

### Examples - Fetch PRs comments

Fetching comments for PRs created between January 1, 2025, and June 30, 2025:

```bash
smm prs fetch-comments --start-date=2025-01-01 --end-date=2025-06-30
```

Forcing the fetch to ignore already fetched comments (this overrides the data stored):

```bash
smm prs fetch-comments --force=true
```

## Data quality

Once data is fetched, you might want to check the quality of it and if the data matches the expected values. To achieve that,
SMM has a summary command that shows basic information about the quality of the data. Such as:

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

The command to get the summary is:

```bash
smm prs summary
```

## Average Review Time by Author

Plot the average time taken from the team to review a PR open by an author and merge it. The result is shown in average
by days.

```bash
smm prs review-time-by-author
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Labels         | Filters PRs by the labels attached to it.      | `--labels=my_label,another_label`       |
| Start date     | Fetches PRs created after a date.    | `--start-date=2025-01-01`     |
| End date       | Fetches PRs created before a date.   | `--end-date=2025-12-31`     |
| Limit          | If the list is too big --top will show only the top x results from the list.  | `--top=10`     |

### Examples - Average Review Time by Author

```bash
smm prs review-time-by-author --labels=bug,enhancement --top=5
```

## PRs by Author

```bash
smm prs by-author
```

## Average of PRs Open by Time

```bash
smm prs average-open-by
```

## Average Comments per PR

Plot the average number of comments a PR receives before it is merged, aggregated by week or month.

```bash
smm prs average-comments-by --aggregate-by=week
```

Note: CLI commands that return processed data will now print the returned data to the console when run
non-interactively (for example, when executed by the test harness or CI). If a command produces a plot and you
pass `--out-file`, the plot will also be saved to the provided path.
