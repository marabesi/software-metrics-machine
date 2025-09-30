import pytest
from unittest.mock import call, patch, MagicMock
from providers.github.github_workflow_client import GithubWorkflowClient
from providers.github.workflows.repository_workflows import LoadWorkflows
from tests.in_memory_configuration import InMemoryConfiguration


class TestGithubWorkflowsClient:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.configuration = InMemoryConfiguration(".")
        self.github_client = GithubWorkflowClient(configuration=self.configuration)
        self.headers = {
            "Authorization": f"token {self.configuration.github_token}",
            "Accept": "application/vnd.github+json",
        }

    def test_fetch_workflows(self):
        with (
            patch("requests.get") as mock_get,
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=None,
            ) as mock_read,
            patch(
                "infrastructure.base_repository.BaseRepository.store_file"
            ) as mock_store,
        ):
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "total_count": 2,
                "workflow_runs": [],
            }
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.github_client.fetch_workflows(
                target_branch="main", start_date="2025-01-01", end_date="2025-12-31"
            )

            mock_read.assert_called_with("workflows.json")
            mock_get.assert_called_once_with(
                f"https://api.github.com/repos/{self.configuration.github_repository}/actions/runs?per_page=100",
                headers=self.headers,
                params={"branch": "main", "created": "2025-01-01..2025-12-31"},
            )
            mock_store.assert_called_once_with("workflows.json", [])

    def test_fetch_workflows_by_step(self):
        with (
            patch("requests.get") as mock_get,
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=None,
            ),
            patch("infrastructure.base_repository.BaseRepository.store_file"),
        ):
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "total_count": 1,
                "workflow_runs": [{"id": 1, "created_at": "2025-06-15T12:00:00Z"}],
            }
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.github_client.fetch_workflows(
                target_branch="main",
                start_date="2025-01-01",
                end_date="2025-01-02",
                step_by="day",
            )

            expected_calls = [
                call(
                    f"https://api.github.com/repos/{self.configuration.github_repository}/actions/runs?per_page=100",
                    headers={
                        "Authorization": "token fake_token",
                        "Accept": "application/vnd.github+json",
                    },
                    params={"branch": "main", "created": "2025-01-01..2025-01-01"},
                ),
                call(
                    "https://api.github.com/repos/fake/repo/actions/runs?per_page=100",
                    headers={
                        "Authorization": "token fake_token",
                        "Accept": "application/vnd.github+json",
                    },
                    params={"branch": "main", "created": "2025-01-02..2025-01-02"},
                ),
            ]
        mock_get.assert_has_calls(expected_calls, True)

    def test_fetch_jobs(self):
        def side_effect_repository_read(path):
            if path == "workflows.json":
                return '[{"id": 1, "created_at": "2025-06-15T12:00:00Z"}]'
            elif path == "jobs.json":
                return None
            return None

        with (
            patch("requests.get") as mock_get,
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                side_effect=side_effect_repository_read,
            ) as mock_read,
            patch("infrastructure.base_repository.BaseRepository.store_file"),
        ):

            mock_response = MagicMock()
            mock_response.json.return_value = {
                "total_count": 0,
                "jobs": [],
            }
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.github_client.fetch_jobs_for_workflows(
                LoadWorkflows(self.configuration),
                start_date="2025-01-01",
                end_date="2025-12-31",
            )

            mock_read.assert_called_with("jobs.json")
            mock_get.assert_called_once_with(
                f"https://api.github.com/repos/{self.configuration.github_repository}/actions/runs/1/jobs?per_page=100",
                headers=self.headers,
                params=None,
            )
