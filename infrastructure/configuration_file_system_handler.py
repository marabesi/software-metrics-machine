import json
from infrastructure.configuration.configuration import Configuration
from infrastructure.file_system_handler import FileSystemHandler


class ConfigurationFileSystemHandler:

    def __init__(self, path):
        self.default_dir = path
        self.file_system_handler = FileSystemHandler(self.default_dir)

    def read_file_if_exists(self, filename: str) -> Configuration:
        contents = self.file_system_handler.read_file_if_exists(filename)
        data = json.loads(contents)
        return Configuration(
            git_provider=data.get("git_provider"),
            github_token=data.get("github_token"),
            github_repository=data.get("github_repository"),
            store_data=data.get("store_data"),
            git_repository_location=data.get("git_repository_location"),
        )

    def store_file(self, file: str, data: Configuration) -> bool:
        print(f"Storing configuration to {file}")
        data = data.__dict__
        return self.file_system_handler.store_file(file, data)
