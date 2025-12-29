import json
from typing import Any
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.file_system_handler import (
    FileSystemHandler,
)
from software_metrics_machine.core.infrastructure.logger import Logger


class ConfigurationFileSystemHandler:

    def __init__(self, path):
        self.default_dir = str(path)
        self.file_system_handler = FileSystemHandler(self.default_dir)

    def read_file_if_exists(self, filename: str) -> Configuration:
        contents = self.file_system_handler.read_file_if_exists(filename)
        if contents is None:
            raise FileNotFoundError(f"{filename} not found")
        data = json.loads(contents)
        return Configuration(
            git_provider=data.get("git_provider"),
            github_token=data.get("github_token"),
            github_repository=data.get("github_repository"),
            store_data=self.default_dir,
            git_repository_location=data.get("git_repository_location"),
            deployment_frequency_target_pipeline=data.get(
                "deployment_frequency_target_pipeline"
            ),
            deployment_frequency_target_job=data.get("deployment_frequency_target_job"),
            main_branch=data.get("main_branch"),
            dashboard_start_date=data.get("dashboard_start_date"),
            dashboard_end_date=data.get("dashboard_end_date"),
            dashboard_color=data.get("dashboard_color"),
            logging_level=data.get("logging_level"),
        )

    def store_file(self, file: str, data: Configuration) -> bool:
        logger = Logger(configuration=data).get_logger()
        logger.debug(f"Storing configuration to {file}")
        data.store_data = self.default_dir
        data_dict: dict[str, Any] = data.__dict__
        stringyfied_configuration = str(json.dumps(data_dict, indent=2))
        return self.file_system_handler.store_file(file, stringyfied_configuration)
