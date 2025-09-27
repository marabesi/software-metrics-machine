import panel as pn
import pandas as pd
from infrastructure.configuration.configuration import Configuration
from providers.github.workflows.assessment.view_summary import WorkflowRunSummary
from providers.github.workflows.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)
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

pn.extension("tabulator")


def pipeline_section(date_range_picker, configuration: Configuration):
    repository = LoadWorkflows(configuration=configuration)
    workflow_names = repository.get_unique_workflow_paths()

    workflow_selector = pn.widgets.Select(
        name="Select Workflow",
        description="Select Workflow",
        options=workflow_names,
    )

    def sanitize_workflow_path(selected_value):
        if selected_value == "All":
            return None
        return selected_value

    def plot_deployment_frequency(date_range_picker):
        return ViewDeploymentFrequency(repository=repository).plot(
            workflow_path=configuration.deployment_frequency_target_pipeline,
            job_name=configuration.deployment_frequency_target_job,
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
        )

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

    def plot_workflow_summary():
        """
        Generate a styled summary table for the Panel app.

        :return: A Panel object displaying the workflow summary as a table.
        """
        summary = WorkflowRunSummary(repository=repository).print_summary()

        if summary["total_runs"] == 0:
            return pn.pane.Markdown("### No workflow runs available.")

        summary_data = pd.DataFrame(
            {
                "Metric": [
                    "Total Runs",
                    "Completed Runs",
                    "In-progress Runs",
                    "Queued Runs",
                    "Unique Workflows",
                ],
                "Value": [
                    summary["total_runs"],
                    summary["completed"],
                    summary["in_progress"],
                    summary["queued"],
                    summary["unique_workflows"],
                ],
            }
        )

        summary_table = pn.widgets.Tabulator(
            summary_data,
            name="Workflow Summary",
            layout="fit_data_fill",
            show_index=False,
        )

        return pn.Column(
            "### Workflow General Data Summary",
            summary_table,
        )

    return pn.Column(
        "## Pipeline Section",
        pn.Row(pn.bind(plot_workflow_summary)),
        pn.Row(
            pn.Column(date_range_picker, align="center"),
            align="start",
        ),
        pn.Row(pn.bind(plot_deployment_frequency, date_range_picker)),
        pn.Row(pn.Column(workflow_selector, align="end")),
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
