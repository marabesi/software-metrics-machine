from pydantic import BaseModel


class CodeChurn(BaseModel):
    date: str
    added: int
    deleted: int
    commits: int
