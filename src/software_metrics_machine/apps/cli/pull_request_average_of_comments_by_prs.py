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
    "--author",
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
def average_prs_comment(author, labels, aggregate_by, start_date, end_date):
    result = ViewAverageCommentsPerPullRequest(repository=create_prs_repository()).main(
        author=author,
        labels=labels,
        aggregate_by=aggregate_by,
        start_date=start_date,
        end_date=end_date,
    )
    click.echo(result.data)


command = average_prs_comment
