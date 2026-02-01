# godot-claude

A comprehensive Claude Code plugin for autonomous Godot 4.6 game development - from concept to release.

## Features

- **20 Skills** covering all aspects of Godot development
- **13 Commands** for project scaffolding, implementation, and release
- **6 Agents** for architecture, development, art, publishing, and review
- **14 Project Templates** for common game genres and workflows

## Autonomous Development Workflow

```
1. CONCEPT
   └─ /godot-gdd "Tower Defense with Roguelike elements"
      → Generates complete Game Design Document

2. ARCHITECTURE
   └─ godot-architect agent analyzes GDD
      → Creates project structure, defines systems

3. DEVELOPMENT
   └─ godot-developer agent implements features
      → Feature by feature with integration

4. ART & POLISH
   └─ godot-artist agent handles visuals
      → Shaders, UI themes, effects

5. RELEASE
   └─ godot-publisher agent prepares launch
      → Export, store pages, marketing
```

## Godot 4.6 Features Covered

- Jolt Physics (default for 3D)
- Modular IK Framework (Two-Bone, Spline, FABRIK, iterative solvers)
- Improved SSR (Screen Space Reflection)
- Direct3D 12 (Windows default)
- LibGodot integration
- OpenXR 1.1 support
- GDExtension JSON bindings
- C# Translation Analyzer
- Enhanced NavigationServer
- AnimationTree improvements

## Installation

Add to Claude Code via marketplace or use directly:

```bash
cc --plugin-dir ./plugins/godot-claude
```

## Agents

### Development Workflow Agents

| Agent | Purpose |
|-------|---------|
| `godot-architect` | Designs game architecture from concepts - GDDs, project structure, system design |
| `godot-developer` | Implements features from specs - GDScript/C#, systems integration |
| `godot-artist` | Creates visual systems - shaders, UI themes, particles, lighting |
| `godot-publisher` | Handles release workflows - exports, store pages, marketing |

### Quality Agents

| Agent | Purpose |
|-------|---------|
| `godot-code-reviewer` | Reviews GDScript, C#, and shader code for best practices |
| `godot-performance-analyzer` | Analyzes scenes and scripts for performance issues |

## Skills

### Core Development
| Skill | Trigger |
|-------|---------|
| godot-gdscript | "GDScript", "Godot script", "signal", "typed var" |
| godot-csharp | "Godot C#", "GodotSharp", "C# node" |
| godot-shaders | "Godot shader", "GLSL", "VisualShader", "SSR" |
| godot-gdextension | "GDExtension", "native module", "C++ Godot", "Rust Godot" |

### Game Systems
| Skill | Trigger |
|-------|---------|
| godot-ui | "UI", "Control nodes", "Theme", "HUD", "menu", "dialog" |
| godot-save | "save game", "persistence", "ConfigFile", "serialization" |
| godot-scenes | "scene loading", "level manager", "scene transition" |
| godot-input | "input", "controls", "rebinding", "gamepad", "combo" |
| godot-navigation | "pathfinding", "NavigationServer", "NavigationAgent" |
| godot-animation | "AnimationTree", "state machine", "IK", "root motion" |
| godot-audio | "AudioServer", "3D audio", "dynamic music" |
| godot-tilemap | "TileMap", "TileSet", "autotiling", "terrain" |
| godot-patterns | "FSM", "behavior tree", "ECS", "design pattern" |
| godot-multiplayer | "multiplayer", "netcode", "RPC", "rollback" |

### Specialized
| Skill | Trigger |
|-------|---------|
| godot-testing | "unit test", "GUT", "TDD", "integration test" |
| godot-xr-vp | "OpenXR", "VR Godot", "virtual production" |
| godot-assets | "Godot import", "Blender Godot", "Jolt physics" |
| godot-optimization | "profiling", "performance", "draw calls" |
| godot-genres | "RPG system", "FPS mechanics", "platformer", "RTS" |
| godot-engine-dev | "engine module", "custom renderer", "Godot source" |

## Commands

### Project Planning
- `/godot-gdd` - Generate Game Design Document from concept
- `/godot-structure` - Plan and create project directory structure

### Implementation
- `/godot-implement` - Implement a feature from specification
- `/godot-scene` - Generate scene templates (3D, 2D, UI, XR)
- `/godot-shader` - Create shaders (PBR, Toon, VFX, Post-Process)
- `/godot-fsm` - Generate state machine implementation

### Project Setup
- `/godot-export` - Configure export presets
- `/godot-nav` - NavigationMesh and NavigationAgent setup
- `/godot-audio` - Audio bus layout and management
- `/godot-netcode` - Multiplayer architecture setup

### Release
- `/godot-release` - Complete release workflow (export, package, deploy)

### Debugging
- `/godot-perf` - Performance profiling setup
- `/godot-xr` - XR project setup wizard

## Templates

### Studio Workflows
- `vp-starter` - Virtual Production setup
- `multiplayer-lobby` - Multiplayer with lobby system
- `procedural-world` - Procedural generation framework
- `shader-library` - Curated shader collection
- `blender-pipeline` - Blender asset import configuration
- `xr-interaction` - XR Interaction Toolkit
- `ci-cd-export` - GitHub Actions export workflow
- `profiling-dashboard` - Performance debugging setup

### Game Genres
- `rpg-starter` - Quest, dialogue, inventory, stats, leveling
- `fps-starter` - Weapons, recoil, hit detection, HUD
- `platformer-starter` - Jump buffer, coyote time, wall jump, dash
- `rts-starter` - Unit selection, building, fog of war, minimap
- `racing-starter` - Vehicle physics, checkpoints, AI racers
- `roguelike-starter` - Procedural rooms, permadeath, meta-progression

## Configuration

Configure in `.claude/godot-claude.local.md`:

```yaml
---
proactive_review: true
preferred_structure: standard
shader_style: pbr
export_platform: windows
xr_runtime: openxr
---
```

## Component Summary

| Category | Count |
|----------|-------|
| Skills | 20 |
| Commands | 13 |
| Agents | 6 |
| Templates | 14 |
| **Total** | **53** |

## License

MIT
