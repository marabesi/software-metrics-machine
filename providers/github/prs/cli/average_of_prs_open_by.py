import click

from providers.github.prs.prs_repository import LoadPrs
from providers.github.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)


@click.command()
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
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
def average_prs_open_by(out_file, author, labels, aggregate_by, start_date, end_date):
    """Plot average PR open."""
    ViewAverageOfPrsOpenBy(repository=LoadPrs()).main(
        out_file=out_file,
        author=author,
        labels=labels,
        aggregate_by=aggregate_by,
        start_date=start_date,
        end_date=end_date,
    )


command = average_prs_open_by
