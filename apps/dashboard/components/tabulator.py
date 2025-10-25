import panel as pn


def TabulatorComponent(
    df: pn.pane.DataFrame,
    header_filters,
    filename,
) -> pn.layout.Column:
    table = pn.widgets.Tabulator(
        df,
        pagination="remote",
        page_size=20,
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
    data = pn.Column(
        pn.FlexBox(filename_input, button, align_items="center"),
        pn.Row(table, sizing_mode="stretch_width"),
        sizing_mode="stretch_width",
    )
    return data
