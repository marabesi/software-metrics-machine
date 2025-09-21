from datetime import date
import panel as pn
from providers.github.workflows.plots.view_jobs_average_time_execution import (
    ViewJobsByStatus,
)
from providers.github.workflows.plots.view_workflow_by_status import (
    ViewWorkflowByStatus,
)
from providers.github.workflows.plots.view_runs_duration import (
    ViewRunsDuration,
)
from providers.github.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)
from providers.github.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)
from providers.github.prs.plots.view_prs_by_author import (
    ViewPrsByAuthor,
)
from providers.github.workflows.plots.view_workflow_runs_by import ViewWorkflowRunsBy

from providers.codemaat.plots.code_churn import CodeChurnViewer
from providers.codemaat.plots.entity_churn import EntityChurnViewer
from providers.codemaat.plots.entity_effort import EntityEffortViewer
from providers.codemaat.plots.entity_ownership import EntityOnershipViewer

from providers.codemaat.codemaat_repository import CodemaatRepository

pn.extension()

# Widgets
start_date_picker = pn.widgets.DatePicker(name="Start Date", value=date(2024, 4, 1))
end_date_picker = pn.widgets.DatePicker(name="End Date", value=date(2025, 9, 30))
anonymize = pn.widgets.Checkbox(name="Anonymize Data", value=False)


# Shared Header Section
header_section = pn.Column("## Software Metrics Dashboard", pn.Row(anonymize))
header_section_prs = pn.Row(
    start_date_picker, end_date_picker, sizing_mode="stretch_width"
)
header_section_pipeline = pn.Row(
    start_date_picker, end_date_picker, sizing_mode="stretch_width"
)


# Pipeline Section
def plot_workflow_by_status(start_date, end_date):
    # if start_date and end_date:
    #     print(f"Filtering Workflow By Status data from {start_date} to {end_date}")
    return ViewWorkflowByStatus().main(start_date=start_date, end_date=end_date)


def plot_view_jobs_by_execution_time(start_date, end_date):
    return ViewJobsByStatus().main(start_date=start_date, end_date=end_date)


def plot_workflow_run_duration(start_date, end_date):
    return ViewRunsDuration().main(start_date=start_date, end_date=end_date)


def plot_workflow_run_by(start_date, end_date):
    return ViewWorkflowRunsBy().main(start_date=start_date, end_date=end_date)


pipeline_section = pn.Column(
    "## Pipeline Section",
    header_section_pipeline,
    pn.Row(
        pn.bind(
            plot_workflow_by_status,
            start_date=start_date_picker,
            end_date=end_date_picker,
        )
    ),
    pn.Row(
        pn.bind(
            plot_workflow_run_by, start_date=start_date_picker, end_date=end_date_picker
        )
    ),
    pn.Row(
        pn.bind(
            plot_workflow_run_duration,
            start_date=start_date_picker,
            end_date=end_date_picker,
        )
    ),
    pn.Row(
        pn.bind(
            plot_view_jobs_by_execution_time,
            start_date=start_date_picker,
            end_date=end_date_picker,
        )
    ),
)


# PRs Section
def plot_average_prs_open_by(start_date, end_date):
    return ViewAverageOfPrsOpenBy().main(start_date=start_date, end_date=end_date)


def plot_average_review_time_by_author(start_date, end_date):
    return ViewAverageReviewTimeByAuthor().plot_average_open_time(
        title="Average Review Time By Author", start_date=start_date, end_date=end_date
    )


def plot_prs_by_author(start_date, end_date):
    return ViewPrsByAuthor().plot_top_authors(
        title="PRs By Author", start_date=start_date, end_date=end_date
    )


def plot_code_churn(start_date, end_date):
    return CodeChurnViewer().render(
        CodemaatRepository(),
    )


def plot_entity_churn(start_date, end_date):
    return EntityChurnViewer().render(CodemaatRepository())


def plot_entity_effort():
    return EntityEffortViewer().render(
        CodemaatRepository(),
    )


def plot_entity_ownership():
    return EntityOnershipViewer().render(
        CodemaatRepository(),
    )


prs_section = pn.Column(
    "## PRs Section",
    header_section_prs,
    pn.Row(
        pn.Column(
            "### Average PRs Open By",
            pn.bind(
                plot_average_prs_open_by,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Average Review Time By Author",
            pn.bind(
                plot_average_review_time_by_author,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### PRs By Author",
            pn.bind(
                plot_prs_by_author,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
        sizing_mode="stretch_width",
    ),
)

source_code_section = pn.Column(
    "## Source code Section",
    pn.Row(
        pn.Column(
            "### Code Churn",
            pn.bind(
                plot_code_churn,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Entity Churn",
            pn.bind(
                plot_entity_churn,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Entity Effort",
            pn.bind(
                plot_entity_effort,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Entity Ownership",
            pn.bind(
                plot_entity_ownership,
            ),
        ),
        sizing_mode="stretch_width",
    ),
)

dashboard = pn.Column(
    header_section,
    pn.Tabs(
        ("Pipeline", pipeline_section),
        ("Pull requests", prs_section),
        ("Source code", source_code_section),
        sizing_mode="stretch_width",
    ),
)

dashboard.servable()
