from infrastructure.configuration.configuration import Configuration
from infrastructure.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)

path = "."


class TestJsonConfigurationBased:

    def test_create_json_configuration_file(self):
        file_system_handler = ConfigurationFileSystemHandler(path)
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            store_data="/tmp",
            git_repository_location="/my/repo",
        )
        assert True is file_system_handler.store_file("my_conf.json", configuration)

    def test_reads_a_valid_configuration(self):
        file_system_handler = ConfigurationFileSystemHandler(path)
        configuration = Configuration(
            git_provider="github",
            github_token="token",
            github_repository="owner/repo",
            store_data="/tmp",
            git_repository_location="/my/repo",
        )
        file = "my_conf.json"
        file_system_handler.store_file(file, configuration)

        read_configuration = file_system_handler.read_file_if_exists(file)
        assert read_configuration.git_provider == "github"
        assert read_configuration.github_token == "token"
        assert read_configuration.github_repository == "owner/repo"
        assert read_configuration.store_data == "/tmp"
        assert read_configuration.git_repository_location == "/my/repo"
