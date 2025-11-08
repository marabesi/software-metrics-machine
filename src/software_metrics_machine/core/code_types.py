from typing import List, TypedDict


class Commit(TypedDict):
    author: str
    msg: str
    hash: str


class PairingIndexResult(TypedDict):
    total_analyzed_commits: int
    paired_commits: int
    pairing_index_percentage: float


class TraverserResult(TypedDict):
    total_analyzed_commits: int
    paired_commits: int
    commits: List[Commit]
