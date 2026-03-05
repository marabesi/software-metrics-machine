from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)


class SonarqubeRepository(FileSystemBaseRepository):
    def __init__(self, configuration: Configuration):
        super().__init__(configuration=configuration, target_subfolder="sonarqube")
