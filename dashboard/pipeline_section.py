import panel as pn
from providers.github.workflows.plots.view_jobs_average_time_execution import (
    ViewJobsByStatus,
)
from providers.github.workflows.plots.view_workflow_by_status import (
    ViewWorkflowByStatus,
)
from providers.github.workflows.plots.view_runs_duration import (
    ViewRunsDuration,
)
from providers.github.workflows.plots.view_workflow_runs_by import ViewWorkflowRunsBy
from providers.github.workflows.repository_workflows import LoadWorkflows

pn.extension()

repository = LoadWorkflows()


# Pipeline Section
def plot_workflow_by_status(date_range_picker):
    return ViewWorkflowByStatus(repository=repository).main(
        start_date=date_range_picker[0], end_date=date_range_picker[1]
    )


def plot_view_jobs_by_execution_time(date_range_picker):
    return ViewJobsByStatus(repository=repository).main(
        start_date=date_range_picker[0], end_date=date_range_picker[1]
    )


def plot_workflow_run_duration(date_range_picker):
    return ViewRunsDuration(repository=repository).main(
        start_date=date_range_picker[0], end_date=date_range_picker[1]
    )


def plot_workflow_run_by(date_range_picker):
    return ViewWorkflowRunsBy(repository=repository).main(
        start_date=date_range_picker[0], end_date=date_range_picker[1]
    )


# Ensure the DateRangePicker triggers updates by linking its parameters to the bindings
def pipeline_section(date_range_picker):
    return pn.Column(
        "## Pipeline Section",
        pn.Row(date_range_picker, sizing_mode="stretch_width"),
        pn.Row(pn.bind(plot_workflow_by_status, date_range_picker)),
        pn.Row(pn.bind(plot_workflow_run_by, date_range_picker)),
        pn.Row(pn.bind(plot_workflow_run_duration, date_range_picker)),
        pn.Row(pn.bind(plot_view_jobs_by_execution_time, date_range_picker)),
    )
