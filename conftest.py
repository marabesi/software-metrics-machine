from dataclasses import dataclass
import functools
import os
import pytest
import sys
from click.testing import CliRunner

from infrastructure.configuration.configuration import Configuration
from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.in_memory_configuration import InMemoryConfiguration


@pytest.fixture(scope="module")
def cli_only():
    """Yield a click.testing.CliRunner to invoke the CLI."""
    class_ = CliRunner

    def invoke_wrapper(f):
        """Augment CliRunner.invoke to emit its output to stdout.
        This enables pytest to show the output in its logs on test failures.
        """

        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            result = f(*args, **kwargs)
            if result.exit_code != 0:  # Show output only on error
                sys.stdout.write(result.output)
            return result

        return wrapper

    class_.invoke = invoke_wrapper(class_.invoke)
    cli_runner = class_()
    with cli_runner.isolated_filesystem():
        yield cli_runner


@dataclass
class CliResult:
    runner: CliRunner
    data_stored_at: str
    configuration: Configuration


@pytest.fixture
def cli(cli_only, tmp_path):
    path_string = str(tmp_path)

    os.environ["SMM_STORE_DATA_AT"] = path_string
    configuration = InMemoryConfiguration(path_string)

    ConfigurationFileSystemHandler(path_string).store_file(
        "smm_config.json", configuration
    )

    yield CliResult(
        runner=cli_only, data_stored_at=path_string, configuration=configuration
    )
