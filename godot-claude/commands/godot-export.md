---
name: godot-export
description: Configure Godot 4.6 export presets for target platforms
argument-hint: "--platform [windows|linux|macos|android|ios|web]"
allowed-tools:
  - Write
  - Read
  - Glob
  - Bash
---

# Godot Export Configuration

Configure export presets for Godot 4.6 with platform-specific optimizations.

## Arguments

Parse the user's arguments:
- `--platform`: Target platform (windows, linux, macos, android, ios, web)
- Multiple platforms can be specified: `--platform windows linux`

## Platform Configurations

### Windows
- Default renderer: Direct3D 12 (Godot 4.6 default)
- Fallback: Vulkan
- Architecture: x86_64
- Icon and version info configuration

Export preset additions:
```ini
[preset.windows]
name="Windows"
platform="Windows Desktop"
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
binary_format/embed_pck=true
texture_format/bptc=true
texture_format/s3tc=true
```

### Linux
- Renderer: Vulkan
- Architecture: x86_64
- AppImage recommendations

### macOS
- Universal binary (arm64 + x86_64)
- Code signing notes
- Notarization requirements

### Android
- Minimum SDK: 24 (Android 7.0)
- Target SDK: 34
- Vulkan renderer
- ARM64 primary, ARMv7 optional
- Keystore configuration guide

### iOS
- Minimum iOS: 12.0
- Code signing requirements
- Capabilities configuration

### Web
- Threads enabled (SharedArrayBuffer)
- WASM SIMD
- Progressive Web App configuration
- Server MIME type requirements

## Generated Files

1. **export_presets.cfg** - Main export configuration
2. **Platform-specific**:
   - Windows: `.ico` icon template location
   - Android: `export_credentials.cfg` template
   - iOS: `Export Options.plist` notes

## CI/CD Integration

Generate GitHub Actions workflow for automated exports:
- `.github/workflows/godot-export.yml`
- Uses official Godot export Docker image
- Uploads artifacts

## Output

After configuration, report:
- Export preset location
- Required setup steps (signing, icons, etc.)
- Build command: `godot --headless --export-release "Preset Name" output_path`
- CI/CD integration options

## Tips

- Always test exports on actual target hardware
- Windows D3D12 is default in 4.6 - test Vulkan fallback
- Web exports need proper server headers for SharedArrayBuffer
