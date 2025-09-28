import panel as pn
from infrastructure.configuration.configuration import Configuration
from providers.codemaat.plots.code_churn import CodeChurnViewer
from providers.codemaat.plots.coupling import CouplingViewer
from providers.codemaat.plots.entity_churn import EntityChurnViewer
from providers.codemaat.plots.entity_effort import EntityEffortViewer
from providers.codemaat.plots.entity_ownership import EntityOnershipViewer
from providers.codemaat.codemaat_repository import CodemaatRepository

pn.extension("tabulator")


def source_code_section(configuration: Configuration, start_end_date_picker):
    repository = CodemaatRepository(configuration=configuration)

    ignore_pattern_files = pn.widgets.TextAreaInput(
        placeholder="Ignore file patterns (comma-separated) - e.g. *.json,**/**/*.png",
        rows=6,
        auto_grow=True,
        max_rows=10,
    )

    # Add a select input for pre-selected values
    pre_selected_values = pn.widgets.Select(
        name="Ignore patterns",
        options={
            "None": "",
            "Js/Ts projects": "*.json,**/**/*.png,*.snap,*.yml.*.yaml",
            "Python and Markdown": "*.py,*.md",
            "All Text Files": "*.txt,*.log",
        },
        value="",
    )

    def update_ignore_pattern(event):
        ignore_pattern_files.value = event.new

    pre_selected_values.param.watch(update_ignore_pattern, "value")

    def plot_code_churn(date_range_picker):
        return CodeChurnViewer().render(
            repository=repository,
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
        )

    def plot_entity_churn(ignore_pattern):
        return EntityChurnViewer().render(repo=repository, ignore_files=ignore_pattern)

    def plot_entity_effort(ignore_pattern):
        return EntityEffortViewer().render_treemap(
            top_n=10,
            repo=repository,
            ignore_files=ignore_pattern,
        )

    def plot_entity_ownership(ignore_pattern):
        return EntityOnershipViewer().render(
            repo=repository,
            ignore_files=ignore_pattern,
        )

    # Refactor plot_code_coupling to include zoom and pan controls using Panel sliders
    def plot_code_coupling_with_controls():
        coupling_viewer = CouplingViewer()

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
        return pn.Column(coupling_viewer.render(repo=repository))

    return pn.Column(
        "## Source code Section",
        pn.Row(
            pn.Column(
                "## Code Churn",
                pn.bind(plot_code_churn, start_end_date_picker),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(ignore_pattern_files, pre_selected_values, sizing_mode="stretch_width"),
        pn.Row(
            pn.Column(
                "## Entity Churn",
                pn.bind(plot_entity_churn, ignore_pattern_files),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "## Entity Effort",
                pn.bind(plot_entity_effort, ignore_pattern_files),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "## Entity Ownership",
                pn.bind(plot_entity_ownership, ignore_pattern_files),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            plot_code_coupling_with_controls(),
        ),
    )
