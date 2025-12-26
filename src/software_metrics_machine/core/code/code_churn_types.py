from typing import Optional, TypedDict
from pydantic import BaseModel


class CodeChurn(BaseModel):
    date: str
    added: int
    deleted: int
    commits: int


class CodeChurnFilters(TypedDict, total=False):
    start_date: Optional[str]
    end_date: Optional[str]
