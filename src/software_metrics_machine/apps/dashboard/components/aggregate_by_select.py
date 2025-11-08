import panel as pn


def aggregate_by_select():
    return pn.widgets.Select(
        name="Aggregate By", options=["week", "month"], value="week"
    )


def aggregate_by_metric_select():
    return pn.widgets.Select(
        name="Metric", options=["avg", "sum", "count"], value="avg"
    )
