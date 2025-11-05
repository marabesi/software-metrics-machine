from fastapi import FastAPI, Query
from typing import Optional
from fastapi.responses import JSONResponse

# Import the same view classes used by the CLI commands
from core.pipelines.plots.view_pipeline_by_status import ViewPipelineByStatus
from core.code.pairing_index import PairingIndex
from core.infrastructure.repository_factory import (
    create_pipelines_repository,
    create_codemaat_repository,
)

# include the router that wraps CLI modules
from apps.rest import router as rest_router

app = FastAPI(title="Software Metrics Machine API")
app.include_router(rest_router, prefix="/api")


@app.get("/pipelines/by-status")
def pipeline_by_status(
    out_file: Optional[str] = Query(None),
    workflow_path: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    view = ViewPipelineByStatus(repository=create_pipelines_repository())
    result = view.main(
        out_file=out_file,
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
    )
    # view.main may save a file or return data; normalize into JSON
    return JSONResponse({"status": "ok", "result": str(result)})


@app.get("/code/pairing-index")
def pairing_index(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    authors: Optional[str] = Query(None),
):
    pi = PairingIndex(repository=create_codemaat_repository())
    result = pi.get_pairing_index(
        authors=authors, start_date=start_date, end_date=end_date
    )
    return JSONResponse(result)


@app.get("/health")
def health():
    return {"status": "ok"}
