#!/usr/bin/env python3
"""Apply the uv CLI template with parameterized names.

Usage:
  python apply_template.py --dest <path> --tool-name <cli-name>

Example:
  python apply_template.py --dest ./asset-cli --tool-name asset-cli

This creates:
  ./asset-cli/           - The CLI project
  ./asset-cli-skill/     - The paired skill (in parent directory)
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path


PLACEHOLDER_TOOL = "{{tool_name}}"
PLACEHOLDER_MODULE = "{{module_name}}"
PLACEHOLDER_SKILL = "{{skill_name}}"

TOOL_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MODULE_NAME_RE = re.compile(r"^[a-z_][a-z0-9_]*$")


def validate_tool_name(tool_name: str) -> None:
    """Validate tool name is kebab-case."""
    if not TOOL_NAME_RE.match(tool_name):
        raise SystemExit(
            "Invalid tool name. Use kebab-case, letters/numbers only, e.g. asset-cli."
        )


def validate_module_name(module_name: str) -> None:
    """Validate module name is snake_case."""
    if not MODULE_NAME_RE.match(module_name):
        raise SystemExit(
            "Invalid module name. Use snake_case, letters/numbers/underscore, "
            "and start with a letter or underscore."
        )


def validate_skill_name(skill_name: str) -> None:
    """Validate skill name is kebab-case."""
    if not TOOL_NAME_RE.match(skill_name):
        raise SystemExit(
            "Invalid skill name. Use kebab-case, letters/numbers only, "
            "e.g. asset-cli-skill."
        )


def replace_placeholders(
    path: Path,
    tool_name: str,
    module_name: str,
    skill_name: str | None,
) -> None:
    """Replace placeholders in a file."""
    content = path.read_text(encoding="utf-8")
    content = content.replace(PLACEHOLDER_TOOL, tool_name)
    content = content.replace(PLACEHOLDER_MODULE, module_name)
    if skill_name:
        content = content.replace(PLACEHOLDER_SKILL, skill_name)
    path.write_text(content, encoding="utf-8")


def replace_in_tree(
    root: Path,
    tool_name: str,
    module_name: str,
    skill_name: str | None,
) -> None:
    """Replace placeholders in all files under root."""
    for path in root.rglob("*"):
        if path.is_file():
            replace_placeholders(path, tool_name, module_name, skill_name)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply CLI template with parameterized names"
    )
    parser.add_argument("--dest", required=True, help="Destination directory for CLI project")
    parser.add_argument("--tool-name", required=True, help="CLI name, e.g. asset-cli")
    parser.add_argument("--no-skill", action="store_true", help="Skip creating paired skill")
    args = parser.parse_args()

    # Derive names
    module_name = args.tool_name.replace("-", "_")
    skill_name = f"{args.tool_name}-skill"

    # Resolve paths
    script_dir = Path(__file__).resolve().parent
    template_dir = script_dir.parent / "assets" / "cli-template"
    dest_dir = Path(args.dest).resolve()
    skill_dest = dest_dir.parent / skill_name

    # Validate
    validate_tool_name(args.tool_name)
    validate_module_name(module_name)
    validate_skill_name(skill_name)

    if dest_dir.exists():
        raise SystemExit(f"Destination already exists: {dest_dir}")

    # Copy CLI template
    print(f"Creating CLI project: {dest_dir}")
    shutil.copytree(template_dir, dest_dir)

    # Replace placeholders
    replace_in_tree(dest_dir, args.tool_name, module_name, skill_name)

    # Rename module folder
    src_dir = dest_dir / "src"
    old_module_dir = src_dir / "my_tool"
    new_module_dir = src_dir / module_name
    if old_module_dir.exists():
        old_module_dir.rename(new_module_dir)
        print(f"Renamed module: my_tool -> {module_name}")

    # Create paired skill
    if not args.no_skill:
        skill_template = script_dir.parent / "assets" / "tool-skill-template"
        if skill_dest.exists():
            print(f"Warning: Skill destination already exists: {skill_dest}")
        else:
            print(f"Creating paired skill: {skill_dest}")
            shutil.copytree(skill_template, skill_dest)
            replace_in_tree(skill_dest, args.tool_name, module_name, skill_name)

    print()
    print("Next steps:")
    print(f"  cd {dest_dir}")
    print("  uv sync")
    print(f"  uv run {args.tool_name} --help")
    print(f"  uv tool install .")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
