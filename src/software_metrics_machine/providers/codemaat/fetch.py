from dataclasses import dataclass
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.run import Run
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    code: int


class FetchCodemaat:
    def __init__(self, configuration: Configuration):
        self.configuration = configuration
        self.codemaat_repository = CodemaatRepository(configuration=configuration)

    def execute_codemaat(
        self, start_date: str, end_date: str, subfolder: str = "", force: bool = False
    ) -> ExecutionResult:
        Run().run_command(
            ["mkdir", "-p", self.codemaat_repository.default_dir],
            capture_output=True,
            text=True,
            check=True,
        )

        command = [
            "sh",
            "src/software_metrics_machine/providers/codemaat/fetch-codemaat.sh",
            self.configuration.git_repository_location,
            self.codemaat_repository.default_dir,
            start_date,
            subfolder and subfolder or "",
            force and "true" or "false",
        ]

        result = Run().run_command(command, capture_output=True, text=True, check=True)

        return ExecutionResult(
            stdout=result.stdout, stderr=result.stderr, code=result.returncode
        )
