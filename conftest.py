import functools
import os
import subprocess
import pytest
import sys
from click.testing import CliRunner

from conftest_types import CliResult
from software_metrics_machine.core.infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.git_repository_builder import GitRepositoryResult
from tests.file_handler_for_testing import FileHandlerForTesting
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
                sys.stdout.write(result.stdout)
            return result

        return wrapper

    class_.invoke = invoke_wrapper(class_.invoke)
    cli_runner = class_()
    with cli_runner.isolated_filesystem():
        yield cli_runner


@pytest.fixture
def git(cli):
    repository = cli.configuration.git_repository_location

    subprocess.run(["mkdir", "-p", f"{repository}"], capture_output=True, text=True)
    subprocess.run(["git", "-C", repository, "init"], capture_output=True, text=True)
    subprocess.run(
        ["git", "-C", repository, "branch", "-m", "main"],
        capture_output=True,
        text=True,
    )
    yield GitRepositoryResult(cli)


@pytest.fixture
def cli(cli_only, tmp_path):
    path_string = str(tmp_path)

    os.environ["SMM_STORE_DATA_AT"] = path_string
    configuration = InMemoryConfiguration(path_string)

    ConfigurationFileSystemHandler(path_string).store_file(
        "smm_config.json", configuration
    )

    storage = FileHandlerForTesting(path_string, configuration)

    yield CliResult(
        runner=cli_only,
        data_stored_at=path_string,
        codemaat_stored_at=f"{path_string}/{configuration.git_provider}_fake_repo/codemaat",
        configuration=configuration,
        storage=storage,
    )
