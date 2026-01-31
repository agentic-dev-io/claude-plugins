---
name: Godot Navigation
description: This skill should be used when the user asks about "pathfinding", "NavigationServer", "NavigationServer3D", "NavigationServer2D", "NavigationAgent", "NavigationAgent3D", "NavigationAgent2D", "NavigationMesh", "NavMesh", "AI movement", "avoidance", "RVO", "navigation layers", "dynamic obstacles", "bake navigation", "path smoothing", or needs guidance on implementing pathfinding and AI navigation in Godot 4.x.
---

# Godot Navigation System (4.6)

Godot's navigation system provides robust pathfinding and movement for AI agents using NavigationServer, NavigationMesh, and NavigationAgent nodes.

## Core Components

### NavigationServer3D/2D

The navigation servers are singletons managing all navigation:

```gdscript
# Get navigation map (default or custom)
var map_rid: RID = NavigationServer3D.get_maps()[0]
var map_rid: RID = get_world_3d().get_navigation_map()

# Query path directly
var path: PackedVector3Array = NavigationServer3D.map_get_path(
    map_rid,
    start_position,
    target_position,
    true  # optimize path
)

# Check if point is on navmesh
var closest: Vector3 = NavigationServer3D.map_get_closest_point(map_rid, query_point)
var is_on_mesh: bool = closest.distance_to(query_point) < 0.5
```

### NavigationRegion3D/2D

Holds the NavigationMesh and defines navigable areas:

```gdscript
# NavigationRegion3D setup
@onready var nav_region: NavigationRegion3D = $NavigationRegion3D

func _ready() -> void:
    # Runtime navmesh baking
    nav_region.bake_navigation_mesh()

    # Connect to bake finished
    nav_region.bake_finished.connect(_on_bake_finished)

func _on_bake_finished() -> void:
    print("Navigation mesh ready")
```

### NavigationMesh Resource

Configure navmesh generation:

```gdscript
# Create NavMesh programmatically
var navmesh := NavigationMesh.new()

# Agent parameters (who will walk on this?)
navmesh.agent_height = 2.0
navmesh.agent_radius = 0.5
navmesh.agent_max_climb = 0.5
navmesh.agent_max_slope = 45.0

# Cell parameters (precision)
navmesh.cell_size = 0.25
navmesh.cell_height = 0.25

# Geometry parsing
navmesh.geometry_parsed_geometry_type = NavigationMesh.PARSED_GEOMETRY_STATIC_COLLIDERS
navmesh.geometry_source_geometry_mode = NavigationMesh.SOURCE_GEOMETRY_ROOT_NODE_CHILDREN

# Apply to region
nav_region.navigation_mesh = navmesh
nav_region.bake_navigation_mesh()
```

## NavigationAgent Setup

### Basic Agent Configuration

```gdscript
class_name AICharacter
extends CharacterBody3D

@export var move_speed: float = 5.0
@export var acceleration: float = 10.0

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

func _ready() -> void:
    # Agent configuration
    nav_agent.path_desired_distance = 0.5
    nav_agent.target_desired_distance = 0.5
    nav_agent.path_max_distance = 1.0

    # Avoidance
    nav_agent.avoidance_enabled = true
    nav_agent.radius = 0.5
    nav_agent.neighbor_distance = 10.0
    nav_agent.max_neighbors = 10
    nav_agent.max_speed = move_speed

    # Signals
    nav_agent.velocity_computed.connect(_on_velocity_computed)
    nav_agent.navigation_finished.connect(_on_navigation_finished)
    nav_agent.target_reached.connect(_on_target_reached)

func set_target(target: Vector3) -> void:
    nav_agent.target_position = target

func _physics_process(delta: float) -> void:
    if nav_agent.is_navigation_finished():
        return

    var next_pos: Vector3 = nav_agent.get_next_path_position()
    var direction: Vector3 = (next_pos - global_position).normalized()

    # For avoidance, set velocity and let agent compute safe velocity
    nav_agent.velocity = direction * move_speed

func _on_velocity_computed(safe_velocity: Vector3) -> void:
    velocity = velocity.lerp(safe_velocity, 0.5)
    move_and_slide()

func _on_navigation_finished() -> void:
    velocity = Vector3.ZERO

func _on_target_reached() -> void:
    print("Arrived at destination")
```

### 2D Navigation Agent

```gdscript
class_name AICharacter2D
extends CharacterBody2D

@export var move_speed: float = 200.0

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D

func _ready() -> void:
    nav_agent.path_desired_distance = 4.0
    nav_agent.target_desired_distance = 4.0
    nav_agent.avoidance_enabled = true
    nav_agent.radius = 16.0
    nav_agent.velocity_computed.connect(_on_velocity_computed)

func set_target(target: Vector2) -> void:
    nav_agent.target_position = target

func _physics_process(delta: float) -> void:
    if nav_agent.is_navigation_finished():
        return

    var next_pos: Vector2 = nav_agent.get_next_path_position()
    var direction: Vector2 = global_position.direction_to(next_pos)
    nav_agent.velocity = direction * move_speed

func _on_velocity_computed(safe_velocity: Vector2) -> void:
    velocity = safe_velocity
    move_and_slide()
```

