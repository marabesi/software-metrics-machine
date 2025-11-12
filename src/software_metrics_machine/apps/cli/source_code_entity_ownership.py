import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
)
from software_metrics_machine.providers.codemaat.plots.entity_ownership import (
    EntityOnershipViewer,
)


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
@click.option(
    "--include-only",
    type=str,
    default=None,
    help="Optional comma-separated glob patterns to include only (e.g. '*.py,**/**/*.js')",
)
def entity_ownership(out_file, top, ignore_files, authors, include_only):
    """Plot entity (File) ownership."""
    df_repo = create_codemaat_repository()
    viewer = EntityOnershipViewer(repository=df_repo)
    result = viewer.render(
        top_n=top,
        ignore_files=ignore_files,
        out_file=out_file,
        authors=authors,
        include_only=include_only,
    )
    click.echo(result.data)


command = entity_ownership
