# type: ignore

import holoviews as hv  # TODO: remove dependency that is for dashboard only

from fastapi import FastAPI
from enum import Enum
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
from software_metrics_machine.core.prs.plots.view_open_prs_through_time import (
    ViewOpenPrsThroughTime,
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

hv.extension("bokeh")

app = FastAPI(
    title="Software Metrics Machine REST API",
    description="A Data-Driven Approach to High-Performing Teams - See your software development process through data. Everything runs locally.",
)


source_code_tags: list[str | Enum] = ["Source code"]
pipeline_tags: list[str | Enum] = ["Pipeline"]
pull_request_tags: list[str | Enum] = ["Pull Requests"]


@app.get("/code/pairing-index", tags=source_code_tags)
def pairing_index(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    authors: Optional[str] = Query(None),
):
    """
    Compute the pairing index for the repository.
    """
    pi = PairingIndex(repository=create_codemaat_repository())
    result = pi.get_pairing_index(
        start_date=start_date, end_date=end_date, authors=authors
    )
    return JSONResponse(content=result)


@app.get("/code/entity-churn", tags=source_code_tags)
def entity_churn(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    ignore_files: Optional[str] = Query(None),
    include_only: Optional[str] = Query(None),
    top: Optional[int] = Query(None),
):
    """
    Return per-entity churn metrics (added, deleted, commits).
    """
    viewer = EntityChurnViewer(repository=create_codemaat_repository())
    result = viewer.render(
        top_n=top,
        ignore_files=ignore_files,
        include_only=include_only,
        start_date=start_date,
        end_date=end_date,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/code/code-churn", tags=source_code_tags)
def code_churn(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    """
    Return code churn time series. Each record contains `date`, `type`, and `value`.
    """
    result = CodeChurnViewer(repository=create_codemaat_repository()).render(
        start_date=start_date, end_date=end_date
    )
    return JSONResponse(result.data)


@app.get("/code/coupling", tags=source_code_tags)
def code_coupling(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    ignore_files: Optional[str] = Query(None),
    include_only: Optional[str] = Query(None),
    top: Optional[int] = Query(20),
):
    """
    Return coupling pairs ranked by coupling degree.
    """
    result = CouplingViewer(repository=create_codemaat_repository()).render(
        ignore_files=ignore_files, include_only=include_only, top=top
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/code/entity-effort", tags=source_code_tags)
def entity_effort(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    top_n: Optional[int] = Query(30),
    ignore_files: Optional[str] = Query(None),
    include_only: Optional[str] = Query(None),
):
    """
    Return entity effort (lines changed) as a treemap-friendly list.
    """
    viewer = EntityEffortViewer(repository=create_codemaat_repository())
    result = viewer.render_treemap(
        top_n=top_n, ignore_files=ignore_files, include_only=include_only
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/code/entity-ownership", tags=source_code_tags)
def entity_ownership(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    top_n: Optional[int] = Query(None),
    ignore_files: Optional[str] = Query(None),
    authors: Optional[str] = Query(None),
    include_only: Optional[str] = Query(None),
):
    """
    Return ownership breakdown per entity and author.
    """
    viewer = EntityOnershipViewer(repository=create_codemaat_repository())
    result = viewer.render(
        top_n=top_n,
        ignore_files=ignore_files,
        authors=authors,
        include_only=include_only,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/by-status", tags=pipeline_tags)
def pipelines_by_status(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    workflow_path: Optional[str] = Query(None),
):
    """
    Return counts of pipeline runs grouped by status.
    """
    view = ViewPipelineByStatus(repository=create_pipelines_repository())
    result = view.main(
        workflow_path=workflow_path, start_date=start_date, end_date=end_date
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/jobs-by-status", tags=pipeline_tags)
def pipeline_jobs_by_status(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    job_name: Optional[str] = Query(None),
    workflow_path: Optional[str] = Query(None),
    with_pipeline: Optional[bool] = Query(False),
    aggregate_by_week: Optional[bool] = Query(False),
    raw_filters: Optional[str] = Query(None),
):
    """
    Return job status summary for pipeline jobs.
    """
    view = ViewJobsByStatus(repository=create_pipelines_repository())
    result = view.main(
        job_name=job_name,
        workflow_path=workflow_path,
        with_pipeline=with_pipeline,
        aggregate_by_week=aggregate_by_week,
        pipeline_raw_filters=raw_filters,
        start_date=start_date,
        end_date=end_date,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/summary", tags=pipeline_tags)
def pipeline_summary(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    """
    Return a summary of pipeline runs (counts, first/last run, in-progress, queued, etc.).
    """
    view = WorkflowRunSummary(repository=create_pipelines_repository())
    result = view.print_summary(
        max_workflows=None,
        start_date=start_date,
        end_date=end_date,
        output_format="json",
    )
    return JSONResponse(result)


@app.get("/pipelines/runs-duration", tags=pipeline_tags)
def pipeline_runs_duration(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    workflow_path: Optional[str] = Query(None),
    max_runs: Optional[int] = Query(100),
    raw_filters: Optional[str] = Query(None),
):
    """
    Return average/total durations for pipeline runs (per workflow).
    """
    view = ViewPipelineExecutionRunsDuration(repository=create_pipelines_repository())
    result = view.main(
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
        max_runs=max_runs,
        raw_filters=raw_filters,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/deployment-frequency", tags=pipeline_tags)
def pipeline_deployment_frequency(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    workflow_path: Optional[str] = Query(None),
    job_name: Optional[str] = Query(None),
):
    """
    Return deployment frequency counts (daily/weekly/monthly) for a job or workflow.
    """
    view = ViewDeploymentFrequency(repository=create_pipelines_repository())
    result = view.plot(
        workflow_path=workflow_path,
        job_name=job_name,
        start_date=start_date,
        end_date=end_date,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/runs-by", tags=pipeline_tags)
def pipeline_runs_by(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    aggregate_by: Optional[str] = Query("week"),
    workflow_path: Optional[str] = Query(None),
    raw_filters: Optional[str] = Query(None),
    include_defined_only: Optional[bool] = Query(False),
):
    """
    Return runs aggregated by period (week or month).
    """
    view = ViewWorkflowRunsByWeekOrMonth(repository=create_pipelines_repository())
    result = view.main(
        aggregate_by=aggregate_by,
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
        include_defined_only=include_defined_only or False,
    )
    return JSONResponse(result.data.to_dict(orient="records"))


@app.get("/pipelines/jobs-average-time", tags=pipeline_tags)
def pipeline_jobs_average_time(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    workflow_path: Optional[str] = Query(None),
    raw_filters: Optional[str] = Query(None),
    top: Optional[int] = Query(20),
    exclude_jobs: Optional[str] = Query(None),
    job_name: Optional[str] = Query(None),
    pipeline_raw_filters: Optional[str] = Query(None),
):
    """
    Return average execution time for jobs. Result returned under `result` key.
    """
    view = ViewJobsByAverageTimeExecution(repository=create_pipelines_repository())
    result = view.main(
        workflow_path=workflow_path,
        raw_filters=raw_filters,
        top=top or 20,
        exclude_jobs=exclude_jobs,
        start_date=start_date,
        end_date=end_date,
        job_name=job_name,
        pipeline_raw_filters=pipeline_raw_filters,
    )
    return JSONResponse(content={"result": result.data.to_dict(orient="records")})


@app.get("/pull-requests/summary", tags=pull_request_tags)
def pull_request_summary(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    """
    Return a summary of pull request metrics.
    """
    view = PrViewSummary(repository=create_prs_repository())
    result = view.main(
        csv=None, start_date=start_date, end_date=end_date, output_format="json"
    )
    return JSONResponse(content={"result": result})


@app.get("/pull-requests/through-time", tags=pull_request_tags)
def pull_request_through_time(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    authors: Optional[str] = Query(None),
):
    result = ViewOpenPrsThroughTime(repository=create_prs_repository()).main(
        title="Open Pull Requests Through Time",
        authors=authors,
        start_date=start_date,
        end_date=end_date,
    )
    return JSONResponse(content={"result": result.data.to_dict(orient="records")})
