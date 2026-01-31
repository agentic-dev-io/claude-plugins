# Claude Plugins

[![License: Ethical Source](https://img.shields.io/badge/License-Ethical%20Source-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-8A2BE2)](https://docs.anthropic.com/en/docs/claude-code)
[![Plugins](https://img.shields.io/badge/Plugins-5-green)]()
[![Skills](https://img.shields.io/badge/Skills-22-orange)]()

Production-ready Claude Code plugins for game development, interactive UIs, LLM orchestration, creative frontends, and CLI tooling.

## Quick Start

```bash
# Clone and install any plugin
git clone https://github.com/agentic-dev-io/claude-plugins.git
cd claude-plugins

# Load a plugin in Claude Code
claude --plugin-dir ./godot-claude
claude --plugin-dir ./creative-frontend
# ... etc
```

## Plugins

| Plugin | Skills | Commands | Description |
|--------|--------|----------|-------------|
| [godot-claude](#godot-claude) | 15 | 9 | Godot 4.6 game development toolkit |
| [mcp-app-next-ui](#mcp-app-next-ui) | 1 | - | MCP App UI with Next.js |
| [open-responses](#open-responses) | 3 | - | Multi-provider LLM orchestration |
| [creative-frontend](#creative-frontend) | 2 | - | WebGPU + Three.js frontends |
| [tool-creator](#tool-creator) | 1 | 1 | AI-First CLI scaffolding |

---

### godot-claude

Comprehensive Godot 4.6 development toolkit for professional studios.

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 15 | GDScript, C#, shaders, GDExtension, navigation, animation, audio, patterns, multiplayer, optimization, genres, engine-dev |
| Commands | 9 | Scene/shader generation, export, FSM, navigation, audio, netcode setup |
| Agents | 2 | Code reviewer, performance analyzer |
| Templates | 14 | VP, multiplayer, procedural, RPG, FPS, platformer, RTS, racing, roguelike |

**Godot 4.6 Features:** Jolt Physics, IK Framework, NavigationServer, AnimationTree, Direct3D 12, LibGodot, OpenXR 1.1

**Links:** [Godot Engine](https://godotengine.org/) · [GDScript Docs](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/) · [Godot 4.6 Release](https://godotengine.org/releases/4.6/)

[Full Documentation](./godot-claude/README.md)

---

### mcp-app-next-ui

Build MCP Apps with Next.js, React, Tailwind CSS, and shadcn/ui.

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 1 | MCP App UI development patterns |

**Features:**
- `@modelcontextprotocol/ext-apps/react` integration
- `useApp`, `useHostStyles` hooks
- `registerAppResource` server-side setup
- iframe embedding for interactive UI

**Links:** [MCP Spec](https://spec.modelcontextprotocol.io/) · [Next.js 15](https://nextjs.org/docs) · [shadcn/ui](https://ui.shadcn.com/) · [Tailwind CSS](https://tailwindcss.com/docs)

[Full Documentation](./mcp-app-next-ui/skills/mcp-app-next-ui/SKILL.md)

---

### open-responses

Open Responses specification implementation for multi-provider LLM orchestration.

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 3 | Orchestrator, Agents SDK, Rust engine |

**Features:**
- Multi-provider routing (OpenAI, Anthropic, local models)
- Streaming support with SSE
- Tool calling and structured outputs
- Anthropic Agents SDK integration
- Rust backend implementation

**Links:** [OpenAI API](https://platform.openai.com/docs/api-reference) · [Anthropic API](https://docs.anthropic.com/en/api) · [Agents SDK](https://github.com/anthropics/anthropic-sdk-python)

[Full Documentation](./open-responses/skills/open-responses-orchestrator/SKILL.md)

---

### creative-frontend

Create distinctive, production-grade frontend interfaces with WebGPU 3D graphics.

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 2 | Frontend design, WebGPU/Three.js/TSL |
| Templates | 6 | Next.js 15 project, WebGPU components, compute shaders |
| Scripts | 3 | Project setup, component installer, WebGPU checker |

**Features:**
- Bold UI design avoiding generic AI aesthetics
- Next.js + React + Tailwind + shadcn/ui stack
- WebGPU 3D graphics with Three.js TSL
- GPU compute shaders and post-processing
- Comprehensive shader reference

**Links:** [Three.js](https://threejs.org/docs/) · [WebGPU](https://www.w3.org/TR/webgpu/) · [TSL Docs](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language) · [Next.js 15](https://nextjs.org/docs)

[Full Documentation](./creative-frontend/README.md)

---

### tool-creator

Create AI-First CLI tools with uv, Typer, Pydantic, and Loguru.

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 1 | AI-First CLI development patterns |
| Commands | 1 | `/create-tool` scaffolding wizard |
| Templates | 2 | CLI project, paired skill |
| Scripts | 2 | Template application, name validation |

**Features:**
- uv-based package management (not pip/poetry)
- `--json` output with stable schema
- Typer + Pydantic + Loguru stack
- Paired skill generation for each tool
- Modern Python 3.11+ patterns

**Links:** [uv](https://docs.astral.sh/uv/) · [Typer](https://typer.tiangolo.com/) · [Pydantic](https://docs.pydantic.dev/) · [Loguru](https://loguru.readthedocs.io/)

[Full Documentation](./tool-creator/README.md)

---

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed
- Plugin-specific requirements documented in each plugin's README

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-plugin`)
3. Follow [Claude Code Plugin Spec](https://docs.anthropic.com/en/docs/claude-code/plugins)
4. Submit a Pull Request

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Agent Skills Specification](https://agentskills.dev/)
- [Plugin Development Guide](https://docs.anthropic.com/en/docs/claude-code/plugins)

## License

[Ethical Source](LICENSE) - MIT-based, excludes military and pharmaceutical use.
