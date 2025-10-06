import os
from enum import Enum
from core.infrastructure.configuration.configuration import Configuration
from core.infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.in_memory_configuration import InMemoryConfiguration


class Driver(Enum):
    CLI = "CLI"
    JSON = "JSON"
    IN_MEMORY = "IN_MEMORY"


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
        if self.driver == Driver.JSON or self.driver == Driver.CLI:
            path = os.getenv("SMM_STORE_DATA_AT")
            if not path:
                raise ValueError("Path must be provided when using JSON driver")
            return ConfigurationFileSystemHandler(path).read_file_if_exists(
                "smm_config.json"
            )
        if self.driver == Driver.IN_MEMORY:
            return InMemoryConfiguration(".")

        raise ValueError("Invalid configuration")
