import panel as pn
from core.pipelines.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)
from core.pipelines.pipelines_repository import PipelinesRepository

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

    return pn.Column(
        "# Insight section",
        pn.layout.Divider(),
        pn.Row(
            pn.Column(pn.bind(workflow_run_duration, date_range_picker.param.value)),
        ),
        pn.Row(
            pn.Column("## Deployment Frequency"),
        ),
        pn.Row(
            pn.Column(
                pn.bind(plot_deployment_frequency, date_range_picker.param.value)
            ),
        ),
    )
