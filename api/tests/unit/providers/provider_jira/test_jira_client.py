import pytest
from unittest.mock import patch, MagicMock
from requests.auth import HTTPBasicAuth
from software_metrics_machine.providers.jira.jira_client import JiraIssuesClient
from tests.in_memory_configuration import InMemoryConfiguration


class TestJiraIssuesClient:
    """Unit tests for JiraIssuesClient authentication and API calls."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.configuration = InMemoryConfiguration(".")
        self.jira_client = JiraIssuesClient(configuration=self.configuration)
        self.headers = {
            "Accept": "application/json",
        }

    def test_jira_client_initialization_with_configuration(self):
        """Test that JiraIssuesClient initializes with proper configuration."""
        assert self.jira_client.jira_url == self.configuration.jira_url
        assert self.jira_client.jira_email == self.configuration.jira_email
        assert self.jira_client.jira_token == self.configuration.jira_token
        assert self.jira_client.jira_project == self.configuration.jira_project

    def test_jira_client_uses_http_basic_auth(self):
        """Test that JiraIssuesClient uses HTTPBasicAuth for authentication."""
        auth = self.jira_client.auth
        assert isinstance(auth, HTTPBasicAuth)
        assert auth.username == self.configuration.jira_email
        assert auth.password == self.configuration.jira_token

    def test_jira_client_headers_only_accept(self):
        """Test that headers only contain Accept header, not Authorization."""
        assert self.jira_client.HEADERS == {"Accept": "application/json"}
        assert "Authorization" not in self.jira_client.HEADERS
        assert "Bearer" not in str(self.jira_client.HEADERS)

    def test_fetch_issues_uses_auth_parameter(self):
        """Test that fetch_issues uses auth parameter instead of Authorization header."""
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
            patch("requests.get") as mock_get,
        ):
            mock_read.return_value = None  # Not cached

            mock_response = MagicMock()
            mock_response.json.return_value = {
                "issues": [],
                "total": 0,
                "startAt": 0,
                "maxResults": 50
            }
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.jira_client.fetch_issues(start_date="2025-01-01", end_date="2025-01-31")

            # Verify requests.get was called with auth parameter
            mock_get.assert_called_once()
            call_args = mock_get.call_args

            # Check that auth parameter was provided
            assert "auth" in call_args.kwargs
            assert isinstance(call_args.kwargs["auth"], HTTPBasicAuth)
            assert call_args.kwargs["auth"].username == self.configuration.jira_email
            assert call_args.kwargs["auth"].password == self.configuration.jira_token

            # Check that headers only contain Accept
            assert call_args.kwargs["headers"] == {"Accept": "application/json"}

    def test_fetch_issues_with_jql_query(self):
        """Test that fetch issues builds correct JQL query."""
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
            patch("requests.get") as mock_get,
        ):
            mock_read.return_value = None

            mock_response = MagicMock()
            mock_response.json.return_value = {
                "issues": [
                    {
                        "key": "PROJ-1",
                        "fields": {
                            "summary": "Test issue",
                            "created": "2025-01-15T10:00:00Z",
                            "issuetype": {"name": "Bug"},
                            "status": {"name": "Done"},
                        }
                    }
                ],
                "total": 1,
                "startAt": 0,
                "maxResults": 50
            }
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.jira_client.fetch_issues(
                start_date="2025-01-01",
                end_date="2025-01-31",
                issue_type="Bug",
                status="Done"
            )

            # Verify JQL query was built correctly
            call_args = mock_get.call_args
            jql_query = call_args.kwargs["params"]["jql"]

            assert 'project = "PROJ"' in jql_query
            assert 'created >= "2025-01-01"' in jql_query
            assert 'created <= "2025-01-31"' in jql_query
            assert 'type = "Bug"' in jql_query
            assert 'status = "Done"' in jql_query

    def test_fetch_issues_handles_pagination(self):
        """Test that fetch_issues handles pagination correctly with auth."""
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
            patch("requests.get") as mock_get,
        ):
            mock_read.return_value = None

            # First page response
            first_page = MagicMock()
            first_page.json.return_value = {
                "issues": [{"key": f"PROJ-{i}"} for i in range(1, 51)],
                "total": 75,
                "startAt": 0,
                "maxResults": 50
            }
            first_page.status_code = 200

            # Second page response
            second_page = MagicMock()
            second_page.json.return_value = {
                "issues": [{"key": f"PROJ-{i}"} for i in range(51, 76)],
                "total": 75,
                "startAt": 50,
                "maxResults": 50
            }
            second_page.status_code = 200

            mock_get.side_effect = [first_page, second_page]

            self.jira_client.fetch_issues(start_date="2025-01-01", end_date="2025-01-31")

            # Verify pagination calls used auth
            assert mock_get.call_count == 2
            for call_obj in mock_get.call_args_list:
                assert "auth" in call_obj.kwargs
                assert isinstance(call_obj.kwargs["auth"], HTTPBasicAuth)
                assert call_obj.kwargs["auth"].username == self.configuration.jira_email

    def test_fetch_issue_changelog_uses_auth(self):
        """Test that fetch_issue_changelog uses auth parameter."""
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
            patch("requests.get") as mock_get,
        ):
            # Mock different responses for different file reads
            def read_side_effect(filename):
                if filename == "issues_changelog.json":
                    return None  # Changelog doesn't exist yet
                elif filename == "issues.json":
                    return '[{"key": "PROJ-1"}]'  # Issues exist
                return None

            mock_read.side_effect = read_side_effect

            mock_response = MagicMock()
            mock_response.json.return_value = {
                "changelog": {
                    "histories": [
                        {
                            "created": "2025-01-01T10:00:00Z",
                            "items": [
                                {
                                    "field": "status",
                                    "fromString": "Open",
                                    "toString": "Done"
                                }
                            ]
                        }
                    ]
                }
            }
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.jira_client.fetch_issue_changes()

            # Verify auth was used in changelog fetch
            assert mock_get.called, "requests.get should have been called"
            call_args = mock_get.call_args
            assert "auth" in call_args.kwargs
            assert isinstance(call_args.kwargs["auth"], HTTPBasicAuth)
            assert call_args.kwargs["headers"] == {"Accept": "application/json"}

    def test_http_basic_auth_credentials_format(self):
        """Test that HTTPBasicAuth is properly created with email and token."""
        auth = self.jira_client.auth

        # HTTPBasicAuth should be initialized with username and password
        assert isinstance(auth, HTTPBasicAuth)
        assert auth.username == self.configuration.jira_email
        assert auth.password == self.configuration.jira_token

        # Verify credentials are not empty
        assert auth.username is not None
        assert auth.password is not None
        assert len(auth.username) > 0
        assert len(auth.password) > 0

    def test_fetch_issues_without_cache(self):
        """Test that fetch_issues works when no cache exists."""
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ) as mock_store,
            patch("requests.get") as mock_get,
        ):
            mock_read.return_value = None  # No cache

            mock_response = MagicMock()
            mock_response.json.return_value = {
                "issues": [
                    {
                        "key": "PROJ-1",
                        "fields": {"summary": "Test"}
                    }
                ],
                "total": 1,
                "startAt": 0,
                "maxResults": 50
            }
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.jira_client.fetch_issues()

            # Should call API when no cache
            mock_get.assert_called()
            mock_store.assert_called_once()

    def test_fetch_issues_with_force_flag(self):
        """Test that fetch_issues respects force flag to bypass cache."""
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.remove_file"
            ) as mock_remove,
            patch("requests.get") as mock_get,
        ):
            # Simulate cached data exists
            mock_read.return_value = '[{"key": "PROJ-1"}]'

            mock_response = MagicMock()
            mock_response.json.return_value = {
                "issues": [{"key": "PROJ-2"}],
                "total": 1,
                "startAt": 0,
                "maxResults": 50
            }
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.jira_client.fetch_issues(force=True)

            # With force=True, should remove cache and fetch fresh data
            mock_remove.assert_called_with("issues.json")

    def test_api_url_construction(self):
        """Test that API URLs are constructed correctly with /jql endpoint."""
        expected_search_url = f"{self.configuration.jira_url}/rest/api/3/search/jql"

        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ),
            patch("requests.get") as mock_get,
        ):
            mock_read.return_value = None

            mock_response = MagicMock()
            mock_response.json.return_value = {
                "issues": [],
                "total": 0
            }
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.jira_client.fetch_issues()

            # Verify correct API URL was used with /jql endpoint
            call_args = mock_get.call_args
            assert call_args[0][0] == expected_search_url
