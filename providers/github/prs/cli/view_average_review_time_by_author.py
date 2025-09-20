import click

from providers.github.prs.plots.view_average_review_time_by_author import (
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
def review_time_by_author(top, labels, out_file):
    """Plot average PR open time by author."""

    return ViewAverageReviewTimeByAuthor().plot_average_open_time(
        title=f"Top {top} PR authors by avg open time",
        top=top,
        labels=labels,
        out_file=out_file,
    )


command = review_time_by_author
