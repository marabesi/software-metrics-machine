from pydantic import BaseModel


class CodeMetadataResult(BaseModel):
    message: str
