from datetime import date
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

pn.extension()

# Widgets
start_date_picker = pn.widgets.DatePicker(name="Start Date", value=date(2024, 4, 1))
end_date_picker = pn.widgets.DatePicker(name="End Date", value=date(2025, 9, 30))


# Pipeline Section
def plot_workflow_by_status(start_date, end_date):
    return ViewWorkflowByStatus().main(start_date=start_date, end_date=end_date)


def plot_view_jobs_by_execution_time(start_date, end_date):
    return ViewJobsByStatus().main(start_date=start_date, end_date=end_date)


def plot_workflow_run_duration(start_date, end_date):
    return ViewRunsDuration().main(start_date=start_date, end_date=end_date)


def plot_workflow_run_by(start_date, end_date):
    return ViewWorkflowRunsBy().main(start_date=start_date, end_date=end_date)


pipeline_section = pn.Column(
    "## Pipeline Section",
    pn.Row(start_date_picker, end_date_picker, sizing_mode="stretch_width"),
    pn.Row(
        pn.bind(
            plot_workflow_by_status,
            start_date=start_date_picker,
            end_date=end_date_picker,
        )
    ),
    pn.Row(
        pn.bind(
            plot_workflow_run_by, start_date=start_date_picker, end_date=end_date_picker
        )
    ),
    pn.Row(
        pn.bind(
            plot_workflow_run_duration,
            start_date=start_date_picker,
            end_date=end_date_picker,
        )
    ),
    pn.Row(
        pn.bind(
            plot_view_jobs_by_execution_time,
            start_date=start_date_picker,
            end_date=end_date_picker,
        )
    ),
)
