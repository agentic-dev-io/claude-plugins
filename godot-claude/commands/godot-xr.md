---
name: godot-xr
description: Set up Godot 4.6 XR project with OpenXR 1.1
argument-hint: "--runtime [openxr|webxr] [--platform quest|pcvr|pico]"
allowed-tools:
  - Write
  - Read
  - Glob
  - Bash
---

# Godot XR Setup Wizard

Configure a complete XR project for Godot 4.6 with OpenXR 1.1 support.

## Arguments

Parse the user's arguments:
- `--runtime`: XR runtime (openxr, webxr) - default: openxr
- `--platform`: Target platform (quest, pcvr, pico) - default: pcvr
- Multiple platforms supported

## Setup Steps

### 1. Project Settings Configuration

Enable required settings:
```
XR > OpenXR > Enabled = true
XR > Shaders > Enabled = true
Rendering > Renderer > Rendering Method = Forward+
Rendering > VRS > Mode = XR
Display > Window > VSync > VSync Mode = Disabled (XR manages sync)
```

### 2. Scene Structure

Create XR scene template:
```
XROrigin3D
├── XRCamera3D
├── XRController3D (tracker: left_hand)
│   ├── MeshInstance3D (controller model)
│   └── RayCast3D (interaction ray)
├── XRController3D (tracker: right_hand)
│   ├── MeshInstance3D (controller model)
│   └── RayCast3D (interaction ray)
├── WorldEnvironment
│   └── Environment (XR-optimized)
└── DirectionalLight3D
```

### 3. Input Actions

Create XR-specific input actions:
- `xr_trigger` - Trigger press
- `xr_grip` - Grip press
- `xr_primary` - Thumbstick
- `xr_button_a` - A/X button
- `xr_button_b` - B/Y button
- `xr_menu` - Menu button

### 4. Platform-Specific Setup

#### Meta Quest (`--platform quest`)
- Android export preset with XR features
- Hand tracking support
- Passthrough configuration
- 72/90/120 Hz refresh rate options

#### PC VR (`--platform pcvr`)
- SteamVR/Oculus runtime support
- Room-scale configuration
- Boundary system integration

#### Pico (`--platform pico`)
- Pico OpenXR runtime
- Android export with Pico SDK

### 5. WebXR Setup (`--runtime webxr`)

Additional configuration for browser-based XR:
- HTML5 export preset
- WebXR feature detection
- Fallback for non-XR browsers
- Required server headers

## Generated Files

1. **scenes/xr_main.tscn** - Main XR scene
2. **scripts/xr_player.gd** - XR player controller
3. **scripts/xr_hand.gd** - Hand/controller script
4. **scripts/xr_teleport.gd** - Teleportation locomotion
5. **scripts/xr_grab.gd** - Object grabbing
6. **project.godot updates** - XR settings

## Interaction Systems

Include scripts for:
- **Teleportation** - Arc pointer with valid surface detection
- **Snap Turn** - Comfortable rotation
- **Grabbing** - Physics-based object interaction
- **UI Interaction** - Laser pointer for 3D UI

## Output

After setup, report:
- Files created
- Project settings changed
- Required export configuration
- Testing instructions (how to run in headset)
- Platform-specific notes

## Tips

- Test frequently on actual hardware
- Start with simple scenes for performance baseline
- Use Variable Rate Shading (VRS) for performance
- Keep draw calls low for mobile XR (< 100)
- Maintain 72+ FPS for comfortable experience
