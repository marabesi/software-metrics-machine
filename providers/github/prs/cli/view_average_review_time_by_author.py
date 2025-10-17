import click

from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from core.prs.prs_repository import LoadPrs
from core.prs.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)


@click.command()
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
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
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
def review_time_by_author(top, labels, out_file, start_date, end_date):
    """Plot average PR open time by author."""

    return ViewAverageReviewTimeByAuthor(
        repository=LoadPrs(
            configuration=ConfigurationBuilder(driver=Driver.CLI).build()
        )
    ).plot_average_open_time(
        title=f"Top {top} PR authors by avg open time",
        top=top,
        labels=labels,
        out_file=out_file,
        start_date=start_date,
        end_date=end_date,
    )


command = review_time_by_author
