import os
from enum import Enum
from infrastructure.configuration.configuration import Configuration
from infrastructure.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)


class Driver(Enum):
    APPLICATION = "APPLICATION"
    CLI = "CLI"
    JSON = "JSON"


class ConfigurationBuilder:
    """
    A builder class to create Configuration objects.
    """

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
        if self.driver == Driver.JSON:
            path = os.getenv("SSM_STORE_DATA_AT")
            if not path:
                raise ValueError("Path must be provided when using JSON driver")
            return ConfigurationFileSystemHandler(path).read_file_if_exists(
                "smm_config.json"
            )

        return Configuration()
