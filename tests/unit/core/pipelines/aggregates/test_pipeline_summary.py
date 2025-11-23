from unittest.mock import patch
from software_metrics_machine.core.pipelines.aggregates.pipeline_summary import (
    PipelineRunSummary,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder


class TestPipelineRunSummary:

    def test_empty_runs_summary(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
            ps = PipelineRunSummary(repository=loader)

            s = ps.compute_summary()
            assert s["total_runs"] == 0
            assert s["first_run"] is None
            assert s["last_run"] is None
            assert s["runs_by_workflow"] == {}

    def test_summary_basic_counts_and_first_last(self):
        single_run = as_json_string(
            [
                PipelineBuilder()
                .with_id(1)
                .with_path("/a.yml")
                .with_name("a")
                .with_status("completed")
                .with_created_at("2023-01-01T00:00:00Z")
                .with_updated_at("2023-01-01T01:00:00Z")
                .build(),
                PipelineBuilder()
                .with_id(2)
                .with_path("/b.yml")
                .with_name("b")
                .with_status("in_progress")
                .with_created_at("2023-01-02T00:00:00Z")
                .with_updated_at("2023-01-02T01:00:00Z")
                .build(),
                PipelineBuilder()
                .with_id(3)
                .with_path("/a.yml")
                .with_name("a")
                .with_status("queued")
                .with_created_at("2023-01-03T00:00:00Z")
                .with_updated_at("2023-01-03T01:00:00Z")
                .build(),
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_run
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
            ps = PipelineRunSummary(repository=loader)

            s = ps.compute_summary()
        assert s["total_runs"] == 3
        assert s["completed"] == 1
        assert s["in_progress"] == 1
        assert s["queued"] == 1
        assert s["first_run"].id == 1
        assert s["last_run"].id == 3
        # runs_by_workflow should have counts for 'a' and 'b'
        assert s["runs_by_workflow"]["a"]["count"] == 2
        assert s["runs_by_workflow"]["a"]["path"] == "/a.yml"
        assert s["runs_by_workflow"]["b"]["count"] == 1

    def test_unique_workflows_count(self):
        single_run = as_json_string(
            [
                PipelineBuilder().with_id(1).with_name("x").build(),
                PipelineBuilder().with_id(2).with_name("y").build(),
                PipelineBuilder().with_id(3).with_name("x").build(),
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_run
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
            ps = PipelineRunSummary(repository=loader)
            s = ps.compute_summary()
            assert s["unique_workflows"] == 2

    def test_plot_most_failed_run_empty(self):
        single_run = as_json_string(
            [
                PipelineBuilder()
                .with_id(1)
                .with_path("/workflows/build.yml")
                .with_conclusion("success")
                .with_created_at("2023-10-01T09:00:00Z")
                .with_updated_at("2023-10-01T09:10:00Z")
                .build(),
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_run
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
            ps = PipelineRunSummary(repository=loader)

            s = ps.compute_summary()

            assert s["most_failed"] == "N/A"

    def test_plot_most_failed_run_with_computed_value(self):
        single_run = as_json_string(
            [
                PipelineBuilder()
                .with_id(1)
                .with_path("/workflows/build.yml")
                .with_conclusion("failure")
                .with_created_at("2023-10-01T09:00:00Z")
                .with_updated_at("2023-10-01T09:10:00Z")
                .build(),
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_run
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            ps = PipelineRunSummary(repository=loader)
            s = ps.compute_summary()

            assert "/workflows/build.yml (1)" == s["most_failed"]
