import os

import pytest
from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


class TestWorkflowsCliCommands:

    def test_can_run_fetch_workflows_command(self, cli):
        result = cli.invoke(main, ["pipelines", "--help"])
        assert 0 == result.exit_code
        assert "Show this message and exit" in result.output
        assert "" == result.stderr

    def test_can_run_view_workflow_by(self, cli):
        result = cli.invoke(main, ["pipelines", "workflow-runs-by", "--help"])
        assert 0 == result.exit_code
        assert "Comma-separated key=value pairs to filter runs" in result.output

    def test_should_fetch_workflow_data_between_dates_date_by_date(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        configuration = InMemoryConfiguration(path_string)
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", configuration
        )

        result = cli.invoke(
            main,
            [
                "pipelines",
                "fetch",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-01-02",
                "--step-by",
                "day",
                "--help",
            ],
        )

        assert "Step by (e.g., day, month)" in result.output

    def test_should_fetch_workflow_data_between_dates(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        configuration = InMemoryConfiguration(path_string)
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", configuration
        )

        result = cli.invoke(
            main,
            [
                "pipelines",
                "fetch",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-01-31",
            ],
        )

        assert (
            f"Fetching workflow runs for {configuration.github_repository} 2023-01-01 to 2023-01-31 (it will return 1000 runs at max)"  # noqa
            in result.output
        )
        assert (
            "fetching https://api.github.com/repos/fake/repo/actions/runs?per_page=100 with params: {'created': '2023-01-01..2023-01-31'}"  # noqa
            in result.output
        )

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                [
                    {
                        "id": 1,
                        "path": "/workflows/build.yml",
                        "status": "success",
                        "created_at": "2023-10-01T12:00:00Z",
                        "head_branch": "main",
                    },
                    {
                        "id": 2,
                        "path": "/workflows/build.yml",
                        "status": "success",
                        "created_at": "2023-10-01T12:00:00Z",
                        "head_branch": "master",
                    },
                ],
                {"target": "main", "count": 1},
            ),
            ([], {"target": "main", "count": 0}),
            (
                [
                    {
                        "id": 1,
                        "path": "/workflows/build.yml",
                        "status": "success",
                        "created_at": "2023-10-01T12:00:00Z",
                        "head_branch": "main",
                    },
                    {
                        "id": 2,
                        "path": "/workflows/build.yml",
                        "status": "success",
                        "created_at": "2023-10-01T12:00:00Z",
                        "head_branch": "master",
                    },
                ],
                {"target": "main,master", "count": 2},
            ),
        ],
    )
    def test_should_filter_workflows_by_target_branch(
        self, cli, tmp_path, workflow_runs, expected
    ):
        target = expected["target"]
        expected_count = expected["count"]

        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        configuration = InMemoryConfiguration(path_string)
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", configuration
        )
        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflow_runs
        )

        result = cli.invoke(
            main,
            [
                "pipelines",
                "workflow-runs-by",
                "--start-date",
                "2023-10-01",
                "--end-date",
                "2023-10-01",
                "--raw-filters",
                f"target_branch={target}",
            ],
        )

        assert f"Found {expected_count} runs after filtering" in result.output

    def test_deployment_frequency_by_job(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        single_deployment_frequency = [
            {
                "id": 1,
                "path": "/workflows/build.yml",
                "status": "success",
                "created_at": "2023-10-01T12:00:00Z",
            },
        ]
        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", single_deployment_frequency
        )

        FileHandlerForTesting(path_string).store_json_file(
            "jobs.json",
            [
                {
                    "id": 105,
                    "run_id": 1,
                    "name": "Deploy",
                    "conclusion": "success",
                    "started_at": "2023-10-01T09:05:00Z",
                    "completed_at": "2023-10-01T09:10:00Z",
                },
            ],
        )

        result = cli.invoke(
            main,
            [
                "pipelines",
                "deployment-frequency",
                "--job-name",
                "Deploy",
                "--out-file",
                "deployment_frequency_out.png",
            ],
        )
        assert 0 == result.exit_code
        assert "Loaded 1 runs" in result.output

    @pytest.mark.parametrize(
        "workflows",
        [
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "success",
                    "created_at": "2023-10-01T12:00:00Z",
                },
            ],
            [],
        ],
    )
    def test_summary_workflows(self, cli, tmp_path, workflows):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        FileHandlerForTesting(path_string).store_json_file("workflows.json", workflows)

        result = cli.invoke(
            main,
            [
                "pipelines",
                "summary",
            ],
        )
        assert 0 == result.exit_code
