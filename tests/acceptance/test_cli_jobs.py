from unittest.mock import patch

import pytest
from requests import Response
from software_metrics_machine.apps.cli import main

from tests.builders import as_json_string, single_run
from tests.github_workflow_response import (
    successfull_response_with_single_job,
    successfull_response_with_empty_jobs,
)
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.pipeline_builder import PipelineBuilder

job_with_single_step_completed_successfully = [
    {
        "id": "1",
        "run_id": "1",
        "workflow_name": "Node CI",
        "head_branch": "main",
        "run_url": "https://api.github.com/repos/marabesi/json-tool/actions/runs/17364448040",
        "run_attempt": 1,
        "node_id": "CR_kwDOF2CqAc8AAAALeduliQ",
        "head_sha": "d5fe25480e3f21d1fcb1eb34e523382d478ed950",
        "url": "https://api.github.com/repos/marabesi/json-tool/actions/jobs/49289078153",
        "html_url": "https://github.com/marabesi/json-tool/actions/runs/17364448040/job/49289078153",
        "status": "completed",
        "conclusion": "success",
        "created_at": "2025-09-01T00:37:44Z",
        "started_at": "2025-09-01T00:37:46Z",
        "completed_at": "2025-09-01T00:38:14Z",
        "name": "build",
        "steps": [
            {
                "number": 1,
                "name": "Set up job",
                "status": "completed",
                "conclusion": "success",
                "created_at": "2025-09-01T00:37:47Z",
                "started_at": "2025-09-01T00:37:47Z",
                "completed_at": "2025-09-01T00:37:48Z",
            },
        ],
    },
]


class TestJobsCliCommands:

    @pytest.fixture(scope="class", autouse=True)
    def reset_mock_get(self):
        with patch("requests.get") as mock_get:
            mock_get.reset_mock()
            yield mock_get

    def test_can_run_fetch_jobs_command(self, cli):
        result = cli.runner.invoke(main, ["pipelines", "jobs-fetch", "--help"])
        assert 0 == result.exit_code

    def test_show_help_message(self, cli):
        result = cli.runner.invoke(main, ["pipelines", "jobs-fetch", "--help"])
        assert "Show this message and exit" in result.output

    def test_should_fetch_jobs_for_a_workflow(self, cli, tmp_path):
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_pipelines_with(single_run())

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

            assert "Loaded 1 runs" in result.output
            assert (
                "run 1 of 1 → fetching https://api.github.com/repos/fake/repo/actions/runs/1/jobs?per_page=100"
                in result.output
            )
            assert f" → Jobs written to {str(tmp_path)}" in result.output

    def test_not_fetch_when_workflow_falls_off_the_start_date_and_end_date(self, cli):
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_pipelines_with(single_run())

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
        path_string = cli.data_stored_at
        single_run = [PipelineBuilder().with_created_at("2023-01-01T12:00:00Z").build()]
        FileHandlerForTesting(path_string).store_pipelines_with(single_run)

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
        "jobs",
        [
            [
                {
                    "id": "1",
                    "run_id": "1",
                    "started_at": "2023-10-01T09:05:00Z",
                    "created_at": "2023-10-01T09:05:00Z",
                    "completed_at": "2023-10-01T09:10:00Z",
                    "steps": [],
                },
            ],
        ],
    )
    def test_with_stored_data_summary(self, cli, jobs):
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_pipelines_with(single_run())
        FileHandlerForTesting(path_string).store_jobs_with(jobs)

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
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_pipelines_with(single_run())
        FileHandlerForTesting(path_string).store_jobs_with(jobs_for_test)

        result = cli.runner.invoke(main, command)

        assert expected in result.output

    def test_plot_jobs_by_status(self, cli):
        path_string = cli.data_stored_at
        jobs = [
            {
                "id": 105,
                "run_id": 1,
                "name": "Deploy",
                "conclusion": "success",
                "started_at": "2023-10-01T09:05:00Z",
                "completed_at": "2023-10-01T09:10:00Z",
            },
            {
                "id": 106,
                "run_id": 1,
                "name": "Build",
                "conclusion": "success",
                "started_at": "2023-10-01T09:05:00Z",
                "completed_at": "2023-10-01T09:10:00Z",
            },
        ]
        FileHandlerForTesting(path_string).store_pipelines_with(single_run())
        FileHandlerForTesting(path_string).store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "jobs-by-status",
                "--job-name",
                "Deploy",
            ],
        )
        assert 0 == result.exit_code
        assert "Found 1 workflow runs and 1 jobs after filtering" in result.output

    def test_plot_jobs_by_average_execution_time(self, cli):
        path_string = cli.data_stored_at
        jobs = [
            {
                "id": 105,
                "run_id": 1,
                "name": "Deploy",
                "conclusion": "success",
                "started_at": "2023-10-01T09:05:00Z",
                "completed_at": "2023-10-01T09:10:00Z",
            },
            {
                "id": 106,
                "run_id": 1,
                "name": "Build",
                "conclusion": "success",
                "started_at": "2023-10-01T09:05:00Z",
                "completed_at": "2023-10-01T09:10:00Z",
            },
        ]
        FileHandlerForTesting(path_string).store_pipelines_with(single_run())
        FileHandlerForTesting(path_string).store_jobs_with(jobs)

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
        path_string = cli.data_stored_at
        jobs = [
            {
                "id": 105,
                "run_id": 1,
                "name": "Deploy",
                "conclusion": "success",
                "started_at": "2023-10-01T09:05:00Z",
                "completed_at": "2023-10-01T09:10:00Z",
            },
            {
                "id": 106,
                "run_id": 1,
                "name": "Build",
                "conclusion": "success",
                "started_at": "2023-10-01T09:05:00Z",
                "completed_at": "2023-10-01T09:10:00Z",
            },
        ]
        FileHandlerForTesting(path_string).store_pipelines_with(single_run())
        FileHandlerForTesting(path_string).store_jobs_with(jobs)

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
