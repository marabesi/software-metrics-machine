import click

from software_metrics_machine.core.code.code_metric import CodeMetric
from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
)


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
    required=True,
    help="Metric to plot (e.g., 'test_code_vs_production_code')",
)
@click.option(
    "--test-patterns",
    type=str,
    required=True,
    help="",
)
@click.option(
    "--ignore",
    type=str,
    default=None,
    help="",
)
def code_metadata(start_date, end_date, metric, test_patterns, ignore):
    repository = create_codemaat_repository()
    result = CodeMetric(repository=repository).analyze_code_changes(
        start_date=start_date,
        end_date=end_date,
        ignore=ignore,
        test_patterns=test_patterns,
    )
    click.echo(result.message)


command = code_metadata
