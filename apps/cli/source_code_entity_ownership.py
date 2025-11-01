import click

from core.infrastructure.repository_factory import create_codemaat_repository
from providers.codemaat.plots.entity_ownership import EntityOnershipViewer


@click.command(name="entity-ownership", help="Plot entity churn graph")
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
@click.option(
    "--top",
    type=int,
    default=None,
    help="Optional number of top entities to display (by total churn)",
)
@click.option(
    "--ignore-files",
    type=str,
    default=None,
    help="Optional comma-separated glob patterns to ignore (e.g. '*.json,**/**/*.png')",
)
@click.option(
    "--authors",
    type=str,
    default=None,
    help="Optional comma-separated list of authors to filter by (e.g. 'Jane,John')",
)
def entity_ownership(out_file, top, ignore_files, authors):
    """Plot entity (File) ownership."""
    df_repo = create_codemaat_repository()
    viewer = EntityOnershipViewer(repository=df_repo)
    viewer.render(
        top_n=top,
        ignore_files=ignore_files,
        out_file=out_file,
        authors=authors,
    )


command = entity_ownership
