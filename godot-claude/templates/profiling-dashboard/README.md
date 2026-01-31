# Profiling Dashboard

A Godot 4.6 debug overlay and profiling toolkit for performance monitoring.

## Structure

```
profiling-dashboard/
├── scenes/
│   └── profiling_overlay.tscn # Debug overlay scene
├── scripts/
│   ├── profiling_overlay.gd   # Main overlay controller
│   ├── fps_counter.gd         # FPS tracking
│   ├── memory_monitor.gd      # Memory usage
│   ├── draw_call_counter.gd   # Rendering stats
│   ├── physics_monitor.gd     # Physics performance
│   └── custom_profiler.gd     # Custom markers
├── themes/
│   └── debug_theme.tres       # Overlay styling
└── autoload/
    └── profiler.gd            # Global profiler singleton
```

## Features

- Real-time FPS counter with graph
- Memory usage tracking
- Draw call monitoring
- Physics body count
- Custom profiler markers
- Screenshot with stats
- CSV export

## Overlay Sections

### Performance Panel
- FPS (current, min, max, average)
- Frame time graph
- CPU/GPU time split

### Memory Panel
- Static memory usage
- Video memory
- Object count
- Resource count

### Rendering Panel
- Draw calls
- Vertices
- Material changes
- Shader compilations

### Physics Panel
- Active bodies
- Collision pairs
- Physics step time

## Usage

### Enable Overlay
```gdscript
# In autoload or main scene
Profiler.show_overlay()
Profiler.hide_overlay()
Profiler.toggle_overlay()  # Default: F3
```

### Custom Markers
```gdscript
# Profile custom code sections
Profiler.begin("enemy_ai")
# ... AI code ...
Profiler.end("enemy_ai")

# Or use scope helper
func _process(delta):
    var _scope = Profiler.scope("player_movement")
    # ... movement code ...
    # Automatically ends when _scope goes out of scope
```

### Export Data
```gdscript
# Export performance data to CSV
Profiler.export_csv("res://profiling_data.csv")
```

## Hotkeys

- `F3` - Toggle overlay
- `F4` - Toggle graph view
- `F5` - Take screenshot with stats
- `F6` - Export CSV

## Integration

1. Add `profiler.gd` to AutoLoad
2. Instance `profiling_overlay.tscn` in main scene (or let autoload handle it)
3. Use custom markers in performance-critical code

## Configuration

```gdscript
# profiler.gd settings
var update_interval: float = 0.5  # Seconds between updates
var graph_history: int = 60       # Frames to show in graph
var show_in_release: bool = false # Hide in release builds
```

## Requirements

- Godot 4.6+
- Debug build for full metrics
- CanvasLayer available
