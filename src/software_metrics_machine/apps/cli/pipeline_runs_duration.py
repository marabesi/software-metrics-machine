import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.plots.view_pipeline_execution_duration import (
    ViewPipelineExecutionRunsDuration,
)


@click.command(name="runs-duration", help="Plot pipeline runs duration")
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
@click.option(
    "--workflow-path",
    "-w",
    help="Workflow path (exact match, case-insensitive). Can be repeated or supply comma-separated values.",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="End date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--max-runs",
    type=int,
    default=100,
    help="Maximum number of runs to include in the plot",
)
@click.option(
    "--raw-filters",
    type=str,
    help=(
        "Filters to apply to the dataset, in the form key=value,key2=value2."
        "For possible filters, see https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository"  # noqa
    ),
)
def workflows_run_duration(
    out_file, workflow_path, start_date, end_date, max_runs, raw_filters
):
    return ViewPipelineExecutionRunsDuration(
        repository=create_pipelines_repository()
    ).main(
        out_file=out_file,
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )


command = workflows_run_duration
