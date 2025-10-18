import pandas as pd
import panel as pn
from apps.dashboard.components.tabulator import TabulatorComponent
from core.pipelines.plots.view_jobs_by_status import ViewJobsByStatus
from core.pipelines.plots.view_jobs_top_failed import ViewJobsTopFailed
from providers.github.workflows.assessment.view_summary import WorkflowRunSummary
from core.pipelines.plots.view_jobs_average_time_execution import (
    ViewJobsByAverageTimeExecution,
)
from core.pipelines.plots.view_workflow_by_status import (
    ViewWorkflowByStatus,
)
from core.pipelines.plots.view_runs_duration import (
    ViewRunsDuration,
)
from core.pipelines.plots.view_workflow_runs_by import ViewWorkflowRunsBy
from core.pipelines.pipelines_repository import PipelinesRepository

pn.extension("tabulator")


def pipeline_section(
    date_range_picker,
    workflow_selector,
    workflow_conclusions,
    jobs_selector,
    repository: PipelinesRepository,
):
    def sanitize_all_argument(selected_value):
        if selected_value == "All":
            return None
        return selected_value

    def plot_workflow_by_status(
        date_range_picker, workflow_selector, workflow_conclusions
    ):
        return ViewWorkflowByStatus(repository=repository).main(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            workflow_path=sanitize_all_argument(workflow_selector),
        )

    def plot_view_jobs_by_execution_time(
        date_range_picker, workflow_selector, workflow_conclusions, jobs_selector
    ):
        return (
            ViewJobsByAverageTimeExecution(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                workflow_path=sanitize_all_argument(workflow_selector),
                job_name=sanitize_all_argument(jobs_selector),
            )
            .matplotlib
        )

    def plot_workflow_run_duration(
        date_range_picker, workflow_selector, workflow_conclusions
    ):
        return (
            ViewRunsDuration(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                workflow_path=sanitize_all_argument(workflow_selector),
            )
            .matplotlib
        )

    def plot_workflow_run_by(
        date_range_picker, workflow_selector, workflow_conclusions
    ):
        return ViewWorkflowRunsBy(repository=repository).main(
            aggregate_by="month",
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            raw_filters=f"conclusion={workflow_conclusions}",
            workflow_path=sanitize_all_argument(workflow_selector),
        )

    def plot_workflow_summary(workflow_conclusions):
        """
        Generate a styled summary table for the Panel app.

        :return: A Panel object displaying the workflow summary as a table.
        """
        summary = WorkflowRunSummary(repository=repository).print_summary()

        if summary["total_runs"] == 0:
            return pn.pane.Markdown("### No workflow runs available.")

    def plot_jobs_by_status(date_range_picker, workflow_selector, jobs_selector):
        if jobs_selector == "All":
            return pn.pane.Markdown("")
        return (
            ViewJobsByStatus(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                job_name=sanitize_all_argument(jobs_selector),
                workflow_path=sanitize_all_argument(workflow_selector),
            )
            .matplotlib
        )

    def plot_failed_jobs(date_range_picker, jobs_selector):
        return (
            ViewJobsTopFailed(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                jobs_selector=jobs_selector,
            )
            .matplotlib
        )

    views = pn.Column(
        "## Pipeline Section",
        "Explore your CI/CD pipeline metrics and gain insights into workflow performance and job execution times.",
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
        pn.Row("## Jobs"),
        pn.Row(jobs_selector),
        pn.Row(
            pn.bind(
                plot_view_jobs_by_execution_time,
                date_range_picker,
                workflow_selector,
                workflow_conclusions,
                jobs_selector,
            )
        ),
        pn.Row(
            pn.bind(
                plot_jobs_by_status,
                date_range_picker,
                workflow_selector,
                jobs_selector,
            )
        ),
        pn.Row(pn.bind(plot_failed_jobs, date_range_picker, jobs_selector)),
    )

    pipelines_filter_criteria = {
        "html_url": {"type": "input", "func": "like", "placeholder": "Enter url"},
        "title": {"type": "input", "func": "like", "placeholder": "Title"},
        "state": {"type": "list", "func": "like", "placeholder": "Select state"},
    }
    df = pd.DataFrame(repository.all_runs)
    data = pn.Column(
        "## Data Section",
        "Explore your Pipeline data with advanced filtering options and download capabilities.",
        TabulatorComponent(df, pipelines_filter_criteria, "pipelines"),
    )

    return pn.Tabs(
        ("Insights", views),
        ("Data", data),
        sizing_mode="stretch_width",
        active=0,
    )
