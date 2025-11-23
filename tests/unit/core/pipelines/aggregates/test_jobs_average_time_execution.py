from unittest.mock import patch
from software_metrics_machine.core.pipelines.aggregates.jobs_average_time_execution import (
    JobsByAverageTimeExecution,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder


class TestJobsByAverageTimeExecution:

    def test_empty_jobs(self):
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
            jobs_avg = JobsByAverageTimeExecution(repository=repository)

            result = jobs_avg.main()

            assert result.runs == []
            assert result.jobs == []
            assert result.averages == []
            assert result.counts == {}

    def test_jobs_with_valid_execution_times(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-01T10:00:00Z")
                        .build(),
                    ]
                )
            if file == "jobs.json":
                return as_json_string(
                    [
                        PipelineJobBuilder()
                        .with_id(101)
                        .with_name("test")
                        .with_run_id(1)
                        .with_started_at("2023-01-01T10:00:00Z")
                        .with_completed_at("2023-01-01T10:05:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(102)
                        .with_name("test")
                        .with_run_id(1)
                        .with_started_at("2023-01-01T10:10:00Z")
                        .with_completed_at("2023-01-01T10:25:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(103)
                        .with_name("build")
                        .with_run_id(1)
                        .with_started_at("2023-01-01T10:00:00Z")
                        .with_completed_at("2023-01-01T10:10:00Z")
                        .build(),
                    ]
                )
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_avg = JobsByAverageTimeExecution(repository=repository)

            result = jobs_avg.main(top=10)

            assert result.counts["test"] == 2
            assert result.counts["build"] == 1

            assert len(result.averages) == 2

            job_names = [avg[0] for avg in result.averages]
            job_avgs = [avg[1] for avg in result.averages]

            assert "test" in job_names
            assert "build" in job_names

            test_idx = job_names.index("test")
            build_idx = job_names.index("build")

            assert abs(job_avgs[test_idx] - 10.0) < 0.01
            assert abs(job_avgs[build_idx] - 10.0) < 0.01

    def test_limits_return_to_top_limit_parameter(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-01T10:00:00Z")
                        .build(),
                    ]
                )
            if file == "jobs.json":
                return as_json_string(
                    [
                        PipelineJobBuilder()
                        .with_id(101)
                        .with_name("job1")
                        .with_run_id(1)
                        .with_started_at("2023-01-01T10:00:00Z")
                        .with_completed_at("2023-01-01T10:10:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(102)
                        .with_name("job2")
                        .with_run_id(1)
                        .with_started_at("2023-01-01T10:00:00Z")
                        .with_completed_at("2023-01-01T10:20:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(103)
                        .with_name("job3")
                        .with_run_id(1)
                        .with_started_at("2023-01-01T10:00:00Z")
                        .with_completed_at("2023-01-01T10:30:00Z")
                        .build(),
                    ]
                )
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_avg = JobsByAverageTimeExecution(repository=repository)

            result = jobs_avg.main(top=2)

            assert len(result.averages) == 2
            assert result.averages[0][0] == "job3"  # 30 minutes
            assert result.averages[1][0] == "job2"  # 20 minutes
