import panel as pn
from software_metrics_machine.core.pipelines.aggregates.pipeline_summary import (
    PipelineRunSummary,
)
from software_metrics_machine.core.pipelines.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)

pn.extension("tabulator")


def insights_section(repository: PipelinesRepository, date_range_picker):
    def plot_deployment_frequency(date_range_picker):
        return (
            ViewDeploymentFrequency(repository=repository)
            .plot(
                workflow_path=repository.configuration.deployment_frequency_target_pipeline,
                job_name=repository.configuration.deployment_frequency_target_job,
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
            )
            .plot
        )

    def workflow_run_duration(date_range_picker):
        filters = {
            "start_date": date_range_picker[0],
            "end_date": date_range_picker[1],
            "workflow_path": repository.configuration.deployment_frequency_target_pipeline,
            "status": "completed",
            "conclusion": "success",
        }
        data = repository.get_workflows_run_duration(filters)
        result = data["rows"]
        total = data["total"]
        if total == 0:
            return pn.pane.Markdown("No data available", width=200)
        avg_min = result[0][2]
        formatted_avg_min = "{:.1f}".format(avg_min)
        return pn.Card(
            pn.indicators.Number(
                value=42,
                name="Your software takes this time to reach production",
                format=f"{formatted_avg_min}min",
            ),
            hide_header=True,
            width=250,
        )

    def plot_failed_pipelines(date_range_picker):
        summary = PipelineRunSummary(repository=repository).compute_summary()
        most_failed = summary.get("most_failed", "N/A")
        return pn.widgets.StaticText(
            name="Most failed pipeline", value=f"{most_failed}"
        )

    return pn.Column(
        "# Insight section",
        pn.pane.HTML(
            """
            This section provides insights into your pipeline executions, including deployment frequency and
            average run durations. Use the date range picker above to filter the data displayed in the charts below.
            """
        ),
        pn.layout.Divider(),
        pn.Row(
            pn.Column(
                pn.panel(
                    pn.bind(plot_failed_pipelines, date_range_picker.param.value),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.layout.Divider(),
        pn.Row(
            pn.Column(pn.bind(workflow_run_duration, date_range_picker.param.value)),
        ),
        pn.Row(
            pn.Column(
                "## Deployment Frequency",
                pn.pane.HTML(
                    """
                <details style="cursor: pointer;">
                <summary>
                    Deployment frequency measures how often your team lands changes to production.
                </summary>
                <div>
                    <br />
                    A higher deployment frequency indicates a more agile and responsive development process, allowing
                    for quicker delivery of features and bug fixes to end-users. It reflects the team's ability to
                    continuously integrate and deploy code changes, which is a key aspect of modern DevOps practices.

                    <a target="_blank" href="https://dora.dev/">DORA (DevOps Research and Assessment)</a> defines
                    deployment frequency as one of the four key metrics for measuring software delivery performance.
                    According to DORA, high-performing teams typically deploy code changes multiple times per day, while
                    low-performing teams may deploy changes only once every few months.
                </div>
                </details>
                    """
                ),
                pn.bind(plot_deployment_frequency, date_range_picker.param.value),
            ),
        ),
    )
