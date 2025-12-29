import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_prs_repository,
)
from software_metrics_machine.core.prs.plots.view_open_prs_through_time import (
    ViewOpenPrsThroughTime,
)


@click.command(name="through-time", help="Plot PRs created through time")
@click.option(
    "--authors",
    "-a",
    type=str,
    default=None,
    help="Optional username to filter PRs by author",
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
def prs_through_time(authors, start_date, end_date, raw_filters):
    result = ViewOpenPrsThroughTime(repository=create_prs_repository()).main(
        title="Open Pull Requests Through Time",
        start_date=start_date,
        end_date=end_date,
        authors=authors,
        raw_filters=raw_filters,
    )
    click.echo(result.data)


command = prs_through_time
