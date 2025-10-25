import pandas as pd
import panel as pn
from apps.dashboard.components.aggregate_by_select import aggregate_by_select
from apps.dashboard.components.tabulator import TabulatorComponent
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
        date_range_picker, workflow_selector, workflow_conclusions, aggregate_by
    ):
        return (
            ViewWorkflowRunsByWeekOrMonth(repository=repository)
            .main(
                aggregate_by=aggregate_by,
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

    aggregate_by = aggregate_by_select()

    views = pn.Column(
        "## Pipeline",
        pn.pane.HTML(
            """
            Explore your
            <a target="_blank" href="https://marabesi.com/software-engineering/ci-vs-cde-vs-cd.html?
            utm_source=metrics-machine&utm_medium=dashboard&utm_campaign=metrics&utm_id=metrics">CI/CD</a>
            pipeline metrics and gain insights into workflow performance and job execution times, gain insights into
            workflow performance and job execution times, find bottlenecks, and optimize your CI/CD processes. A
            pipeline is a set of automated processes that allow software development teams to compile, build, and deploy
            their code to production environments efficiently and reliably.
            """
        ),
        pn.layout.Divider(),
        pn.Row(
            pn.Column(
                "### Distribution of pipelines by status",
                pn.pane.HTML(
                    """
                    <details style="cursor: pointer;">
                    <summary>
                        Pipelines execution have a status and a conclusion attached to it.
                    </summary>
                    <div>
                        <br />
                        The status indicates the current state of the pipeline, such as 'in_progress', 'completed', or
                        'queued'. The conclusion provides more specific information about the outcome of the pipeline,
                        such as 'success', 'failure', 'cancelled', or 'timed_out'.
                    </div>
                    </details>
                    """
                ),
                pn.panel(
                    pn.bind(
                        plot_workflow_by_status,
                        date_range_picker.param.value,
                        workflow_selector.param.value,
                        workflow_conclusions.param.value,
                    ),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Distribution of pipelines execution aggregated by time",
                pn.pane.HTML(
                    """
                    <details style="cursor: pointer;">
                    <summary>
                        Pipeline are executed many times a day, week, or month depending on the development activity.
                    </summary>
                    <div>
                        <br />
                        This view helps you understand the frequency and patterns of pipeline executions over time,
                        allowing you to identify trends, spikes, or periods of low activity.
                    </div>
                    </details>
                    """
                ),
                aggregate_by,
                pn.panel(
                    pn.bind(
                        plot_workflow_run_by,
                        date_range_picker.param.value,
                        workflow_selector.param.value,
                        workflow_conclusions.param.value,
                        aggregate_by=aggregate_by.param.value,
                    ),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Distribution of pipelines by run duration",
                pn.pane.HTML(
                    """
                    <details style="cursor: pointer;">
                    <summary>
                        The time taken for a pipeline to complete its execution can vary based on several factors,
                        including the complexity of the tasks involved, the number of jobs, and the resources allocated.
                    </summary>
                    <div>
                        <br />
                        This view provides insights into the performance and efficiency of your pipelines, helping you
                        identify potential bottlenecks and areas for optimization.
                    </div>
                    </details>
                    """
                ),
                pn.panel(
                    pn.bind(
                        plot_workflow_run_duration,
                        date_range_picker.param.value,
                        workflow_selector.param.value,
                        workflow_conclusions.param.value,
                    ),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row("## Jobs", sizing_mode="stretch_width"),
        pn.pane.HTML(
            """
            Jobs are individual tasks or steps within a pipeline that perform specific actions, such as building code,
            running tests, or deploying applications. Each job has its own status and conclusion, similar to pipelines.
            Monitoring job execution times helps identify bottlenecks and optimize the overall pipeline performance.
            """
        ),
        pn.Row(
            pn.Column(
                "### Distribution of jobs by execution time",
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
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Distribution of jobs execution by status",
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
        active=0,
    )
