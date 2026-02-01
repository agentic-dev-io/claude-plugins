---
name: Godot Scene Management
description: This skill should be used when the user asks about "scene loading", "change scene", "level loading", "scene transition", "loading screen", "persistent scene", "additive loading", "scene tree", "get_tree", "PackedScene", "instantiate", "level manager", "scene stack", "ResourceLoader", "background loading", or needs guidance on scene management in Godot 4.x.
---

# Godot 4.6 Scene Management

This skill covers scene loading, transitions, level management, and advanced scene handling patterns.

## Basic Scene Operations

### Scene Changing

```gdscript
# Simple scene change
func change_scene(path: String) -> void:
    get_tree().change_scene_to_file(path)


# Change to packed scene
func change_to_packed(scene: PackedScene) -> void:
    get_tree().change_scene_to_packed(scene)


# Deferred change (safer during physics/signals)
func change_scene_deferred(path: String) -> void:
    call_deferred("_do_change_scene", path)


func _do_change_scene(path: String) -> void:
    get_tree().change_scene_to_file(path)
```

### Scene Instantiation

```gdscript
# Preload for frequently used scenes
const BULLET_SCENE: PackedScene = preload("res://scenes/bullet.tscn")

func spawn_bullet(position: Vector3) -> Node3D:
    var bullet: Node3D = BULLET_SCENE.instantiate()
    bullet.global_position = position
    get_tree().current_scene.add_child(bullet)
    return bullet


# Runtime loading
func spawn_enemy(enemy_type: String, position: Vector3) -> Node3D:
    var path := "res://scenes/enemies/%s.tscn" % enemy_type
    var scene: PackedScene = load(path)

    if not scene:
        push_error("Enemy scene not found: %s" % path)
        return null

    var enemy: Node3D = scene.instantiate()
    enemy.global_position = position
    add_child(enemy)
    return enemy
```

## Scene Manager

### Full Implementation

```gdscript
# scene_manager.gd - Autoload
class_name SceneManagerClass
extends Node

signal scene_load_started(scene_path: String)
signal scene_load_progress(progress: float)
signal scene_load_completed(scene_path: String)
signal transition_started
signal transition_midpoint  # Use for actual scene swap
signal transition_completed

const TRANSITION_SCENE := "res://scenes/ui/transition.tscn"

var _current_scene_path: String = ""
var _loading_scene_path: String = ""
var _loader: ResourceLoader.ThreadLoadStatus
var _transition_layer: CanvasLayer
var _transition_control: Control


func _ready() -> void:
    _setup_transition_layer()


func _setup_transition_layer() -> void:
    _transition_layer = CanvasLayer.new()
    _transition_layer.layer = 100  # Above all game UI
    add_child(_transition_layer)


func change_scene(path: String, transition: bool = true) -> void:
    if transition:
        await _transition_to_scene(path)
    else:
        _immediate_change(path)


func _immediate_change(path: String) -> void:
    scene_load_started.emit(path)
    get_tree().change_scene_to_file(path)
    _current_scene_path = path
    scene_load_completed.emit(path)


func _transition_to_scene(path: String) -> void:
    transition_started.emit()
    scene_load_started.emit(path)

    # Start loading in background
    _loading_scene_path = path
    ResourceLoader.load_threaded_request(path)

    # Play transition in
    await _play_transition_in()

    transition_midpoint.emit()

    # Wait for load to complete
    var scene: PackedScene = await _wait_for_load(path)

    if scene:
        # Perform the swap
        get_tree().change_scene_to_packed(scene)
        _current_scene_path = path

    # Play transition out
    await _play_transition_out()

    scene_load_completed.emit(path)
    transition_completed.emit()


func _wait_for_load(path: String) -> PackedScene:
    var progress: Array = []

    while true:
        var status := ResourceLoader.load_threaded_get_status(path, progress)

        match status:
            ResourceLoader.THREAD_LOAD_IN_PROGRESS:
                scene_load_progress.emit(progress[0])
                await get_tree().process_frame

            ResourceLoader.THREAD_LOAD_LOADED:
                scene_load_progress.emit(1.0)
                return ResourceLoader.load_threaded_get(path)

            ResourceLoader.THREAD_LOAD_FAILED:
                push_error("Failed to load scene: %s" % path)
                return null

            ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
                push_error("Invalid scene resource: %s" % path)
                return null


func _play_transition_in() -> void:
    # Create fade overlay
    var fade := ColorRect.new()
    fade.color = Color.BLACK
    fade.set_anchors_preset(Control.PRESET_FULL_RECT)
    fade.modulate.a = 0.0
    _transition_layer.add_child(fade)
    _transition_control = fade

    var tween := create_tween()
    tween.tween_property(fade, "modulate:a", 1.0, 0.3)
    await tween.finished


func _play_transition_out() -> void:
    if not _transition_control:
        return

    var tween := create_tween()
    tween.tween_property(_transition_control, "modulate:a", 0.0, 0.3)
    await tween.finished

    _transition_control.queue_free()
    _transition_control = null


# Reload current scene
func reload_current_scene() -> void:
    if _current_scene_path.is_empty():
        get_tree().reload_current_scene()
    else:
        await change_scene(_current_scene_path)


# Get current scene reference
func get_current_scene() -> Node:
    return get_tree().current_scene
```

