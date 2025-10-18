import pandas as pd
import panel as pn
from apps.dashboard.components.tabulator import TabulatorComponent
from core.pipelines.plots.view_jobs_by_status import ViewJobsByStatus
from core.pipelines.plots.view_jobs_top_failed import ViewJobsTopFailed
from core.pipelines.plots.view_jobs_average_time_execution import (
    ViewJobsByAverageTimeExecution,
)
from core.pipelines.plots.view_pipeline_by_status import (
    ViewPipelineByStatus,
)
from core.pipelines.plots.view_pipeline_execution_duration import (
    ViewPipelineExecutionRunsDuration,
)
from core.pipelines.plots.view_workflow_runs_by_week_or_month import (
    ViewWorkflowRunsByWeekOrMonth,
)
from core.pipelines.pipelines_repository import PipelinesRepository

# include tabulator extension and add a small raw CSS class for 90% width container
pn.extension(
    "tabulator",
    raw_css=[
        ".smm-90-width { width: 90%; margin-left: auto; margin-right: auto; }",
    ],
)


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
        return (
            ViewPipelineByStatus(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                workflow_path=sanitize_all_argument(workflow_selector),
            )
            .matplotlib
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
            ViewPipelineExecutionRunsDuration(repository=repository)
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
        return (
            ViewWorkflowRunsByWeekOrMonth(repository=repository)
            .main(
                aggregate_by="week",
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                raw_filters=f"conclusion={workflow_conclusions}",
                workflow_path=sanitize_all_argument(workflow_selector),
            )
            .matplotlib
        )

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
        pn.Row(
            pn.panel(
                pn.bind(
                    plot_workflow_by_status,
                    date_range_picker,
                    workflow_selector,
                    workflow_conclusions,
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.panel(
                pn.bind(
                    plot_workflow_run_by,
                    date_range_picker,
                    workflow_selector,
                    workflow_conclusions,
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.panel(
                pn.bind(
                    plot_workflow_run_duration,
                    date_range_picker,
                    workflow_selector,
                    workflow_conclusions,
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row("## Jobs", sizing_mode="stretch_width"),
        pn.Row(
            pn.panel(jobs_selector, sizing_mode="stretch_width"),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.panel(
                pn.bind(
                    plot_view_jobs_by_execution_time,
                    date_range_picker,
                    workflow_selector,
                    workflow_conclusions,
                    jobs_selector,
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.panel(
                pn.bind(
                    plot_jobs_by_status,
                    date_range_picker,
                    workflow_selector,
                    jobs_selector,
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.panel(
                pn.bind(plot_failed_jobs, date_range_picker, jobs_selector),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        sizing_mode="stretch_width",
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
        pn.panel(
            TabulatorComponent(df, pipelines_filter_criteria, "pipelines"),
            sizing_mode="stretch_width",
        ),
        sizing_mode="stretch_width",
    )

    return pn.Tabs(
        ("Insights", views),
        ("Data", data),
        sizing_mode="stretch_width",
        css_classes=["smm-90-width"],
        active=0,
    )
