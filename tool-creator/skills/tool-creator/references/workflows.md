# Workflow Patterns

## Standard Tool Creation Workflow

```
1. Scaffold CLI (apply template)
2. Implement commands and schemas
3. Add tests and run via uv
4. Install tool with uv tool install
5. Create paired skill with commands/examples
```

## Conditional Workflows

### Determine Tool Type

**Single-command CLI?** → Simple workflow
**Multi-command CLI?** → Structured workflow with subcommands

### Simple Workflow (Single Command)

1. Create project with uv init
2. Add dependencies: typer, pydantic, loguru
3. Implement single command in main.py
4. Add --json, --verbose, --quiet flags
5. Install with uv tool install

### Structured Workflow (Multi-Command)

1. Create project with uv init
2. Add dependencies
3. Create Typer app with subcommands
4. Organize by noun-verb: `tool item list`, `tool item create`
5. Shared output models and logging config
6. Install and create skill

## Template Application Workflow

```bash
# Using the apply_template.py script
python scripts/apply_template.py --dest ./my-tool --tool-name my-tool

# This creates:
# ./my-tool/           - The CLI project
# ./my-tool-skill/     - The paired skill
```

## Testing Workflow

```bash
# Development testing
uv sync
uv run my-tool --help
uv run my-tool command --json

# Run tests
uv run pytest

# Install globally
uv tool install .

# Verify installation
my-tool --help
```

## Skill Creation Workflow

After tool is working:

1. Copy tool-skill-template
2. Fill in: overview, commands, flags, JSON schema
3. Add concrete examples with expected output
4. Document error handling and exit codes
