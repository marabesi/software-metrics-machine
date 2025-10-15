import panel as pn


def tabulator(
    df: pn.pane.DataFrame,
    header_filters,
    filename,
) -> pn.widgets.Tabulator:
    table = pn.widgets.Tabulator(
        df,
        pagination="remote",
        page_size=10,
        header_filters=header_filters,
        show_index=False,
        width=900,
    )
    filename, button = table.download_menu(
        text_kwargs={"name": "", "value": f"{filename}.csv"},
        button_kwargs={"name": "Download table"},
    )
    data = pn.Column(
        pn.FlexBox(filename, button, align_items="center"),
        pn.Row(table),
        sizing_mode="stretch_width",
    )
    return data
