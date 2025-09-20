import click

from providers.github.prs.plots.view_prs_by_author import ViewPrsByAuthor


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
def prs_by_author(top, labels, out_file):
    return ViewPrsByAuthor().plot_top_authors(
        title=f"Top {top} PR authors", top=top, labels=labels, out_file=out_file
    )


command = prs_by_author
