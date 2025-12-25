import typing
import panel as pn
from software_metrics_machine.core.code.pairing_index import PairingIndex
from software_metrics_machine.core.pipelines.aggregates.pipeline_summary import (
    PipelineRunSummary,
)
from software_metrics_machine.core.pipelines.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.plots.view_lead_time import ViewLeadTime
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)
from software_metrics_machine.providers.pydriller.commit_traverser import (
    CommitTraverser,
)


def insights_section(
    repository: PipelinesRepository,
    codemaat_repository: CodemaatRepository,
    date_range_picker,
) -> pn.Column:
    authors_text = pn.widgets.TextInput(
        name="Authors filter", placeholder="comma-separated emails", value=""
    )

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
        if date_range_picker is None:
            return pn.pane.Markdown("No date available", width=200)
        filters = {
            "start_date": date_range_picker[0],
            "end_date": date_range_picker[1],
            "workflow_path": repository.configuration.deployment_frequency_target_pipeline,
            "status": "completed",
            "conclusion": "success",
        }
        data = repository.get_workflows_run_duration(filters)
        result = data.rows
        total = data.total
        if total == 0:
            return pn.pane.Markdown("No data available", width=200)
        if result is None or len(result) == 0:
            return pn.pane.Markdown("No data available", width=200)
        avg_min = result[0][2]
        total_min = result[0][1]
        formatted_avg_min = "{:.1f}".format(avg_min)
        formatted_total_min = "{:.1f}".format(total_min)
        return pn.Row(
            pn.Card(
                pn.indicators.Number(
                    value=42,
                    name="Your software takes this time to reach production (Average)",
                    format=f"{formatted_avg_min}min",
                ),
                hide_header=True,
                width=250,
            ),
            pn.Spacer(width=10),
            pn.Card(
                pn.indicators.Number(
                    value=42,
                    name="Total run time",
                    format=f"{formatted_total_min}min",
                ),
                hide_header=True,
                width=250,
            ),
        )

    def plot_failed_pipelines(date_range_picker):
        summary = PipelineRunSummary(repository=repository).compute_summary(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
        )
        most_failed = summary.get("most_failed", "N/A")
        return pn.widgets.StaticText(
            name="Most failed pipeline", value=f"{most_failed}"
        )

    def render_pairing_index_card(date_range_picker, authors: str | None = None):
        pi = PairingIndex(repository=codemaat_repository)
        result = pi.get_pairing_index(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            authors=authors,
        )

        # Attempt to read pairing index from either of the possible keys
        pairing_val = None
        if isinstance(result, dict):
            pairing_val = result.get("pairing_index_percentage")

        pairing_text = (
            f"**Pairing index:** {pairing_val}%"
            if pairing_val is not None
            else "Pairing index: n/a"
        )

        # Get commit list from traverser
        commits_data: typing.List[typing.Dict[str, str]] = []
        try:
            traverser = CommitTraverser(configuration=repository.configuration)
            traverse_result = traverser.traverse_commits()
            commits_iter = traverse_result.get("commits")
            commits_list = list(commits_iter)

            # Filter by explicit phrase first
            phrase = "implemented the feature in the cli"
            filtered = [
                c for c in commits_list if phrase in ((getattr(c, "msg")).lower())
            ]

            source_list = filtered if filtered else commits_list[-20:]

            # Prepare rows newest-first
            for c in reversed(source_list[-20:]):
                author = getattr(getattr(c, "author", None), "name", "") or ""
                commits_data.append(
                    {
                        "author": author,
                        "msg": getattr(c, "msg", ""),
                        "hash": getattr(c, "hash", ""),
                    }
                )
        except Exception:
            # On errors, keep commits_data empty
            commits_data = []

        return pn.Column(
            authors_text,
            pn.pane.Markdown(pairing_text),
            sizing_mode="stretch_width",
        )

    def render_lead_time(date_range_picker):
        result = (
            ViewLeadTime(repository=repository)
            .main(
                workflow_path=repository.configuration.deployment_frequency_target_pipeline,
                job_name=repository.configuration.deployment_frequency_target_job,
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
            )
            .plot
        )
        return result

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
            pn.Column(
                "## Pipeline Run Duration",
                pn.bind(workflow_run_duration, date_range_picker.param.value),
                pn.pane.HTML(
                    """
                <details style="cursor: pointer;">
                <summary>
                    The average time it takes for your pipeline to run from start to finish.
                </summary>
                <div>
                    This metric takes the data range selected and filters the pipeline runs that were successful
                    (with completed status and "success" conclusion). It then calculates the average duration
                    in minutes.
                </div>
                </details>
                    """
                ),
            ),
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
        pn.Row(
            pn.Column(
                "## Pairing Index",
                pn.bind(
                    render_pairing_index_card,
                    date_range_picker.param.value,
                    authors_text.param.value,
                ),
            ),
        ),
        pn.Row(
            pn.Column(
                "## Lead Time",
                pn.bind(
                    render_lead_time,
                    date_range_picker.param.value,
                ),
            ),
        ),
    )
