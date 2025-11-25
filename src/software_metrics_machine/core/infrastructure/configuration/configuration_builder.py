import os
from enum import Enum
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from software_metrics_machine.core.infrastructure.logger import Logger


class Driver(Enum):
    CLI = "CLI"
    JSON = "JSON"
    HTTP = "HTTP"


class ConfigurationBuilder:

    def __init__(
        self,
        driver: Driver,
    ):
        self.driver = driver

    def build(self) -> Configuration:
        """
        Build and return a Configuration object.

        :return: A Configuration instance.
        """
        if self.driver == Driver.JSON or self.driver == Driver.CLI:
            path = os.getenv("SMM_STORE_DATA_AT")
            if not path:
                raise ValueError("Path must be provided when using JSON driver")

            configuration = ConfigurationFileSystemHandler(path).read_file_if_exists(
                "smm_config.json"
            )

            logger = Logger(configuration=configuration).get_logger()
            logger.debug(
                f"git_repository_location {configuration.git_repository_location} repository={configuration.github_repository} "
            )
            logger.info(
                f"Configuration: {configuration.git_provider} store_data={configuration.store_data}"
            )
            return configuration
        raise ValueError("Invalid configuration")

    def create_web_configuration(data):
        return Configuration(
            git_provider=data.get("git_provider"),
            github_token=data.get("github_token"),
            github_repository=data.get("github_repository"),
            store_data=None,
            git_repository_location=data.get("git_repository_location"),
            deployment_frequency_target_pipeline=data.get(
                "deployment_frequency_target_pipeline"
            ),
            deployment_frequency_target_job=data.get("deployment_frequency_target_job"),
            main_branch=data.get("main_branch"),
            dashboard_start_date=data.get("dashboard_start_date"),
            dashboard_end_date=data.get("dashboard_end_date"),
            dashboard_color=data.get("dashboard_color"),
        )
