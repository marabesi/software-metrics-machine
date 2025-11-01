import click

from core.infrastructure.repository_factory import create_codemaat_repository
from providers.codemaat.plots.coupling import CouplingViewer


@click.command(name="coupling", help="Plot coupling graph")
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
    return CouplingViewer(repository=create_codemaat_repository()).render(
        out_file=out_file,
        ignore_files=ignore_files,
    )


command = coupling
