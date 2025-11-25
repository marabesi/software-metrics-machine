from software_metrics_machine.apps.cli import main
from tests.builders import single_run

from tests.pipeline_builder import PipelineJobBuilder


class TestPipelineJobsSummaryCliCommands:

    def test_summary_jobs_pipeline_is_defined(self, cli):
        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-summary",
            ],
        )
        assert 0 == result.exit_code

    def test_summary_pipeline_no_jobs(self, cli):
        cli.storage.store_pipelines_with(single_run())

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-summary",
            ],
        )
        assert "No job executions available." in result.output

    def test_summary_pipeline_with_one_job(self, cli):
        cli.storage.store_pipelines_with(single_run())

        job1 = (
            PipelineJobBuilder()
            .with_id(1)
            .with_run_id(1)
            .with_name("build")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_created_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build()
        )
        job2 = (
            PipelineJobBuilder()
            .with_id(2)
            .with_run_id(1)
            .with_name("build")
            .with_started_at("2024-10-01T09:05:00Z")
            .with_created_at("2024-10-01T09:05:00Z")
            .with_completed_at("2024-10-01T09:10:00Z")
            .build()
        )

        cli.storage.store_jobs_with([job1, job2])

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-summary",
            ],
        )

        assert 0 == result.exit_code
        assert "Jobs summary" in result.output
        assert "Total job executions: 2" in result.output

        assert "Conclusions:" in result.output
        assert "success  : 2" in result.output
        assert "Unique job names: 1" in result.output

        assert "Executions by job name:" in result.output
        assert "2  build" in result.output

        assert "First job:" in result.output
        assert "Created at: 01 Oct 2023, 09:05" in result.output
        assert "Started at: 01 Oct 2023, 09:05" in result.output
        assert "Completed/Updated at: 01 Oct 2023, 09:10" in result.output

        assert "Last job:" in result.output
        assert "Created at: 01 Oct 2024, 09:05" in result.output
        assert "Started at: 01 Oct 2024, 09:05" in result.output
        assert "Completed/Updated at: 01 Oct 2024, 09:10" in result.output
