import panel as pn
from infrastructure.configuration import Configuration
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

# Initialize the repository to fetch workflow names
repository = LoadWorkflows(configuration=Configuration())
workflow_names = repository.get_unique_workflow_paths()

# Create a selector widget for filtering workflows
workflow_selector = pn.widgets.Select(
    name="Select Workflow",
    description="Select Workflow",
    options=workflow_names,
    value=(
        workflow_names[0] if workflow_names else None
    ),  # Default to the first workflow if available
)


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
        pn.Row(date_range_picker, workflow_selector, align=("start", "center")),
        pn.Row(pn.bind(plot_workflow_by_status, date_range_picker)),
        pn.Row(pn.bind(plot_workflow_run_by, date_range_picker)),
        pn.Row(pn.bind(plot_workflow_run_duration, date_range_picker)),
        pn.Row(pn.bind(plot_view_jobs_by_execution_time, date_range_picker)),
    )
