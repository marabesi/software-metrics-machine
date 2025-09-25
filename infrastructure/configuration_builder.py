from enum import Enum
from infrastructure.configuration import Configuration


class Driver(Enum):
    APPLICATION = "APPLICATION"
    CLI = "CLI"


class ConfigurationBuilder:
    """
    A builder class to create Configuration objects.
    """

    def __init__(self, driver: Driver):
        self.driver = driver

    def build(self) -> Configuration:
        """
        Build and return a Configuration object.

        :return: A Configuration instance.
        """
        return Configuration()
