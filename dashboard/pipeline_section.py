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
)


def sanitize_workflow_path(selected_value):
    if selected_value == "All":
        return None  # No filtering
    return selected_value


# Pipeline Section
def plot_workflow_by_status(date_range_picker, workflow_selector):
    return ViewWorkflowByStatus(repository=repository).main(
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
        workflow_path=sanitize_workflow_path(workflow_selector),
    )


def plot_view_jobs_by_execution_time(date_range_picker, workflow_selector):
    return ViewJobsByStatus(repository=repository).main(
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
        workflow_path=sanitize_workflow_path(workflow_selector),
    )


def plot_workflow_run_duration(date_range_picker, workflow_selector):
    return ViewRunsDuration(repository=repository).main(
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
        workflow_path=sanitize_workflow_path(workflow_selector),
    )


def plot_workflow_run_by(date_range_picker, workflow_selector):
    return ViewWorkflowRunsBy(repository=repository).main(
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
        workflow_path=sanitize_workflow_path(workflow_selector),
    )


# Ensure the DateRangePicker triggers updates by linking its parameters to the bindings
def pipeline_section(date_range_picker):
    return pn.Column(
        "## Pipeline Section",
        pn.Row(
            pn.Column(date_range_picker, align="center"),
            pn.Column(workflow_selector, align="end"),
            align="start",
        ),
        pn.Row(pn.bind(plot_workflow_by_status, date_range_picker, workflow_selector)),
        pn.Row(pn.bind(plot_workflow_run_by, date_range_picker, workflow_selector)),
        pn.Row(
            pn.bind(plot_workflow_run_duration, date_range_picker, workflow_selector)
        ),
        pn.Row(
            pn.bind(
                plot_view_jobs_by_execution_time, date_range_picker, workflow_selector
            )
        ),
    )
