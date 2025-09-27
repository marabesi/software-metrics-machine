import pytest
from unittest.mock import patch, MagicMock
from providers.github.github_client import GithubClient
from tests.in_memory_configuration import InMemoryConfiguration


class TestGithubClient:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.configuration = InMemoryConfiguration(".")
        self.github_client = GithubClient(configuration=self.configuration)
        self.headers = {
            "Authorization": f"token {self.configuration.github_token}",
            "Accept": "application/vnd.github+json",
        }

    def test_fetch_prs(self):
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "infrastructure.base_repository.BaseRepository.store_file"
            ) as mocked_store,
            patch("requests.get") as mock_get,
        ):

            # Stub the read_file_if_exists method
            mock_read.return_value = None

            # Stub the requests.get method
            mock_response = MagicMock()
            mock_response.json.return_value = [
                {"created_at": "2023-01-01T00:00:00Z"},
                {"created_at": "2023-02-01T00:00:00Z"},
            ]
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.github_client.fetch_prs(start_date="2023-01-01", end_date="2023-03-01")

            mock_read.assert_called_once_with("prs.json")
            mock_get.assert_called_once_with(
                f"https://api.github.com/repos/{self.configuration.github_repository}/pulls?state=all&per_page=100&sort=created&direction=desc",  # noqa
                headers=self.headers,
            )
            mocked_store.assert_called_once()

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

            # Call the method
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
