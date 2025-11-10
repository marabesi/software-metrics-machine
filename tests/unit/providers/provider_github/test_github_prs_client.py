import pytest
from unittest.mock import patch, MagicMock
from software_metrics_machine.providers.github.github_pr_client import GithubPrsClient
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.prs_builder import PullRequestBuilder
from tests.response_builder import build_http_successfull_response


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
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
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
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
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

    def test_fetch_a_pr_comments_with_page_set_to_100(self):
        def mocked_read_file_if_exists(file):
            if file == "prs.json":
                return as_json_string(
                    [
                        PullRequestBuilder()
                        .with_number(1164)
                        .with_created_at("2023-02-01T00:00:00Z")
                        .with_review_comments_url(
                            "https://api.github.com/repos/github/github-mcp-server/pulls/1164/comments"
                        )
                        .build(),
                    ]
                )
            if file == "prs_review_comments.json":
                return None
            raise FileNotFoundError(f"File {file} not found")

        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=mocked_read_file_if_exists,
            ),
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ) as mocked_store,
            patch("requests.get") as mock_get,
        ):
            mock_get.return_value = build_http_successfull_response([])

            github_client = GithubPrsClient(configuration=self.configuration)
            github_client.fetch_pr_comments(
                filters={"start_date": "2023-01-01", "end_date": "2023-03-01"}
            )

            mock_get.assert_called_once_with(
                "https://api.github.com/repos/github/github-mcp-server/pulls/1164/comments",
                headers=self.headers,
                params={
                    "per_page": "100",
                },
            )
            mocked_store.assert_called_once_with("prs_review_comments.json", [])

    @pytest.mark.parametrize(
        "raw_filters, params",
        [
            (
                "per_page=100",
                {
                    "per_page": "100",
                },
            ),
            (
                "per_page=20",
                {
                    "per_page": "20",
                },
            ),
        ],
    )
    def test_fetch_a_pr_comments(self, raw_filters, params):
        def mocked_read_file_if_exists(file):
            if file == "prs.json":
                return as_json_string(
                    [
                        PullRequestBuilder()
                        .with_number(1164)
                        .with_created_at("2023-02-01T00:00:00Z")
                        .with_review_comments_url(
                            "https://api.github.com/repos/github/github-mcp-server/pulls/1164/comments"
                        )
                        .build(),
                    ]
                )
            if file == "prs_review_comments.json":
                return None
            raise FileNotFoundError(f"File {file} not found")

        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=mocked_read_file_if_exists,
            ),
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ) as mocked_store,
            patch("requests.get") as mock_get,
        ):
            mock_response = MagicMock()
            mock_response.json.return_value = []
            mock_response.links = {}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            github_client = GithubPrsClient(configuration=self.configuration)
            github_client.fetch_pr_comments(
                filters={"start_date": "2023-01-01", "end_date": "2023-03-01"},
                raw_params=raw_filters,
            )

            mock_get.assert_called_once_with(
                "https://api.github.com/repos/github/github-mcp-server/pulls/1164/comments",
                headers=self.headers,
                params=params,
            )
            mocked_store.assert_called_once_with("prs_review_comments.json", [])
