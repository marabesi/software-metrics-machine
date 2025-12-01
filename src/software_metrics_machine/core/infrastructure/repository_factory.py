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
    return ConfigurationBuilder(driver=driver).build()


def create_pipelines_repository(driver: Driver = Driver.JSON) -> PipelinesRepository:
    configuration = create_configuration(driver=driver)
    return PipelinesRepository(configuration=configuration)


def create_prs_repository(driver: Driver = Driver.CLI) -> PrsRepository:
    configuration = create_configuration(driver=driver)
    return PrsRepository(configuration=configuration)


def create_codemaat_repository(driver: Driver = Driver.JSON) -> CodemaatRepository:
    configuration = create_configuration(driver=driver)
    return CodemaatRepository(configuration=configuration)


def create_file_system_repository(
    driver: Driver = Driver.CLI,
) -> FileSystemBaseRepository:
    configuration = create_configuration(driver=driver)
    return FileSystemBaseRepository(
        configuration=configuration, target_subfolder=configuration.git_provider
    )
