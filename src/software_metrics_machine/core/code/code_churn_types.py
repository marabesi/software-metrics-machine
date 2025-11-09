import dataclasses


@dataclasses.dataclass
class CodeChurn:
    date: str
    added: int
    deleted: int
    commits: int
