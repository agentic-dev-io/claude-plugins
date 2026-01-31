# Procedural World Generation

A Godot 4.6 template for procedural world generation with chunking, noise-based terrain, and runtime mesh generation.

## Structure

```
procedural-world/
├── project.godot
├── scenes/
│   ├── world.tscn             # Main world scene
│   ├── chunk.tscn             # Chunk template
│   └── player.tscn            # Player with chunk loading
├── scripts/
│   ├── world_generator.gd     # Main generation controller
│   ├── chunk_manager.gd       # Chunk loading/unloading
│   ├── terrain_generator.gd   # Heightmap generation
│   ├── mesh_generator.gd      # Runtime mesh creation
│   ├── biome_manager.gd       # Biome selection
│   └── prop_placer.gd         # Object scattering
├── resources/
│   ├── noise_settings.tres    # FastNoiseLite config
│   ├── biomes/
│   │   ├── forest.tres
│   │   ├── desert.tres
│   │   └── mountain.tres
│   └── props/
│       ├── tree_spawner.tres
│       └── rock_spawner.tres
└── shaders/
    └── terrain.gdshader       # Terrain splatmap shader
```

## Features

- Infinite terrain with chunk streaming
- FastNoiseLite-based heightmaps
- Multi-biome support
- LOD for distant chunks
- Threaded generation
- Object scattering with density maps
- Collision generation

## Architecture

```
WorldGenerator
├── ChunkManager (loads/unloads around player)
│   └── Chunks (GridMap or MeshInstance3D)
├── TerrainGenerator (heightmap + normals)
├── BiomeManager (biome selection by position)
└── PropPlacer (trees, rocks, etc.)
```

## Configuration

### Noise Settings
```gdscript
var noise = FastNoiseLite.new()
noise.noise_type = FastNoiseLite.TYPE_PERLIN
noise.frequency = 0.01
noise.fractal_octaves = 4
```

### Chunk Settings
```gdscript
const CHUNK_SIZE = 32        # Units per chunk
const CHUNK_HEIGHT = 64      # Max terrain height
const VIEW_DISTANCE = 5      # Chunks to load
const LOD_DISTANCE = 3       # Full detail distance
```

## Usage

1. Configure noise in `noise_settings.tres`
2. Define biomes in `resources/biomes/`
3. Set up prop spawners
4. Adjust chunk settings for performance
5. Add custom generation rules

## Performance Tips

- Use threading for generation
- Pool chunk instances
- LOD for distant terrain
- Occlusion culling
- Combine meshes where possible

## Requirements

- Godot 4.6+
- Sufficient RAM for chunk streaming
- GPU for large terrain rendering
