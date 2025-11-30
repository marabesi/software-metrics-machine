import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
)
from software_metrics_machine.providers.codemaat.plots.entity_churn import (
    EntityChurnViewer,
)


@click.command(name="entity-churn", help="Plot entity churn graph")
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
    "--include-only",
    type=str,
    default=None,
    help="Optional comma-separated glob patterns to include only (e.g. '*.py,**/**/*.js')",
)
def entity_churn(top, ignore_files, include_only):
    df_repo = create_codemaat_repository()
    viewer = EntityChurnViewer(repository=df_repo)
    result = viewer.render(
        top_n=top,
        ignore_files=ignore_files,
        include_only=include_only,
    )
    click.echo(result.data)


command = entity_churn
