---
name: Godot TileMap
description: This skill should be used when the user asks about "TileMap", "TileMapLayer", "TileSet", "TileSetSource", "autotile", "autotiling", "terrain", "terrain set", "tilemap physics", "tilemap collision", "tilemap navigation", "tile animation", "2D level design", "procedural tilemap", "chunked tilemap", or needs guidance on using TileMap and TileSet systems in Godot 4.x.
---

# Godot TileMap System (4.6)

Godot 4.x features a redesigned TileMap system with TileMapLayer nodes, powerful TileSet editor, terrain autotiling, and per-tile physics/navigation configuration.

## TileMap Basics

### TileMapLayer (Godot 4.3+)

Godot 4.3+ uses TileMapLayer instead of TileMap with multiple layers:

```gdscript
# Multiple TileMapLayer nodes for different layers
# Scene structure:
# World
# ├── Ground (TileMapLayer)
# ├── Walls (TileMapLayer)
# └── Decorations (TileMapLayer)

@onready var ground: TileMapLayer = $Ground
@onready var walls: TileMapLayer = $Walls
@onready var decorations: TileMapLayer = $Decorations

func _ready() -> void:
    # All layers share the same TileSet
    var tileset: TileSet = ground.tile_set

    # Each layer can have different z_index
    ground.z_index = 0
    walls.z_index = 1
    decorations.z_index = 2
```

### Setting Tiles Programmatically

```gdscript
func place_tile(layer: TileMapLayer, pos: Vector2i, source_id: int, atlas_coords: Vector2i) -> void:
    layer.set_cell(pos, source_id, atlas_coords)

func remove_tile(layer: TileMapLayer, pos: Vector2i) -> void:
    layer.erase_cell(pos)

func get_tile_info(layer: TileMapLayer, pos: Vector2i) -> Dictionary:
    return {
        "source_id": layer.get_cell_source_id(pos),
        "atlas_coords": layer.get_cell_atlas_coords(pos),
        "alternative_tile": layer.get_cell_alternative_tile(pos)
    }

# Convert world position to tile coordinates
func world_to_tile(world_pos: Vector2) -> Vector2i:
    return ground.local_to_map(ground.to_local(world_pos))

# Convert tile coordinates to world position
func tile_to_world(tile_pos: Vector2i) -> Vector2:
    return ground.to_global(ground.map_to_local(tile_pos))
```

## TileSet Configuration

### Atlas Sources

```gdscript
func create_tileset() -> TileSet:
    var tileset := TileSet.new()

    # Set tile size
    tileset.tile_size = Vector2i(16, 16)

    # Add atlas source
    var source := TileSetAtlasSource.new()
    source.texture = preload("res://sprites/tileset.png")
    source.texture_region_size = Vector2i(16, 16)

    # Add source to tileset
    var source_id: int = tileset.add_source(source)

    # Create tiles from atlas
    for x in range(10):
        for y in range(10):
            source.create_tile(Vector2i(x, y))

    return tileset
```

### Physics Layers

```gdscript
func setup_physics_layers(tileset: TileSet) -> void:
    # Add physics layer
    tileset.add_physics_layer()
    tileset.set_physics_layer_collision_layer(0, 1)  # Layer 1
    tileset.set_physics_layer_collision_mask(0, 1)   # Mask 1

    # Configure individual tile physics
    var source: TileSetAtlasSource = tileset.get_source(0) as TileSetAtlasSource
    var tile_data: TileData = source.get_tile_data(Vector2i(0, 0), 0)

    # Add collision polygon
    var polygon: PackedVector2Array = [
        Vector2(-8, -8),
        Vector2(8, -8),
        Vector2(8, 8),
        Vector2(-8, 8)
    ]
    tile_data.add_collision_polygon(0)
    tile_data.set_collision_polygon_points(0, 0, polygon)
```

### Navigation Layers

```gdscript
func setup_navigation_layers(tileset: TileSet) -> void:
    # Add navigation layer
    tileset.add_navigation_layer()
    tileset.set_navigation_layer_layers(0, 1)

    # Configure tile navigation
    var source: TileSetAtlasSource = tileset.get_source(0) as TileSetAtlasSource
    var tile_data: TileData = source.get_tile_data(Vector2i(1, 0), 0)

    # Set navigation polygon (walkable area)
    var nav_polygon := NavigationPolygon.new()
    nav_polygon.add_outline([
        Vector2(-8, -8),
        Vector2(8, -8),
        Vector2(8, 8),
        Vector2(-8, 8)
    ])
    nav_polygon.make_polygons_from_outlines()
    tile_data.set_navigation_polygon(0, nav_polygon)
```

