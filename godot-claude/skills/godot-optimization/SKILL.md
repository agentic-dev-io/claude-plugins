---
name: Godot Optimization
description: This skill should be used when the user asks about "profiling", "optimization", "performance", "FPS", "frame rate", "occlusion culling", "OccluderInstance3D", "MultiMesh", "MultiMeshInstance", "draw calls", "batching", "LOD", "level of detail", "memory management", "object pooling", "GC", "garbage collection", "visibility notifier", "process mode", "physics optimization", "culling", or needs guidance on optimizing Godot 4.x games for better performance.
---

# Godot Performance Optimization (4.6)

This skill covers profiling tools, rendering optimization, physics tuning, memory management, and best practices for performant Godot games.

## Profiling Tools

### Built-in Profiler

```gdscript
# Access profiler programmatically
func _ready() -> void:
    # Enable profiler
    Performance.add_custom_monitor("game/enemies", callable(self, "_get_enemy_count"))

func _get_enemy_count() -> int:
    return get_tree().get_nodes_in_group("enemies").size()

# Read performance metrics
func _process(delta: float) -> void:
    var fps: float = Performance.get_monitor(Performance.TIME_FPS)
    var physics_time: float = Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS)
    var render_time: float = Performance.get_monitor(Performance.TIME_PROCESS)

    # Object counts
    var object_count: int = Performance.get_monitor(Performance.OBJECT_COUNT)
    var node_count: int = Performance.get_monitor(Performance.OBJECT_NODE_COUNT)

    # Memory
    var static_memory: int = Performance.get_monitor(Performance.MEMORY_STATIC)
    var dynamic_memory: int = Performance.get_monitor(Performance.MEMORY_DYNAMIC)

    # Rendering
    var draw_calls: int = Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
    var vertices: int = Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
```

### Debug Overlay

```gdscript
# Create in-game debug overlay
class_name DebugOverlay
extends CanvasLayer

@onready var label: Label = $Label

var update_interval: float = 0.5
var timer: float = 0.0

func _process(delta: float) -> void:
    timer += delta
    if timer >= update_interval:
        timer = 0.0
        update_stats()

func update_stats() -> void:
    var text: String = ""
    text += "FPS: %d\n" % Performance.get_monitor(Performance.TIME_FPS)
    text += "Frame: %.2f ms\n" % (Performance.get_monitor(Performance.TIME_PROCESS) * 1000)
    text += "Physics: %.2f ms\n" % (Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000)
    text += "Draw Calls: %d\n" % Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
    text += "Vertices: %d\n" % Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
    text += "Objects: %d\n" % Performance.get_monitor(Performance.OBJECT_COUNT)
    text += "Memory: %.1f MB\n" % (Performance.get_monitor(Performance.MEMORY_STATIC) / 1048576.0)
    label.text = text
```

## Rendering Optimization

### Occlusion Culling

```gdscript
# Use OccluderInstance3D for large occluders (walls, buildings)
# Scene structure:
# Building
# ├── MeshInstance3D (visible geometry)
# └── OccluderInstance3D (occlusion shape)

# Create occluder programmatically
func add_occluder(mesh_instance: MeshInstance3D) -> void:
    var occluder := OccluderInstance3D.new()

    # Create box occluder matching mesh bounds
    var occluder3d := BoxOccluder3D.new()
    var aabb: AABB = mesh_instance.get_aabb()
    occluder3d.size = aabb.size

    occluder.occluder = occluder3d
    occluder.position = aabb.get_center()
    mesh_instance.add_child(occluder)

# Enable occlusion culling in project settings:
# rendering/occlusion_culling/use_occlusion_culling = true
```

### MultiMesh Instancing

For many identical objects (grass, trees, bullets):

