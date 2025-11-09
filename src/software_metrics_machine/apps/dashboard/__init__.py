"""Dashboard application entrypoint.

This module exposes a `main()` function used by the `smm-dashboard` script.
It delegates to the `panel` CLI the same way the previous script did.
"""

import os
import sys
import subprocess


def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    existing = os.environ.get("PYTHONPATH", "")
    if project_root not in existing.split(os.pathsep):
        os.environ["PYTHONPATH"] = project_root + (
            os.pathsep + existing if existing else ""
        )

    args = [
        "panel",
        "serve",
        "src/software_metrics_machine/apps/dashboard/dashboard.py",
    ]
    args.extend(sys.argv[1:])

    try:
        return subprocess.call(args)
    except FileNotFoundError:
        print(
            "`panel` executable not found. Make sure dependencies are installed and run inside poetry environment."
        )
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
