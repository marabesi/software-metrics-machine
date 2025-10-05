import os

import pytest
from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.builders import workflows_data
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


class TestWorkflowsRunsByCliCommands:

    def test_can_run_view_workflow_by(self, cli):
        result = cli.invoke(main, ["pipelines", "workflow-runs-by", "--help"])
        assert 0 == result.exit_code
        assert "Comma-separated key=value pairs to filter runs" in result.output

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                workflows_data(),
                {"target": "main", "count": 1},
            ),
            ([], {"target": "main", "count": 0}),
            (
                workflows_data(),
                {"target": "main,master", "count": 1},  # ignores second after comma
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

    def test_should_filter_by_workflow_path(self, cli, tmp_path):
        workflow_runs = workflows_data()
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
                "--workflow-path",
                "/workflows/tests.yml",
            ],
        )

        assert "Found 1 runs after filtering" in result.output

    def test_should_aggregate_data_by_week_by_default(self, cli, tmp_path):
        workflow_runs = workflows_data()
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
            ],
        )

        assert "Plotting data aggregated by week" in result.output

    def test_should_aggregate_data_by_month(self, cli, tmp_path):
        workflow_runs = workflows_data()
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
                "--aggregate-by",
                "month",
            ],
        )

        assert "Plotting data aggregated by month" in result.output

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                workflows_data(),
                {"event": "push", "count": 1},
            ),
            ([], {"event": "push", "count": 0}),
        ],
    )
    def test_should_filter_workflows_by_events(
        self, cli, tmp_path, workflow_runs, expected
    ):
        event = expected["event"]
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
                f"event={event}",
            ],
        )

        assert f"Found {expected_count} runs after filtering" in result.output

    @pytest.mark.parametrize(
        "command, expected",
        [
            (
                [
                    "pipelines",
                    "workflow-runs-by",
                    "--start-date",
                    "2023-10-01",
                    "--end-date",
                    "2023-10-01",
                    "--raw-filters",
                    "event=pull_request",
                ],
                {
                    "count": 0,
                },
            ),
            (
                [
                    "pipelines",
                    "workflow-runs-by",
                    "--start-date",
                    "2023-10-01",
                    "--end-date",
                    "2023-12-01",
                    "--include-defined-only",
                ],
                {
                    "count": 2,
                },
            ),
        ],
    )
    def test_should_filter_by_multiple_parameters(
        self, cli, tmp_path, command, expected
    ):
        expected_count = expected["count"]
        workflow_runs = workflows_data()
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        configuration = InMemoryConfiguration(path_string)
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", configuration
        )
        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflow_runs
        )

        result = cli.invoke(main, command)

        assert f"Found {expected_count} runs after filtering" in result.output
