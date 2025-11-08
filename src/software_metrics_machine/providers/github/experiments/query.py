from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any
from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
)


def load_input(file_name: str | None = None) -> Any:
    cfg = ConfigurationBuilder().build()
    data_dir = cfg.store_data
    pdir = Path(data_dir)

    if file_name:
        if Path(file_name).name != file_name:
            raise SystemExit(
                "Please provide only the filename (no path). The file will be loaded from the configured store_data folder."  # noqa
            )
        candidate = pdir / file_name
        if not candidate.exists():
            raise SystemExit(f"File not found in store_data folder: {candidate}")
        try:
            return json.loads(candidate.read_text(encoding="utf-8"))
        except Exception as e:
            raise SystemExit(f"Failed to parse JSON from {candidate}: {e}")

    raise SystemExit("mising json file")


def run_with_python_jq(expr: str, data: Any) -> list:
    try:
        import jq
    except Exception as e:
        raise RuntimeError("python 'jq' module not available") from e

    program = jq.compile(expr)
    out = program.input(data).all()
    return out


def run_with_system_jq(expr: str, data: Any) -> list:
    # write data to a temporary buffer and run jq via subprocess
    jq_path = shutil.which("jq")
    if not jq_path:
        raise RuntimeError(
            "'jq' binary not found on PATH and python 'jq' module not available"
        )

    p = subprocess.Popen(
        [jq_path, expr],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    stdin_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
    stdout, stderr = p.communicate(stdin_bytes)
    if p.returncode != 0:
        raise RuntimeError(f"jq failed: {stderr.decode('utf-8', errors='replace')}")
    # jq may output multiple JSON values separated by newlines
    text = stdout.decode("utf-8")
    results = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            results.append(json.loads(line))
        except Exception:
            # not JSON, return raw line
            results.append(line)
    return results


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Run a jq expression against JSON input stored in the project's data store"
    )
    parser.add_argument(
        "expr", type=str, help="jq expression to run (wrap in single quotes)"
    )
    parser.add_argument(
        "-f",
        "--file",
        type=str,
        default=None,
        help="Filename (basename) to load from the configured store_data folder (SMM_STORE_DATA_AT). If omitted, all JSON files in the folder will be merged and queried.",  # noqa
    )
    parser.add_argument(
        "--raw",
        action="store_true",
        help="Print raw Python repr of results instead of JSON",
    )
    args = parser.parse_args(argv)

    data = load_input(args.file)

    # Try python jq first, then system jq
    results = None
    try:
        results = run_with_python_jq(args.expr, data)
    except Exception:
        try:
            results = run_with_system_jq(args.expr, data)
        except Exception as e:
            raise SystemExit(f"Failed to evaluate jq expression: {e}")

    # Print results
    if args.raw:
        for r in results:
            print(repr(r))
    else:
        # if results is a single item that is a list, print it prettily
        if len(results) == 1 and isinstance(results[0], (list, dict)):
            print(json.dumps(results[0], indent=2, ensure_ascii=False))
        else:
            print(json.dumps(results, indent=2, ensure_ascii=False))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