```gdscript
class_name GrassField
extends MultiMeshInstance3D

@export var grass_mesh: Mesh
@export var grass_count: int = 10000
@export var area_size: Vector2 = Vector2(100, 100)

func _ready() -> void:
    setup_multimesh()
    populate_grass()

func setup_multimesh() -> void:
    multimesh = MultiMesh.new()
    multimesh.transform_format = MultiMesh.TRANSFORM_3D
    multimesh.instance_count = grass_count
    multimesh.mesh = grass_mesh

    # Optional: per-instance color/custom data
    multimesh.use_colors = true
    multimesh.use_custom_data = false

func populate_grass() -> void:
    for i in grass_count:
        var pos := Vector3(
            randf_range(-area_size.x / 2, area_size.x / 2),
            0,
            randf_range(-area_size.y / 2, area_size.y / 2)
        )

        # Snap to terrain height
        pos.y = get_terrain_height(pos)

        var transform := Transform3D()
        transform.origin = pos
        transform.basis = transform.basis.rotated(Vector3.UP, randf() * TAU)
        transform.basis = transform.basis.scaled(Vector3.ONE * randf_range(0.8, 1.2))

        multimesh.set_instance_transform(i, transform)
        multimesh.set_instance_color(i, Color(randf_range(0.7, 1.0), 1.0, randf_range(0.7, 1.0)))

func get_terrain_height(pos: Vector3) -> float:
    var space_state := get_world_3d().direct_space_state
    var query := PhysicsRayQueryParameters3D.create(
        pos + Vector3.UP * 100,
        pos + Vector3.DOWN * 100
    )
    var result := space_state.intersect_ray(query)
    return result.position.y if result else 0.0

# Update individual instance transforms at runtime
func sway_grass(delta: float) -> void:
    var time: float = Time.get_ticks_msec() / 1000.0
    for i in grass_count:
        var transform := multimesh.get_instance_transform(i)
        var sway := sin(time + transform.origin.x * 0.1) * 0.1
        transform.basis = Basis().rotated(Vector3.FORWARD, sway)
        multimesh.set_instance_transform(i, transform)
```

### Level of Detail (LOD)

```gdscript
# Using built-in LOD
class_name LODMesh
extends Node3D

@export var lod0_mesh: Mesh  # High detail
@export var lod1_mesh: Mesh  # Medium detail
@export var lod2_mesh: Mesh  # Low detail

@onready var mesh_instance: MeshInstance3D = $MeshInstance3D

func _ready() -> void:
    # Configure LOD distances in MeshInstance3D
    mesh_instance.lod_bias = 1.0  # Multiplier for LOD distances

# Manual LOD (for more control)
class_name ManualLOD
extends Node3D

@export var lod_meshes: Array[Mesh] = []
@export var lod_distances: Array[float] = [10.0, 30.0, 50.0]

@onready var mesh_instance: MeshInstance3D = $MeshInstance3D

var camera: Camera3D

func _ready() -> void:
    camera = get_viewport().get_camera_3d()

func _process(delta: float) -> void:
    var distance: float = global_position.distance_to(camera.global_position)

    var lod_level: int = lod_meshes.size() - 1
    for i in lod_distances.size():
        if distance < lod_distances[i]:
            lod_level = i
            break

    if mesh_instance.mesh != lod_meshes[lod_level]:
        mesh_instance.mesh = lod_meshes[lod_level]
```

### Draw Call Batching

```gdscript
# Godot batches automatically when:
# - Same material
# - Same mesh
# - 2D: CanvasItem.use_parent_material = true

# Force material sharing
func optimize_materials() -> void:
    var shared_material: StandardMaterial3D = preload("res://materials/shared.tres")

    for child in get_tree().get_nodes_in_group("optimizable"):
        if child is MeshInstance3D:
            child.material_override = shared_material

# For 2D, use CanvasGroup for batching
# CanvasGroup
# ├── Sprite2D (same texture)
# ├── Sprite2D (same texture)
# └── Sprite2D (same texture)
```

## Physics Optimization

### Collision Layers

```gdscript
# Use collision layers to minimize checks
# Layer 1: Player
# Layer 2: Enemies
# Layer 3: Environment
# Layer 4: Projectiles
# Layer 5: Pickups

func setup_collision_layers() -> void:
    # Player checks against enemies, environment, pickups
    player.collision_layer = 1
    player.collision_mask = 2 | 3 | 5  # Layers 2, 3, 5

    # Enemy projectile only checks player
    projectile.collision_layer = 4
    projectile.collision_mask = 1  # Only layer 1
```

### Shape Complexity