## Navigation Layers

Use layers to restrict agent movement:

```gdscript
# Define layers in project settings or code
# Layer 1: Ground
# Layer 2: Water (boats only)
# Layer 3: Air (flying units)

func _ready() -> void:
    # Agent can navigate on ground and air
    nav_agent.navigation_layers = 1 | 4  # Layers 1 and 3 (bitmask)

    # Or set individually
    nav_agent.set_navigation_layer_value(1, true)   # Ground
    nav_agent.set_navigation_layer_value(2, false)  # Not water
    nav_agent.set_navigation_layer_value(3, true)   # Air

# Region configuration
func setup_region(region: NavigationRegion3D, layer: int) -> void:
    region.navigation_layers = 1 << (layer - 1)
```

## Dynamic Obstacles

### NavigationObstacle3D

Block navigation dynamically:

```gdscript
class_name DynamicBarrier
extends Node3D

@onready var obstacle: NavigationObstacle3D = $NavigationObstacle3D

func _ready() -> void:
    # Set obstacle properties
    obstacle.radius = 2.0
    obstacle.height = 2.0
    obstacle.avoidance_enabled = true

    # For moving obstacles
    obstacle.use_3d_avoidance = true
    obstacle.velocity = Vector3.ZERO

func _physics_process(delta: float) -> void:
    # Update velocity for moving obstacles
    obstacle.velocity = linear_velocity
```

### Carving (Runtime NavMesh Updates)

```gdscript
# Enable carving for obstacles that should cut holes in navmesh
func enable_carving(obstacle: NavigationObstacle3D) -> void:
    obstacle.carve_navigation_mesh = true

# After obstacle changes, rebake affected region
func update_navmesh() -> void:
    var region: NavigationRegion3D = $NavigationRegion3D
    region.bake_navigation_mesh()  # Expensive - use sparingly
```

## RVO Avoidance

Reciprocal Velocity Obstacles for crowd simulation:

```gdscript
class_name CrowdAgent
extends CharacterBody3D

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

func _ready() -> void:
    # RVO settings
    nav_agent.avoidance_enabled = true
    nav_agent.radius = 0.5
    nav_agent.height = 2.0
    nav_agent.max_speed = 5.0
    nav_agent.neighbor_distance = 10.0
    nav_agent.max_neighbors = 10
    nav_agent.time_horizon_agents = 1.0
    nav_agent.time_horizon_obstacles = 0.5

    # Avoidance layers (who to avoid)
    nav_agent.avoidance_layers = 1  # This agent's layer
    nav_agent.avoidance_mask = 1    # Avoid agents on layer 1

    # Priority (lower = yields to higher)
    nav_agent.avoidance_priority = 1.0

func _physics_process(delta: float) -> void:
    if nav_agent.is_navigation_finished():
        nav_agent.velocity = Vector3.ZERO
        return

    var next_pos: Vector3 = nav_agent.get_next_path_position()
    var desired_velocity: Vector3 = (next_pos - global_position).normalized() * nav_agent.max_speed
    nav_agent.velocity = desired_velocity
```

## Path Smoothing & Modification

```gdscript
class_name SmartNavigator
extends CharacterBody3D

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

var current_path: PackedVector3Array
var path_index: int = 0

func get_smoothed_path(start: Vector3, end: Vector3) -> PackedVector3Array:
    var map_rid: RID = get_world_3d().get_navigation_map()
    var raw_path: PackedVector3Array = NavigationServer3D.map_get_path(
        map_rid, start, end, true
    )

    # Simple path smoothing - remove unnecessary waypoints
    var smoothed: PackedVector3Array = []
    smoothed.append(raw_path[0])

    for i in range(1, raw_path.size() - 1):
        var prev: Vector3 = smoothed[-1]
        var curr: Vector3 = raw_path[i]
        var next: Vector3 = raw_path[i + 1]

        # Check if we can skip this point
        var space_state := get_world_3d().direct_space_state
        var query := PhysicsRayQueryParameters3D.create(prev, next)
        var result := space_state.intersect_ray(query)

        if result:
            # Can't skip, keep the waypoint
            smoothed.append(curr)

    smoothed.append(raw_path[-1])
    return smoothed

# Funnel algorithm for tighter paths (simplified)
func funnel_path(path: PackedVector3Array) -> PackedVector3Array:
    if path.size() <= 2:
        return path

    var funneled: PackedVector3Array = [path[0]]
    var apex: Vector3 = path[0]
    var left: Vector3 = path[1]
    var right: Vector3 = path[1]
    var apex_index: int = 0

    for i in range(2, path.size()):
        var point: Vector3 = path[i]
        # Simplified funnel logic
        funneled.append(point)

    return funneled
```

## Runtime NavMesh Baking

