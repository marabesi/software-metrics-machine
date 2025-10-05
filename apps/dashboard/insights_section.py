import panel as pn
from providers.github.workflows.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)
from providers.github.workflows.repository_workflows import LoadWorkflows

pn.extension("tabulator")


def insights_section(repository: LoadWorkflows, date_range_picker):
    def plot_deployment_frequency(date_range_picker):
        return ViewDeploymentFrequency(repository=repository).plot(
            workflow_path=repository.configuration.deployment_frequency_target_pipeline,
            job_name=repository.configuration.deployment_frequency_target_job,
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
        )

    return pn.Column(
        "## Insight section",
        pn.Row(pn.bind(plot_deployment_frequency, date_range_picker)),
    )
