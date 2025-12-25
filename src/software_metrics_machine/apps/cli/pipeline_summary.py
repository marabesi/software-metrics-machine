import click
import json

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.pipelines_types import PipelineRun
from software_metrics_machine.core.pipelines.plots.view_pipeline_summary import (
    WorkflowRunSummary,
)


@click.command(name="summary", help="Display a summary of pipeline runs")
@click.option(
    "--max-workflows",
    default=10,
    type=int,
    help="Maximum number of workflows to list in the summary (default: 10)",
)
@click.option(
    "--start-date",
    type=str,
    required=False,
    default=None,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    required=False,
    default=None,
    help="End date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--output",
    type=str,
    default="text",
    help="Either 'text' or 'json' to specify the output format",
)
@click.option(
    "--raw-filters",
    type=str,
    default=None,
    help="Raw Provider filters string (e.g. 'status=draft,author=john')",
)
def summary(max_workflows, start_date, end_date, output, raw_filters):
    view = WorkflowRunSummary(repository=create_pipelines_repository())
    result = view.print_summary(
        max_workflows=max_workflows,
        start_date=start_date,
        end_date=end_date,
        output_format=None,
        raw_filters=raw_filters,
    )

    if output == "json":
        click.echo(json.dumps(result, indent=4))
        return result

    click.echo("\nWorkflow runs summary:")
    click.echo(f"  Total runs: {result.get('total_runs')}")
    click.echo(f"  Completed runs: {result.get('completed')}")
    click.echo(f"  In-progress runs: {result.get('in_progress')}")
    click.echo(f"  Queued runs: {result.get('queued')}")
    if result.get("most_failed"):
        click.echo(f"  Most failed run: {result.get('most_failed')}")

    runs_by_wf = result.get("runs_by_workflow") or {}
    if runs_by_wf:
        click.echo("")
        click.echo("Runs by workflow name:")
        sorted_items = sorted(
            runs_by_wf.items(), key=lambda x: x[1].get("count", 0), reverse=True
        )
        for name, info in sorted_items[:max_workflows]:
            cnt = info.get("count", 0)
            path = info.get("path") or ""
            click.echo(f"  {cnt:4d}  {name}  ({path})")

    first: PipelineRun = result.get("first_run") or {}
    last: PipelineRun = result.get("last_run") or {}

    click.echo("")
    click.echo("First run:")
    click.echo(f"  Created run at: {first.get('created_at')}")
    click.echo(f"  Started run at: {first.get('run_started_at')}")
    click.echo(f"  Updated run at: {first.get('updated_at')} (Ended at)")

    click.echo("")
    click.echo("Last run:")
    click.echo(f"  Created run at: {last.get('created_at')}")
    click.echo(f"  Started run at: {last.get('run_started_at')}")
    click.echo(f"  Updated run at: {last.get('updated_at')} (Ended at)")

    return result


command = summary
