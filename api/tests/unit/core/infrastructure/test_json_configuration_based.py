import pytest
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)


class TestJsonConfigurationBased:

    def test_create_json_configuration_file(sel, tmp_path):
        configuration_file_system_handler = ConfigurationFileSystemHandler(tmp_path)
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            git_repository_location="/my/repo",
        )
        assert True is configuration_file_system_handler.store_file(
            "my_conf.json", configuration
        )

    def test_by_defaulk_sets_dashboard_color(sel):
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            git_repository_location="/my/repo",
        )
        assert "#6b77e3" == configuration.dashboard_color

    def test_by_defaulk_sets_logging_to_critical(sel):
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            git_repository_location="/my/repo",
        )
        assert "CRITICAL" == configuration.logging_level

    def test_reads_a_valid_configuration(self, tmp_path):
        configuration_file_system_handler = ConfigurationFileSystemHandler(tmp_path)
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            git_repository_location="/my/repo",
            deployment_frequency_target_pipeline="my_pipeline",
            deployment_frequency_target_job="my_job",
            main_branch="main",
            dashboard_start_date="2023-01-01",
            dashboard_end_date="2023-01-01",
            dashboard_color="#000",
            logging_level="INFO",
        )
        file = "my_conf.json"
        configuration_file_system_handler.store_file(file, configuration)

        read_configuration = configuration_file_system_handler.read_file_if_exists(file)
        assert read_configuration.git_provider == "github"
        assert read_configuration.github_token == "token"
        assert read_configuration.github_repository == "owner/repo"
        assert read_configuration.store_data == str(tmp_path)
        assert read_configuration.git_repository_location == "/my/repo"
        assert read_configuration.deployment_frequency_target_pipeline == "my_pipeline"
        assert read_configuration.deployment_frequency_target_job == "my_job"
        assert read_configuration.main_branch == "main"
        assert read_configuration.dashboard_start_date == "2023-01-01"
        assert read_configuration.dashboard_end_date == "2023-01-01"
        assert read_configuration.dashboard_color == "#000"
        assert read_configuration.logging_level == "INFO"

    def test_configuration_accepts_gitlab_provider_with_repository(self):
        config = Configuration(
            git_provider="gitlab",
            github_token="token",
            github_repository="owner/repo",
            git_repository_location="/my/repo",
        )
        assert config.git_provider == "gitlab"

    def test_configuration_requires_repository_for_gitlab(self):
        with pytest.raises(ValueError):
            Configuration(
                git_provider="gitlab",
                github_token="token",
                git_repository_location="/my/repo",
            )

    def test_reads_jira_configuration(self, tmp_path):
        configuration_file_system_handler = ConfigurationFileSystemHandler(tmp_path)
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            git_repository_location="/my/repo",
            jira_url="https://example.atlassian.net",
            jira_email="test@example.com",
            jira_token="token123",
            jira_project="PRJ",
        )
        file = "my_conf.json"
        configuration_file_system_handler.store_file(file, configuration)

        read_configuration = configuration_file_system_handler.read_file_if_exists(file)
        assert read_configuration.jira_url == "https://example.atlassian.net"
        assert read_configuration.jira_email == "test@example.com"
        assert read_configuration.jira_token == "token123"
        assert read_configuration.jira_project == "PRJ"

    def test_reads_sonar_configuration(self, tmp_path):
        configuration_file_system_handler = ConfigurationFileSystemHandler(tmp_path)
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            git_repository_location="/my/repo",
            sonar_url="http://sonarqube:9000",
            sonar_token="sonar-token",
            sonar_project="SONAR_PROJECT",
        )
        file = "my_sonar_conf.json"
        configuration_file_system_handler.store_file(file, configuration)

        read_configuration = configuration_file_system_handler.read_file_if_exists(file)
        assert read_configuration.sonar_url == "http://sonarqube:9000"
        assert read_configuration.sonar_token == "sonar-token"
        assert read_configuration.sonar_project == "SONAR_PROJECT"
