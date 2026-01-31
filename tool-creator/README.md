# Tool Creator

Create AI-First CLI tools with uv, Typer, Pydantic, and Loguru.

## Features

- **uv-based** - Modern Python package management
- **AI-Friendly Output** - `--json` flag with stable schema
- **Typer + Pydantic** - Type-safe CLI with validation
- **Paired Skills** - Auto-generated skill for each tool
- **Template-based** - Consistent project structure

## Components

| Component | Description |
|-----------|-------------|
| Skill | `tool-creator` - AI-First CLI development patterns |
| Command | `/create-tool` - Scaffold new CLI project |

## Quick Start

```bash
# Use the command
/create-tool my-cli

# Or ask Claude
"Create an AI-first CLI tool called asset-manager"
```

## Stack

- **uv** - Package manager (not pip/poetry)
- **Typer** - CLI framework
- **Pydantic** - Validation
- **Loguru** - Logging

## Installation

```bash
cc --plugin-dir ./tool-creator
```

## License

MIT
