import pandas as pd
import holoviews as hv


from core.infrastructure.base_viewer import MatplotViewer, PlotResult
from core.pipelines.aggregates.pipeline_by_status import PipelineByStatus
from core.pipelines.pipelines_repository import PipelinesRepository

hv.extension("bokeh")


class ViewPipelineByStatus(MatplotViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        out_file: str | None = None,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        result = PipelineByStatus(repository=self.repository).main(
            workflow_path=workflow_path,
            start_date=start_date,
            end_date=end_date,
        )
        status_counts = result.status_counts
        runs = result.runs

        data = [{"Status": k, "Count": v} for k, v in status_counts.items()]

        title = "Status of Pipeline Runs"
        if workflow_path:
            title = f"Status of Pipeline Runs for '{workflow_path}' - Total {len(runs)}"

        bars = hv.Bars(data, "Status", "Count").opts(
            color="skyblue",
            width=700,
            height=400,
            title=title,
            xlabel="Status",
            ylabel="Count",
            xrotation=45,
            tools=["hover"],
        )

        labels_data = []
        for d in data:
            labels_data.append(
                {"x": d["Status"], "y": d["Count"], "text": str(d["Count"])}
            )
        labels = hv.Labels(labels_data, ["x", "y"], "text").opts(text_font_size="8pt")

        chart = bars * labels

        df = pd.DataFrame(runs)

        if out_file:
            try:
                hv.save(chart, out_file)
            except Exception:
                pass

        return PlotResult(chart, df)
