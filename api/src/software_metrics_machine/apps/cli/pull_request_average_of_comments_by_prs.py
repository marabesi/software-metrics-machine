import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_prs_repository,
)
from software_metrics_machine.core.prs.plots.view_average_comments_per_pr import (
    ViewAverageCommentsPerPullRequest,
)


@click.command(
    name="average-comments-by", help="Plot average of comments a PR receives"
)
@click.option(
    "--authors",
    "-a",
    type=str,
    default=None,
    help="Optional username to filter PRs by author",
)
@click.option(
    "--labels",
    "-l",
    type=str,
    default=None,
    help="Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)",
)
@click.option(
    "--aggregate-by",
    "-g",
    type=click.Choice(["month", "week"]),
    default="month",
    help="Aggregate the averages by 'month' (default) or 'week'",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Filter PRs created on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="Filter PRs created on or before this date (ISO 8601)",
)
@click.option(
    "--raw-filters",
    type=str,
    default=None,
    help="Raw Provider filters string (e.g. 'status=draft,author=john')",
)
def average_prs_comment(
    authors, labels, aggregate_by, start_date, end_date, raw_filters
):
    result = ViewAverageCommentsPerPullRequest(repository=create_prs_repository()).main(
        authors=authors,
        labels=labels,
        aggregate_by=aggregate_by,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )
    click.echo(result.data)


command = average_prs_comment
