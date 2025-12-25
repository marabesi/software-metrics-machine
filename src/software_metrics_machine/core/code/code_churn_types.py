from datetime import datetime
from pydantic import BaseModel


class CodeChurn(BaseModel):
    date: datetime
    added: int
    deleted: int
    commits: int
