# uv Usage

Use uv for all dependency management, environment setup, and command execution.

## Project Init

Create a new project directory, then run:

```bash
uv init
```

## Dependencies

```bash
# Add runtime deps
uv add <package>

# Add dev deps
uv add --dev <package>

# Remove deps
uv remove <package>
```

## Sync and Run

```bash
# Sync environment from lockfile
uv sync

# Run a command inside the project environment
uv run <command>

# Run tests
uv run pytest
```

## Tool Install

```bash
# Install a CLI tool into the uv tool environment
uv tool install <package>

# Install from local path
uv tool install .

# Run a tool directly
uv tool run <command>

# List installed tools
uv tool list

# Uninstall a tool
uv tool uninstall <package>
```

## Common Patterns

### New Tool Project

```bash
mkdir my-tool && cd my-tool
uv init
uv add typer pydantic loguru
# ... implement ...
uv tool install .
```

### Development Workflow

```bash
uv sync                    # Install deps
uv run my-tool --help      # Test locally
uv run pytest              # Run tests
uv tool install .          # Install globally
```

## Notes

- Prefer uv for all installs and runs
- Do not use pip, pipenv, or poetry
- Keep pyproject.toml as the source of truth