## Loading Screen

```gdscript
# loading_screen.gd
class_name LoadingScreen
extends Control

@onready var _progress_bar: ProgressBar = %ProgressBar
@onready var _status_label: Label = %StatusLabel
@onready var _tip_label: Label = %TipLabel
@onready var _animation_player: AnimationPlayer = $AnimationPlayer

var _tips: Array[String] = [
    "Press Space to jump!",
    "Collect coins to increase your score.",
    "Watch out for spikes!",
]


func _ready() -> void:
    SceneManager.scene_load_started.connect(_on_load_started)
    SceneManager.scene_load_progress.connect(_on_load_progress)
    SceneManager.scene_load_completed.connect(_on_load_completed)

    _tip_label.text = _tips.pick_random()
    hide()


func _on_load_started(path: String) -> void:
    _progress_bar.value = 0
    _status_label.text = "Loading..."
    _tip_label.text = _tips.pick_random()
    show()
    _animation_player.play("fade_in")


func _on_load_progress(progress: float) -> void:
    _progress_bar.value = progress * 100
    _status_label.text = "Loading... %d%%" % int(progress * 100)


func _on_load_completed(_path: String) -> void:
    _progress_bar.value = 100
    _status_label.text = "Complete!"
    _animation_player.play("fade_out")
    await _animation_player.animation_finished
    hide()
```

## Additive Scene Loading

```gdscript
# level_manager.gd
class_name LevelManager
extends Node

signal level_loaded(level_name: String)
signal level_unloaded(level_name: String)

var _loaded_levels: Dictionary = {}  # name -> Node
var _persistent_scene: Node  # Shared across levels (player, UI)


func _ready() -> void:
    # Mark persistent objects
    _setup_persistent_scene()


func _setup_persistent_scene() -> void:
    # Create container for persistent nodes
    _persistent_scene = Node.new()
    _persistent_scene.name = "Persistent"
    add_child(_persistent_scene)


func load_level(level_name: String, unload_current: bool = true) -> Node:
    if unload_current:
        unload_all_levels()

    var path := "res://scenes/levels/%s.tscn" % level_name

    if not ResourceLoader.exists(path):
        push_error("Level not found: %s" % path)
        return null

    var scene: PackedScene = load(path)
    var level: Node = scene.instantiate()
    level.name = level_name

    add_child(level)
    _loaded_levels[level_name] = level

    level_loaded.emit(level_name)
    return level


func load_level_additive(level_name: String) -> Node:
    if _loaded_levels.has(level_name):
        push_warning("Level already loaded: %s" % level_name)
        return _loaded_levels[level_name]

    return load_level(level_name, false)


func unload_level(level_name: String) -> void:
    if not _loaded_levels.has(level_name):
        return

    var level: Node = _loaded_levels[level_name]
    level.queue_free()
    _loaded_levels.erase(level_name)

    level_unloaded.emit(level_name)


func unload_all_levels() -> void:
    for level_name in _loaded_levels.keys():
        unload_level(level_name)


func get_level(level_name: String) -> Node:
    return _loaded_levels.get(level_name)


func is_level_loaded(level_name: String) -> bool:
    return _loaded_levels.has(level_name)


# Move node to persistent container
func make_persistent(node: Node) -> void:
    if node.get_parent():
        node.get_parent().remove_child(node)
    _persistent_scene.add_child(node)


# Return node from persistent to current level
func unmake_persistent(node: Node, target_parent: Node = null) -> void:
    if node.get_parent() == _persistent_scene:
        _persistent_scene.remove_child(node)
        if target_parent:
            target_parent.add_child(node)
```

