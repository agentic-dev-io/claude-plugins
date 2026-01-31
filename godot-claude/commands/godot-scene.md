---
name: godot-scene
description: Generate Godot 4.6 scene templates with starter code
argument-hint: "--type [3d|2d|ui|xr] [scene-name]"
allowed-tools:
  - Write
  - Read
  - Glob
  - Bash
---

# Godot Scene Generator

Generate production-ready Godot 4.6 scene templates with proper structure and starter code.

## Arguments

Parse the user's arguments to determine:
- `--type`: Scene type (3d, 2d, ui, xr) - default: 3d
- `scene-name`: Name for the scene - default: "new_scene"

## Execution

1. **Determine project root** by finding `project.godot`:
   ```bash
   find . -name "project.godot" -type f 2>/dev/null | head -1
   ```

2. **Create scene based on type**:

### 3D Scene (default)
Create files:
- `scenes/{name}.tscn` - Scene file
- `scripts/{name}.gd` - Main script

Scene structure:
```
Node3D (root)
├── WorldEnvironment
├── DirectionalLight3D
├── Camera3D
└── (content placeholder)
```

### 2D Scene
Create files:
- `scenes/{name}.tscn`
- `scripts/{name}.gd`

Scene structure:
```
Node2D (root)
├── Camera2D
├── CanvasLayer (UI)
└── (content placeholder)
```

### UI Scene
Create files:
- `scenes/ui/{name}.tscn`
- `scripts/ui/{name}.gd`

Scene structure:
```
Control (root)
├── MarginContainer
│   └── VBoxContainer
│       ├── Label (title)
│       └── (content placeholder)
```

### XR Scene
Create files:
- `scenes/{name}.tscn`
- `scripts/{name}.gd`

Scene structure:
```
Node3D (root)
├── WorldEnvironment
├── XROrigin3D
│   ├── XRCamera3D
│   ├── XRController3D (left)
│   └── XRController3D (right)
└── (environment placeholder)
```

## Script Templates

Include typed GDScript 4.6 patterns:
- `@onready` for node references
- Typed variables and return values
- Signal declarations where appropriate
- `_ready()` and `_process()` stubs

## Output

After creation, report:
- Files created
- Scene structure
- Suggested next steps

## Tips

- Use standard Godot project structure (res://scenes/, res://scripts/)
- Include proper class_name declarations
- Add useful comments for customization points
