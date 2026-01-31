---
name: tool-creator
description: This skill should be used when the user asks to "create a CLI tool", "scaffold a Python CLI", "build a command-line tool", "make an AI-friendly CLI", "uv tool", "typer CLI", or needs to create Python command-line tools with --json output and uv package management.
---

# Tool Creator

Create AI-First CLI tools with uv, Typer, Pydantic, and Loguru. Each tool comes with a paired skill that teaches Claude to use it perfectly.

## Core Rules

- Always use uv for environments, dependencies, and execution (not pip, pipenv, or poetry)
- Output is a tool + paired skill that documents the tool
- Install tools with `uv tool install` and document exact commands
- Prefer `src/` layout with explicit console entrypoints in pyproject.toml
- Keep stdout clean for data; logs and diagnostics go to stderr
- Support `--json` flag for machine-readable output

## Workflow

1. **Confirm requirements**: commands needed, inputs/outputs, error cases, target platform
2. **Define CLI shape**: subcommands, flags, --json contract
3. **Initialize project**: use uv and add dependencies
4. **Implement CLI**: follow AI-friendly patterns
5. **Add tests**: minimal tests for core commands, run via uv
6. **Install tool**: `uv tool install <path>` and provide examples
7. **Create paired skill**: document commands, flags, JSON schema, examples

## Project Structure

```
my-tool/
├── pyproject.toml          # uv project config
├── src/
│   └── my_tool/
│       ├── __init__.py
│       └── main.py         # Typer app
└── tests/
```

## Dependencies

```toml
[project]
dependencies = [
  "typer>=0.12",
  "pydantic>=2.6",
  "loguru>=0.7",
]

[project.scripts]
"my-tool" = "my_tool.main:app"

[tool.uv]
package = true
```

## JSON Output Contract

Success:
```json
{"ok": true, "data": {...}, "warnings": []}
```

Error:
```json
{"ok": false, "error": {"type": "validation", "message": "...", "details": {...}}}
```

## Exit Codes

- `0` - Success
- `1` - User or validation error
- `2` - Unexpected runtime error

## Standard Flags

- `--json` - Machine-readable output
- `--output <path>` - Write results to file
- `--quiet` - Suppress non-error logs
- `--verbose` - Enable debug logging

## Additional Resources

### Reference Documentation

- **`references/uv.md`** - uv commands and workflow
- **`references/ai-cli-design.md`** - Output schemas and error handling
- **`references/best-practices.md`** - Typer/Pydantic/Loguru conventions
- **`references/workflows.md`** - Step-by-step patterns
- **`references/output-patterns.md`** - Output templates

### Assets

- **`assets/cli-template/`** - Default scaffold for new tools
- **`assets/tool-skill-template/`** - Template for paired skill

### Scripts

- **`scripts/apply_template.py`** - Apply template with parameterized names
- **`scripts/validate_names.py`** - Validate tool/module/skill names
