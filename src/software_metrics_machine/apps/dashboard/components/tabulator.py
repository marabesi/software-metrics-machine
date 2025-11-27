import panel as pn


def TabulatorComponent(
    df: pn.pane.DataFrame,
    header_filters,
    filename,
) -> pn.layout.Column:
    initial_size = 100
    table = pn.widgets.Tabulator(
        df,
        pagination="remote",
        page_size=initial_size,
        header_filters=header_filters,
        show_index=False,
        sizing_mode="stretch_width",
        # configuration={
        #     "initialHeaderFilter": [
        #         {"field":"path", "value": ".github/workflows/ci.yml"}
        #     ]
        # }
    )
    filename_input, button = table.download_menu(
        text_kwargs={"name": "", "value": f"{filename}.csv"},
        button_kwargs={"name": "Download table"},
    )
    page_size_select = pn.widgets.Select(
        name="",
        options=[10, 25, 50, 100, 200],
        value=initial_size,
    )

    def _on_page_size_change(event):
        new_size = int(event.new)
        table.page_size = new_size

    page_size_select.param.watch(_on_page_size_change, "value")

    controls = pn.FlexBox(
        filename_input, button, page_size_select, align_items="center"
    )

    data = pn.Column(
        controls,
        pn.Row(table, sizing_mode="stretch_width"),
        sizing_mode="stretch_width",
    )
    return data
