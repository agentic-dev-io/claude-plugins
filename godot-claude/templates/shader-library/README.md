# Shader Library

A curated collection of production-ready shaders for Godot 4.6.

## Structure

```
shader-library/
├── spatial/                   # 3D shaders
│   ├── pbr_extended.gdshader  # Enhanced PBR
│   ├── toon_advanced.gdshader # Cel shading
│   ├── dissolve.gdshader      # Dissolve effect
│   ├── hologram.gdshader      # Hologram effect
│   ├── force_field.gdshader   # Energy shield
│   ├── water_surface.gdshader # Water rendering
│   └── triplanar.gdshader     # Triplanar mapping
├── canvas_item/               # 2D shaders
│   ├── outline.gdshader       # Sprite outline
│   ├── blur.gdshader          # Gaussian blur
│   ├── pixelate.gdshader      # Pixel effect
│   ├── wave.gdshader          # Wave distortion
│   └── palette_swap.gdshader  # Color palette
├── post_process/              # Screen effects
│   ├── vignette.gdshader
│   ├── chromatic_aberration.gdshader
│   ├── film_grain.gdshader
│   ├── color_correction.gdshader
│   └── crt.gdshader           # CRT monitor effect
├── particles/                 # Particle shaders
│   ├── fire.gdshader
│   ├── smoke.gdshader
│   └── magic.gdshader
└── materials/                 # Pre-configured materials
    ├── metal.tres
    ├── plastic.tres
    ├── glass.tres
    └── fabric.tres
```

## Usage

1. Copy desired shaders to your project's `shaders/` folder
2. Create ShaderMaterial and assign shader
3. Configure uniforms in Inspector
4. Apply material to mesh/sprite

## Shader Previews

Each shader includes:
- Documented uniforms
- Performance notes
- Example usage
- Recommended values

## Categories

### Spatial (3D)
For MeshInstance3D, CSG, and 3D objects.

### Canvas Item (2D)
For Sprite2D, Control, and 2D objects.

### Post-Process
Apply via SubViewport or CompositorEffect.

### Particles
For GPUParticles3D custom processing.

## Performance Notes

- **Mobile-friendly**: outline, pixelate, vignette
- **Desktop recommended**: water_surface, SSR shaders
- **Heavy**: film_grain (many samples), complex dissolve

## Requirements

- Godot 4.6+
- Forward+ renderer for advanced effects
- Vulkan/D3D12 for compute-based shaders
