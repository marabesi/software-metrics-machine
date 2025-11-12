import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
)
from software_metrics_machine.providers.codemaat.plots.entity_effort import (
    EntityEffortViewer,
)


@click.command(name="entity-effort", help="Plot entity effort graph")
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
    default=30,
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
def entity_effort(out_file, top, ignore_files, include_only):
    """Plot entity (File) effort."""
    df_repo = create_codemaat_repository()
    viewer = EntityEffortViewer(repository=df_repo)
    result = viewer.render_treemap(
        top_n=top,
        ignore_files=ignore_files,
        out_file=out_file,
        include_only=include_only,
    )
    click.echo(result.data)


command = entity_effort
