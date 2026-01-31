# XR Interaction Toolkit

A Godot 4.6 template for XR applications with OpenXR 1.1 support, teleportation, grabbing, and UI interaction.

## Structure

```
xr-interaction/
├── project.godot
├── scenes/
│   ├── xr_main.tscn           # Main XR scene
│   ├── xr_player.tscn         # Player rig
│   ├── hand_left.tscn         # Left controller
│   └── hand_right.tscn        # Right controller
├── scripts/
│   ├── xr_player.gd           # Player controller
│   ├── xr_hand.gd             # Hand/controller logic
│   ├── xr_teleport.gd         # Teleportation
│   ├── xr_grab.gd             # Object grabbing
│   ├── xr_ui_pointer.gd       # UI interaction
│   └── xr_grabbable.gd        # Grabbable object component
├── materials/
│   ├── teleport_valid.tres
│   ├── teleport_invalid.tres
│   └── laser_pointer.tres
└── input/
    └── xr_actions.tres        # XR input actions
```

## Features

- OpenXR 1.1 with fallback support
- Teleportation with arc pointer
- Physics-based grabbing
- Snap turn locomotion
- 3D UI interaction
- Hand tracking ready
- Quest/PCVR/Pico support

## Setup

1. Copy this folder to your project
2. Enable XR in Project Settings
3. Configure target platform in export presets
4. Test with your headset

## Platforms

- **Meta Quest**: Android export with OpenXR
- **PC VR**: Windows export, SteamVR/Oculus
- **Pico**: Android export with Pico runtime

## Requirements

- Godot 4.6+
- OpenXR-compatible headset
- For Quest: Android build tools
