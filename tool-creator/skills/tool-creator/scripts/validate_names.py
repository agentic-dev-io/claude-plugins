#!/usr/bin/env python3
"""Validate tool, module, and skill names.

Usage:
  python validate_names.py <tool-name>

Example:
  python validate_names.py asset-cli

Output:
  tool_name:   asset-cli
  module_name: asset_cli
  skill_name:  asset-cli-skill
  Valid: True
"""

from __future__ import annotations

import re
import sys


TOOL_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MODULE_NAME_RE = re.compile(r"^[a-z_][a-z0-9_]*$")


def validate_and_derive(tool_name: str) -> dict[str, str | bool]:
    """Validate tool name and derive module/skill names."""
    module_name = tool_name.replace("-", "_")
    skill_name = f"{tool_name}-skill"

    tool_valid = bool(TOOL_NAME_RE.match(tool_name))
    module_valid = bool(MODULE_NAME_RE.match(module_name))
    skill_valid = bool(TOOL_NAME_RE.match(skill_name))

    return {
        "tool_name": tool_name,
        "module_name": module_name,
        "skill_name": skill_name,
        "tool_valid": tool_valid,
        "module_valid": module_valid,
        "skill_valid": skill_valid,
        "all_valid": tool_valid and module_valid and skill_valid,
    }


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: validate_names.py <tool-name>")
        return 1

    tool_name = sys.argv[1]
    result = validate_and_derive(tool_name)

    print(f"tool_name:   {result['tool_name']} {'✓' if result['tool_valid'] else '✗'}")
    print(f"module_name: {result['module_name']} {'✓' if result['module_valid'] else '✗'}")
    print(f"skill_name:  {result['skill_name']} {'✓' if result['skill_valid'] else '✗'}")
    print(f"Valid: {result['all_valid']}")

    return 0 if result["all_valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
