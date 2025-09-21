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

pn.extension()

# Widgets
start_date_picker = pn.widgets.DatePicker(name="Start Date", value=date(2024, 4, 1))
end_date_picker = pn.widgets.DatePicker(name="End Date", value=date(2025, 9, 30))


# Shared Header Section
header_section = pn.Row(start_date_picker, end_date_picker, sizing_mode="stretch_width")


# Pipeline Section
def plot_workflow_by_status(start_date, end_date):
    # if start_date and end_date:
    #     print(f"Filtering Workflow By Status data from {start_date} to {end_date}")
    return ViewWorkflowByStatus().main(start_date=start_date, end_date=end_date)


def plot_view_jobs_by_execution_time(start_date, end_date):
    return ViewJobsByStatus().main()


def plot_workflow_run_duration(start_date, end_date):
    return ViewRunsDuration().main()


def plot_workflow_run_by(start_date, end_date):
    return ViewWorkflowRunsBy().main()


pipeline_section = pn.Column(
    "## Pipeline Section",
    pn.Row(
        pn.bind(
            plot_workflow_by_status,
            start_date=start_date_picker,
            end_date=end_date_picker,
        )
    ),
    pn.Row(plot_workflow_run_by(start_date_picker, end_date_picker)),
    pn.Row(plot_workflow_run_duration(start_date_picker, end_date_picker)),
    pn.Row(plot_view_jobs_by_execution_time(start_date_picker, end_date_picker)),
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


prs_section = pn.Column(
    "## PRs Section",
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

dashboard = pn.Column(
    header_section,
    pn.Tabs(
        ("Pipeline", pipeline_section),
        ("PRs", prs_section),
        sizing_mode="stretch_width",
    ),
)

dashboard.servable()
