import panel as pn
from providers.codemaat.plots.code_churn import CodeChurnViewer
from providers.codemaat.plots.coupling import CouplingViewer
from providers.codemaat.plots.entity_churn import EntityChurnViewer
from providers.codemaat.plots.entity_effort import EntityEffortViewer
from providers.codemaat.plots.entity_ownership import EntityOnershipViewer
from providers.codemaat.codemaat_repository import CodemaatRepository

pn.extension("tabulator")


def source_code_section(repository: CodemaatRepository, start_end_date_picker):
    ignore_pattern_files = pn.widgets.TextAreaInput(
        placeholder="Ignore file patterns (comma-separated) - e.g. *.json,**/**/*.png",
        rows=6,
        auto_grow=True,
        max_rows=10,
    )

    author_select = pn.widgets.MultiChoice(
        name="Select Authors",
        placeholder="Select authors to filter, by the default all are included",
        options=repository.get_entity_ownership_unique_authors(),
        value=[],
    )

    pre_selected_values = pn.widgets.Select(
        name="Ignore patterns",
        options={
            "None": "",
            "Js/Ts projects": "*.json,**/**/*.png,*.snap,*.yml,*.yaml,*.md",
            "Python and Markdown": "*.py,*.md",
            "All Text Files": "*.txt,*.log",
        },
        value="",
    )

    top_entries = pn.widgets.Select(
        name="Limit to top N entries",
        options={
            "10": "10",
            "20": "20",
            "50": "50",
            "100": "100",
            "1000": "1000",
        },
        value="10",
    )

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
        chart = EntityChurnViewer(repository=repository).render(
            ignore_files=ignore_pattern, top_n=int(top)
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_entity_effort(ignore_pattern, top):
        chart = EntityEffortViewer(repository=repository).render_treemap(
            top_n=int(top),
            ignore_files=ignore_pattern,
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_entity_ownership(ignore_pattern, authors, top):
        chart = EntityOnershipViewer(repository=repository).render(
            ignore_files=ignore_pattern,
            authors=",".join(authors),
            top_n=int(top),
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    # Refactor plot_code_coupling to include zoom and pan controls using Panel sliders
    def plot_code_coupling_with_controls():
        coupling_viewer = CouplingViewer(repository=repository)

        # Create sliders for zoom and pan
        # zoom_slider = pn.widgets.FloatSlider(
        #     name="Zoom", start=-50, end=100.0, step=0.1, value=1.0
        # )
        # x_pan_slider = pn.widgets.FloatSlider(
        #     name="Pan X", start=-1.0, end=100.0, step=0.1, value=0.0
        # )
        # y_pan_slider = pn.widgets.FloatSlider(
        #     name="Pan Y", start=-1.0, end=100.0, step=0.1, value=0.0
        # )

        # Callback to update the plot based on slider values
        # def update_plot(zoom, x_pan, y_pan):
        #     fig = coupling_viewer.render(repo=repository)
        #     if fig is not None:
        #         ax = fig.gca()
        #         ax.set_xlim(
        #             ax.get_xlim()[0] * zoom + x_pan, ax.get_xlim()[1] * zoom + x_pan
        #         )
        #         ax.set_ylim(
        #             ax.get_ylim()[0] * zoom + y_pan, ax.get_ylim()[1] * zoom + y_pan
        #         )
        #         return fig

        # # Bind sliders to the update function
        # interactive_plot = pn.bind(
        #     update_plot, zoom=zoom_slider, x_pan=x_pan_slider, y_pan=y_pan_slider
        # )

        # return pn.Column(zoom_slider, x_pan_slider, y_pan_slider, interactive_plot)
        return pn.Column(coupling_viewer.render())

    return pn.Column(
        "## Source code Section",
        pn.Row(
            pn.Column(
                "## Code Churn",
                pn.bind(plot_code_churn, start_end_date_picker.param.value),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            ignore_pattern_files,
            pre_selected_values,
            top_entries,
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
        pn.Row(author_select, sizing_mode="stretch_width"),
        pn.Row(
            pn.Column(
                "## Entity Ownership",
                pn.bind(
                    plot_entity_ownership,
                    ignore_pattern_files.param.value,
                    author_select.param.value,
                    top_entries.param.value,
                ),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            plot_code_coupling_with_controls(),
        ),
    )
