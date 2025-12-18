import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_prs_repository,
)
from software_metrics_machine.core.prs.plots.view_prs_by_author import ViewPrsByAuthor


@click.command(name="by-author", help="Plot number of PRs by author")
@click.option(
    "--top",
    type=int,
    default=10,
    help="How many top authors to show",
)
@click.option(
    "--labels",
    "-l",
    type=str,
    default=None,
    help="Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)",
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
def by_author(top, labels, start_date, end_date, raw_filters):
    result = ViewPrsByAuthor(repository=create_prs_repository()).plot_top_authors(
        title=f"Top {top} PR authors",
        top=top,
        labels=labels,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )
    click.echo(result.data)


command = by_author
