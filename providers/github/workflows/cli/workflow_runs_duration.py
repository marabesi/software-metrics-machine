import click
from providers.github.workflows.plots.view_runs_duration import ViewRunsDuration


@click.command()
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
@click.option(
    "--workflow-name",
    "-w",
    multiple=True,
    help="Workflow name (exact match, case-insensitive). Can be repeated or supply comma-separated values.",
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
def workflows_run_durantion(out_file, workflow_name, start_date, end_date, max_runs):
    # Normalize workflow_name into a list (split comma-separated values)
    wf_names = []
    if workflow_name:
        for item in workflow_name:
            parts = [p.strip() for p in item.split(",") if p.strip()]
            wf_names.extend(parts)

    return ViewRunsDuration().main(
        out_file=out_file,
        workflow_name=wf_names,
        start_date=start_date,
        end_date=end_date,
        max_runs=max_runs,
    )


command = workflows_run_durantion