## Terrain System (Autotiling)

### Terrain Setup

```gdscript
func setup_terrain(tileset: TileSet) -> void:
    # Add terrain set
    tileset.add_terrain_set()
    tileset.set_terrain_set_mode(0, TileSet.TERRAIN_MODE_MATCH_CORNERS_AND_SIDES)

    # Add terrain types
    tileset.add_terrain(0)
    tileset.set_terrain_name(0, 0, "Grass")
    tileset.set_terrain_color(0, 0, Color.GREEN)

    tileset.add_terrain(0)
    tileset.set_terrain_name(0, 1, "Dirt")
    tileset.set_terrain_color(0, 1, Color.BROWN)
```

### Terrain Bits Configuration

```gdscript
# Configure terrain peering bits for autotiling
func setup_terrain_tile(tileset: TileSet, atlas_coords: Vector2i, terrain_id: int) -> void:
    var source: TileSetAtlasSource = tileset.get_source(0) as TileSetAtlasSource
    var tile_data: TileData = source.get_tile_data(atlas_coords, 0)

    # Set terrain set
    tile_data.terrain_set = 0

    # Set center terrain
    tile_data.terrain = terrain_id

    # Set peering bits (for 3x3 bitmask)
    # TileSet.CELL_NEIGHBOR_* constants
    tile_data.set_terrain_peering_bit(TileSet.CELL_NEIGHBOR_TOP_LEFT_CORNER, terrain_id)
    tile_data.set_terrain_peering_bit(TileSet.CELL_NEIGHBOR_TOP_SIDE, terrain_id)
    tile_data.set_terrain_peering_bit(TileSet.CELL_NEIGHBOR_TOP_RIGHT_CORNER, terrain_id)
    tile_data.set_terrain_peering_bit(TileSet.CELL_NEIGHBOR_LEFT_SIDE, terrain_id)
    tile_data.set_terrain_peering_bit(TileSet.CELL_NEIGHBOR_RIGHT_SIDE, terrain_id)
    tile_data.set_terrain_peering_bit(TileSet.CELL_NEIGHBOR_BOTTOM_LEFT_CORNER, terrain_id)
    tile_data.set_terrain_peering_bit(TileSet.CELL_NEIGHBOR_BOTTOM_SIDE, terrain_id)
    tile_data.set_terrain_peering_bit(TileSet.CELL_NEIGHBOR_BOTTOM_RIGHT_CORNER, terrain_id)
```

### Using Terrains in Code

```gdscript
@onready var ground: TileMapLayer = $Ground

func paint_terrain(pos: Vector2i, terrain_set: int, terrain: int) -> void:
    # Paint single cell with terrain
    ground.set_cells_terrain_connect([pos], terrain_set, terrain)

func paint_terrain_area(cells: Array[Vector2i], terrain_set: int, terrain: int) -> void:
    # Paint multiple cells, connecting terrains
    ground.set_cells_terrain_connect(cells, terrain_set, terrain)

func paint_terrain_path(cells: Array[Vector2i], terrain_set: int, terrain: int) -> void:
    # Paint path without connecting to surroundings
    ground.set_cells_terrain_path(cells, terrain_set, terrain)

# Example: Paint a rectangle
func paint_rectangle(start: Vector2i, size: Vector2i, terrain: int) -> void:
    var cells: Array[Vector2i] = []
    for x in range(size.x):
        for y in range(size.y):
            cells.append(start + Vector2i(x, y))
    ground.set_cells_terrain_connect(cells, 0, terrain)
```

## Animated Tiles

```gdscript
func create_animated_tile(source: TileSetAtlasSource, start: Vector2i, frame_count: int) -> void:
    # Create animation columns
    source.set_tile_animation_columns(start, frame_count)
    source.set_tile_animation_separation(start, Vector2i(0, 0))

    # Set frame durations
    source.set_tile_animation_frames_count(start, frame_count)
    for i in range(frame_count):
        source.set_tile_animation_frame_duration(start, i, 0.1)  # 100ms per frame

    # Animation mode
    source.set_tile_animation_mode(start, TileSetAtlasSource.TILE_ANIMATION_MODE_DEFAULT)
    # or TILE_ANIMATION_MODE_RANDOM_START_TIMES for variation
```

## Procedural Generation

### Random Placement

