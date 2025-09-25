from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()


class PRFilter(BaseModel):
    top: Optional[int] = None
    labels: Optional[List[str]] = None
    out_file: Optional[str] = None


@app.get("/prs_by_author")
def prs_by_author(filter: PRFilter):
    # Logic for prs_by_author
    return {"message": "PRs by author"}


@app.get("/review_time_by_author")
def review_time_by_author(filter: PRFilter):
    # Logic for review_time_by_author
    return {"message": "Review time by author"}


@app.get("/summary")
def summary():
    # Logic for summary
    return {"message": "Summary"}


@app.get("/average_prs_open_by")
def average_prs_open_by():
    # Logic for average_prs_open_by
    return {"message": "Average PRs open by"}
