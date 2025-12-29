import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.plots.view_pipeline_runs_by_week_or_month import (
    ViewWorkflowRunsByWeekOrMonth,
)


@click.command(name="runs-by", help="Plot pipeline runs by week or month")
@click.option(
    "--workflow-path",
    "-w",
    type=str,
    default=None,
    help="Optional workflow path (case-insensitive substring) to filter runs",
)
@click.option(
    "--include-defined-only",
    is_flag=True,
    help="If set, include only workflows that are defined as .yml or .yaml, excluding those that are automated by GitHub (e.g., dependabot).",  # noqa: E501
)
@click.option(
    "--aggregate-by",
    type=click.Choice(["week", "month"]),
    default="week",
    help="Aggregate the data by 'week' (default) or 'month'",
)
@click.option(
    "--start-date",
    type=str,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    help="End date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--raw-filters",
    type=str,
    default=None,
    help="Comma-separated key=value pairs to filter runs (e.g., event=push,target_branch=main)",
)
def workflow_runs_by(
    workflow_path,
    include_defined_only,
    aggregate_by,
    start_date,
    end_date,
    raw_filters,
):
    return ViewWorkflowRunsByWeekOrMonth(repository=create_pipelines_repository()).main(
        aggregate_by=aggregate_by,
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
        include_defined_only=include_defined_only,
    )


command = workflow_runs_by