```gdscript
class_name TileMapGenerator
extends Node

@export var ground_layer: TileMapLayer
@export var decoration_layer: TileMapLayer
@export var map_size: Vector2i = Vector2i(100, 100)

func generate() -> void:
    generate_ground()
    generate_decorations()

func generate_ground() -> void:
    var noise := FastNoiseLite.new()
    noise.seed = randi()
    noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
    noise.frequency = 0.05

    for x in range(map_size.x):
        for y in range(map_size.y):
            var value: float = noise.get_noise_2d(x, y)

            # Choose terrain based on noise
            var terrain: int
            if value < -0.2:
                terrain = 0  # Water
            elif value < 0.3:
                terrain = 1  # Grass
            else:
                terrain = 2  # Dirt

            var cells: Array[Vector2i] = [Vector2i(x, y)]
            ground_layer.set_cells_terrain_connect(cells, 0, terrain)

func generate_decorations() -> void:
    for x in range(map_size.x):
        for y in range(map_size.y):
            # 10% chance of decoration
            if randf() < 0.1:
                var ground_terrain: int = get_ground_terrain(Vector2i(x, y))
                if ground_terrain == 1:  # Only on grass
                    # Random decoration tile
                    var deco_coords: Vector2i = Vector2i(randi() % 4, 0)
                    decoration_layer.set_cell(Vector2i(x, y), 0, deco_coords)

func get_ground_terrain(pos: Vector2i) -> int:
    var tile_data: TileData = ground_layer.get_cell_tile_data(pos)
    if tile_data:
        return tile_data.terrain
    return -1
```

### Wave Function Collapse Pattern

```gdscript
class_name WFCTileMap
extends Node

@export var tilemap: TileMapLayer
@export var size: Vector2i = Vector2i(20, 20)

# Define adjacency rules
var rules: Dictionary = {
    "grass": ["grass", "dirt", "path"],
    "dirt": ["dirt", "grass", "water_edge"],
    "water": ["water", "water_edge"],
    "water_edge": ["water", "dirt"],
    "path": ["path", "grass"]
}

var tile_to_terrain: Dictionary = {
    "grass": 0,
    "dirt": 1,
    "water": 2,
    "water_edge": 3,
    "path": 4
}

var grid: Array[Array] = []  # Stores possible tiles for each cell

func _ready() -> void:
    initialize_grid()
    collapse_all()
    apply_to_tilemap()

func initialize_grid() -> void:
    grid.clear()
    for x in range(size.x):
        var column: Array = []
        for y in range(size.y):
            # All tiles possible initially
            column.append(rules.keys().duplicate())
        grid.append(column)

func collapse_all() -> void:
    while has_uncollapsed():
        # Find cell with lowest entropy (fewest options)
        var min_cell: Vector2i = find_min_entropy_cell()

        # Collapse it to random valid option
        var options: Array = grid[min_cell.x][min_cell.y]
        var chosen: String = options[randi() % options.size()]
        grid[min_cell.x][min_cell.y] = [chosen]

        # Propagate constraints
        propagate(min_cell)

func propagate(pos: Vector2i) -> void:
    var stack: Array[Vector2i] = [pos]

    while not stack.is_empty():
        var current: Vector2i = stack.pop_back()
        var current_tiles: Array = grid[current.x][current.y]

        # Check all neighbors
        for dir in [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]:
            var neighbor: Vector2i = current + dir
            if not is_valid_pos(neighbor):
                continue

            var neighbor_tiles: Array = grid[neighbor.x][neighbor.y]
            var valid_tiles: Array = []

            # Filter neighbor tiles based on current possibilities
            for n_tile in neighbor_tiles:
                var is_valid: bool = false
                for c_tile in current_tiles:
                    if n_tile in rules[c_tile]:
                        is_valid = true
                        break
                if is_valid:
                    valid_tiles.append(n_tile)

            # If changed, add to stack
            if valid_tiles.size() < neighbor_tiles.size():
                grid[neighbor.x][neighbor.y] = valid_tiles
                stack.append(neighbor)

func apply_to_tilemap() -> void:
    for x in range(size.x):
        for y in range(size.y):
            var tile_name: String = grid[x][y][0]
            var terrain: int = tile_to_terrain[tile_name]
            tilemap.set_cells_terrain_connect([Vector2i(x, y)], 0, terrain)
```

## Chunked TileMap

For large worlds:

