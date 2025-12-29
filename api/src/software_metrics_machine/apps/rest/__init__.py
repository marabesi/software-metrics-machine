import os
import sys

DEFAULT_TARGET = "software_metrics_machine.apps.rest.main:app"


def main():
    args = sys.argv[1:]

    if not any(":" in a or a.endswith(".py") for a in args if not a.startswith("-")):
        args = [DEFAULT_TARGET] + args

    os.execv(sys.executable, [sys.executable, "-m", "uvicorn", *args])
