import pytest
from unittest.mock import call, patch, MagicMock
from urllib.parse import quote_plus
from software_metrics_machine.providers.gitlab.gitlab_pipelines_client import (
    GitlabPipelinesClient,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder
from tests.builders import as_json_string


class TestGitlabPipelinesClient:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.configuration = InMemoryConfiguration(".")
        self.client = GitlabPipelinesClient(configuration=self.configuration)
        self.encoded = quote_plus(self.configuration.github_repository)
        self.headers = {
            "Authorization": f"token {self.configuration.github_token}",
            "Accept": "application/json",
        }

    def test_fetch_pipelines(self):
        with (
            patch("requests.get") as mock_get,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=None,
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ) as mock_store,
        ):
            mock_response = MagicMock()
            mock_response.json.return_value = []
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.client.fetch_pipelines(
                target_branch="main", start_date="2025-01-01", end_date="2025-12-31"
            )

            mock_read.assert_called_with("workflows.json")
            mock_get.assert_called_once_with(
                f"https://gitlab.com/api/v4/projects/{self.encoded}/pipelines",
                headers=self.headers,
                params={"ref": "main", "updated_after": "2025-01-01", "updated_before": "2025-12-31"},
            )
            mock_store.assert_called_once()

    def test_fetch_workflows_by_hour_step(self):
        with (
            patch("requests.get") as mock_get,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=None,
            ),
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
        ):
            mock_response = MagicMock()
            mock_response.json.return_value = [{"id": 1, "created_at": "2025-06-15T12:00:00Z"}]
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.client.fetch_pipelines(
                target_branch="main",
                start_date="2025-01-01",
                end_date="2025-01-01",
                step_by="hour",
            )

            expected_calls = [
                call(
                    f"https://gitlab.com/api/v4/projects/{self.encoded}/pipelines",
                    headers=self.headers,
                    params={"ref": "main"},
                ),
            ]
        mock_get.assert_has_calls(expected_calls, False)

    def test_fetch_workflows_by_day_step(self):
        with (
            patch("requests.get") as mock_get,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=None,
            ),
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
        ):
            mock_response = MagicMock()
            mock_response.json.return_value = [{"id": 1, "created_at": "2025-06-15T12:00:00Z"}]
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.client.fetch_pipelines(
                target_branch="main",
                start_date="2025-01-01",
                end_date="2025-01-02",
                step_by="day",
            )

            expected_calls = [
                call(
                    f"https://gitlab.com/api/v4/projects/{self.encoded}/pipelines",
                    headers=self.headers,
                    params={"ref": "main"},
                ),
                call(
                    f"https://gitlab.com/api/v4/projects/{self.encoded}/pipelines",
                    headers=self.headers,
                    params={"ref": "main"},
                ),
            ]
        mock_get.assert_has_calls(expected_calls, True)

    def test_fetch_jobs(self):
        def side_effect_repository_read(path):
            if path == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_created_at("2025-06-15T12:00:00Z")
                        .build()
                    ]
                )
            elif path == "jobs.json":
                return None
            return None

        with (
            patch("requests.get") as mock_get,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=side_effect_repository_read,
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
        ):

            mock_response = MagicMock()
            mock_response.json.return_value = []
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.client.fetch_jobs_for_pipelines(
                PipelinesRepository(self.configuration),
                start_date="2025-01-01",
                end_date="2025-12-31",
            )

            mock_read.assert_called_with("jobs.json")
            mock_get.assert_called_once_with(
                f"https://gitlab.com/api/v4/projects/{self.encoded}/pipelines/1/jobs",
                headers=self.headers,
                params=None,
            )