```gdscript
# Use simple shapes when possible
# Performance: Sphere > Capsule > Box > Convex > Concave

# For complex meshes, use simplified collision
func create_simplified_collision(mesh_instance: MeshInstance3D) -> void:
    # Option 1: Convex hull
    var convex_shape := mesh_instance.mesh.create_convex_shape()

    # Option 2: Multiple convex shapes (for concave objects)
    var shapes := mesh_instance.mesh.create_multiple_convex_shapes()

    # Option 3: Use primitives
    var collision := CollisionShape3D.new()
    collision.shape = BoxShape3D.new()  # Fast!
    collision.shape.size = mesh_instance.get_aabb().size
```

### Physics Processing

```gdscript
# Sleep distant physics bodies
func _physics_process(delta: float) -> void:
    var camera_pos: Vector3 = get_viewport().get_camera_3d().global_position

    for body in get_tree().get_nodes_in_group("physics_bodies"):
        var distance: float = body.global_position.distance_to(camera_pos)
        body.sleeping = distance > 50.0  # Sleep far bodies

# Use Area3D monitoring wisely
func _ready() -> void:
    # Only monitor when needed
    $DetectionArea.monitoring = false

func start_detection() -> void:
    $DetectionArea.monitoring = true

func stop_detection() -> void:
    $DetectionArea.monitoring = false
```

## Memory Management

### Object Pooling

```gdscript
class_name ObjectPool
extends Node

@export var pooled_scene: PackedScene
@export var initial_size: int = 50
@export var max_size: int = 200

var pool: Array[Node] = []
var active: Array[Node] = []

func _ready() -> void:
    # Pre-instantiate objects
    for i in initial_size:
        var obj := pooled_scene.instantiate()
        obj.set_process(false)
        obj.set_physics_process(false)
        obj.visible = false
        add_child(obj)
        pool.append(obj)

func acquire() -> Node:
    var obj: Node

    if pool.is_empty():
        if active.size() < max_size:
            obj = pooled_scene.instantiate()
            add_child(obj)
        else:
            # Recycle oldest active object
            obj = active.pop_front()
    else:
        obj = pool.pop_back()

    obj.set_process(true)
    obj.set_physics_process(true)
    obj.visible = true
    active.append(obj)

    if obj.has_method("on_spawn"):
        obj.on_spawn()

    return obj

func release(obj: Node) -> void:
    if obj not in active:
        return

    active.erase(obj)

    if obj.has_method("on_despawn"):
        obj.on_despawn()

    obj.set_process(false)
    obj.set_physics_process(false)
    obj.visible = false
    pool.append(obj)

# Poolable object interface
class_name Poolable
extends Node3D

var pool: ObjectPool

func on_spawn() -> void:
    # Reset state
    pass

func on_despawn() -> void:
    # Clean up
    pass

func return_to_pool() -> void:
    pool.release(self)
```

### Resource Preloading

```gdscript
# Preload frequently used resources
const ENEMY_SCENE: PackedScene = preload("res://scenes/enemy.tscn")
const HIT_EFFECT: PackedScene = preload("res://effects/hit.tscn")
const EXPLOSION_SOUND: AudioStream = preload("res://audio/explosion.ogg")

# Background loading for large resources
class_name ResourceLoader
extends Node

signal resource_loaded(path: String, resource: Resource)

var loading_queue: Array[String] = []
var loaded_resources: Dictionary = {}

func queue_load(path: String) -> void:
    if path in loaded_resources or path in loading_queue:
        return
    loading_queue.append(path)
    ResourceLoader.load_threaded_request(path)

func _process(delta: float) -> void:
    for i in range(loading_queue.size() - 1, -1, -1):
        var path: String = loading_queue[i]
        var status := ResourceLoader.load_threaded_get_status(path)

        if status == ResourceLoader.THREAD_LOAD_LOADED:
            var resource := ResourceLoader.load_threaded_get(path)
            loaded_resources[path] = resource
            loading_queue.remove_at(i)
            resource_loaded.emit(path, resource)

func get_resource(path: String) -> Resource:
    return loaded_resources.get(path)
```

### Avoid GC Pressure

```gdscript
# BAD: Creates garbage every frame
func _process(delta: float) -> void:
    var pos := Vector3(x, y, z)  # New Vector3
    var enemies := get_tree().get_nodes_in_group("enemies")  # New Array

# GOOD: Reuse objects
var cached_position: Vector3
var cached_enemies: Array[Node]

func _process(delta: float) -> void:
    cached_position.x = x
    cached_position.y = y
    cached_position.z = z

    # Only refresh when needed
    if frame_count % 10 == 0:
        cached_enemies = get_tree().get_nodes_in_group("enemies")

# Avoid string concatenation in hot paths
# BAD
func _process(delta: float) -> void:
    label.text = "Score: " + str(score)  # Creates strings

# GOOD
func _process(delta: float) -> void:
    label.text = "Score: %d" % score  # Faster formatting
```

