import click

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
def main(out_file, author, labels, aggregate_by):
    """Plot average PR open."""
    ViewAverageOfPrsOpenBy().main(
        out_file=out_file,
        author=author,
        labels=labels,
        aggregate_by=aggregate_by,
    )


command = main
