import click

from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.codemaat.codemaat_repository import CodemaatRepository
from providers.codemaat.plots.coupling import CouplingViewer


@click.command()
@click.option(
    "--ignore-files",
    type=str,
    default=None,
    help="Optional comma-separated glob patterns to ignore (e.g. '*.json,**/**/*.png')",
)
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
def coupling(ignore_files, out_file):
    """Plot coupling graph."""
    return CouplingViewer(
        repository=CodemaatRepository(
            configuration=ConfigurationBuilder(Driver.JSON).build()
        )
    ).render(
        out_file=out_file,
        ignore_files=ignore_files,
    )


command = coupling
