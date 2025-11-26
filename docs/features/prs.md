---
outline: deep
---

# Pull Requests

<!--@include: ../parts/supported-by-all.md{,2}-->

This dashboard provides insights into Pull Request (PR) activity within a software repository. It includes four distinct
charts, each designed to highlight different aspects of PR management and team dynamics.

Each chart in the dashboard is interactive and supports filtering by author, labels, and date range, allowing you to
drill down into the data that matters most for your team. This enables you to monitor team flow and identify bottlenecks.

## Summary PRs data

Show a summary of the PRs fetched from the repository, including total PRs, average open time, and other key metrics.

:::tabs key:cli
== Dashboard

Not available yet.


== CLI

```bash
smm prs summary
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches PRs created after a date.    | `--start-date=2025-01-01`|
| End date       | Fetches PRs created before a date.   | `--end-date=2025-12-31`  |
| Export         | Exports the data as csv to a given file path   | `--csv=my_export.csv`  |
| Output        | Defines the output format, either text or json. Defaults to text.  | `--output=json`     |
| Labels         | Filters PRs by attached labels. Multiple labels can be provided separated by commas. | `--labels=bug,enhancement` |

### Examples - Summary PRs data

```bash
smm prs summary \
  --start-date=2025-01-01 \
  --end-date=2025-06-30 \
  --output=text \
  --labels=bug,enhancement
```

Output:

```textplain
PRs Summary:

Total PRs: 876
Merged PRs: 589
Closed PRs: 743
PRs Without Conclusion: 287
Unique Authors: 146
Unique Labels: 17
Average of comments per PR: 1.711187214611872

Labels:
  - created-by: next.js team: 350 PRs
  - locked: 705 PRs
  - tests: 375 PRs
  - documentation: 152 PRs
  - ci approved: 45 PRs
  - run-react-18-tests: 97 PRs
  - type: next: 396 PRs
  - created-by: turbopack team: 188 PRs
  - turbopack: 181 PRs
  - type: react-sync: 37 PRs
  - examples: 21 PRs
  - create-next-app: 24 PRs
  - created-by: next.js devex team: 44 PRs
  - font (next/font): 25 PRs
  - hacktoberfest-accepted: 5 PRs
  - ci bypass graphite optimization: 10 PRs
  - rspack: 6 PRs

First PR:
  Number: 84395
  Title: Update failing e2e deploy tests
  Author: ijjk
  Created: 2025-10-01T01:09:44Z
  Merged: 2025-10-01T02:18:18Z
  Closed: 2025-10-01T02:18:18Z

Last PR:
  Number: 85953
  Title: Update authentication.mdx: Fix `Auth0` Link
  Author: georgesfarah
  Created: 2025-11-09T23:07:38Z
  Merged: 2025-11-11T09:09:20Z
  Closed: 2025-11-11T09:09:20Z
```

:::






## Open PRs Through Time

Shows the volume of PRs opened and closed each day. This helps you spot bottlenecks, busy periods, or trends in your team's workflow.

:::tabs key:cli
== Dashboard

### Type of Chart

Bar chart (daily breakdown, with separate bars for opened and closed PRs).

### Insight Provided

Shows the volume of PRs opened and closed each day. This helps you spot bottlenecks, busy periods, or trends in your team's workflow.

![Pull requests timeline](/dashboard/prs/prs_timeline.png)

== CLI

```bash
smm prs through-time
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches PRs created after a date.    | `--start-date=2025-01-01`|
| End date       | Fetches PRs created before a date.   | `--end-date=2025-12-31`  |
| Authors        | Filters PRs by the authors who created them. Multiple authors can be provided separated by commas. This is the author who opened the PR  | `--authors=author1,author2`     |

### Examples - Open PRs Through Time

Computes the number of opened and closed PRs over time for a specific author:

```bash
smm prs through-time \
  --start-date=2025-01-01 \
  --end-date=2025-06-30 \
  --authors=author1,author2
```

