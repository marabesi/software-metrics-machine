from unittest.mock import patch
from software_metrics_machine.core.pipelines.aggregates.jobs_summary import JobsSummary
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineJobBuilder, PipelineBuilder


class TestJobsSummary:

    def test_empty_jobs_list(self):
        """Test summarize_jobs with an empty list of jobs."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_summary = JobsSummary(repository=repository)

            summary = jobs_summary.summarize_jobs([])

            # Verify empty summary structure
            assert summary["total_jobs"] == 0
            assert summary["first_job"] is None
            assert summary["last_job"] is None
            assert summary["conclusions"] == {}
            assert summary["unique_jobs"] == 0

    def test_jobs_with_conclusions_and_names(self):
        build_ = [
            PipelineJobBuilder()
            .with_id(101)
            .with_run_id(1)
            .with_name("test")
            .with_conclusion("success")
            .with_created_at("2023-01-01T10:00:00Z")
            .build(),
            PipelineJobBuilder()
            .with_id(102)
            .with_run_id(2)
            .with_name("build")
            .with_conclusion("failure")
            .with_created_at("2023-01-02T10:00:00Z")
            .build(),
            PipelineJobBuilder()
            .with_id(103)
            .with_run_id(1)
            .with_name("test")
            .with_conclusion("success")
            .with_created_at("2023-01-03T10:00:00Z")
            .build(),
        ]

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder().with_id(1).with_name("CI Pipeline").build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("Build Pipeline")
                        .build(),
                    ]
                )
            if file == "jobs.json":
                return as_json_string(build_)
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_summary = JobsSummary(repository=repository)

            summary = jobs_summary.summarize_jobs(build_)

            # Verify total count
            assert summary["total_jobs"] == 3

            # Verify first and last jobs
            assert summary["first_job"].id == 101
            assert summary["last_job"].id == 103

            # Verify conclusion counts
            assert summary["conclusions"]["success"] == 2
            assert summary["conclusions"]["failure"] == 1

            # Verify unique jobs (test :: CI Pipeline, build :: Build Pipeline)
            assert summary["unique_jobs"] == 2

    def test_jobs_without_conclusion(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_summary = JobsSummary(repository=repository)

            jobs = [
                PipelineJobBuilder()
                .with_id(201)
                .with_run_id(1)
                .with_name("deploy")
                .with_conclusion("success")
                .with_created_at("2023-01-01T10:00:00Z")
                .build(),
                PipelineJobBuilder()
                .with_id(202)
                .with_run_id(1)
                .with_name("lint")
                .with_conclusion("success")
                .with_created_at("2023-01-02T10:00:00Z")
                .build(),
            ]

            summary = jobs_summary.summarize_jobs(jobs)

            # Verify total count
            assert summary["total_jobs"] == 2

            # Verify conclusions include "unknown" for missing conclusions
            assert summary["conclusions"]["success"] == 2

            # Verify unique jobs without workflow names
            assert summary["unique_jobs"] == 2
            assert "deploy" in summary["jobs_by_name"]
            assert "lint" in summary["jobs_by_name"]
