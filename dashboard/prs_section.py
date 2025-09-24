import panel as pn
from infrastructure.configuration import Configuration
from providers.github.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)
from providers.github.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)
from providers.github.prs.plots.view_prs_by_author import (
    ViewPrsByAuthor,
)

from providers.github.prs.prs_repository import LoadPrs

pn.extension("tabulator")
prs_repository = LoadPrs(configuration=Configuration())


def normalize_label(selected_labels):
    if "All" in selected_labels:
        return None
    return ",".join(selected_labels)


def plot_average_prs_open_by(date_range_picker, selected_labels):
    return ViewAverageOfPrsOpenBy(repository=prs_repository).main(
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
        labels=normalize_label(selected_labels),
    )


def plot_average_review_time_by_author(date_range_picker, selected_labels):
    return ViewAverageReviewTimeByAuthor(
        repository=prs_repository
    ).plot_average_open_time(
        title="Average Review Time By Author",
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
        labels=normalize_label(selected_labels),
    )


def plot_prs_by_author(date_range_picker, selected_labels):
    return ViewPrsByAuthor(repository=prs_repository).plot_top_authors(
        title="PRs By Author",
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
        labels=normalize_label(selected_labels),
    )


def prs_section(date_range_picker, anonymize=False):
    unique_authors = prs_repository.get_unique_authors()
    unique_labels = prs_repository.get_unique_labels()
    label_names = [label["label_name"] for label in unique_labels]
    label_names.insert(0, "All")

    author_select = pn.widgets.MultiSelect(
        name="Select Authors",
        options=unique_authors,
        size=10,
        value=unique_authors,
    )

    label_selector = pn.widgets.MultiSelect(
        name="Select Labels",
        options=label_names,
        size=min(10, len(label_names)),
        value=[],
    )

    return pn.Column(
        "## PRs Section",
        pn.Row(
            pn.Column(date_range_picker, sizing_mode="stretch_width"),
            pn.Column(author_select, sizing_mode="stretch_width"),
            pn.Column(label_selector, sizing_mode="stretch_width"),
        ),
        pn.Row(
            pn.Column(
                "### Average PRs Open By",
                pn.bind(plot_average_prs_open_by, date_range_picker, label_selector),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Average Review Time By Author",
                pn.bind(
                    plot_average_review_time_by_author,
                    date_range_picker,
                    label_selector,
                ),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### PRs By Author",
                pn.bind(plot_prs_by_author, date_range_picker, label_selector),
            ),
            sizing_mode="stretch_width",
        ),
    )