```gdscript
class_name DynamicWorld
extends Node3D

@onready var nav_region: NavigationRegion3D = $NavigationRegion3D

var bake_mutex: Mutex = Mutex.new()
var is_baking: bool = false

func _ready() -> void:
    nav_region.bake_finished.connect(_on_bake_finished)

func request_rebake() -> void:
    if is_baking:
        return

    is_baking = true

    # Bake on separate thread for large meshes
    var thread := Thread.new()
    thread.start(_bake_thread)

func _bake_thread() -> void:
    bake_mutex.lock()
    nav_region.bake_navigation_mesh()
    bake_mutex.unlock()

func _on_bake_finished() -> void:
    is_baking = false
    print("NavMesh rebaked")
```

## Integration with Jolt Physics

Godot 4.6 uses Jolt Physics by default:

```gdscript
# Navigation works seamlessly with Jolt
# Just ensure colliders are properly configured

func _ready() -> void:
    var navmesh := NavigationMesh.new()

    # Parse Jolt colliders
    navmesh.geometry_parsed_geometry_type = NavigationMesh.PARSED_GEOMETRY_STATIC_COLLIDERS

    # Or parse mesh instances
    navmesh.geometry_parsed_geometry_type = NavigationMesh.PARSED_GEOMETRY_MESH_INSTANCES

    # Collision mask for parsing
    navmesh.geometry_collision_mask = 1  # Only layer 1 colliders
```

## Navigation Links

Connect disconnected navigation regions:

```gdscript
# NavigationLink3D for jumps, teleports, doors
@onready var nav_link: NavigationLink3D = $NavigationLink3D

func _ready() -> void:
    # Setup link
    nav_link.start_position = Vector3(0, 0, 0)
    nav_link.end_position = Vector3(5, 2, 0)  # Jump up to ledge
    nav_link.bidirectional = false  # One-way jump
    nav_link.travel_cost = 2.0  # More expensive than walking

    # Enable/disable link
    nav_link.enabled = true

# Detect when agent uses link
func _on_agent_link_reached(link: NavigationLink3D) -> void:
    # Play jump animation
    play_jump_to(link.end_position)
```

## Performance Tips

### Optimize NavMesh Generation

```gdscript
# Use appropriate cell size
# Smaller = more precise but slower
navmesh.cell_size = 0.5  # Good balance for most games

# Reduce parsed geometry
navmesh.geometry_source_geometry_mode = NavigationMesh.SOURCE_GEOMETRY_GROUPS_WITH_CHILDREN
# Only include nodes in "navigation" group

# Filter unnecessary areas
navmesh.filter_low_hanging_obstacles = true
navmesh.filter_ledge_spans = true
navmesh.filter_walkable_low_height_spans = true
```

### Reduce Agent Overhead

```gdscript
# Limit path updates
var path_update_timer: float = 0.0
const PATH_UPDATE_INTERVAL: float = 0.2  # 5 times per second

func _physics_process(delta: float) -> void:
    path_update_timer += delta
    if path_update_timer >= PATH_UPDATE_INTERVAL:
        path_update_timer = 0.0
        update_path()

# Disable avoidance for distant agents
func _on_visibility_changed(visible: bool) -> void:
    nav_agent.avoidance_enabled = visible
```

### Debug Visualization

```gdscript
# Enable in editor or runtime
func _ready() -> void:
    # Show navigation mesh in editor
    NavigationServer3D.set_debug_enabled(true)

    # Custom debug drawing
    if OS.is_debug_build():
        draw_path()

func draw_path() -> void:
    var path: PackedVector3Array = nav_agent.get_current_navigation_path()
    for i in range(path.size() - 1):
        DebugDraw3D.draw_line(path[i], path[i + 1], Color.GREEN)
```

## Common Patterns

### Patrol System

```gdscript
class_name PatrolAgent
extends CharacterBody3D

@export var patrol_points: Array[Marker3D] = []
@export var wait_time: float = 2.0

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

var current_point: int = 0

func _ready() -> void:
    nav_agent.navigation_finished.connect(_on_navigation_finished)
    go_to_next_point()

func go_to_next_point() -> void:
    if patrol_points.is_empty():
        return
    nav_agent.target_position = patrol_points[current_point].global_position

func _on_navigation_finished() -> void:
    await get_tree().create_timer(wait_time).timeout
    current_point = (current_point + 1) % patrol_points.size()
    go_to_next_point()
```

### Chase with Prediction

```gdscript
class_name ChaseAgent
extends CharacterBody3D

@export var prediction_time: float = 0.5

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

var target: CharacterBody3D

func _physics_process(delta: float) -> void:
    if not target:
        return

    # Predict where target will be
    var target_velocity: Vector3 = target.velocity
    var predicted_pos: Vector3 = target.global_position + target_velocity * prediction_time

    # Validate predicted position is on navmesh
    var map_rid: RID = get_world_3d().get_navigation_map()
    var valid_pos: Vector3 = NavigationServer3D.map_get_closest_point(map_rid, predicted_pos)

    nav_agent.target_position = valid_pos
```
