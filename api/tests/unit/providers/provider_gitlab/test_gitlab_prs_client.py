import pytest
from unittest.mock import patch, MagicMock
from urllib.parse import quote_plus
from software_metrics_machine.providers.gitlab.gitlab_pr_client import GitlabPrsClient
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.prs_builder import PullRequestBuilder
from tests.prs_comment_builder import PullRequestCommentsBuilder
from tests.response_builder import build_http_successfull_response


class TestGitlabPrsClient:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.configuration = InMemoryConfiguration(".")
        self.client = GitlabPrsClient(configuration=self.configuration)
        self.encoded = quote_plus(self.configuration.github_repository)
        self.headers = {
            "Authorization": f"token {self.configuration.github_token}",
            "Accept": "application/json",
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

            self.client.fetch_prs(start_date="2023-01-01", end_date="2023-03-01")

            mock_read.assert_called_once_with("prs.json")
            mock_get.assert_called_once_with(
                f"https://gitlab.com/api/v4/projects/{self.encoded}/merge_requests",
                headers=self.headers,
                params={
                    "state": "all",
                    "per_page": 100,
                    "sort": "created",
                    "direction": "desc",
                },
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
                            "https://gitlab.com/api/v4/projects/1/merge_requests/1164/notes"
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

            client = GitlabPrsClient(configuration=self.configuration)
            client.fetch_pr_comments(
                filters={"start_date": "2023-01-01", "end_date": "2023-03-01"}
            )

            mock_get.assert_called_once_with(
                "https://gitlab.com/api/v4/projects/1/merge_requests/1164/notes",
                headers=self.headers,
                params={
                    "per_page": "100",
                },
            )
            mocked_store.assert_called_once_with("prs_review_comments.json", "[]")

    def test_if_prs_comments_exists_should_not_refetch(self):
        def mocked_read_file_if_exists(file):
            if file == "prs.json":
                return as_json_string(
                    [
                        PullRequestBuilder()
                        .with_number(1164)
                        .with_created_at("2023-02-01T00:00:00Z")
                        .with_review_comments_url(
                            "https://gitlab.com/api/v4/projects/1/merge_requests/1164/notes"
                        )
                        .build(),
                    ]
                )
            if file == "prs_review_comments.json":
                return as_json_string(
                    [PullRequestCommentsBuilder().with_body("Existing comment").build()]
                )
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

            client = GitlabPrsClient(configuration=self.configuration)
            client.fetch_pr_comments()

            mock_get.assert_not_called()
            mocked_store.assert_not_called()
