from infrastructure.configuration.configuration import Configuration
from infrastructure.configuration.configuration_file_system_handler import (
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

    def test_reads_a_valid_configuration(self, tmp_path):
        configuration_file_system_handler = ConfigurationFileSystemHandler(tmp_path)
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            git_repository_location="/my/repo",
        )
        file = "my_conf.json"
        configuration_file_system_handler.store_file(file, configuration)

        read_configuration = configuration_file_system_handler.read_file_if_exists(file)
        assert read_configuration.git_provider == "github"
        assert read_configuration.github_token == "token"
        assert read_configuration.github_repository == "owner/repo"
        assert read_configuration.store_data == str(tmp_path)
        assert read_configuration.git_repository_location == "/my/repo"
