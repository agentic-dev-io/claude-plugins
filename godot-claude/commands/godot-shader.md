---
name: godot-shader
description: Generate Godot 4.6 shader files with preset effects
argument-hint: "--preset [pbr|toon|vfx|post] [shader-name]"
allowed-tools:
  - Write
  - Read
  - Glob
---

# Godot Shader Generator

Generate production-ready Godot 4.6 shaders with common presets.

## Arguments

Parse the user's arguments:
- `--preset`: Shader preset (pbr, toon, vfx, post) - default: pbr
- `shader-name`: Name for shader file - default based on preset

## Presets

### PBR (`--preset pbr`)
Full physically-based rendering shader:
- Albedo with texture
- Normal mapping
- Metallic/Roughness workflow
- Ambient occlusion
- Emission support

Output: `shaders/{name}.gdshader`

### Toon (`--preset toon`)
Cel/toon shading with:
- Stepped lighting
- Outline support
- Rim lighting
- Shadow color control

Output: `shaders/{name}.gdshader`

### VFX (`--preset vfx`)
Visual effects shaders:
- Dissolve effect
- Hologram
- Force field
- Energy shield

Ask user which VFX type they want.
Output: `shaders/vfx/{name}.gdshader`

### Post-Process (`--preset post`)
Screen-space effects:
- Vignette
- Chromatic aberration
- Film grain
- Color correction

Output: `shaders/post/{name}.gdshader`

## Shader Structure

Include proper Godot 4.6 shader syntax:
- Correct `shader_type` declaration
- Appropriate `render_mode` flags
- Well-organized uniforms with hints
- Clear comments for customization

## Material Creation

Optionally create accompanying `.tres` material file with default values.

## Output

After creation, report:
- Shader file location
- Available uniforms and their purposes
- How to apply (material setup)
- Performance considerations

## Tips

- Use `hint_range` for numeric uniforms
- Include `source_color` for color uniforms
- Document uniform purposes in comments
