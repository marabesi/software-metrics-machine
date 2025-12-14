from unittest.mock import patch

import pytest
from software_metrics_machine.core.pipelines.aggregates.jobs_by_status import (
    JobsByStatus,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder


class TestJobsByStatus:

    @pytest.mark.parametrize(
        "pipelines, jobs",
        [
            pytest.param([], [], id="empty_data"),
            pytest.param(
                [],
                [
                    PipelineJobBuilder()
                    .with_id(101)
                    .with_name("test")
                    .with_run_id(1)
                    .with_conclusion("success")
                    .with_created_at("2023-01-01T10:00:00Z")
                    .build(),
                ],
            ),
        ],
    )
    def test_jobs_and_runs_based_on_params(self, pipelines, jobs):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(pipelines)
            if file == "jobs.json":
                return as_json_string(jobs)
            raise FileNotFoundError

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_by_status = JobsByStatus(repository=repository)

            result = jobs_by_status.main(job_name="test")

            assert result.status_counts == {}
            assert result.dates == []
            assert result.conclusions == []
            assert result.matrix == []
            assert result.runs == []

    def test_jobs_grouped_by_day(self):
        """Test main() with jobs grouped by day and different conclusions."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_conclusion("success")
                        .with_created_at("2023-01-01T10:00:00Z")
                        .with_run_started_at("2023-01-01T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_conclusion("failure")
                        .with_created_at("2023-01-02T10:00:00Z")
                        .with_run_started_at("2023-01-02T10:00:00Z")
                        .build(),
                    ]
                )
            if file == "jobs.json":
                return as_json_string(
                    [
                        PipelineJobBuilder()
                        .with_id(101)
                        .with_name("build")
                        .with_run_id(1)
                        .with_conclusion("success")
                        .with_created_at("2023-01-01T10:00:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(102)
                        .with_name("build")
                        .with_run_id(1)
                        .with_conclusion("success")
                        .with_created_at("2023-01-01T11:00:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(103)
                        .with_name("build")
                        .with_run_id(2)
                        .with_conclusion("failure")
                        .with_created_at("2023-01-02T10:00:00Z")
                        .build(),
                    ]
                )
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_by_status = JobsByStatus(repository=repository)

            result = jobs_by_status.main(job_name="build", aggregate_by_week=False)

            # Verify status counts for runs
            assert result.status_counts["success"] == 2
            assert result.status_counts["failure"] == 1

            # Verify date grouping (2 days)
            assert len(result.dates) == 2
            assert "2023-01-01" in result.dates
            assert "2023-01-02" in result.dates

            # Verify conclusions order (success, failure)
            assert "success" in result.conclusions
            assert "failure" in result.conclusions

            # Verify matrix structure (rows per conclusion, columns per date)
            assert len(result.matrix) == len(result.conclusions)
            assert len(result.matrix[0]) == len(result.dates)

            # Verify counts in matrix
            success_index = result.conclusions.index("success")
            failure_index = result.conclusions.index("failure")
            day1_index = result.dates.index("2023-01-01")
            day2_index = result.dates.index("2023-01-02")

            assert result.matrix[success_index][day1_index] == 2
            assert result.matrix[success_index][day2_index] == 0
            assert result.matrix[failure_index][day1_index] == 0
            assert result.matrix[failure_index][day2_index] == 1

    def test_jobs_grouped_by_week(self):
        """Test main() with jobs grouped by week."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_conclusion("success")
                        .with_created_at("2023-01-02T10:00:00Z")  # Week 1
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("CI")
                        .with_conclusion("success")
                        .with_created_at("2023-01-09T10:00:00Z")  # Week 2
                        .build(),
                    ]
                )
            if file == "jobs.json":
                return as_json_string(
                    [
                        PipelineJobBuilder()
                        .with_id(101)
                        .with_name("deploy")
                        .with_run_id(1)
                        .with_conclusion("success")
                        .with_created_at("2023-01-02T10:00:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(102)
                        .with_name("deploy")
                        .with_run_id(1)
                        .with_conclusion("success")
                        .with_created_at("2023-01-03T10:00:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(103)
                        .with_name("deploy")
                        .with_run_id(2)
                        .with_conclusion("failure")
                        .with_created_at("2023-01-09T10:00:00Z")
                        .build(),
                    ]
                )
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_by_status = JobsByStatus(repository=repository)

            result = jobs_by_status.main(job_name="deploy", aggregate_by_week=True)

            # Verify date grouping by week (2 weeks)
            assert len(result.dates) == 2
            assert "2023-W01" in result.dates
            assert "2023-W02" in result.dates

            # Verify conclusions
            assert "success" in result.conclusions
            assert "failure" in result.conclusions

            # Verify matrix structure
            assert len(result.matrix) == len(result.conclusions)
            assert len(result.matrix[0]) == len(result.dates)

            # Verify counts by week
            success_index = result.conclusions.index("success")
            failure_index = result.conclusions.index("failure")
            week1_index = result.dates.index("2023-W01")
            week2_index = result.dates.index("2023-W02")

            assert result.matrix[success_index][week1_index] == 2
            assert result.matrix[success_index][week2_index] == 0
            assert result.matrix[failure_index][week1_index] == 0
            assert result.matrix[failure_index][week2_index] == 1
