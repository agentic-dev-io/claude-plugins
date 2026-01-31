---
name: godot-perf
description: Set up Godot 4.6 performance profiling and analysis
argument-hint: "--analyze [scene|script|rendering|physics|all]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
---

# Godot Performance Profiler

Set up performance profiling and analyze Godot 4.6 projects for optimization opportunities.

## Arguments

Parse the user's arguments:
- `--analyze`: Analysis target (scene, script, rendering, physics, all)
- Default: all

## Analysis Types

### Scene Analysis (`--analyze scene`)
Examine scene files for:
- Node count and hierarchy depth
- Duplicate resources
- Missing resources
- Heavy nodes (particles, lights)

Check patterns:
```
*.tscn files → node count, resource refs
*.tres files → resource size, dependencies
```

### Script Analysis (`--analyze script`)
Review GDScript/C# for:
- `_process()` vs `_physics_process()` usage
- Object allocation in loops
- Signal connection patterns
- Unnecessary `await` in tight loops

Check patterns:
```gdscript
# Red flags
func _process(delta):
    var new_vec = Vector2()  # Allocation every frame
    $Node/Deep/Path  # Repeated node lookup
```

### Rendering Analysis (`--analyze rendering`)
Check for:
- Draw call estimation (MeshInstance3D count)
- Shader complexity
- Texture sizes and formats
- Light and shadow settings
- Overdraw potential (transparent materials)

### Physics Analysis (`--analyze physics`)
Review Jolt Physics setup:
- Collision shape complexity
- Physics body counts
- Collision layer/mask efficiency
- RayCast usage patterns

## Profiling Setup

Generate debug overlay script:
```gdscript
# debug/performance_overlay.gd
extends CanvasLayer

@onready var label: Label = $Label

func _process(delta: float) -> void:
    var fps = Engine.get_frames_per_second()
    var mem = OS.get_static_memory_usage() / 1048576.0
    var objects = Performance.get_monitor(Performance.OBJECT_COUNT)

    label.text = "FPS: %d\nMem: %.1f MB\nObjects: %d" % [fps, mem, objects]
```

## Output Report

Generate performance report including:
1. **Summary**: Overall health score
2. **Issues Found**: Categorized by severity
3. **Recommendations**: Specific optimization steps
4. **Profiler Guide**: How to use built-in profiler

## Optimization Tips

Include common optimizations:
- Object pooling for bullets/particles
- LOD setup for 3D scenes
- Shader optimization techniques
- Physics shape simplification

## Output

After analysis, report:
- Issues found with file locations
- Severity ratings (critical, warning, info)
- Specific fix recommendations
- Links to relevant Godot documentation

## Tips

- Run profiler in release build for accurate metrics
- Use Godot's built-in Debugger > Profiler tab
- Monitor both CPU and GPU performance
- Test on minimum spec target hardware
