import pytest
from software_metrics_machine.apps.cli import main
from tests.builders import single_run

from tests.pipeline_builder import PipelineJobBuilder
from tests.builders import job_with_single_step_completed_successfully


class TestPipelineJobsSummaryCliCommands:

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

    @pytest.mark.parametrize(
        "jobs",
        [
            pytest.param(
                [
                    PipelineJobBuilder()
                    .with_id(1)
                    .with_run_id(1)
                    .with_started_at("2023-10-01T09:05:00Z")
                    .with_created_at("2023-10-01T09:05:00Z")
                    .with_completed_at("2023-10-01T09:10:00Z")
                    .with_steps([])
                    .build(),
                ],
                id="no steps",
            ),
        ],
    )
    def test_with_stored_data_summary(self, cli, jobs):
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-summary",
            ],
        )
        assert 0 == result.exit_code
        assert "Jobs summary" in result.output

    @pytest.mark.parametrize(
        "jobs_for_test, command, expected",
        [
            (
                job_with_single_step_completed_successfully,
                [
                    "pipelines",
                    "jobs-summary",
                    "--start-date",
                    "2021-09-01",
                    "--end-date",
                    "2026-09-01",
                ],
                "Unique job names: 1",
            ),
            (
                job_with_single_step_completed_successfully,
                [
                    "pipelines",
                    "jobs-summary",
                    "--start-date",
                    "2021-09-01",
                    "--end-date",
                    "2021-09-01",
                ],
                "No job executions available.",
            ),
        ],
    )
    def test_jobs_summary_with_data_available(
        self, cli, jobs_for_test, command, expected
    ):
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs_for_test)

        result = cli.runner.invoke(main, command)

        assert expected in result.output
