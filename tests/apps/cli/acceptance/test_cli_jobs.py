from unittest.mock import patch

import pytest
from requests import Response
from software_metrics_machine.apps.cli import main

from tests.builders import as_json_string, single_run
from tests.github_workflow_response import (
    successfull_response_with_single_job,
    successfull_response_with_empty_jobs,
)
from tests.pipeline_builder import (
    PipelineBuilder,
    PipelineJobBuilder,
)


class TestJobsCliCommands:

    @pytest.fixture(scope="class", autouse=True)
    def reset_mock_get(self):
        with patch("requests.get") as mock_get:
            mock_get.reset_mock()
            yield mock_get

    def test_should_fetch_jobs_for_a_workflow(self, cli, tmp_path):
        cli.storage.store_pipelines_with(single_run())

        with patch("requests.get") as mock_get:
            response = Response()
            response._content = bytes(
                as_json_string(successfull_response_with_single_job()), "utf-8"
            )
            response.status_code = 200

            mock_get.return_value = response

            result = cli.runner.invoke(
                main,
                [
                    "pipelines",
                    "jobs-fetch",
                ],
            )

            assert (
                "run 1 of 1 → fetching https://api.github.com/repos/fake/repo/actions/runs/1/jobs?per_page=100"
                in result.output
            )
            assert f" → Jobs written to {str(tmp_path)}" in result.output

    def test_not_fetch_when_workflow_falls_off_the_start_date_and_end_date(self, cli):
        cli.storage.store_pipelines_with(single_run())

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-fetch",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-01-31",
            ],
        )

        assert (
            "No runs to fetch jobs for in the date range 2023-01-01 to 2023-01-31"
            in result.output
        )

    def test_fetch_jobs_based_on_raw_filters(self, cli):
        single_run = [PipelineBuilder().with_created_at("2023-01-01T12:00:00Z").build()]
        cli.storage.store_pipelines_with(single_run)

        with patch("requests.get") as mock_get:
            response = Response()
            response._content = bytes(
                as_json_string(successfull_response_with_empty_jobs()), "utf-8"
            )
            response.status_code = 200

            mock_get.return_value = response

            cli.runner.invoke(
                main,
                [
                    "pipelines",
                    "jobs-fetch",
                    "--start-date",
                    "2023-01-01",
                    "--end-date",
                    "2023-01-31",
                    "--raw-filters",
                    "owner=random",
                ],
            )

            mock_get.assert_called_once()
            mock_get.assert_called_with(
                "https://api.github.com/repos/fake/repo/actions/runs/1/jobs?per_page=100",
                headers={
                    "Authorization": "token fake_token",
                    "Accept": "application/vnd.github+json",
                },
                params={"owner": "random"},
            )

    @pytest.mark.parametrize(
        "command, jobs, expected",
        [
            pytest.param(
                [
                    "pipelines",
                    "jobs-by-status",
                    "--job-name",
                    "Deploy",
                ],
                [
                    PipelineJobBuilder()
                    .with_id(105)
                    .with_run_id(1)
                    .with_name("Deploy")
                    .with_conclusion("success")
                    .with_started_at("2023-10-01T09:05:00Z")
                    .with_completed_at("2023-10-01T09:10:00Z")
                    .build(),
                    PipelineJobBuilder()
                    .with_id(106)
                    .with_run_id(1)
                    .with_name("Build")
                    .with_started_at("2023-10-01T09:05:00Z")
                    .with_completed_at("2023-10-01T09:10:00Z")
                    .build(),
                ],
                "Found 1 workflow runs and 1 jobs after filtering",
            ),
            # pytest.param(
            #     [
            #         "pipelines",
            #         "jobs-by-status",
            #         "--job-name",
            #         "Deploy",
            #         "--raw-filters",
            #         "status=in_progress",
            #     ],
            #     [
            #         PipelineJobBuilder()
            #         .with_id(105)
            #         .with_run_id(1)
            #         .with_name("Deploy")
            #         .with_started_at("2023-10-01T09:05:00Z")
            #         .with_completed_at("2023-10-01T09:10:00Z")
            #         .build(),
            #         PipelineJobBuilder()
            #         .with_id(106)
            #         .with_run_id(1)
            #         .with_name("Build")
            #         .with_conclusion("success")
            #         .with_started_at("2023-10-01T09:05:00Z")
            #         .with_completed_at("2023-10-01T09:10:00Z")
            #         .build(),
            #     ],
            #     "Found 1 workflow runs and 1 jobs after filtering"
            # )
        ],
    )
    def test_plot_jobs_by_status(self, cli, command, jobs, expected):
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(main, command)

        assert expected in result.output

    @pytest.mark.parametrize(
        "jobs_with_conclusion, expected",
        [
            (
                {
                    "jobs": [
                        PipelineJobBuilder()
                        .with_id(105)
                        .with_run_id(1)
                        .with_name("Deploy")
                        .with_conclusion("success")
                        .with_started_at("2023-10-01T09:05:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build(),
                    ],
                    "job_name": "Deploy",
                },
                "success      1",
            ),
            (
                {
                    "jobs": [
                        PipelineJobBuilder()
                        .with_id(101)
                        .with_run_id(1)
                        .with_name("Build")
                        .with_conclusion("failure")
                        .with_started_at("2023-10-01T09:04:00Z")
                        .with_completed_at("2023-10-01T09:05:00Z")
                        .build(),
                    ],
                    "job_name": "Build",
                },
                "failure      1",
            ),
        ],
    )
    def test_print_jobs_by_status(self, cli, jobs_with_conclusion, expected):
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs_with_conclusion["jobs"])

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-by-status",
                "--job-name",
                jobs_with_conclusion["job_name"],
            ],
        )
        assert expected in result.output

    def test_plot_jobs_by_average_execution_time(self, cli):
        jobs = [
            PipelineJobBuilder()
            .with_id(105)
            .with_run_id(1)
            .with_name("Deploy")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
            PipelineJobBuilder()
            .with_id(106)
            .with_run_id(1)
            .with_name("Build")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
        ]
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-by-execution-time",
                "--job-name",
                "Deploy",
            ],
        )
        assert 0 == result.exit_code
        assert "Found 1 workflow runs and 1 jobs after filtering" in result.output

    def test_plot_jobs_by_average_execution_time_by_raw_filters(self, cli):
        jobs = [
            PipelineJobBuilder()
            .with_id(105)
            .with_run_id(1)
            .with_name("Deploy")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
            PipelineJobBuilder()
            .with_id(106)
            .with_run_id(1)
            .with_name("Build")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
        ]
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-by-execution-time",
                "--pipeline-raw-filters",
                "status=in_progress",
            ],
        )
        assert 0 == result.exit_code
        assert "Found 0 workflow runs and 0 jobs after filtering" in result.output

    @pytest.mark.parametrize(
        "jobs, expected",
        [
            (
                [
                    PipelineJobBuilder()
                    .with_id(105)
                    .with_run_id(1)
                    .with_name("Deploy")
                    .with_conclusion("success")
                    .with_started_at("2023-10-01T09:05:00Z")
                    .with_completed_at("2023-10-01T09:10:00Z")
                    .build(),
                ],
                "Deploy  5.0",
            ),
            (
                [
                    PipelineJobBuilder()
                    .with_id(105)
                    .with_run_id(1)
                    .with_name("Build")
                    .with_conclusion("success")
                    .with_started_at("2023-10-01T09:04:00Z")
                    .with_completed_at("2023-10-01T09:05:00Z")
                    .build(),
                ],
                "Build  1.0",
            ),
        ],
    )
    def test_print_pipelines_by_execution_time_in_minutes(self, cli, jobs, expected):
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-by-execution-time",
            ],
        )
        assert expected in result.output

    def test_should_specify_the_metric_to_calculate(self, cli):
        jobs = [
            PipelineJobBuilder()
            .with_id(105)
            .with_run_id(1)
            .with_name("Deploy")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
            PipelineJobBuilder()
            .with_id(106)
            .with_run_id(1)
            .with_name("Deploy")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
        ]
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-by-execution-time",
                "--metric",
                "sum",
            ],
        )
        assert "Deploy  10.0" in result.output
