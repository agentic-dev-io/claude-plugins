---
name: godot-nav
description: Setup NavigationMesh and NavigationAgent for Godot 4.6 scenes
argument-hint: "[2d|3d] [scene-name]"
allowed-tools:
  - Write
  - Read
  - Glob
  - Bash
---

# Navigation Setup Wizard

Configure NavigationMesh, NavigationRegion, and NavigationAgent for 2D or 3D Godot 4.6 projects.

## Arguments

Parse the user's arguments:
- `dimension`: 2d or 3d - default: 3d
- `scene-name`: Name for the navigation-enabled scene - default: "navigation_test"

## Execution

1. **Determine project root** by finding `project.godot`

2. **Create navigation components based on dimension**:

### 3D Navigation Setup

**scenes/{scene_name}.tscn** - Scene with navigation:
```
Node3D (root)
├── WorldEnvironment
├── DirectionalLight3D
├── NavigationRegion3D
│   └── MeshInstance3D (level geometry)
├── Obstacles (Node3D)
│   └── NavigationObstacle3D
├── AICharacter
│   ├── MeshInstance3D
│   ├── CollisionShape3D
│   └── NavigationAgent3D
└── Camera3D
```

**scripts/navigation/ai_navigation_3d.gd**:
```gdscript
class_name AINavigation3D
extends CharacterBody3D

@export var move_speed: float = 5.0
@export var acceleration: float = 10.0
@export var rotation_speed: float = 10.0

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

var target_position: Vector3

func _ready() -> void:
    # Navigation agent configuration
    nav_agent.path_desired_distance = 0.5
    nav_agent.target_desired_distance = 0.5
    nav_agent.avoidance_enabled = true
    nav_agent.radius = 0.5
    nav_agent.max_speed = move_speed

    # Connect signals
    nav_agent.velocity_computed.connect(_on_velocity_computed)
    nav_agent.navigation_finished.connect(_on_navigation_finished)

func set_target(target: Vector3) -> void:
    target_position = target
    nav_agent.target_position = target

func _physics_process(delta: float) -> void:
    if nav_agent.is_navigation_finished():
        return

    var next_pos: Vector3 = nav_agent.get_next_path_position()
    var direction: Vector3 = (next_pos - global_position).normalized()

    # Rotate towards movement direction
    if direction.length() > 0.1:
        var target_rotation: float = atan2(direction.x, direction.z)
        rotation.y = lerp_angle(rotation.y, target_rotation, rotation_speed * delta)

    # Use avoidance
    nav_agent.velocity = direction * move_speed

func _on_velocity_computed(safe_velocity: Vector3) -> void:
    velocity = velocity.lerp(safe_velocity, 0.5)
    move_and_slide()

func _on_navigation_finished() -> void:
    velocity = Vector3.ZERO
```

**scripts/navigation/nav_region_setup_3d.gd**:
```gdscript
extends NavigationRegion3D

@export var auto_bake: bool = true
@export var bake_on_ready: bool = true

func _ready() -> void:
    if bake_on_ready:
        call_deferred("_bake_navigation")

    bake_finished.connect(_on_bake_finished)

func _bake_navigation() -> void:
    if not navigation_mesh:
        navigation_mesh = NavigationMesh.new()
        _configure_navmesh()

    bake_navigation_mesh()

func _configure_navmesh() -> void:
    # Agent parameters
    navigation_mesh.agent_height = 2.0
    navigation_mesh.agent_radius = 0.5
    navigation_mesh.agent_max_climb = 0.5
    navigation_mesh.agent_max_slope = 45.0

    # Cell parameters
    navigation_mesh.cell_size = 0.25
    navigation_mesh.cell_height = 0.25

    # Geometry parsing
    navigation_mesh.geometry_parsed_geometry_type = NavigationMesh.PARSED_GEOMETRY_STATIC_COLLIDERS
    navigation_mesh.geometry_source_geometry_mode = NavigationMesh.SOURCE_GEOMETRY_ROOT_NODE_CHILDREN

    # Filter settings
    navigation_mesh.filter_low_hanging_obstacles = true
    navigation_mesh.filter_ledge_spans = true
    navigation_mesh.filter_walkable_low_height_spans = true

func _on_bake_finished() -> void:
    print("Navigation mesh baked successfully")

func rebake() -> void:
    bake_navigation_mesh()
```

### 2D Navigation Setup

