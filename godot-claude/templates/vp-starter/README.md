# Virtual Production Starter

A Godot 4.6 template for virtual production setups including LED wall rendering, camera tracking, and real-time compositing.

## Structure

```
vp-starter/
├── project.godot
├── scenes/
│   ├── main.tscn              # Main VP scene
│   ├── led_wall.tscn          # LED wall viewport
│   └── tracked_camera.tscn    # Camera with tracking
├── scripts/
│   ├── vp_manager.gd          # VP coordination
│   ├── led_wall_controller.gd # Frustum management
│   ├── camera_tracker.gd      # External tracking input
│   └── ndi_output.gd          # NDI broadcast (requires plugin)
├── environments/
│   └── studio.tres            # Studio environment
└── materials/
    └── led_wall.tres          # Wall material
```

## Features

- Tracked camera with external input (OSC/VRPN)
- LED wall frustum correction
- Real-time environment matching
- NDI output ready (requires GDExtension)
- Genlock-aware frame timing

## Setup

1. Copy this folder to your project
2. Configure tracking source in `camera_tracker.gd`
3. Set LED wall dimensions in `led_wall_controller.gd`
4. Connect to your tracking system

## Requirements

- Godot 4.6+
- For NDI: NDI GDExtension plugin
- For tracking: OSC or VRPN compatible system
