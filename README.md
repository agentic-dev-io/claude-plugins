# Claude Plugins

Production-ready Claude Code plugins: Godot 4.6 game dev toolkit, MCP App UI builder, Open Responses LLM orchestration, creative WebGPU frontends, and AI-First CLI scaffolding.

## Plugins

### godot-claude

Comprehensive Godot 4.6 development toolkit for professional studios.

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 15 | GDScript, C#, shaders, GDExtension, navigation, animation, audio, patterns, multiplayer, optimization, genres, engine-dev |
| Commands | 9 | Scene/shader generation, export, FSM, navigation, audio, netcode setup |
| Agents | 2 | Code reviewer, performance analyzer |
| Templates | 14 | VP, multiplayer, procedural, RPG, FPS, platformer, RTS, racing, roguelike |

**Godot 4.6 Features:** Jolt Physics, IK Framework, NavigationServer, AnimationTree, Direct3D 12, LibGodot, OpenXR 1.1

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

[Full Documentation](./tool-creator/README.md)

---

## Installation

```bash
# Via Claude Code CLI
cc --plugin-dir ./godot-claude
cc --plugin-dir ./mcp-app-next-ui
cc --plugin-dir ./open-responses
cc --plugin-dir ./creative-frontend
cc --plugin-dir ./tool-creator
```

## License

MIT
