"""{{tool_name}} CLI application."""

from __future__ import annotations

import json
import sys
from typing import Any

import typer
from loguru import logger
from pydantic import BaseModel, ValidationError

app = typer.Typer(
    add_completion=False,
    no_args_is_help=True,
    help="{{tool_name}} - AI-friendly CLI tool",
)


# =============================================================================
# Models
# =============================================================================


class InputModel(BaseModel):
    """Input validation model."""

    name: str


class OutputModel(BaseModel):
    """Standard output model for --json responses."""

    ok: bool
    data: dict[str, Any] | None = None
    warnings: list[str] = []
    error: dict[str, Any] | None = None


# =============================================================================
# Helpers
# =============================================================================


def _configure_logging(verbose: bool, quiet: bool) -> None:
    """Configure loguru based on verbosity flags."""
    logger.remove()
    if quiet:
        level = "ERROR"
    elif verbose:
        level = "DEBUG"
    else:
        level = "INFO"
    logger.add(sys.stderr, level=level)


def _emit_json(payload: OutputModel) -> None:
    """Write JSON output to stdout."""
    sys.stdout.write(payload.model_dump_json())
    sys.stdout.write("\n")


def _emit_error(error_type: str, message: str, details: dict[str, Any] | None = None) -> OutputModel:
    """Create error output model."""
    return OutputModel(
        ok=False,
        error={
            "type": error_type,
            "message": message,
            "details": details or {},
        },
    )


# =============================================================================
# Commands
# =============================================================================


@app.command("hello")
def hello(
    name: str = typer.Argument(..., help="Name to greet"),
    json_output: bool = typer.Option(False, "--json", help="Output JSON"),
    verbose: bool = typer.Option(False, "--verbose", help="Verbose logging"),
    quiet: bool = typer.Option(False, "--quiet", help="Suppress non-error logs"),
) -> None:
    """Greet someone by name.

    Examples:
        {{tool_name}} hello World
        {{tool_name}} hello World --json
    """
    _configure_logging(verbose, quiet)

    try:
        validated = InputModel(name=name)
    except ValidationError as exc:
        logger.error("Validation error")
        if json_output:
            _emit_json(
                _emit_error(
                    "validation",
                    "Invalid input",
                    json.loads(exc.json()),
                )
            )
            raise typer.Exit(code=1)
        raise typer.BadParameter(str(exc))

    logger.debug(f"Greeting {validated.name}")

    if json_output:
        _emit_json(OutputModel(ok=True, data={"message": f"Hello {validated.name}"}))
        return

    typer.echo(f"Hello {validated.name}")


if __name__ == "__main__":
    app()
