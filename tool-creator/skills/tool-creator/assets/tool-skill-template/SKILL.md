---
name: "{{skill_name}}"
description: This skill should be used when the user asks to use the {{tool_name}} CLI tool. Includes install/run commands, JSON output schema, and examples.
---

# {{tool_name}} Tool Skill

## Overview

Short, concrete description of what the tool does and when to use it.

## Install

```bash
uv tool install {{tool_name}}
```

## Run

```bash
{{tool_name}} --help
{{tool_name}} <command> [args]
```

## Commands

List commands with one-line purpose and required arguments:

- `hello <name>` - Greet someone by name

## Flags

| Flag | Purpose |
|------|---------|
| `--json` | Machine-readable output |
| `--output <path>` | Write results to file |
| `--quiet` | Suppress non-error logs |
| `--verbose` | Enable debug logging |

## JSON Output

### Success

```json
{
  "ok": true,
  "data": {
    "message": "Hello World"
  },
  "warnings": []
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "type": "validation",
    "message": "Invalid input",
    "details": {}
  }
}
```

## Examples

### Basic Usage

```bash
{{tool_name}} hello World
```

Output:
```
Hello World
```

### JSON Output

```bash
{{tool_name}} hello World --json
```

Output:
```json
{"ok": true, "data": {"message": "Hello World"}, "warnings": []}
```

## Error Handling

| Exit Code | Meaning |
|-----------|---------|
| 0 | Success |
| 1 | Validation error |
| 2 | Runtime error |
