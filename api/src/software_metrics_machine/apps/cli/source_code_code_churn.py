import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
)
from software_metrics_machine.providers.codemaat.plots.code_churn import CodeChurnViewer


@click.command(name="code-churn", help="Plot the code churn rate over time")
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Filter code churn data on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="Filter code churn data on or before this date (ISO 8601)",
)
def code_churn(start_date, end_date):
    result = CodeChurnViewer(repository=create_codemaat_repository()).render(
        start_date=start_date,
        end_date=end_date,
    )

    for row in result.data:
        if row["type"] == "Added":
            click.echo(f"{row["date"]}    Added     {row["value"]}")
        if row["type"] == "Deleted":
            click.echo(f"{row["date"]}  Deleted     {row["value"]}")


command = code_churn
