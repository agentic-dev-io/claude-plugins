# Output Patterns

Use these patterns for consistent, high-quality output.

## Tool Skill Template

ALWAYS use this structure for paired skills:

```markdown
# {{tool_name}} Tool Skill

## Overview
[One-paragraph summary of what the tool does]

## Install
uv tool install {{tool_name}}

## Commands
- command1: [purpose]
- command2: [purpose]

## Flags
- --json (machine output)
- --output <path>
- --quiet
- --verbose

## JSON Output

Success:
{json}
{"ok": true, "data": {...}}
{/json}

Error:
{json}
{"ok": false, "error": {"type": "...", "message": "..."}}
{/json}

## Examples

### Example 1: Basic usage
{bash}
my-tool process input.txt --json
{/bash}

Output:
{json}
{"ok": true, "data": {"processed": 42}}
{/json}

## Error Handling
- Exit 0: Success
- Exit 1: Validation error
- Exit 2: Runtime error
```

## JSON Output Examples

### List Command

```json
{
  "ok": true,
  "data": {
    "items": [
      {"id": 1, "name": "Item 1"},
      {"id": 2, "name": "Item 2"}
    ],
    "total": 2
  }
}
```

### Create Command

```json
{
  "ok": true,
  "data": {
    "created": {
      "id": 3,
      "name": "New Item"
    }
  }
}
```

### Validation Error

```json
{
  "ok": false,
  "error": {
    "type": "validation",
    "message": "Invalid input",
    "details": {
      "field": "name",
      "reason": "Must be at least 3 characters"
    }
  }
}
```

### Not Found Error

```json
{
  "ok": false,
  "error": {
    "type": "not_found",
    "message": "Item not found",
    "details": {
      "id": 999
    }
  }
}
```

## Help Text Pattern

Keep help text concise with examples:

```python
@app.command("process")
def process(
    input_file: Path = typer.Argument(
        ...,
        help="Input file to process (e.g., data.json)"
    ),
    format: str = typer.Option(
        "json",
        "--format", "-f",
        help="Output format: json, csv, yaml"
    ),
) -> None:
    """Process input file and generate output.

    Examples:
        my-tool process data.json
        my-tool process data.json --format csv
        my-tool process data.json --json
    """
```
