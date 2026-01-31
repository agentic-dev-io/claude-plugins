# godot-claude

A comprehensive Claude Code plugin for professional Godot 4.6 development in studios.

## Features

- **15 Skills** covering all aspects of Godot development
- **9 Commands** for project scaffolding and setup
- **2 Agents** for code review and performance analysis
- **14 Project Templates** for common game genres and workflows

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
| godot-navigation | "pathfinding", "NavigationServer", "NavigationAgent", "avoidance" |
| godot-animation | "AnimationTree", "state machine", "IK", "root motion" |
| godot-audio | "AudioServer", "3D audio", "dynamic music", "audio bus" |
| godot-tilemap | "TileMap", "TileSet", "autotiling", "terrain" |
| godot-patterns | "FSM", "behavior tree", "ECS", "design pattern" |
| godot-multiplayer | "multiplayer", "netcode", "RPC", "rollback" |

### Specialized
| Skill | Trigger |
|-------|---------|
| godot-xr-vp | "OpenXR", "VR Godot", "virtual production", "LibGodot" |
| godot-assets | "Godot import", "Blender Godot", "collision shape", "Jolt" |
| godot-optimization | "profiling", "performance", "draw calls", "MultiMesh" |
| godot-genres | "RPG system", "FPS mechanics", "platformer", "RTS" |
| godot-engine-dev | "engine module", "custom renderer", "Godot source", "SCons" |

## Commands

### Scene & Code Generation
- `/godot-scene` - Generate scene templates (3D, 2D, UI, XR)
- `/godot-shader` - Create shaders (PBR, Toon, VFX, Post-Process)
- `/godot-fsm` - Generate state machine implementation (GDScript/C#)

### Project Setup
- `/godot-export` - Configure export presets (Windows, Linux, Android, Web)
- `/godot-nav` - NavigationMesh and NavigationAgent setup wizard
- `/godot-audio` - Audio bus layout and management system
- `/godot-netcode` - Multiplayer architecture setup (authoritative/p2p/rollback)

### Debugging & Testing
- `/godot-perf` - Performance profiling setup
- `/godot-xr` - XR project setup wizard

## Agents

### godot-code-reviewer
Reviews GDScript, C#, and shader code for best practices and performance.

### godot-performance-analyzer
Analyzes scenes and scripts for performance issues, recommending optimizations.

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

## Component Summary

| Category | Count | New in this version |
|----------|-------|---------------------|
| Skills | 15 | +9 |
| Commands | 9 | +4 |
| Agents | 2 | +1 |
| Templates | 14 | +6 |
| **Total** | **40** | **+20** |

## License

MIT
