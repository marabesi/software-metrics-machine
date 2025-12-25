from dataclasses import dataclass
from click.testing import CliRunner

from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from tests.file_handler_for_testing import FileHandlerForTesting


@dataclass
class CliResult:
    runner: CliRunner
    data_stored_at: str
    codemaat_stored_at: str
    configuration: Configuration
    storage: FileHandlerForTesting
