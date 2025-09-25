import pytest
from unittest.mock import patch, MagicMock
from providers.github.github_client import GithubClient
from infrastructure.configuration.configuration import Configuration


class InMemoryConfiguration(Configuration):
    def __init__(self):
        super().__init__(
            git_provider="github",
            github_token="fake_token",
            github_repository="fake/repo",
            store_data="in_memory",
            git_repository_location="in_memory",
        )


configuration = InMemoryConfiguration()

headers = {
    "Authorization": f"token {configuration.github_token}",
    "Accept": "application/vnd.github+json",
}


@pytest.fixture
def mock_configuration():
    return InMemoryConfiguration()


@pytest.fixture
def github_client(mock_configuration):
    return GithubClient(configuration=mock_configuration)


def test_fetch_prs(github_client):
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

        github_client.fetch_prs(start_date="2023-01-01", end_date="2023-03-01")

        mock_read.assert_called_once_with("prs.json")
        mock_get.assert_called_once_with(
            f"https://api.github.com/repos/{configuration.github_repository}/pulls?state=all&per_page=100&sort=created&direction=desc",  # noqa
            headers=headers,
        )
        mocked_store.assert_called_once()
