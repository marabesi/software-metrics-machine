import pandas as pd
import panel as pn
from apps.dashboard.components.tabulator import TabulatorComponent
from core.pipelines.aggregates.pipeline_summary import PipelineRunSummary
from core.pipelines.plots.view_jobs_by_status import ViewJobsByStatus
from core.pipelines.plots.view_jobs_average_time_execution import (
    ViewJobsByAverageTimeExecution,
)
from core.pipelines.plots.view_pipeline_by_status import (
    ViewPipelineByStatus,
)
from core.pipelines.plots.view_pipeline_execution_duration import (
    ViewPipelineExecutionRunsDuration,
)
from core.pipelines.plots.view_pipeline_runs_by_week_or_month import (
    ViewWorkflowRunsByWeekOrMonth,
)
from core.pipelines.pipelines_repository import PipelinesRepository

pn.extension(
    "tabulator",
    raw_css=[
        ".smm-90-width { margin-top: 15px }",
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
            .plot
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
            .plot
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
            .plot
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
            .plot
        )

    def plot_jobs_by_status(date_range_picker, workflow_selector, jobs_selector):
        return (
            ViewJobsByStatus(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                job_name=sanitize_all_argument(jobs_selector),
                workflow_path=sanitize_all_argument(workflow_selector),
            )
            .plot
        )

    def plot_failed_pipelines(date_range_picker):
        summary = PipelineRunSummary(repository=repository).compute_summary()
        most_failed = summary.get("most_failed", "N/A")
        return pn.widgets.StaticText(
            name="Most failed pipeline", value=f"{most_failed}"
        )

    views = pn.Column(
        "## Pipeline",
        pn.Row(
            pn.panel(
                pn.bind(plot_failed_pipelines, date_range_picker),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(),
        pn.Row(),
        pn.Row(),
        "Explore your [CI/CD](https://marabesi.com/software-engineering/ci-vs-cde-vs-cd.html?utm_source=metrics-machine&utm_medium=dashboard&utm_campaign=metrics&utm_id=metrics) pipeline metrics and gain insights into workflow performance and job execution times.",  # noqa
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
            pn.panel(
                pn.bind(
                    plot_view_jobs_by_execution_time,
                    date_range_picker.param.value,
                    workflow_selector.param.value,
                    workflow_conclusions.param.value,
                    jobs_selector.param.value,
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.panel(
                pn.bind(
                    plot_jobs_by_status,
                    date_range_picker.param.value,
                    workflow_selector.param.value,
                    jobs_selector.param.value,
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
    )

    pipelines_filter_criteria = {
        "id": {"type": "input", "func": "like", "placeholder": "id"},
        "path": {"type": "input", "func": "like", "placeholder": ""},
        "name": {"type": "list", "func": "like", "placeholder": ""},
        "status": {"type": "list", "func": "like", "placeholder": "Select state"},
        "conclusion": {
            "type": "list",
            "func": "like",
            "placeholder": "Select conclusion",
        },
        "html_url": {"type": "input", "func": "like", "placeholder": "Enter url"},
        "head_branch": {"type": "input", "func": "like", "placeholder": ""},
        "event": {"type": "list", "func": "like", "placeholder": "event"},
    }

    pick_pipeline = [
        "id",
        "path",
        "name",
        "status",
        "conclusion",
        "created_at",
        "updated_at",
        "html_url",
        "head_branch",
        "event",
    ]
    pipeline_rows = [
        {k: run.get(k) for k in pick_pipeline} for run in repository.all_runs
    ]
    df_pipelines = pd.DataFrame(pipeline_rows)

    pick_jobs = [
        "id",
        "run_id",
        "name",
        "status",
        "conclusion",
        "created_at",
        "updated_at",
        "html_url",
        "head_branch",
        "labels",
        "runner_group_name",
        "run_attempt",
    ]
    jobs_rows = [{k: run.get(k) for k in pick_jobs} for run in repository.all_jobs]
    jobs_filter_criteria = {
        "id": {"type": "input", "func": "like", "placeholder": "id"},
        "run_id": {"type": "input", "func": "like", "placeholder": ""},
        "workflow_name": {"type": "input", "func": "like", "placeholder": ""},
        "head_branch": {"type": "input", "func": "like", "placeholder": ""},
        "head_sha": {"type": "input", "func": "like", "placeholder": ""},
        "run_attempt": {"type": "list", "func": "like", "placeholder": ""},
        "html_url": {"type": "input", "func": "like", "placeholder": "Enter url"},
        "status": {"type": "list", "func": "like", "placeholder": "Select state"},
        "conclusion": {
            "type": "list",
            "func": "like",
            "placeholder": "Select conclusion",
        },
        "name": {"type": "list", "func": "like", "placeholder": "event"},
        "labels": {"type": "list", "func": "like", "placeholder": "event"},
        "runner_group_name": {"type": "list", "func": "like", "placeholder": "event"},
    }
    df_jobs = pd.DataFrame(jobs_rows)

    data = pn.Column(
        "## Explore your raw data",
        "Explore your Pipeline data with advanced filtering options and download capabilities.",
        pn.Row("### Pipeline"),
        pn.panel(
            TabulatorComponent(df_pipelines, pipelines_filter_criteria, "pipelines"),
            sizing_mode="stretch_width",
        ),
        pn.Row("### Jobs"),
        pn.panel(
            TabulatorComponent(df_jobs, jobs_filter_criteria, "jobs"),
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
