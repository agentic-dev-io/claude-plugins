# CLI Best Practices

## Libraries

| Library | Purpose |
|---------|---------|
| Typer | CLI framework with rich help/validation |
| Pydantic | Input models and validation |
| Loguru | Logging (avoid print) |

## AI-Friendly Behavior

- Provide `--json` output with a stable schema
- Keep stdout for data, stderr for logs
- Avoid interactive prompts unless explicitly requested
- Keep help text short and example-driven
- Be concrete, concise, and deterministic

## Context Awareness

- Read config from explicit flags or env vars; document them
- Validate inputs early with clear error messages
- Fail fast with actionable errors and exit codes

## Logging with Loguru

```python
from loguru import logger
import sys

def _configure_logging(verbose: bool, quiet: bool) -> None:
    logger.remove()
    if quiet:
        level = "ERROR"
    elif verbose:
        level = "DEBUG"
    else:
        level = "INFO"
    logger.add(sys.stderr, level=level)
```

### Log Levels

| Level | When to use |
|-------|-------------|
| trace | Extremely detailed debugging |
| debug | Developer diagnostics |
| info | Normal operation events |
| warning | Potential issues |
| error | Failures that need attention |
| critical | System-level failures |

## Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import Any

class InputModel(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    count: int = Field(default=10, ge=1, le=1000)

class OutputModel(BaseModel):
    ok: bool
    data: dict[str, Any] | None = None
    warnings: list[str] = []
    error: dict[str, Any] | None = None
```

## Typer Patterns

```python
import typer

app = typer.Typer(
    add_completion=False,
    no_args_is_help=True,
)

@app.command("process")
def process(
    input_file: Path = typer.Argument(..., help="Input file path"),
    output: Path = typer.Option(None, "--output", "-o", help="Output file"),
    json_output: bool = typer.Option(False, "--json", help="JSON output"),
) -> None:
    ...
```

## Output Contract

- Prefer noun-verb subcommands: `asset list`, `asset preview`
- Include `--output <path>` for file outputs
- Keep schemas consistent across versions
- Never log secrets
