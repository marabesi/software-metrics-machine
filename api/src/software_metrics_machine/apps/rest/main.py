# type: ignore

import holoviews as hv  # TODO: remove dependency that is for dashboard only
import math
from pathlib import Path

from fastapi import FastAPI
from enum import Enum
from fastapi import Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from typing import Optional

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
    create_configuration,
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
from software_metrics_machine.core.prs.plots.view_prs_by_author import (
    ViewPrsByAuthor,
)
from software_metrics_machine.core.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
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

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

source_code_tags: list[str | Enum] = ["Source code"]
pipeline_tags: list[str | Enum] = ["Pipeline"]
pull_request_tags: list[str | Enum] = ["Pull Requests"]


def sanitize_nan_and_inf(obj):
    """
    Recursively sanitize NaN and Infinity values for JSON serialization.
    Converts NaN and Infinity to null.
    """
    if isinstance(obj, dict):
        return {key: sanitize_nan_and_inf(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_nan_and_inf(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    else:
        return obj


def convert_result_data(data):
    """
    Safely convert result data to records format.
    Handles both DataFrame and string/dict cases.
    Sanitizes NaN and Infinity values for JSON serialization.
    """
    if hasattr(data, 'to_dict'):
        # It's a DataFrame
        result = data.to_dict(orient="records")
    elif isinstance(data, str):
        # It's already a string, return as is
        result = data
    elif isinstance(data, (list, dict)):
        # It's already a list or dict
        result = data
    else:
        # Try to convert to dict
        result = str(data)

    # Sanitize NaN and Infinity values
    return sanitize_nan_and_inf(result)


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
    return JSONResponse(convert_result_data(result.data))


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
    return JSONResponse(convert_result_data(result.data))


@app.get("/code/entity-effort", tags=source_code_tags)
def entity_effort(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    top: Optional[int] = Query(30),
    ignore_files: Optional[str] = Query(None),
    include_only: Optional[str] = Query(None),
):
    viewer = EntityEffortViewer(repository=create_codemaat_repository())
    result = viewer.render_treemap(
        top_n=top, ignore_files=ignore_files, include_only=include_only
    )
    return JSONResponse(convert_result_data(result.data))


@app.get("/code/entity-ownership", tags=source_code_tags)
def entity_ownership(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    top: Optional[int] = Query(None),
    ignore_files: Optional[str] = Query(None),
    authors: Optional[str] = Query(None),
    include_only: Optional[str] = Query(None),
):
    """
    Return ownership breakdown per entity and author.
    """
    viewer = EntityOnershipViewer(repository=create_codemaat_repository())
    result = viewer.render(
        top_n=top,
        ignore_files=ignore_files,
        authors=authors,
        include_only=include_only,
    )
    return JSONResponse(convert_result_data(result.data))


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
    return JSONResponse(convert_result_data(result.data))


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
    return JSONResponse(convert_result_data(result.data))


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
    return JSONResponse(convert_result_data(result.data))


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
    pipelines_repository = create_pipelines_repository()
    view = ViewDeploymentFrequency(repository=pipelines_repository)
    result = view.plot(
        workflow_path=pipelines_repository.configuration.deployment_frequency_target_pipeline or workflow_path,
        job_name=pipelines_repository.configuration.deployment_frequency_target_job or job_name,
        start_date=start_date,
        end_date=end_date,
    )
    return JSONResponse(convert_result_data(result.data))


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
    return JSONResponse(convert_result_data(result.data))


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
    return JSONResponse(content={"result": convert_result_data(result.data)})


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
    return JSONResponse(content={"result": convert_result_data(result.data)})


@app.get("/pull-requests/by-author", tags=pull_request_tags)
def pull_requests_by_author(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    labels: Optional[str] = Query(None),
    top: Optional[int] = Query(10),
    raw_filters: Optional[str] = Query(None),
):
    """
    Return top N authors ranked by number of pull requests created.
    """
    view = ViewPrsByAuthor(repository=create_prs_repository())
    result = view.plot_top_authors(
        title="Pull Requests by Author",
        top=top or 10,
        labels=labels,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )
    return JSONResponse(content={"result": convert_result_data(result.data)})


@app.get("/pull-requests/average-review-time", tags=pull_request_tags)
def pull_requests_average_review_time(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    labels: Optional[str] = Query(None),
    authors: Optional[str] = Query(None),
    top: Optional[int] = Query(10),
    raw_filters: Optional[str] = Query(None),
):
    """
    Return average review time (in days) per author for merged PRs.
    """
    view = ViewAverageReviewTimeByAuthor(repository=create_prs_repository())
    result = view.plot_average_open_time(
        title="Average Review Time by Author",
        top=top or 10,
        labels=labels,
        start_date=start_date,
        end_date=end_date,
        authors=authors,
        raw_filters=raw_filters,
    )
    return JSONResponse(content={"result": convert_result_data(result.data)})


@app.get("/pull-requests/average-open-by", tags=pull_request_tags)
def pull_requests_average_open_by(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    aggregate_by: Optional[str] = Query("week"),
    labels: Optional[str] = Query(None),
):
    """
    Return average days PRs remain open, aggregated by period (week or month).
    """
    from software_metrics_machine.core.prs.pr_types import PRFilters

    repository = create_prs_repository()

    # Build filters if dates are provided
    filters = None
    if start_date or end_date:
        filters = PRFilters(
            start_date=start_date,
            end_date=end_date,
        )

    # Get filtered PRs
    filtered_prs = repository.prs_with_filters(filters=filters)

    # Use the aggregate_by parameter (week or month)
    periods, averages = repository.average_by(
        by=aggregate_by or "week",
        labels=labels,
        prs=filtered_prs
    )

    # Transform to the format expected by the frontend
    result_data = [
        {"period": period, "avg_days": avg}
        for period, avg in zip(periods, averages)
    ]

    return JSONResponse(content=result_data)


@app.get("/pull-requests/average-comments", tags=pull_request_tags)
def pull_requests_average_comments(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    aggregate_by: Optional[str] = Query("week"),
    labels: Optional[str] = Query(None),
):
    """
    Return average comments per PR, aggregated by period (week or month).
    """
    from software_metrics_machine.core.prs.pr_types import PRFilters

    repository = create_prs_repository()

    # Build filters if dates are provided
    filters = None
    if start_date or end_date:
        filters = PRFilters(
            start_date=start_date,
            end_date=end_date,
        )

    # Get average comments by period
    result = repository.average_comments(
        filters=filters,
        aggregate_by=aggregate_by or "week"
    )

    # Transform to the format expected by the frontend
    result_data = [
        {"period": period, "avg_comments": avg}
        for period, avg in zip(result["period"], result["y"])
    ]

    return JSONResponse(content=result_data)


# Filter Option Endpoints
@app.get("/pipelines/workflows", tags=pipeline_tags)
def pipeline_workflows():
    """
    Return list of unique workflow paths.
    """
    repository = create_pipelines_repository()
    workflows = repository.get_unique_workflow_paths()
    return JSONResponse(content=[
        {"name": workflow, "path": workflow} for workflow in workflows
    ])


@app.get("/pipelines/statuses", tags=pipeline_tags)
def pipeline_statuses(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """
    Return list of unique workflow statuses.
    """
    repository = create_pipelines_repository()
    statuses = repository.get_unique_workflow_status(
        {"start_date": start_date, "end_date": end_date}
        if start_date or end_date
        else None
    )
    return JSONResponse(content=statuses)


@app.get("/pipelines/conclusions", tags=pipeline_tags)
def pipeline_conclusions(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """
    Return list of unique workflow conclusions.
    """
    repository = create_pipelines_repository()
    conclusions = repository.get_unique_workflow_conclusions(
        {"start_date": start_date, "end_date": end_date}
        if start_date or end_date
        else None
    )
    return JSONResponse(content=conclusions)


@app.get("/pipelines/branches", tags=pipeline_tags)
def pipeline_branches(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """
    Return list of unique branches from pipeline runs.
    """
    repository = create_pipelines_repository()
    branches = repository.get_unique_branches(
        {"start_date": start_date, "end_date": end_date}
        if start_date or end_date
        else None
    )
    return JSONResponse(content=branches)


@app.get("/pipelines/events", tags=pipeline_tags)
def pipeline_events():
    """
    Return list of unique pipeline trigger events.
    """
    repository = create_pipelines_repository()
    events = repository.get_unique_pipeline_trigger_events()
    return JSONResponse(content=events)


@app.get("/pipelines/jobs", tags=pipeline_tags)
def pipeline_jobs(
    workflow_path: Optional[str] = Query(None),
):
    """
    Return list of unique job names.
    """
    repository = create_pipelines_repository()
    jobs = repository.get_unique_jobs_name(
        {"path": workflow_path} if workflow_path else None
    )
    return JSONResponse(content=[
        {"name": job, "id": job} for job in jobs
    ])


@app.get("/code/authors", tags=source_code_tags)
def code_authors():
    """
    Return list of unique authors from git commits in source code.
    """
    repository = create_codemaat_repository()
    authors = repository.get_entity_ownership_unique_authors()
    return JSONResponse(content=authors)


@app.get("/pull-requests/authors", tags=pull_request_tags)
def pull_request_authors():
    """
    Return list of unique pull request authors.
    """
    repository = create_prs_repository()
    authors = repository.get_unique_authors()
    return JSONResponse(content=authors)


@app.get("/pull-requests/labels", tags=pull_request_tags)
def pull_request_labels():
    """
    Return list of unique pull request labels.
    """
    repository = create_prs_repository()
    labels = repository.get_unique_labels()
    label_names = [label["label_name"] for label in labels]
    return JSONResponse(content=label_names)


@app.get("/configuration")
def configuration():
    """
    Return the stored configuration.
    """
    config = create_configuration()
    return JSONResponse(content={
        "result": {
            "git_provider": config.git_provider,
            "github_repository": config.github_repository,
            "git_repository_location": config.git_repository_location,
            "store_data": config.store_data,
            "deployment_frequency_target_pipeline": config.deployment_frequency_target_pipeline,
            "deployment_frequency_target_job": config.deployment_frequency_target_job,
            "main_branch": config.main_branch,
            "dashboard_start_date": config.dashboard_start_date,
            "dashboard_end_date": config.dashboard_end_date,
            "dashboard_color": config.dashboard_color,
            "logging_level": config.logging_level,
            "jira_url": config.jira_url,
            "jira_email": config.jira_email,
            "jira_token": config.jira_token,
            "jira_project": config.jira_project,
        }
    })


# Serve frontend static files
static_path = Path(__file__).parent.parent.parent.parent.parent / "static"
if static_path.exists():
    app.mount("/", StaticFiles(directory=str(static_path), html=True), name="static")
