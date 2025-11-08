"""
Factory functions for creating repository instances with configurations.

This module provides helper functions to create repository instances
with the appropriate configuration, reducing code duplication across
CLI commands.
"""

from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)


def create_configuration(driver: Driver = Driver.CLI):
    """
    Create a Configuration object with the specified driver.

    Args:
        driver: The configuration driver to use (default: Driver.CLI)

    Returns:
        Configuration instance built with the specified driver
    """
    return ConfigurationBuilder(driver=driver).build()


def create_pipelines_repository(driver: Driver = Driver.JSON) -> PipelinesRepository:
    """
    Create a PipelinesRepository with the specified driver.

    Args:
        driver: The configuration driver to use (default: Driver.JSON)

    Returns:
        PipelinesRepository instance configured with the specified driver
    """
    configuration = create_configuration(driver=driver)
    return PipelinesRepository(configuration=configuration)


def create_prs_repository(driver: Driver = Driver.CLI) -> PrsRepository:
    """
    Create a PrsRepository with the specified driver.

    Args:
        driver: The configuration driver to use (default: Driver.CLI)

    Returns:
        PrsRepository instance configured with the specified driver
    """
    configuration = create_configuration(driver=driver)
    return PrsRepository(configuration=configuration)


def create_codemaat_repository(driver: Driver = Driver.JSON) -> CodemaatRepository:
    """
    Create a CodemaatRepository with the specified driver.

    Args:
        driver: The configuration driver to use (default: Driver.JSON)

    Returns:
        CodemaatRepository instance configured with the specified driver
    """
    configuration = create_configuration(driver=driver)
    return CodemaatRepository(configuration=configuration)


def create_file_system_repository(
    driver: Driver = Driver.CLI,
) -> FileSystemBaseRepository:
    """
    Create a FileSystemBaseRepository with the specified driver.

    Args:
        driver: The configuration driver to use (default: Driver.CLI)

    Returns:
        FileSystemBaseRepository instance configured with the specified driver
    """
    configuration = create_configuration(driver=driver)
    return FileSystemBaseRepository(configuration=configuration)