## Scene Streaming (Open World)

```gdscript
# chunk_manager.gd - For open world games
class_name ChunkManager
extends Node3D

signal chunk_loaded(chunk_coords: Vector2i)
signal chunk_unloaded(chunk_coords: Vector2i)

@export var chunk_size: float = 100.0
@export var load_distance: int = 2  # Chunks to load around player
@export var unload_distance: int = 3  # Chunks to keep loaded

var _loaded_chunks: Dictionary = {}  # Vector2i -> Node3D
var _loading_chunks: Array[Vector2i] = []
var _player: Node3D


func _ready() -> void:
    _player = get_tree().get_first_node_in_group("player")


func _process(_delta: float) -> void:
    if not _player:
        return

    var player_chunk := _get_chunk_coords(_player.global_position)
    _update_chunks(player_chunk)


func _get_chunk_coords(position: Vector3) -> Vector2i:
    return Vector2i(
        int(floor(position.x / chunk_size)),
        int(floor(position.z / chunk_size))
    )


func _update_chunks(center: Vector2i) -> void:
    # Load nearby chunks
    for x in range(center.x - load_distance, center.x + load_distance + 1):
        for y in range(center.y - load_distance, center.y + load_distance + 1):
            var coords := Vector2i(x, y)
            if not _loaded_chunks.has(coords) and coords not in _loading_chunks:
                _load_chunk(coords)

    # Unload distant chunks
    var chunks_to_unload: Array[Vector2i] = []
    for coords in _loaded_chunks.keys():
        var distance := max(abs(coords.x - center.x), abs(coords.y - center.y))
        if distance > unload_distance:
            chunks_to_unload.append(coords)

    for coords in chunks_to_unload:
        _unload_chunk(coords)


func _load_chunk(coords: Vector2i) -> void:
    _loading_chunks.append(coords)

    var path := _get_chunk_path(coords)

    if not ResourceLoader.exists(path):
        # Generate empty chunk or procedural content
        var chunk := _create_empty_chunk(coords)
        _on_chunk_loaded(coords, chunk)
        return

    # Background loading
    ResourceLoader.load_threaded_request(path)
    _wait_for_chunk_load(coords, path)


func _wait_for_chunk_load(coords: Vector2i, path: String) -> void:
    while true:
        var status := ResourceLoader.load_threaded_get_status(path)

        if status == ResourceLoader.THREAD_LOAD_LOADED:
            var scene: PackedScene = ResourceLoader.load_threaded_get(path)
            var chunk: Node3D = scene.instantiate()
            _on_chunk_loaded(coords, chunk)
            return

        if status != ResourceLoader.THREAD_LOAD_IN_PROGRESS:
            _loading_chunks.erase(coords)
            return

        await get_tree().process_frame


func _on_chunk_loaded(coords: Vector2i, chunk: Node3D) -> void:
    _loading_chunks.erase(coords)

    chunk.global_position = Vector3(
        coords.x * chunk_size,
        0,
        coords.y * chunk_size
    )
    chunk.name = "Chunk_%d_%d" % [coords.x, coords.y]

    add_child(chunk)
    _loaded_chunks[coords] = chunk

    chunk_loaded.emit(coords)


func _unload_chunk(coords: Vector2i) -> void:
    if not _loaded_chunks.has(coords):
        return

    var chunk: Node3D = _loaded_chunks[coords]
    chunk.queue_free()
    _loaded_chunks.erase(coords)

    chunk_unloaded.emit(coords)


func _get_chunk_path(coords: Vector2i) -> String:
    return "res://scenes/chunks/chunk_%d_%d.tscn" % [coords.x, coords.y]


func _create_empty_chunk(coords: Vector2i) -> Node3D:
    var chunk := Node3D.new()
    # Add procedural content here
    return chunk
```