## Scene Optimization

### Visibility Management

```gdscript
# Use VisibleOnScreenNotifier3D for culling
class_name OptimizedEnemy
extends CharacterBody3D

@onready var visibility: VisibleOnScreenNotifier3D = $VisibleOnScreenNotifier3D

func _ready() -> void:
    visibility.screen_entered.connect(_on_screen_entered)
    visibility.screen_exited.connect(_on_screen_exited)

func _on_screen_entered() -> void:
    set_process(true)
    set_physics_process(true)
    $AnimationPlayer.play()

func _on_screen_exited() -> void:
    set_process(false)
    # Keep physics for gameplay consistency
    # Or disable if far enough
    $AnimationPlayer.stop()
```

### ProcessMode Control

```gdscript
# Disable processing for inactive nodes
func pause_section(section: Node) -> void:
    section.process_mode = Node.PROCESS_MODE_DISABLED

func resume_section(section: Node) -> void:
    section.process_mode = Node.PROCESS_MODE_INHERIT

# Pause game but keep UI
func pause_game() -> void:
    get_tree().paused = true
    $UI.process_mode = Node.PROCESS_MODE_ALWAYS
    $Game.process_mode = Node.PROCESS_MODE_PAUSABLE
```

### Scene Streaming

```gdscript
class_name StreamingManager
extends Node

@export var load_distance: float = 100.0
@export var unload_distance: float = 150.0

var loaded_chunks: Dictionary = {}  # Vector2i -> Node
var player: Node3D

func _physics_process(delta: float) -> void:
    if not player:
        return

    var player_chunk: Vector2i = world_to_chunk(player.global_position)
    manage_chunks(player_chunk)

func world_to_chunk(pos: Vector3) -> Vector2i:
    return Vector2i(int(pos.x / 50), int(pos.z / 50))

func manage_chunks(center: Vector2i) -> void:
    # Load nearby chunks
    for x in range(-2, 3):
        for z in range(-2, 3):
            var chunk_pos := center + Vector2i(x, z)
            var world_pos := chunk_to_world(chunk_pos)
            var distance: float = player.global_position.distance_to(world_pos)

            if distance < load_distance and chunk_pos not in loaded_chunks:
                load_chunk_async(chunk_pos)

    # Unload far chunks
    var to_unload: Array[Vector2i] = []
    for chunk_pos in loaded_chunks:
        var world_pos := chunk_to_world(chunk_pos)
        var distance: float = player.global_position.distance_to(world_pos)

        if distance > unload_distance:
            to_unload.append(chunk_pos)

    for chunk_pos in to_unload:
        unload_chunk(chunk_pos)

func load_chunk_async(chunk_pos: Vector2i) -> void:
    var path: String = "res://chunks/chunk_%d_%d.tscn" % [chunk_pos.x, chunk_pos.y]
    ResourceLoader.load_threaded_request(path)
    loaded_chunks[chunk_pos] = null  # Mark as loading

func unload_chunk(chunk_pos: Vector2i) -> void:
    var chunk: Node = loaded_chunks.get(chunk_pos)
    if chunk:
        chunk.queue_free()
    loaded_chunks.erase(chunk_pos)
```

## Profiling Tips

```gdscript
# Time specific code sections
func profile_function() -> void:
    var start := Time.get_ticks_usec()

    # Code to profile
    expensive_operation()

    var elapsed := Time.get_ticks_usec() - start
    print("Operation took %d microseconds" % elapsed)

# Frame time budget
# 60 FPS = 16.67ms per frame
# 30 FPS = 33.33ms per frame
# Target: Keep frame time under budget

# Spread expensive work across frames
var work_queue: Array = []
const MAX_WORK_PER_FRAME: int = 10

func _process(delta: float) -> void:
    var processed: int = 0
    while not work_queue.is_empty() and processed < MAX_WORK_PER_FRAME:
        var work: Callable = work_queue.pop_front()
        work.call()
        processed += 1
```
