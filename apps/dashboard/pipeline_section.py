import panel as pn
from providers.github.workflows.assessment.view_summary import WorkflowRunSummary
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


def pipeline_section(
    date_range_picker,
    workflow_selector,
    workflow_conclusions,
    repository: LoadWorkflows,
):
    def sanitize_workflow_path(selected_value):
        if selected_value == "All":
            return None
        return selected_value

    def plot_workflow_by_status(
        date_range_picker, workflow_selector, workflow_conclusions
    ):
        return ViewWorkflowByStatus(repository=repository).main(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            workflow_path=sanitize_workflow_path(workflow_selector),
        )

    def plot_view_jobs_by_execution_time(
        date_range_picker, workflow_selector, workflow_conclusions
    ):
        return ViewJobsByStatus(repository=repository).main(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            workflow_path=sanitize_workflow_path(workflow_selector),
        )

    def plot_workflow_run_duration(
        date_range_picker, workflow_selector, workflow_conclusions
    ):
        return ViewRunsDuration(repository=repository).main(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            workflow_path=sanitize_workflow_path(workflow_selector),
        )

    def plot_workflow_run_by(
        date_range_picker, workflow_selector, workflow_conclusions
    ):
        return ViewWorkflowRunsBy(repository=repository).main(
            aggregate_by="week",
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            workflow_path=sanitize_workflow_path(workflow_selector),
        )

    def plot_workflow_summary(workflow_conclusions):
        """
        Generate a styled summary table for the Panel app.

        :return: A Panel object displaying the workflow summary as a table.
        """
        summary = WorkflowRunSummary(repository=repository).print_summary()

        if summary["total_runs"] == 0:
            return pn.pane.Markdown("### No workflow runs available.")

    return pn.Column(
        "## Pipeline Section",
        pn.Row(pn.bind(plot_workflow_summary, workflow_conclusions)),
        pn.Row(
            pn.bind(
                plot_workflow_by_status,
                date_range_picker,
                workflow_selector,
                workflow_conclusions,
            )
        ),
        pn.Row(
            pn.bind(
                plot_workflow_run_by,
                date_range_picker,
                workflow_selector,
                workflow_conclusions,
            )
        ),
        pn.Row(
            pn.bind(
                plot_workflow_run_duration,
                date_range_picker,
                workflow_selector,
                workflow_conclusions,
            )
        ),
        pn.Row(
            pn.bind(
                plot_view_jobs_by_execution_time,
                date_range_picker,
                workflow_selector,
                workflow_conclusions,
            )
        ),
    )