## Scene Stack (UI Flow)

```gdscript
# ui_scene_stack.gd - For menu navigation
class_name UISceneStack
extends CanvasLayer

signal stack_changed(depth: int)

var _stack: Array[Control] = []


func push_scene(scene_path: String) -> Control:
    var scene: PackedScene = load(scene_path)
    return push_scene_packed(scene)


func push_scene_packed(scene: PackedScene) -> Control:
    var instance: Control = scene.instantiate()

    # Hide current top
    if not _stack.is_empty():
        _stack[-1].hide()

    add_child(instance)
    _stack.append(instance)

    stack_changed.emit(_stack.size())
    return instance


func pop_scene() -> void:
    if _stack.is_empty():
        return

    var top: Control = _stack.pop_back()
    top.queue_free()

    # Show new top
    if not _stack.is_empty():
        _stack[-1].show()

    stack_changed.emit(_stack.size())


func pop_to_root() -> void:
    while _stack.size() > 1:
        var scene: Control = _stack.pop_back()
        scene.queue_free()

    if not _stack.is_empty():
        _stack[0].show()

    stack_changed.emit(_stack.size())


func clear() -> void:
    for scene in _stack:
        scene.queue_free()
    _stack.clear()

    stack_changed.emit(0)


func get_depth() -> int:
    return _stack.size()


func get_current() -> Control:
    if _stack.is_empty():
        return null
    return _stack[-1]


func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel") and _stack.size() > 1:
        pop_scene()
        get_viewport().set_input_as_handled()
```

## Scene Preloading

```gdscript
# preloader.gd
class_name ScenePreloader
extends Node

signal preload_completed(path: String)
signal all_preloads_completed

var _preloaded: Dictionary = {}  # path -> PackedScene
var _loading: Array[String] = []


func preload_scene(path: String) -> void:
    if _preloaded.has(path) or path in _loading:
        return

    _loading.append(path)
    ResourceLoader.load_threaded_request(path)


func preload_scenes(paths: Array[String]) -> void:
    for path in paths:
        preload_scene(path)


func _process(_delta: float) -> void:
    var completed: Array[String] = []

    for path in _loading:
        var status := ResourceLoader.load_threaded_get_status(path)

        if status == ResourceLoader.THREAD_LOAD_LOADED:
            _preloaded[path] = ResourceLoader.load_threaded_get(path)
            completed.append(path)
            preload_completed.emit(path)

        elif status != ResourceLoader.THREAD_LOAD_IN_PROGRESS:
            completed.append(path)  # Failed, remove from loading

    for path in completed:
        _loading.erase(path)

    if _loading.is_empty() and not completed.is_empty():
        all_preloads_completed.emit()


func get_scene(path: String) -> PackedScene:
    if _preloaded.has(path):
        return _preloaded[path]
    return load(path)  # Fallback to sync load


func is_preloaded(path: String) -> bool:
    return _preloaded.has(path)


func clear_preloaded() -> void:
    _preloaded.clear()
```

## Best Practices

1. **Use change_scene_to_file for full transitions** - Clears old scene automatically
2. **Preload frequently used scenes** - Reduces load stuttering
3. **Thread load for large scenes** - Keep UI responsive
4. **Signal at transition midpoint** - For audio/visual sync
5. **Handle load failures gracefully** - Show error UI, not crash
6. **Use additive loading for persistent elements** - Player, UI, music
7. **Chunk large worlds** - Stream content based on position
