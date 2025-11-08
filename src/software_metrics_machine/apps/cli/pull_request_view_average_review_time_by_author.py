import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_prs_repository,
)
from software_metrics_machine.core.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)


@click.command(
    name="review-time-by-author", help="Plot average PR review time by author"
)
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
        repository=create_prs_repository()
    ).plot_average_open_time(
        title=f"Top {top} PR authors by avg open time",
        top=top,
        labels=labels,
        out_file=out_file,
        start_date=start_date,
        end_date=end_date,
    )


command = review_time_by_author
