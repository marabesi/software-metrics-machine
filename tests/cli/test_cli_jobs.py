import os
from unittest.mock import patch

import pytest
from requests import Response
from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.builders import as_json_string
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


class TestJobsCliCommands:

    @pytest.fixture(scope="class", autouse=True)
    def reset_mock_get(self):
        with patch("requests.get") as mock_get:
            mock_get.reset_mock()
            yield mock_get

    def test_can_run_fetch_jobs_command(self, cli):
        result = cli.invoke(main, ["pipelines", "fetch-jobs", "--help"])
        assert 0 == result.exit_code
        assert "Show this message and exit" in result.output

    def test_should_fetch_jobs_for_a_workflow(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        workflow_fetched = [
            {
                "id": 1,
                "path": "/workflows/build.yml",
                "status": "success",
                "created_at": "2023-10-01T12:00:00Z",
            },
        ]

        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflow_fetched
        )

        with patch("requests.get") as mock_get:
            fetch_jobs_fake_response = {
                "total_count": 1,
                "jobs": [
                    {
                        "id": 1,
                        "run_id": 1,
                        "workflow_name": "Node CI",
                        "run_attempt": 1,
                        "node_id": "CR_kwDOF2CqAc8AAAALeduliQ",
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
                                "name": "Set up job",
                                "status": "completed",
                                "conclusion": "success",
                                "number": 1,
                                "started_at": "2025-09-01T00:37:47Z",
                                "completed_at": "2025-09-01T00:37:48Z",
                            }
                        ],
                    }
                ],
            }
            response = Response()
            response._content = bytes(as_json_string(fetch_jobs_fake_response), "utf-8")
            response.status_code = 200

            mock_get.return_value = response

            result = cli.invoke(
                main,
                [
                    "pipelines",
                    "fetch-jobs",
                ],
            )

            assert "Loaded 1 runs" in result.output
            assert (
                "run 1 of 1 → fetching https://api.github.com/repos/fake/repo/actions/runs/1/jobs?per_page=100"
                in result.output
            )
            assert f" → Jobs written to {str(tmp_path)}" in result.output
