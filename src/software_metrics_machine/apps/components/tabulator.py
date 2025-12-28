import panel as pn
from software_metrics_machine.core.infrastructure.pandas import pd


class TabulatorComponent:
    def __init__(
        self,
        df: pd.DataFrame,
        header_filters,
        filename,
    ):
        self.df = df
        self.header_filters = header_filters
        self.filename = filename
        self.initial_size = 100
        self.table = None
        self.filename_input = None
        self.button = None
        self.page_size_select = None
        self._build()

    def _build(self):
        self.table = pn.widgets.Tabulator(
            self.df,
            pagination="remote",
            page_size=self.initial_size,
            header_filters=self.header_filters,
            show_index=False,
            sizing_mode="stretch_width",
            # configuration={
            #     "initialHeaderFilter": [
            #         {"field":"path", "value": ".github/workflows/ci.yml"}
            #     ]
            # }
        )
        self.filename_input, self.button = self.table.download_menu(
            text_kwargs={"name": "", "value": f"{self.filename}.csv"},
            button_kwargs={"name": "Download table"},
        )
        self.page_size_select = pn.widgets.Select(
            name="",
            options=[10, 25, 50, 100, 200],
            value=self.initial_size,
        )
        self.page_size_select.param.watch(self._on_page_size_change, "value")

    def _on_page_size_change(self, event):
        new_size = int(event.new)
        self.table.page_size = new_size

    def __panel__(self) -> pn.layout.Column:
        controls = pn.FlexBox(
            self.filename_input,
            self.button,
            self.page_size_select,
            align_items="center",
        )

        data = pn.Column(
            controls,
            pn.Row(self.table, sizing_mode="stretch_width"),
            sizing_mode="stretch_width",
        )
        return data
