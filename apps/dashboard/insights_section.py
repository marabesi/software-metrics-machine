import panel as pn
from infrastructure.configuration.configuration import Configuration
from providers.github.workflows.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)
from providers.github.workflows.repository_workflows import LoadWorkflows

pn.extension("tabulator")


def insights_section(configuration: Configuration, date_range_picker):
    repository = LoadWorkflows(configuration=configuration)

    def plot_deployment_frequency(date_range_picker):
        return ViewDeploymentFrequency(repository=repository).plot(
            workflow_path=configuration.deployment_frequency_target_pipeline,
            job_name=configuration.deployment_frequency_target_job,
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
        )

    return pn.Column(
        "## Insight section",
        pn.Row(pn.bind(plot_deployment_frequency, date_range_picker)),
    )
