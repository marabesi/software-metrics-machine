import pytest
from unittest.mock import patch, MagicMock
from providers.github.github_pr_client import GithubPrsClient
from tests.in_memory_configuration import InMemoryConfiguration


class TestGithubPrsClient:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.configuration = InMemoryConfiguration(".")
        self.github_client = GithubPrsClient(configuration=self.configuration)
        self.headers = {
            "Authorization": f"token {self.configuration.github_token}",
            "Accept": "application/vnd.github+json",
        }

    def test_fetch_prs(self):
        with (
            patch(
                "core.infrastructure.base_repository.BaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "core.infrastructure.base_repository.BaseRepository.store_file"
            ) as mocked_store,
            patch("requests.get") as mock_get,
        ):
            mock_read.return_value = None

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
                f"https://api.github.com/repos/{self.configuration.github_repository}/pulls",
                headers=self.headers,
                params={
                    "state": "all",
                    "per_page": 100,
                    "sort": "created",
                    "direction": "desc",
                },
            )
            mocked_store.assert_called_once()

    @pytest.mark.parametrize(
        "filters, expected",
        [
            (
                "state=open",
                {
                    "state": "open",
                    "per_page": 100,
                    "sort": "created",
                    "direction": "desc",
                },
            ),
            (
                "per_page=20",
                {
                    "state": "all",
                    "per_page": 20,
                    "sort": "created",
                    "direction": "desc",
                },
            ),
            (
                "sort=popularity",
                {
                    "state": "all",
                    "per_page": 100,
                    "sort": "popularity",
                    "direction": "desc",
                },
            ),
            (
                "direction=asc",
                {
                    "state": "all",
                    "per_page": 100,
                    "sort": "created",
                    "direction": "asc",
                },
            ),
            (
                "base=main",
                {
                    "state": "all",
                    "per_page": 100,
                    "sort": "created",
                    "direction": "desc",
                    "base": "main",
                },
            ),
            (
                "state=open,base=main,per_page=1,sort=popularity,direction=asc",
                {
                    "state": "open",
                    "per_page": 1,
                    "sort": "popularity",
                    "direction": "asc",
                    "base": "main",
                },
            ),
        ],
    )
    def test_fetch_prs_with_filters(self, filters, expected):
        with (
            patch(
                "core.infrastructure.base_repository.BaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "core.infrastructure.base_repository.BaseRepository.store_file"
            ) as mocked_store,
            patch("requests.get") as mock_get,
        ):
            mock_read.return_value = None

            mock_response = MagicMock()
            mock_response.json.return_value = [
                {"created_at": "2023-01-01T00:00:00Z"},
                {"created_at": "2023-02-01T00:00:00Z"},
            ]
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.github_client.fetch_prs(raw_filters=filters)

            mock_read.assert_called_once_with("prs.json")
            mock_get.assert_called_once_with(
                f"https://api.github.com/repos/{self.configuration.github_repository}/pulls",
                headers=self.headers,
                params=expected,
            )
            mocked_store.assert_called_once()