```gdscript
class_name ChunkedTileMap
extends Node2D

const CHUNK_SIZE: int = 16

@export var tileset: TileSet
@export var view_distance: int = 2

var chunks: Dictionary = {}  # Vector2i -> TileMapLayer
var player: Node2D

func _process(delta: float) -> void:
    if not player:
        return

    var player_chunk: Vector2i = world_to_chunk(player.global_position)
    update_chunks(player_chunk)

func world_to_chunk(world_pos: Vector2) -> Vector2i:
    var tile_size: Vector2i = tileset.tile_size
    return Vector2i(
        int(world_pos.x / (CHUNK_SIZE * tile_size.x)),
        int(world_pos.y / (CHUNK_SIZE * tile_size.y))
    )

func update_chunks(center: Vector2i) -> void:
    var needed_chunks: Array[Vector2i] = []

    # Determine which chunks we need
    for x in range(-view_distance, view_distance + 1):
        for y in range(-view_distance, view_distance + 1):
            needed_chunks.append(center + Vector2i(x, y))

    # Unload far chunks
    var chunks_to_remove: Array[Vector2i] = []
    for chunk_pos in chunks.keys():
        if chunk_pos not in needed_chunks:
            chunks_to_remove.append(chunk_pos)

    for chunk_pos in chunks_to_remove:
        unload_chunk(chunk_pos)

    # Load needed chunks
    for chunk_pos in needed_chunks:
        if chunk_pos not in chunks:
            load_chunk(chunk_pos)

func load_chunk(chunk_pos: Vector2i) -> void:
    var chunk := TileMapLayer.new()
    chunk.tile_set = tileset
    chunk.position = Vector2(chunk_pos) * CHUNK_SIZE * tileset.tile_size

    # Generate or load chunk data
    generate_chunk(chunk, chunk_pos)

    add_child(chunk)
    chunks[chunk_pos] = chunk

func unload_chunk(chunk_pos: Vector2i) -> void:
    var chunk: TileMapLayer = chunks[chunk_pos]
    # Optionally save chunk data here
    chunk.queue_free()
    chunks.erase(chunk_pos)

func generate_chunk(chunk: TileMapLayer, chunk_pos: Vector2i) -> void:
    var seed_offset: int = chunk_pos.x * 1000 + chunk_pos.y
    var noise := FastNoiseLite.new()
    noise.seed = 12345 + seed_offset

    for x in range(CHUNK_SIZE):
        for y in range(CHUNK_SIZE):
            var world_x: int = chunk_pos.x * CHUNK_SIZE + x
            var world_y: int = chunk_pos.y * CHUNK_SIZE + y
            var value: float = noise.get_noise_2d(world_x, world_y)

            var terrain: int = 0 if value < 0 else 1
            chunk.set_cells_terrain_connect([Vector2i(x, y)], 0, terrain)
```

## Custom Data Layers

Store additional data per tile:

```gdscript
func setup_custom_data(tileset: TileSet) -> void:
    # Add custom data layer
    tileset.add_custom_data_layer()
    tileset.set_custom_data_layer_name(0, "damage")
    tileset.set_custom_data_layer_type(0, TYPE_INT)

    tileset.add_custom_data_layer()
    tileset.set_custom_data_layer_name(1, "walkable")
    tileset.set_custom_data_layer_type(1, TYPE_BOOL)

func get_tile_custom_data(layer: TileMapLayer, pos: Vector2i, data_name: String) -> Variant:
    var tile_data: TileData = layer.get_cell_tile_data(pos)
    if tile_data:
        return tile_data.get_custom_data(data_name)
    return null

# Usage
func check_tile_damage(pos: Vector2i) -> int:
    var damage: Variant = get_tile_custom_data(ground, pos, "damage")
    return damage if damage else 0

func is_tile_walkable(pos: Vector2i) -> bool:
    var walkable: Variant = get_tile_custom_data(ground, pos, "walkable")
    return walkable if walkable != null else true
```

## Performance Tips

```gdscript
# Batch cell updates
func update_many_cells(cells: Dictionary) -> void:
    # cells = {Vector2i: {source_id, atlas_coords}}
    for pos in cells:
        var data: Dictionary = cells[pos]
        ground.set_cell(pos, data.source_id, data.atlas_coords)

    # Force update after batch
    ground.update_internals()

# Use y_sort for proper depth sorting
func _ready() -> void:
    ground.y_sort_enabled = true
    decorations.y_sort_enabled = true

# Disable processing for static tilemaps
func _ready() -> void:
    ground.set_process(false)
    ground.set_physics_process(false)
```
