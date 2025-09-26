import functools
import pytest
import sys
from click.testing import CliRunner


@pytest.fixture(scope="module")
def cli():
    """Yield a click.testing.CliRunner to invoke the CLI."""
    class_ = CliRunner

    def invoke_wrapper(f):
        """Augment CliRunner.invoke to emit its output to stdout.
        This enables pytest to show the output in its logs on test failures.
        """

        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            # echo = kwargs.pop('echo', False)
            result = f(*args, **kwargs)
            if result.exit_code != 0:  # Show output only on error
                sys.stdout.write(result.output)
            return result

        return wrapper

    class_.invoke = invoke_wrapper(class_.invoke)
    cli_runner = class_()
    yield cli_runner
