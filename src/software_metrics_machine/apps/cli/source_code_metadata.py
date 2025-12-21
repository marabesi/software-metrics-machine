import click


@click.command(name="metadata", help="Plot metrics based on the source code history")
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
@click.option(
    "--metric",
    type=str,
    default=None,
    help="Metric to plot (e.g., 'test_code_vs_production_code')",
)
def code_metadata(start_date, end_date, metric):
    click.echo("No production files with commits found to analyze.")


command = code_metadata
