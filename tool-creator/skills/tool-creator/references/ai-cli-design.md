# AI-Friendly CLI Design

## Output Contract

Support a `--json` flag that returns machine-readable output.

When `--json` is set:
- Write only JSON to stdout
- Send logs to stderr
- Keep the JSON schema stable across versions

### Success Response

```json
{
  "ok": true,
  "data": {
    "result": "...",
    "items": [...]
  },
  "warnings": ["Optional warning messages"]
}
```

### Error Response

```json
{
  "ok": false,
  "error": {
    "type": "validation|runtime|not_found|conflict",
    "message": "Human-readable summary",
    "details": {
      "field": "name",
      "reason": "Must be alphanumeric"
    }
  }
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | User or validation error |
| 2 | Unexpected runtime error |

## Standard Flags

| Flag | Purpose |
|------|---------|
| `--json` | Machine-readable output |
| `--output <path>` | Write results to file |
| `--quiet` | Suppress non-error logs |
| `--verbose` | Enable debug logging (stderr) |

## UX Rules

- Keep help text short but example-driven
- Avoid interactive prompts unless explicitly requested
- Avoid color unless stdout is a TTY
- Prefer noun-verb subcommands: `asset list`, `asset preview`

## Example Implementation

```python
@app.command("list")
def list_items(
    json_output: bool = typer.Option(False, "--json"),
    verbose: bool = typer.Option(False, "--verbose"),
    quiet: bool = typer.Option(False, "--quiet"),
) -> None:
    _configure_logging(verbose, quiet)

    items = fetch_items()

    if json_output:
        _emit_json(OutputModel(ok=True, data={"items": items}))
        return

    for item in items:
        typer.echo(item.name)
```
