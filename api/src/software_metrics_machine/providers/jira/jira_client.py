from datetime import datetime, timezone
from software_metrics_machine.core.infrastructure.pandas import pd
import requests
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from software_metrics_machine.core.infrastructure.json import as_json_string


class JiraRepository(FileSystemBaseRepository):
    def __init__(self, configuration: Configuration):
        super().__init__(configuration=configuration, target_subfolder="jira")


class JiraIssuesClient:
    """
    Client for fetching issues from Jira.
    
    This client handles authentication and data fetching from Jira API.
    It stores fetched data locally for further analysis.
    """

    def __init__(self, configuration: Configuration):
        self.jira_url = configuration.jira_url
        self.jira_token = configuration.jira_token
        self.jira_project = configuration.jira_project
        self.jira_repository = JiraRepository(configuration=configuration)
        self.logger = Logger(configuration=configuration).get_logger()
        self.configuration = configuration

        # Setup headers for authentication
        self.HEADERS = {
            "Authorization": f"Bearer {self.jira_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def fetch_issues(
        self,
        start_date=None,
        end_date=None,
        months=1,
        force=False,
        raw_filters=None,
        issue_type=None,
        status=None,
    ):
        """
        Fetch issues from Jira.
        
        Args:
            start_date: Start date for filtering issues (ISO 8601 format)
            end_date: End date for filtering issues (ISO 8601 format)
            months: Number of months back to fetch (default: 1)
            force: Force re-fetching issues even if already fetched
            raw_filters: Additional filters in format key=value,key2=value2
            issue_type: Filter by issue type (e.g., Bug, Story, Task)
            status: Filter by status (e.g., Open, In Progress, Done)
        """
        issues_json_path = "issues.json"

        if force:
            print("Force re-fetching issues even if already fetched")
            self.jira_repository.remove_file(issues_json_path)

        contents = self.jira_repository.read_file_if_exists(issues_json_path)
        if contents is not None:
            print(f"Issues file already exists. Loading issues from {issues_json_path}")
            return

        params = self.jira_repository.parse_raw_filters(raw_filters)

        if not start_date or not end_date:
            print(
                f"No start_date or end_date provided. Defaulting to the last {months} month(s)."
            )
            end_date = datetime.now(timezone.utc)
            start_date = end_date - pd.DateOffset(months=months)
            start_date = start_date.to_pydatetime()
            start_date = str(start_date)
            end_date = str(end_date)

        if start_date and end_date:
            try:
                start_date = datetime.fromisoformat(start_date).replace(
                    tzinfo=timezone.utc
                )
                end_date = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
            except ValueError:
                raise ValueError("Dates must be in ISO format: YYYY-MM-DD")

        self.logger.info(
            f"Fetching issues from Jira project {self.jira_project} "
            f"from {start_date.date()} to {end_date.date()}"
        )

        # Build JQL query
        jql_query = self.__build_jql_query(
            start_date=start_date,
            end_date=end_date,
            issue_type=issue_type,
            status=status,
            additional_filters=params,
        )

        issues = self.__fetch_all_issues(jql_query)

        self.jira_repository.store_file(issues_json_path, as_json_string(issues))

    def fetch_issue_changes(self, force=False):
        """
        Fetch issue change history/changelog for issues.
        
        This method retrieves changelog data for all previously fetched issues,
        which can be useful for analyzing issue state transitions and timelines.
        """
        issues_json_path = "issues.json"
        changelog_json_path = "issues_changelog.json"

        if force:
            print("Force re-fetching issue changelogs")
            self.jira_repository.remove_file(changelog_json_path)

        contents = self.jira_repository.read_file_if_exists(changelog_json_path)
        if contents is not None:
            print(
                f"Changelog file already exists. Loading from {changelog_json_path}"
            )
            return

        # Read existing issues
        issues_content = self.jira_repository.read_file_if_exists(issues_json_path)
        if issues_content is None:
            raise ValueError(
                f"No issues found. Run fetch_issues first to get issues from {issues_json_path}"
            )

        import json

        issues = json.loads(issues_content)
        changelogs = []

        for issue in issues:
            issue_key = issue.get("key")
            if issue_key:
                self.logger.info(f"Fetching changelog for {issue_key}")
                changelog = self.__fetch_issue_changelog(issue_key)
                if changelog:
                    changelogs.append(
                        {
                            "key": issue_key,
                            "changelog": changelog,
                        }
                    )

        self.jira_repository.store_file(changelog_json_path, as_json_string(changelogs))

    def fetch_issue_comments(self, force=False):
        """
        Fetch comments for all issues.
        """
        issues_json_path = "issues.json"
        comments_json_path = "issues_comments.json"

        if force:
            print("Force re-fetching issue comments")
            self.jira_repository.remove_file(comments_json_path)

        contents = self.jira_repository.read_file_if_exists(comments_json_path)
        if contents is not None:
            print(
                f"Comments file already exists. Loading from {comments_json_path}"
            )
            return

        # Read existing issues
        issues_content = self.jira_repository.read_file_if_exists(issues_json_path)
        if issues_content is None:
            raise ValueError(
                f"No issues found. Run fetch_issues first to get issues from {issues_json_path}"
            )

        import json

        issues = json.loads(issues_content)
        all_comments = []

        for issue in issues:
            issue_key = issue.get("key")
            if issue_key:
                self.logger.info(f"Fetching comments for {issue_key}")
                comments = issue.get("fields", {}).get("comment", {}).get("comments", [])
                for comment in comments:
                    all_comments.append(
                        {
                            "issueKey": issue_key,
                            "comment": comment,
                        }
                    )

        self.jira_repository.store_file(comments_json_path, as_json_string(all_comments))

    def __build_jql_query(
        self,
        start_date=None,
        end_date=None,
        issue_type=None,
        status=None,
        additional_filters=None,
    ):
        """Build a JQL query based on filters."""
        conditions = []

        # Add project filter
        conditions.append(f'project = "{self.jira_project}"')

        # Add date filters
        if start_date:
            start_str = start_date.strftime("%Y-%m-%d")
            conditions.append(f'created >= "{start_str}"')

        if end_date:
            end_str = end_date.strftime("%Y-%m-%d")
            conditions.append(f'created <= "{end_str}"')

        # Add issue type filter
        if issue_type:
            conditions.append(f'type = "{issue_type}"')

        # Add status filter
        if status:
            conditions.append(f'status = "{status}"')

        # Add additional filters from params
        if additional_filters:
            for key, value in additional_filters.items():
                if key not in ["issue_type", "status"]:
                    conditions.append(f'{key} = "{value}"')

        jql = " AND ".join(conditions)
        self.logger.debug(f"Built JQL query: {jql}")
        return jql

    def __fetch_all_issues(self, jql_query, max_results=50):
        """Fetch all issues using pagination."""
        issues = []
        start_at = 0
        total = None

        url = f"{self.jira_url}/rest/api/3/search"

        while total is None or start_at < total:
            print(f"  → fetching issues (offset: {start_at})")

            params = {
                "jql": jql_query,
                "startAt": start_at,
                "maxResults": max_results,
                "expand": "changelog",
            }

            try:
                response = requests.get(
                    url,
                    headers=self.HEADERS,
                    params=params,
                    timeout=30,
                )
                response.raise_for_status()
                data = response.json()

                issues.extend(data.get("issues", []))
                total = data.get("total", 0)
                start_at += max_results

                self.logger.info(
                    f"Fetched {len(issues)}/{total} issues so far"
                )

            except requests.exceptions.RequestException as e:
                self.logger.error(f"Error fetching issues: {str(e)}")
                raise

        return issues

    def __fetch_issue_changelog(self, issue_key):
        """Fetch changelog for a specific issue."""
        url = f"{self.jira_url}/rest/api/3/issues/{issue_key}"

        try:
            response = requests.get(
                url,
                headers=self.HEADERS,
                params={"expand": "changelog"},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            return data.get("changelog", {}).get("histories", [])

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error fetching changelog for {issue_key}: {str(e)}")
            return None
