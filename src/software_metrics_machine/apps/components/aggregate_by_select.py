import panel as pn


class SelectComponent:

    def aggregate_by_select(self):
        return pn.widgets.Select(
            name="Aggregate By", options=["week", "month"], value="week"
        )

    def aggregate_by_metric_select(self):
        return pn.widgets.Select(
            name="Metric", options=["avg", "sum", "count", "min", "max"], value="avg"
        )
