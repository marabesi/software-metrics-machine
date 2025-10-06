import click

from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.codemaat.codemaat_repository import CodemaatRepository
from providers.codemaat.plots.coupling import CouplingViewer


@click.command()
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
def coupling(out_file):
    """Plot coupling graph."""
    return CouplingViewer().render(
        repo=CodemaatRepository(
            configuration=ConfigurationBuilder(Driver.JSON).build()
        ),
        out_file=out_file,
    )


command = coupling
