---
name: create-tool
description: Scaffold a new AI-First CLI tool with uv, Typer, Pydantic, and Loguru
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "<tool-name> [--dest <path>]"
---

# Create Tool Command

Scaffold a new AI-First CLI tool project.

## Arguments

- `<tool-name>` - Name for the CLI tool (kebab-case, e.g. `asset-manager`)
- `--dest <path>` - Optional destination directory (defaults to `./<tool-name>`)

## Workflow

1. **Validate the tool name**
   - Must be kebab-case (lowercase letters, numbers, hyphens)
   - Derive module_name (snake_case) and skill_name automatically

2. **Determine destination**
   - Use provided --dest or default to `./<tool-name>`
   - Check if directory already exists

3. **Create project structure**
   ```
   <tool-name>/
   ├── pyproject.toml
   ├── README.md
   └── src/
       └── <module_name>/
           ├── __init__.py
           └── main.py
   ```

4. **Initialize with uv**
   ```bash
   cd <tool-name>
   uv sync
   ```

5. **Verify installation works**
   ```bash
   uv run <tool-name> --help
   ```

6. **Create paired skill** (optional)
   - Create `<tool-name>-skill/` directory
   - Generate SKILL.md with commands, flags, JSON schema

7. **Provide next steps**
   - How to add commands
   - How to install globally with `uv tool install`

## Example

User: `/create-tool asset-manager`

Creates:
- `./asset-manager/` - CLI project with Typer + Pydantic + Loguru
- `./asset-manager-skill/` - Paired skill for using the tool

## Template Location

Use templates from the tool-creator skill:
- `skills/tool-creator/assets/cli-template/`
- `skills/tool-creator/assets/tool-skill-template/`

## Notes

- Always use uv (not pip, pipenv, or poetry)
- Include --json flag support for AI-friendly output
- Keep help text short and example-driven
- Document all commands in the paired skill