**scenes/{scene_name}.tscn** - 2D scene with navigation:
```
Node2D (root)
├── NavigationRegion2D
│   └── TileMapLayer
├── Obstacles (Node2D)
│   └── NavigationObstacle2D
├── AICharacter2D
│   ├── Sprite2D
│   ├── CollisionShape2D
│   └── NavigationAgent2D
└── Camera2D
```

**scripts/navigation/ai_navigation_2d.gd**:
```gdscript
class_name AINavigation2D
extends CharacterBody2D

@export var move_speed: float = 200.0
@export var acceleration: float = 1000.0

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D

var target_position: Vector2

func _ready() -> void:
    nav_agent.path_desired_distance = 4.0
    nav_agent.target_desired_distance = 4.0
    nav_agent.avoidance_enabled = true
    nav_agent.radius = 16.0
    nav_agent.max_speed = move_speed

    nav_agent.velocity_computed.connect(_on_velocity_computed)
    nav_agent.navigation_finished.connect(_on_navigation_finished)

func set_target(target: Vector2) -> void:
    target_position = target
    nav_agent.target_position = target

func _physics_process(delta: float) -> void:
    if nav_agent.is_navigation_finished():
        return

    var next_pos: Vector2 = nav_agent.get_next_path_position()
    var direction: Vector2 = global_position.direction_to(next_pos)

    nav_agent.velocity = direction * move_speed

func _on_velocity_computed(safe_velocity: Vector2) -> void:
    velocity = velocity.lerp(safe_velocity, 0.5)
    move_and_slide()

func _on_navigation_finished() -> void:
    velocity = Vector2.ZERO
```

**scripts/navigation/nav_region_setup_2d.gd**:
```gdscript
extends NavigationRegion2D

@export var auto_bake: bool = true

func _ready() -> void:
    if auto_bake and navigation_polygon:
        # Navigation polygons are usually set up in editor
        # but can be generated from TileMap
        pass

func create_from_tilemap(tilemap: TileMapLayer) -> void:
    var nav_poly := NavigationPolygon.new()

    # Get walkable tiles and create polygon
    var used_cells := tilemap.get_used_cells()
    var tile_size: Vector2 = tilemap.tile_set.tile_size

    for cell in used_cells:
        var tile_data := tilemap.get_cell_tile_data(cell)
        if tile_data and tile_data.get_custom_data("walkable"):
            var world_pos: Vector2 = tilemap.map_to_local(cell)
            var outline: PackedVector2Array = [
                world_pos + Vector2(-tile_size.x/2, -tile_size.y/2),
                world_pos + Vector2(tile_size.x/2, -tile_size.y/2),
                world_pos + Vector2(tile_size.x/2, tile_size.y/2),
                world_pos + Vector2(-tile_size.x/2, tile_size.y/2)
            ]
            nav_poly.add_outline(outline)

    nav_poly.make_polygons_from_outlines()
    navigation_polygon = nav_poly
```

### Shared Utilities

**scripts/navigation/click_to_move.gd**:
```gdscript
extends Node

@export var navigation_agent_path: NodePath
@export var camera_path: NodePath

var nav_agent: NavigationAgent3D
var camera: Camera3D

func _ready() -> void:
    nav_agent = get_node(navigation_agent_path)
    camera = get_node(camera_path)

func _input(event: InputEvent) -> void:
    if event is InputEventMouseButton:
        if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
            var from: Vector3 = camera.project_ray_origin(event.position)
            var to: Vector3 = from + camera.project_ray_normal(event.position) * 1000

            var space_state := get_viewport().get_world_3d().direct_space_state
            var query := PhysicsRayQueryParameters3D.create(from, to)
            query.collision_mask = 1  # Ground layer
            var result := space_state.intersect_ray(query)

            if result:
                nav_agent.target_position = result.position
```

## Output

After creation, report:
- Files created
- Project settings to verify:
  - `navigation/3d/default_cell_size`
  - `navigation/3d/default_agent_radius`
- Next steps:
  1. Add level geometry to NavigationRegion
  2. Bake the navigation mesh (in editor or runtime)
  3. Test pathfinding with click-to-move

## Tips

- Use navigation layers to separate different agent types
- Enable debug visualization: NavigationServer3D.set_debug_enabled(true)
- For dynamic obstacles, use NavigationObstacle3D with carving
- Consider async baking for large meshes
