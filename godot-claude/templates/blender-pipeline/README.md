# Blender Asset Pipeline

Configuration and scripts for streamlined Blender-to-Godot 4.6 asset workflow.

## Structure

```
blender-pipeline/
├── blender/
│   ├── godot_export_preset.py # Blender export operator
│   ├── naming_conventions.md  # Asset naming guide
│   └── material_setup.md      # Material workflow
├── godot/
│   ├── import_scripts/        # Post-import processors
│   │   ├── character_import.gd
│   │   ├── prop_import.gd
│   │   └── environment_import.gd
│   └── import_presets/        # .import configurations
│       ├── character.preset
│       ├── prop.preset
│       └── environment.preset
├── conventions/
│   ├── collision_suffixes.md  # -col, -trimesh, etc.
│   ├── lod_naming.md          # _LOD0, _LOD1, etc.
│   └── material_slots.md      # Material organization
└── examples/
    ├── character_example.blend
    └── prop_example.blend
```

## Naming Conventions

### Collision Shapes
```
MeshName-col        # Convex collision (auto-generated)
MeshName-colonly    # Collision only, no visual
MeshName-trimesh    # Triangle mesh (static only)
```

### LOD Levels
```
MeshName_LOD0       # Highest detail (render)
MeshName_LOD1       # Medium detail
MeshName_LOD2       # Low detail (distant)
```

### Animation
```
AnimationName-loop  # Looping animation
AnimationName-cycle # Ping-pong animation
```

## Blender Export Settings

Recommended glTF export configuration:
- Format: glTF Binary (.glb)
- Transform: +Y Up
- Geometry: Apply Modifiers, UVs, Normals, Tangents
- Animation: Actions, NLA Tracks
- Compression: None (or Draco for web)

## Godot Import Settings

### Characters
- Animation import: Enabled
- Root type: CharacterBody3D
- Skeleton optimization: Enabled

### Props
- Generate collisions: Based on suffixes
- LOD generation: Automatic
- Lightmap UV2: Generate

### Environments
- Occlusion culling: Enabled
- Generate LODs: Enabled
- Merge meshes: Where appropriate

## Workflow

1. **Model in Blender** following naming conventions
2. **Export as GLB** using preset
3. **Import to Godot** - scripts auto-process
4. **Fine-tune** materials and collisions
5. **Save as scene** for reuse

## Requirements

- Blender 4.0+
- Godot 4.6+
- glTF export addon (built-in)
