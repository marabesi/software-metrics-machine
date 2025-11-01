import panel as pn
from providers.codemaat.plots.code_churn import CodeChurnViewer
from providers.codemaat.plots.coupling import CouplingViewer
from providers.codemaat.plots.entity_churn import EntityChurnViewer
from providers.codemaat.plots.entity_effort import EntityEffortViewer
from providers.codemaat.plots.entity_ownership import EntityOnershipViewer
from providers.codemaat.codemaat_repository import CodemaatRepository

pn.extension("tabulator")


def source_code_section(
    repository: CodemaatRepository,
    start_end_date_picker,
    ignore_pattern_files,
    include_pattern_files,
    author_select_source_code,
    pre_selected_values,
    top_entries,
):
    def update_ignore_pattern(event):
        ignore_pattern_files.value = event.new

    pre_selected_values.param.watch(update_ignore_pattern, "value")

    def plot_code_churn(date_range_picker):
        chart = (
            CodeChurnViewer(repository=repository)
            .render(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
            )
            .plot
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_entity_churn(ignore_pattern, top):
        chart = (
            EntityChurnViewer(repository=repository)
            .render(
                ignore_files=ignore_pattern,
                top_n=int(top),
                include_only=include_pattern_files.value,
            )
            .plot
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_entity_effort(ignore_pattern, top):
        chart = (
            EntityEffortViewer(repository=repository)
            .render_treemap(
                top_n=int(top),
                ignore_files=ignore_pattern,
                include_only=include_pattern_files.value,
            )
            .plot
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_entity_ownership(ignore_pattern, authors, top, type_churn):
        chart = (
            EntityOnershipViewer(repository=repository)
            .render(
                ignore_files=ignore_pattern,
                include_only=include_pattern_files.value,
                authors=",".join(authors),
                top_n=int(top),
                type_churn=type_churn,
            )
            .plot
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    # Refactor plot_code_coupling to include zoom and pan controls using Panel sliders
    def plot_code_coupling_with_controls(ignore_pattern_files, top):
        coupling_viewer = CouplingViewer(repository=repository)
        return pn.Column(
            coupling_viewer.render(
                top=int(top),
                ignore_files=ignore_pattern_files,
                include_only=include_pattern_files.value,
            ).plot
        )

    type_churn = pn.widgets.Select(
        name="Select pipeline conclusion",
        description="Select pipeline conclusion",
        options=["added", "deleted"],
        value="added",
    )

    return pn.Column(
        "## Source code Section",
        pn.pane.HTML(
            """
            This section provides insights into the source code evolution of the repository, including metrics such as
            code churn, entity churn, entity effort, entity ownership, and code coupling. Use the controls below to
            filter and customize the visualizations according to your analysis needs. This analysis is powered by
            CodeMaat.
            """
        ),
        pn.layout.Divider(),
        pn.Row(
            pn.Column(
                "## Code Churn",
                pn.bind(plot_code_churn, start_end_date_picker.param.value),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "## Entity Churn",
                pn.bind(
                    plot_entity_churn,
                    ignore_pattern_files.param.value,
                    top_entries.param.value,
                ),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "## Entity Effort",
                pn.bind(
                    plot_entity_effort,
                    ignore_pattern_files.param.value,
                    top_entries.param.value,
                ),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "## Entity Ownership",
                type_churn,
                pn.bind(
                    plot_entity_ownership,
                    ignore_pattern_files.param.value,
                    author_select_source_code.param.value,
                    top_entries.param.value,
                    type_churn=type_churn.param.value,
                ),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.bind(
                plot_code_coupling_with_controls,
                ignore_pattern_files.param.value,
                top_entries.param.value,
            )
        ),
    )
