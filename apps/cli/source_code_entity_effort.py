import click
from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.codemaat.codemaat_repository import CodemaatRepository
from providers.codemaat.plots.entity_effort import EntityEffortViewer


@click.command()
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
def entity_effort(out_file, top, ignore_files):
    """Plot entity (File) effort."""
    df_repo = CodemaatRepository(
        configuration=ConfigurationBuilder(Driver.JSON).build()
    )
    viewer = EntityEffortViewer(repository=df_repo)
    viewer.render_treemap(top_n=top, ignore_files=ignore_files, out_file=out_file)


command = entity_effort
