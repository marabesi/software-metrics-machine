from unittest.mock import patch
from core.pipelines.aggregates.pipeline_summary import PipelineRunSummary
from core.pipelines.pipelines_repository import PipelinesRepository
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class FakeRepo:
    def __init__(self, runs):
        self._runs = runs

    def runs(self):
        return self._runs

    def get_pipeline_fails_the_most(self):
        return [{}]


def make_run(
    id=1,
    name=None,
    path=None,
    status=None,
    conclusion=None,
    created_at=None,
    updated_at=None,
):
    r = {}
    if id is not None:
        r["id"] = id
    if name is not None:
        r["name"] = name
    if path is not None:
        r["path"] = path
    if status is not None:
        r["status"] = status
    if conclusion is not None:
        r["conclusion"] = conclusion
    if created_at is not None:
        r["created_at"] = created_at
    if updated_at is not None:
        r["updated_at"] = updated_at
    return r


class TestPipelineRunSummary:

    def test_empty_runs_summary(self):
        repo = FakeRepo([])
        ps = PipelineRunSummary(repository=repo)

        s = ps.compute_summary()
        assert s["total_runs"] == 0
        assert s["first_run"] is None
        assert s["last_run"] is None
        assert s["runs_by_workflow"] == {}

    def test_summary_basic_counts_and_first_last(self):
        runs = [
            make_run(
                id=1,
                name="a",
                path="/a.yml",
                status="completed",
                created_at="2023-01-01T00:00:00Z",
                updated_at="2023-01-01T01:00:00Z",
            ),
            make_run(
                id=2,
                name="b",
                path="/b.yml",
                status="in_progress",
                created_at="2023-01-02T00:00:00Z",
                updated_at="2023-01-02T01:00:00Z",
            ),
            make_run(
                id=3,
                name="a",
                path="/a.yml",
                status="queued",
                created_at="2023-01-03T00:00:00Z",
                updated_at="2023-01-03T01:00:00Z",
            ),
        ]
        repo = FakeRepo(runs)
        ps = PipelineRunSummary(repository=repo)

        s = ps.compute_summary()
        assert s["total_runs"] == 3
        assert s["completed"] == 1
        assert s["in_progress"] == 1
        assert s["queued"] == 1
        assert s["first_run"]["id"] == 1
        assert s["last_run"]["id"] == 3
        # runs_by_workflow should have counts for 'a' and 'b'
        assert s["runs_by_workflow"]["a"]["count"] == 2
        assert s["runs_by_workflow"]["a"]["path"] == "/a.yml"
        assert s["runs_by_workflow"]["b"]["count"] == 1

    def test_unnamed_runs_and_path_selection(self):
        runs = [
            make_run(id=1, name=None, path=None, status="completed"),
            make_run(id=2, name=None, path="/x.yml", status="completed"),
        ]
        repo = FakeRepo(runs)
        ps = PipelineRunSummary(repository=repo)
        s = ps.compute_summary()

        # unnamed runs become '<unnamed>' key
        assert "<unnamed>" in s["runs_by_workflow"]
        assert s["runs_by_workflow"]["<unnamed>"]["count"] == 2
        # path should prefer explicit path when available
        assert s["runs_by_workflow"]["<unnamed>"]["path"] in ("/x.yml", "<no path>")

    def test_unique_workflows_count(self):
        runs = [
            make_run(id=1, name="x"),
            make_run(id=2, name="y"),
            make_run(id=3, name="x"),
        ]
        repo = FakeRepo(runs)
        ps = PipelineRunSummary(repository=repo)
        s = ps.compute_summary()
        assert s["unique_workflows"] == 2

    def test_plot_most_failed_run_empty(self):
        single_run = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "conclusion": "success",
                    "created_at": "2023-10-01T09:00:00Z",
                    "updated_at": "2023-10-01T09:10:00Z",
                },
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_run
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
            ps = PipelineRunSummary(repository=loader)

            s = ps.compute_summary()

            assert s["most_failed"] == "N/A"

    def test_plot_most_failed_run_with_computed_value(self):
        single_run = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "conclusion": "failure",
                    "created_at": "2023-10-01T09:00:00Z",
                    "updated_at": "2023-10-01T09:10:00Z",
                },
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_run
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            ps = PipelineRunSummary(repository=loader)
            s = ps.compute_summary()

            assert 1 == s["most_failed"]
