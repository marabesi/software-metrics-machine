"""
Factory functions for creating repository instances with configurations.

This module provides helper functions to create repository instances
with the appropriate configuration, reducing code duplication across
CLI commands.
"""

from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder, Driver)
from core.pipelines.pipelines_repository import PipelinesRepository
from core.prs.prs_repository import PrsRepository
from providers.codemaat.codemaat_repository import CodemaatRepository


def create_pipelines_repository(driver: Driver = Driver.JSON) -> PipelinesRepository:
    """
    Create a PipelinesRepository with the specified driver.

    Args:
        driver: The configuration driver to use (default: Driver.JSON)

    Returns:
        PipelinesRepository instance configured with the specified driver
    """
    configuration = ConfigurationBuilder(driver=driver).build()
    return PipelinesRepository(configuration=configuration)


def create_prs_repository(driver: Driver = Driver.CLI) -> PrsRepository:
    """
    Create a PrsRepository with the specified driver.

    Args:
        driver: The configuration driver to use (default: Driver.CLI)

    Returns:
        PrsRepository instance configured with the specified driver
    """
    configuration = ConfigurationBuilder(driver=driver).build()
    return PrsRepository(configuration=configuration)


def create_codemaat_repository(driver: Driver = Driver.JSON) -> CodemaatRepository:
    """
    Create a CodemaatRepository with the specified driver.

    Args:
        driver: The configuration driver to use (default: Driver.JSON)

    Returns:
        CodemaatRepository instance configured with the specified driver
    """
    configuration = ConfigurationBuilder(driver=driver).build()
    return CodemaatRepository(configuration=configuration)
