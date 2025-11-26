import ast
from pathlib import Path


def _find_test_imports_in_file(path: Path) -> list[str]:
    """Return list of offending import lines (as strings) in the given file.

    We parse the AST and look for Import and ImportFrom nodes that reference
    the top-level package `tests` (for example: `import tests.foo` or
    `from tests.foo import bar`).
    """
    try:
        content = path.read_text(encoding="utf8")
    except Exception:
        return ["<could not read file>"]

    try:
        tree = ast.parse(content)
    except Exception:
        return ["<invalid python file>"]

    offenders: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for n in node.names:
                if n.name == "tests" or n.name.startswith("tests."):
                    offenders.append(f"import {n.name}")
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            if module == "tests" or module.startswith("tests."):
                offenders.append(f"from {module} import ...")

    return offenders


def test_src_does_not_import_tests_package():
    src_root = Path(__file__).resolve().parents[2] / "src"
    assert (
        src_root.exists()
    ), f"src directory not found at expected location: {src_root}"

    py_files = list(src_root.rglob("*.py"))

    problems: dict[str, list[str]] = {}

    for p in py_files:
        offenders = _find_test_imports_in_file(p)
        if offenders:
            problems[str(p.relative_to(src_root))] = offenders

    if problems:
        msg_lines = [
            "Found imports referencing `tests` package from files under src/:",
            "",
        ]
        for fn, offs in problems.items():
            msg_lines.append(f"- {fn}")
            for o in offs:
                msg_lines.append(f"    - {o}")

        full = "\n".join(msg_lines)
        raise AssertionError(full)
