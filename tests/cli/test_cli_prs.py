import os
import pytest
from apps.cli.main import main
from unittest.mock import patch

from infrastructure.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


class TestCliCommands:

    @pytest.fixture(scope="class", autouse=True)
    def reset_mock_get(self):
        with patch("requests.get") as mock_get:
            mock_get.reset_mock()
            yield mock_get

    def test_can_run_fetch_prs_command(self, cli):
        result = cli.invoke(main, ["--help"])
        assert result.exit_code == 0
        assert "Show this message and exit" in result.output

    def test_fetch_prs_from_last_three_months(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SSM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        with patch("requests.get") as mock_get:
            fetch_prs_fake_response = [
                {
                    "created_at": "2011-01-26T19:01:12Z",
                    "closed_at": "2011-01-26T19:01:12Z",
                }
            ]

            mock_get.return_value.json.return_value = fetch_prs_fake_response
            mock_get.return_value.status_code = 200

            result = cli.invoke(
                main,
                [
                    "prs",
                    "fetch",
                    "--months",
                    "3",
                ],
            )
            mock_get.assert_called_once()
            assert f"Data written to {str(tmp_path)}" in result.output

    def test_with_stored_data_plot_prs_by_author(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SSM_STORE_DATA_AT"] = path_string

        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )
        pull_requests_data = [
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            },
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            },
        ]
        FileHandlerForTesting(path_string).store_file("prs.json", pull_requests_data)

        result = cli.invoke(
            main,
            [
                "prs",
                "by-author",
                "--top",
                "5",
                "--labels",
                "bug",
                "--out-file",
                "output.png",
            ],
        )
        assert result.exit_code == 0
        assert "Loaded 2 PRs" in result.output

    def test_with_stored_data_review_time_by_author(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SSM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )
        pull_requests_data = [
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            },
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            },
        ]
        FileHandlerForTesting(path_string).store_file("prs.json", pull_requests_data)

        result = cli.invoke(
            main,
            [
                "prs",
                "review-time-by-author",
                "--top",
                "5",
                "--labels",
                "enhancement",
                "--out-file",
                "output.png",
            ],
        )
        assert result.exit_code == 0
        assert "Loaded 2 PRs" in result.output

    def test_with_stored_data__summary(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SSM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )
        pull_requests_data = [
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            },
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            },
        ]
        FileHandlerForTesting(path_string).store_file("prs.json", pull_requests_data)

        result = cli.invoke(
            main,
            [
                "prs",
                "summary",
                "--csv",
                "data.csv",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-12-31",
                "--output",
                "text",
            ],
        )
        assert result.exit_code == 0
        assert "Loaded 2 PRs" in result.output

    def test_with_stored_data_plot_average_prs_open_by(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SSM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )
        pull_requests_data = [
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            },
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            },
        ]
        FileHandlerForTesting(path_string).store_file("prs.json", pull_requests_data)

        result = cli.invoke(
            main,
            [
                "prs",
                "average-open-by",
                "--out-file",
                "output.png",
                "--author",
                "john",
                "--labels",
                "bug",
                "--aggregate-by",
                "month",
            ],
        )
        assert result.exit_code == 0
        assert "Loaded 2 PRs" in result.output
        assert "Filtered PRs count: 2" in result.output