:::

If you notice a spike in opened PRs but few closed ones, it may indicate the start of a new sprint or a backlog forming.
For example, if September 25th shows many opened PRs but none closed, it could signal a need to focus on reviews.

### How It Computes and Filters

1. Aggregates PR events by day.
2. Filters by date range (start/end date) - the date used in the prs are the created_at.
3. Data is processed to count opened and closed PRs per day.
4. You can filter the chart to focus on specific periods, such as a sprint or release window.










## Average PR Open

Tracks how long PRs stay open before merging. It uses weekly or monthly aggregation to show trends in review speed.

:::tabs key:cli
== Dashboard

### Type of Chart

Line chart (trend of average days PRs remain open, aggregated by week or month).


### Insight Provided


![Pull requests open by on average](/dashboard/prs/open_prs_average.png)

== CLI

```bash
smm prs average-open-by
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches PRs created after a date.    | `--start-date=2025-01-01`|
| End date       | Fetches PRs created before a date.   | `--end-date=2025-12-31`  |
| Authors        | Filters PRs by the authors who created them. Multiple authors can be provided separated by commas. Thisis the author who opened the PR  | `--authors=author1,author2`     |
| Aggregate by   | Defines the aggregation period, either by week or month. Defaults to week.  | `--aggregate-by=month`     |
| Labels         | Filters PRs by the labels attached to it. Multiple labels can be provided separated by commas.  | `--labels=my_label,another_label`     |

### Examples - Average PR Open

A downward trend in average open days means your team is merging PRs faster, indicating improved workflow. For instance,
if the average drops from 5 to 2 days over several weeks, your review process is getting more efficient.

Computes the number of opened and closed PRs over time for a specific author:

```bash
smm prs average-open-by \
  --start-date=2025-01-01 \
  --end-date=2025-06-30 \
  --authors=author1,author2 \
  --aggregate-by=month \
  --labels=bug,enhancement
```


:::



### How It Computes and Filters

1. Calculates the average number of days PRs are open, grouped by week or month.
2. Supports filters for author, labels (e.g., bug, enhancement), and date range.
3. Aggregation smooths out daily fluctuations, showing long-term trends.





## Average Review Time By Author

Plot the average time taken from the team to review a PR open by an author and merge it. The result is shown in average
by days.

:::tabs key:cli
== Dashboard

### Type of Chart

Horizontal bar chart (authors ranked by average PR open time).

### Insight Provided

Highlights which contributors have PRs that remain open the longest, helping identify review bottlenecks or training needs.

![Pull requests open by author](/dashboard/prs/prs_open_by_author.png)

== CLI

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

:::



### Example Usage

If one author consistently has longer open times, it may indicate complex PRs or a need for more review support. For
example, if Alice's PRs average 7 days open while others average 2, you can investigate further.

### How It Computes and Filters

1. Computes average open time for each author.
2. Filters by top N authors, labels, and date range.
3. Data is processed to exclude bots or focus on specific contributors.







## PRs By Author

:::tabs key:cli
== Dashboard

### Type of Chart

Horizontal bar chart (authors ranked by number of PRs opened).

### Insight Provided

Shows who is most active in opening PRs, helping you recognize top contributors and balance workload.

== CLI

```bash
smm prs by-author
```

:::


### Example Usage

If one developer is opening most PRs, you may want to redistribute tasks or recognize their effort. For example, if Bob
opened 30 PRs in a month, he’s a key contributor.

### How It Computes and Filters

1. Counts PRs opened by each author.
2. Filters by top N authors, labels, and date range.
3. Includes bots (e.g., dependabot) to show the impact of automation.














## Average Comments per PR

Plot the average number of comments a PR receives before it is merged, aggregated by week or month.

:::tabs key:cli
== Dashboard


![Comments made in prs averaged](/dashboard/prs/prs_comments_average.png)

== CLI

```bash
smm prs average-comments-by --aggregate-by=week
```

:::

