from dataclasses import dataclass
from infrastructure.configuration import configuration
from infrastructure.run import Run


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    code: int


class FetchCodemaat:
    def __init__(self, configuration: configuration):
        self.configuration = configuration

    def execute_codemaat(
        self, start_date: str, end_date: str, subfolder: str = "", force: bool = False
    ) -> ExecutionResult:
        command = [
            "sh",
            "providers/codemaat/fetch-codemaat.sh",
            self.configuration.git_repository_location,
            self.configuration.store_data,
            start_date,
            subfolder,
            force and "true" or "false",
        ]
        result = Run().run_command(command, capture_output=True, text=True, check=True)
        return ExecutionResult(
            stdout=result.stdout, stderr=result.stderr, code=result.returncode
        )
