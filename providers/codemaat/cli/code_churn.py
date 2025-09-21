import click

from providers.codemaat.plots.code_churn import CodeChurnViewer
from providers.codemaat.codemaat_repository import CodemaatRepository


@click.command()
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
def code_churn(out_file):
    """Plot the code churn rate over time."""
    return CodeChurnViewer().render(CodemaatRepository(), out_file=out_file)


command = code_churn
