from fastapi import FastAPI
from fastapi import Query
from fastapi.responses import JSONResponse
from typing import Optional

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
    create_pipelines_repository,
    create_prs_repository,
)

from software_metrics_machine.core.code.pairing_index import PairingIndex
from software_metrics_machine.core.pipelines.plots.view_pipeline_summary import (
    WorkflowRunSummary,
)
from software_metrics_machine.providers.codemaat.plots.entity_churn import (
    EntityChurnViewer,
)
from software_metrics_machine.providers.codemaat.plots.code_churn import CodeChurnViewer
from software_metrics_machine.providers.codemaat.plots.coupling import CouplingViewer
from software_metrics_machine.providers.codemaat.plots.entity_effort import (
    EntityEffortViewer,
)
from software_metrics_machine.providers.codemaat.plots.entity_ownership import (
    EntityOnershipViewer,
)

from software_metrics_machine.core.pipelines.plots.view_pipeline_by_status import (
    ViewPipelineByStatus,
)
from software_metrics_machine.core.pipelines.plots.view_jobs_by_status import (
    ViewJobsByStatus,
)
from software_metrics_machine.core.pipelines.plots.view_pipeline_execution_duration import (
    ViewPipelineExecutionRunsDuration,
)
from software_metrics_machine.core.pipelines.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)
from software_metrics_machine.core.pipelines.plots.view_pipeline_runs_by_week_or_month import (
    ViewWorkflowRunsByWeekOrMonth,
)
from software_metrics_machine.core.pipelines.plots.view_jobs_average_time_execution import (
    ViewJobsByAverageTimeExecution,
)

from software_metrics_machine.core.prs.plots.view_summary import PrViewSummary

app = FastAPI()


source_code_tags: list[str] = ["Source code"]
pipeline_tags: list[str] = ["Pipeline"]
pull_request_tags: list[str] = ["Pull Requests"]


@app.get("/code/pairing-index", tags=source_code_tags)
def pairing_index(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    authors: Optional[str] = Query(None),
):
    pi = PairingIndex(repository=create_codemaat_repository())
    result = pi.get_pairing_index(
        start_date=start_date, end_date=end_date, authors=authors
    )
    return JSONResponse(content=result)


@app.get("/code/entity-churn", tags=source_code_tags)
def entity_churn(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    viewer = EntityChurnViewer(repository=create_codemaat_repository())
    result = viewer.render(
        out_file=None,
        top_n=None,
        ignore_files=None,
        include_only=None,
        start_date=start_date,
        end_date=end_date,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/code/code-churn", tags=source_code_tags)
def code_churn(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    result = CodeChurnViewer(repository=create_codemaat_repository()).render(
        out_file=None, start_date=start_date, end_date=end_date
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/code/coupling", tags=source_code_tags)
def code_coupling(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    result = CouplingViewer(repository=create_codemaat_repository()).render(
        out_file=None, ignore_files=None, include_only=None
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/code/entity-effort", tags=source_code_tags)
def entity_effort(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    viewer = EntityEffortViewer(repository=create_codemaat_repository())
    result = viewer.render_treemap(
        top_n=30, ignore_files=None, out_file=None, include_only=None
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/code/entity-ownership", tags=source_code_tags)
def entity_ownership(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    viewer = EntityOnershipViewer(repository=create_codemaat_repository())
    result = viewer.render(
        top_n=None, ignore_files=None, out_file=None, authors=None, include_only=None
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/by-status", tags=pipeline_tags)
def pipelines_by_status(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = ViewPipelineByStatus(repository=create_pipelines_repository())
    result = view.main(
        out_file=None, workflow_path=None, start_date=start_date, end_date=end_date
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/jobs-by-status", tags=pipeline_tags)
def pipeline_jobs_by_status(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = ViewJobsByStatus(repository=create_pipelines_repository())
    result = view.main(
        job_name=None,
        workflow_path=None,
        out_file=None,
        with_pipeline=None,
        aggregate_by_week=None,
        raw_filters=None,
        start_date=start_date,
        end_date=end_date,
        force_all_jobs=False,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/summary", tags=pipeline_tags)
def pipeline_summary(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = WorkflowRunSummary(repository=create_pipelines_repository())
    # print_summary prints to stdout; call method and return ok
    result = view.print_summary(
        max_workflows=10, start_date=start_date, end_date=end_date, output_format="json"
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/runs-duration", tags=pipeline_tags)
def pipeline_runs_duration(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = ViewPipelineExecutionRunsDuration(repository=create_pipelines_repository())
    result = view.main(
        out_file=None,
        workflow_path=None,
        start_date=start_date,
        end_date=end_date,
        max_runs=100,
        raw_filters=None,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/deployment-frequency", tags=pipeline_tags)
def pipeline_deployment_frequency(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = ViewDeploymentFrequency(repository=create_pipelines_repository())
    result = view.plot(
        out_file=None,
        workflow_path=None,
        job_name=None,
        start_date=start_date,
        end_date=end_date,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/runs-by", tags=pipeline_tags)
def pipeline_runs_by(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = ViewWorkflowRunsByWeekOrMonth(repository=create_pipelines_repository())
    result = view.main(
        aggregate_by="week",
        out_file=None,
        workflow_path=None,
        start_date=start_date,
        end_date=end_date,
        raw_filters=None,
        include_defined_only=False,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/jobs-average-time", tags=pipeline_tags)
def pipeline_jobs_average_time(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = ViewJobsByAverageTimeExecution(repository=create_pipelines_repository())
    result = view.main(
        workflow_path=None,
        out_file=None,
        raw_filters=None,
        top=20,
        exclude_jobs=None,
        start_date=start_date,
        end_date=end_date,
        force_all_jobs=False,
        job_name=None,
        pipeline_raw_filters=None,
    )
    return JSONResponse(content={"result": result})


@app.get("/pull-requests/summary", tags=pull_request_tags)
def pull_request_summary(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = PrViewSummary(repository=create_prs_repository())
    result = view.main(
        csv=None, start_date=start_date, end_date=end_date, output_format="json"
    )
    return JSONResponse(content={"result": result})
