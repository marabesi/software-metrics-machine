from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from typing import Optional, Any

from core.infrastructure.repository_factory import (
    create_codemaat_repository,
    create_pipelines_repository,
    create_prs_repository,
)

from core.code.pairing_index import PairingIndex
from core.pipelines.plots.view_pipeline_summary import WorkflowRunSummary
from providers.codemaat.plots.entity_churn import EntityChurnViewer
from providers.codemaat.plots.code_churn import CodeChurnViewer
from providers.codemaat.plots.coupling import CouplingViewer
from providers.codemaat.plots.entity_effort import EntityEffortViewer
from providers.codemaat.plots.entity_ownership import EntityOnershipViewer

from core.pipelines.plots.view_pipeline_by_status import ViewPipelineByStatus
from core.pipelines.plots.view_jobs_by_status import ViewJobsByStatus
from core.pipelines.plots.view_pipeline_execution_duration import (
    ViewPipelineExecutionRunsDuration,
)
from core.pipelines.plots.view_deployment_frequency import ViewDeploymentFrequency
from core.pipelines.plots.view_pipeline_runs_by_week_or_month import (
    ViewWorkflowRunsByWeekOrMonth,
)
from core.pipelines.plots.view_jobs_average_time_execution import (
    ViewJobsByAverageTimeExecution,
)

from core.prs.plots.view_summary import PrViewSummary

router = APIRouter()


def _coerce_result(res: Any) -> Any:
    """Make a CLI result JSON-serializable where possible.

    - dict/list/primitives are returned as-is
    - objects with __dict__ are returned as dicts
    - otherwise convert to str()
    """
    if res is None:
        return None
    if isinstance(res, (dict, list, str, int, float, bool)):
        return res
    try:
        # try typical dataclass-like or typed dict conversion
        return dict(res)
    except Exception:
        try:
            return res.__dict__
        except Exception:
            return str(res)


# A small convenience builder that maps typical CLI commands to HTTP endpoints.
# We'll add endpoints for several CLI modules discovered in the codebase.


@router.get("/code/pairing-index")
def pairing_index(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    authors: Optional[str] = Query(None),
):
    pi = PairingIndex(repository=create_codemaat_repository())
    result = pi.get_pairing_index(
        start_date=start_date, end_date=end_date, authors=authors
    )
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/code/entity-churn")
def entity_churn(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    viewer = EntityChurnViewer(repository=create_codemaat_repository())
    viewer.render(out_file=None, top=None, ignore_files=None, include_only=None)
    return JSONResponse(content={"result": "ok"})


@router.get("/code/code-churn")
def code_churn(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    result = CodeChurnViewer(repository=create_codemaat_repository()).render(
        out_file=None, start_date=start_date, end_date=end_date
    )
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/pipelines/by-status")
def pipelines_by_status(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = ViewPipelineByStatus(repository=create_pipelines_repository())
    result = view.main(
        out_file=None, workflow_path=None, start_date=start_date, end_date=end_date
    )
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/pipelines/jobs-by-status")
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
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/pull-requests/summary")
def pull_request_summary(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = PrViewSummary(repository=create_prs_repository())
    result = view.main(
        csv=None, start_date=start_date, end_date=end_date, output_format="json"
    )
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/pipelines/summary")
def pipeline_summary(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    view = WorkflowRunSummary(repository=create_pipelines_repository())
    # print_summary prints to stdout; call method and return ok
    view.print_summary(
        max_workflows=10, start_date=start_date, end_date=end_date, output_format="json"
    )
    return JSONResponse(content={"result": "ok"})


@router.get("/pipelines/runs-duration")
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
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/pipelines/deployment-frequency")
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
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/pipelines/runs-by")
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
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/pipelines/jobs-average-time")
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
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/code/coupling")
def code_coupling(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    result = CouplingViewer(repository=create_codemaat_repository()).render(
        out_file=None, ignore_files=None, include_only=None
    )
    return JSONResponse(content={"result": _coerce_result(result)})


@router.get("/code/entity-effort")
def entity_effort(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    viewer = EntityEffortViewer(repository=create_codemaat_repository())
    viewer.render_treemap(top_n=30, ignore_files=None, out_file=None, include_only=None)
    return JSONResponse(content={"result": "ok"})


@router.get("/code/entity-ownership")
def entity_ownership(
    start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)
):
    viewer = EntityOnershipViewer(repository=create_codemaat_repository())
    viewer.render(
        top_n=None, ignore_files=None, out_file=None, authors=None, include_only=None
    )
    return JSONResponse(content={"result": "ok"})
