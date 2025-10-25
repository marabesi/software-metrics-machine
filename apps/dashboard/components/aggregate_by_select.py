import panel as pn


def aggregate_by_select():
    return pn.widgets.Select(
        name="Aggregate By", options=["week", "month"], value="week"
    )
