import panel as pn
from providers.github.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)
from providers.github.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)
from providers.github.prs.plots.view_open_prs_through_time import ViewOpenPrsThroughTime
from providers.github.prs.plots.view_prs_by_author import (
    ViewPrsByAuthor,
)

from providers.github.prs.prs_repository import LoadPrs

pn.extension("tabulator")


def prs_section(date_range_picker, repository: LoadPrs, anonymize=False):
    def normalize_label(selected_labels):
        if len(selected_labels) == 0:
            return None
        return ",".join(selected_labels)

    def normalize_authors(author_select):
        if len(author_select) == 0:
            return None
        return ",".join(author_select)

    def plot_average_prs_open_by(date_range_picker, selected_labels, author_select):
        return ViewAverageOfPrsOpenBy(repository=repository).main(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            labels=normalize_label(selected_labels),
            authors=normalize_authors(author_select),
        )

    def plot_average_review_time_by_author(
        date_range_picker, selected_labels, author_select
    ):
        return ViewAverageReviewTimeByAuthor(
            repository=repository
        ).plot_average_open_time(
            title="Average Review Time By Author",
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            labels=normalize_label(selected_labels),
            authors=normalize_authors(author_select),
        )

    def plot_prs_through_time(date_range_picker, author_select):
        return ViewOpenPrsThroughTime(repository=repository).main(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            title="Open PRs Through Time",
            authors=normalize_authors(author_select),
        )

    def plot_prs_by_author(date_range_picker, selected_labels):
        return ViewPrsByAuthor(repository=repository).plot_top_authors(
            title="PRs By Author",
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            labels=normalize_label(selected_labels),
        )

    unique_authors = repository.get_unique_authors()

    unique_labels = repository.get_unique_labels()
    label_names = [label["label_name"] for label in unique_labels]

    author_select = pn.widgets.MultiChoice(
        name="Select Authors",
        options=unique_authors,
        placeholder="Select authors to filter, by the default all are included",
        value=[],
    )

    label_selector = pn.widgets.MultiChoice(
        name="Select Labels",
        options=label_names,
        placeholder="Select labels to filter, by the default all are included",
        value=[],
    )

    return pn.Column(
        "## PRs Section",
        pn.Row(
            pn.Column(author_select, sizing_mode="stretch_width"),
            pn.Column(label_selector, sizing_mode="stretch_width"),
        ),
        pn.Row(pn.bind(plot_prs_through_time, date_range_picker, author_select)),
        pn.Row(
            pn.Column(
                "### Average PRs Open By",
                pn.bind(
                    plot_average_prs_open_by,
                    date_range_picker,
                    label_selector,
                    author_select,
                ),
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
                    author_select,
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
